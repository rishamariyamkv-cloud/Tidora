import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Bell,
  CalendarDays,
  Check,
  Pencil,
  Plus,
  Repeat,
  Search,
  SearchX,
  Trash2,
} from 'lucide-react';
import {
  Card,
  CategoryChip,
  CategoryIcon,
  ConfirmDialog,
  DateNavigator,
  EmptyState,
  PageHeader,
  PriorityBadge,
  ProgressBar,
  Segmented,
  StatusBadge,
} from '../components/ui';
import { useActivityModal } from '../components/activities/ActivityModal';
import { useStore } from '../store/StoreContext';
import { useToast } from '../store/ToastContext';
import { WEEKDAY_LABELS, addDays, formatLong, todayKey } from '../utils/date';
import { dayStats, findCategory, isCurrent, sortByOrder } from '../utils/schedule';
import { format12, formatDuration, durationMinutes, toMinutes } from '../utils/time';
import { useNow } from '../utils/useNow';

const SECTIONS = [
  { key: 'morning', label: 'Morning', test: (m) => m < 12 * 60 },
  { key: 'afternoon', label: 'Afternoon', test: (m) => m >= 12 * 60 && m < 17 * 60 },
  { key: 'evening', label: 'Evening & Night', test: (m) => m >= 17 * 60 },
];

function recurrenceLabel(a) {
  if (a.recurrence === 'daily') return 'Daily';
  if (a.recurrence === 'weekly') {
    const d = a.days || [];
    if (d.length === 5 && [1, 2, 3, 4, 5].every((x) => d.includes(x))) return 'Weekdays';
    if (d.length === 2 && d.includes(0) && d.includes(6)) return 'Weekends';
    return d.map((x) => WEEKDAY_LABELS[x]).join(', ');
  }
  return 'One-time';
}

export default function Planner() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const openActivity = useActivityModal();
  const now = useNow();
  const [date, setDate] = useState(todayKey());
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [sortMode, setSortMode] = useState('time');
  const [toDelete, setToDelete] = useState(null);

  const stats = useMemo(() => dayStats(state, date, now), [state, date, now]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = stats.list.filter(
      (a) =>
        (category === 'all' || a.categoryId === category) &&
        (status === 'all' || a.status === status) &&
        (!q || `${a.title} ${a.description} ${a.notes}`.toLowerCase().includes(q)),
    );
    if (sortMode === 'custom') list = sortByOrder(list);
    return list;
  }, [stats.list, query, category, status, sortMode]);

  const filtersActive = query || category !== 'all' || status !== 'all';

  const setActStatus = (a, s) => {
    dispatch({ type: 'SET_STATUS', date, id: a.id, status: s });
    if (s === 'completed') toast(`“${a.title}” completed 🎉`);
  };

  const move = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= filtered.length) return;
    const ids = filtered.map((a) => a.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    dispatch({ type: 'REORDER_ACTIVITIES', ids });
  };

  const renderRow = (a, index) => {
    const cat = findCategory(state.categories, a.categoryId);
    const done = a.status === 'completed';
    const current = isCurrent(a, date, now);
    return (
      <li
        key={a.id}
        className={`group flex flex-col gap-3 rounded-2xl border p-3.5 transition sm:flex-row sm:items-center ${
          current ? 'border-teal/40 bg-teal/5' : 'border-line/70 bg-card hover:border-teal/30'
        }`}
      >
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <button
            onClick={() => setActStatus(a, done ? 'pending' : 'completed')}
            aria-label={done ? `Mark ${a.title} as not completed` : `Mark ${a.title} as completed`}
            className={`mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition ${
              done ? 'border-success bg-success text-white' : 'border-line text-transparent hover:border-teal hover:text-teal'
            }`}
          >
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </button>
          <CategoryIcon category={cat} icon={a.icon} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className={`font-semibold ${done ? 'text-muted line-through' : ''}`}>{a.title}</p>
              {current && <span className="rounded-full bg-teal px-2 py-0.5 text-[10px] font-bold uppercase text-white">Now</span>}
            </div>
            <p className="mt-0.5 text-xs text-muted">
              <span className="font-semibold tabular-nums text-ink/80">
                {format12(a.start)} – {format12(a.end)}
              </span>{' '}
              · {formatDuration(durationMinutes(a.start, a.end))}
            </p>
            {a.description && <p className="mt-1 text-sm text-muted">{a.description}</p>}
            {a.notes && <p className="mt-1 whitespace-pre-line rounded-lg bg-soft px-2.5 py-1.5 text-xs text-muted">{a.notes}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <CategoryChip category={cat} />
              <PriorityBadge priority={a.priority} />
              <span className="inline-flex items-center gap-1 rounded-full bg-soft px-2 py-0.5 text-[11px] font-medium text-muted">
                <Repeat className="h-3 w-3" /> {recurrenceLabel(a)}
              </span>
              {a.reminder !== null && a.reminder !== undefined && (
                <span className="inline-flex items-center gap-1 rounded-full bg-soft px-2 py-0.5 text-[11px] font-medium text-muted">
                  <Bell className="h-3 w-3" /> {a.reminder ? `${a.reminder}m before` : 'At start'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-line/60 pt-3 sm:border-0 sm:pt-0">
          <StatusBadge status={a.status} />
          <select
            className="input w-auto py-1.5 text-xs"
            value={a.status === 'missed' ? 'pending' : a.status}
            onChange={(e) => setActStatus(a, e.target.value)}
            aria-label={`Status of ${a.title}`}
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <div className="ml-auto flex items-center">
            {sortMode === 'custom' && (
              <>
                <button className="icon-btn" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up">
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button className="icon-btn" onClick={() => move(index, 1)} disabled={index === filtered.length - 1} aria-label="Move down">
                  <ArrowDown className="h-4 w-4" />
                </button>
              </>
            )}
            <button className="icon-btn" onClick={() => openActivity(a, date)} aria-label={`Edit ${a.title}`}>
              <Pencil className="h-4 w-4" />
            </button>
            <button className="icon-btn hover:!text-danger" onClick={() => setToDelete(a)} aria-label={`Delete ${a.title}`}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </li>
    );
  };

  return (
    <div>
      <PageHeader
        title="My Daily Planner"
        subtitle={formatLong(date)}
        actions={
          <>
            <DateNavigator
              label={date === todayKey() ? 'Today' : formatLong(date).split(',')[0]}
              sublabel={new Date(`${date}T00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
              onPrev={() => setDate(addDays(date, -1))}
              onNext={() => setDate(addDays(date, 1))}
              onToday={() => setDate(todayKey())}
              isToday={date === todayKey()}
            >
              <label className="icon-btn relative cursor-pointer" title="Pick a date">
                <CalendarDays className="h-5 w-5" />
                <input
                  type="date"
                  className="absolute inset-0 cursor-pointer opacity-0"
                  value={date}
                  onChange={(e) => e.target.value && setDate(e.target.value)}
                  aria-label="Pick a date"
                />
              </label>
            </DateNavigator>
            <button className="btn-primary" onClick={() => openActivity(null, date)}>
              <Plus className="h-4 w-4" /> Add
            </button>
          </>
        }
      />

      <Card className="mb-5 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex-1">
            <div className="mb-1.5 flex justify-between text-sm">
              <span className="font-semibold">
                {stats.completed} of {stats.total} completed
              </span>
              <span className="font-semibold text-teal">{stats.percent}%</span>
            </div>
            <ProgressBar value={stats.percent} />
          </div>
          <div className="flex gap-4 text-xs text-muted">
            <span>
              <b className="text-ink">{stats.inProgress}</b> in progress
            </span>
            <span>
              <b className="text-ink">{stats.pending - stats.inProgress}</b> pending
            </span>
            <span>
              <b className="text-danger">{stats.missed}</b> missed
            </span>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder="Search activities…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search activities" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <select className="input sm:w-48" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
            <option value="all">All categories</option>
            {state.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select className="input sm:w-40" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="missed">Missed</option>
          </select>
        </div>
        <Segmented
          value={sortMode}
          onChange={setSortMode}
          options={[
            { value: 'time', label: 'By time' },
            { value: 'custom', label: 'Custom order' },
          ]}
        />
      </div>

      {stats.total === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarDays}
            title="Nothing planned for this day"
            text="Add an activity — you can make it repeat daily or on specific weekdays."
            action={
              <button className="btn-primary" onClick={() => openActivity(null, date)}>
                <Plus className="h-4 w-4" /> Add activity
              </button>
            }
          />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={SearchX}
            title="No matching activities"
            text="Try a different search term or clear the filters."
            action={
              filtersActive && (
                <button
                  className="btn-ghost"
                  onClick={() => {
                    setQuery('');
                    setCategory('all');
                    setStatus('all');
                  }}
                >
                  Clear filters
                </button>
              )
            }
          />
        </Card>
      ) : sortMode === 'custom' ? (
        <>
          <p className="mb-3 text-xs text-muted">Use the arrows to arrange activities in your preferred order.</p>
          <ul className="space-y-2.5">{filtered.map((a, i) => renderRow(a, i))}</ul>
        </>
      ) : (
        <div className="space-y-6">
          {SECTIONS.map((s) => {
            const items = filtered.filter((a) => s.test(toMinutes(a.start)));
            if (!items.length) return null;
            return (
              <section key={s.key}>
                <h2 className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
                  {s.label} <span className="rounded-full bg-soft px-2 py-0.5 text-[10px]">{items.length}</span>
                </h2>
                <ul className="space-y-2.5">{items.map((a) => renderRow(a, filtered.indexOf(a)))}</ul>
              </section>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete activity?"
        message={
          toDelete
            ? toDelete.recurrence === 'once'
              ? `“${toDelete.title}” will be permanently removed.`
              : `“${toDelete.title}” repeats (${recurrenceLabel(toDelete)}). Deleting removes it from every day of your schedule.`
            : ''
        }
        confirmLabel="Delete"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          dispatch({ type: 'DELETE_ACTIVITY', id: toDelete.id });
          toast(`“${toDelete.title}” deleted.`, 'info');
          setToDelete(null);
        }}
      />
    </div>
  );
}
