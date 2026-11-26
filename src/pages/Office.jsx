import { useEffect, useMemo, useState } from 'react';
import { Briefcase, Bug, Check, ClipboardList, Clock, FileText, Pencil, Plus, Trash2, Wand2 } from 'lucide-react';
import {
  Card,
  CardHeader,
  ConfirmDialog,
  DateNavigator,
  EmptyState,
  Modal,
  PageHeader,
  PriorityBadge,
  ProgressBar,
} from '../components/ui';
import Timeline from '../components/activities/Timeline';
import { useStore } from '../store/StoreContext';
import { useToast } from '../store/ToastContext';
import { OFFICE_TASK_TYPES } from '../data/defaults';
import { addDays, formatDayName, formatLong, todayKey, weekdayOf } from '../utils/date';
import { dayStats, isCurrent } from '../utils/schedule';
import { durationMinutes, format12, formatHours } from '../utils/time';
import { useNow } from '../utils/useNow';

const TASK_STATUS = {
  todo: { label: 'To do', cls: 'bg-warning/15 text-[#B7861F] dark:text-warning' },
  in_progress: { label: 'In progress', cls: 'bg-teal/10 text-teal' },
  done: { label: 'Done', cls: 'bg-success/10 text-success' },
};
const NEXT_STATUS = { todo: 'in_progress', in_progress: 'done', done: 'todo' };

export default function Office() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const now = useNow();
  const [date, setDate] = useState(todayKey());
  const [typeFilter, setTypeFilter] = useState('all');
  const [editing, setEditing] = useState(null); // task object or {} for new
  const [toDelete, setToDelete] = useState(null);
  const { officeStart, officeEnd, workDays } = state.settings;
  const isWorkDay = workDays.includes(weekdayOf(date));
  const isToday = date === todayKey();

  const stats = useMemo(() => dayStats(state, date, now), [state, date, now]);
  const officeCats = state.categories.filter((c) => c.office).map((c) => c.id);
  const officeSchedule = stats.list.filter((a) => officeCats.includes(a.categoryId));
  const current = officeSchedule.find((a) => isCurrent(a, date, now));

  const tasks = state.officeTasks.filter((t) => t.date === date);
  const shown = typeFilter === 'all' ? tasks : tasks.filter((t) => t.type === typeFilter);
  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const bugsLogged = tasks.reduce((s, t) => s + (Number(t.bugs) || 0), 0);
  const officeSpan = durationMinutes(officeStart, officeEnd);

  const [summary, setSummary] = useState(state.workSummary[date] || '');
  useEffect(() => setSummary(state.workSummary[date] || ''), [date, state.workSummary]);

  const saveSummary = () => {
    dispatch({ type: 'SET_WORK_SUMMARY', date, text: summary });
    toast('Work summary saved.');
  };

  const generateSummary = () => {
    const done = tasks.filter((t) => t.status === 'done');
    const open = tasks.filter((t) => t.status !== 'done');
    const lines = [
      `Work summary — ${formatLong(date)}`,
      '',
      `Completed (${done.length}):`,
      ...(done.length ? done.map((t) => `• [${t.type}] ${t.title}${t.bugs ? ` — ${t.bugs} bug(s)` : ''}`) : ['• —']),
      '',
      `In progress / pending (${open.length}):`,
      ...(open.length ? open.map((t) => `• [${t.type}] ${t.title}`) : ['• —']),
      '',
      `Office time logged: ${formatHours(stats.officeMinutes)} of ${formatHours(officeSpan)}`,
    ];
    setSummary(lines.join('\n'));
  };

  const toggleOfficeActivity = (a) => {
    dispatch({ type: 'SET_STATUS', date, id: a.id, status: a.status === 'completed' ? 'pending' : 'completed' });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Office & QA Tasks"
        subtitle={`Office hours ${format12(officeStart)} – ${format12(officeEnd)} · ${isWorkDay ? 'work day' : 'day off'}`}
        actions={
          <>
            <DateNavigator
              label={isToday ? 'Today' : formatDayName(date, 'long')}
              sublabel={formatLong(date).split(', ').slice(1).join(', ')}
              onPrev={() => setDate(addDays(date, -1))}
              onNext={() => setDate(addDays(date, 1))}
              onToday={() => setDate(todayKey())}
              isToday={isToday}
            />
            <button className="btn-primary" onClick={() => setEditing({})}>
              <Plus className="h-4 w-4" /> New task
            </button>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <MiniStat icon={ClipboardList} label="QA tasks done" value={`${doneCount}/${tasks.length}`} />
        <MiniStat icon={Bug} label="Bugs found" value={bugsLogged} />
        <MiniStat icon={Clock} label="Office time" value={formatHours(stats.officeMinutes)} hint={`of ${formatHours(officeSpan)}`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        {/* Tasks */}
        <Card className="p-5 xl:col-span-3">
          <CardHeader title="Daily QA Tasks" subtitle="Click the status to move it forward" icon={Bug} />
          <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
            {['all', ...OFFICE_TASK_TYPES].map((t) => {
              const count = t === 'all' ? tasks.length : tasks.filter((x) => x.type === t).length;
              return (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    typeFilter === t ? 'bg-navy text-white dark:bg-teal' : 'bg-soft text-muted hover:text-ink'
                  }`}
                >
                  {t === 'all' ? 'All' : t} {count > 0 && <span className="opacity-70">· {count}</span>}
                </button>
              );
            })}
          </div>
          {tasks.length > 0 && <ProgressBar value={(doneCount / tasks.length) * 100} className="mb-4 h-1.5" />}
          {shown.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title={tasks.length ? 'No tasks of this type' : 'No QA tasks for this day'}
              text="Plan testing work like manual, regression or Playwright practice."
              action={
                <button className="btn-primary" onClick={() => setEditing({ type: typeFilter === 'all' ? OFFICE_TASK_TYPES[0] : typeFilter })}>
                  <Plus className="h-4 w-4" /> Add task
                </button>
              }
            />
          ) : (
            <ul className="space-y-2">
              {shown.map((t) => (
                <li key={t.id} className="flex items-start gap-3 rounded-xl border border-line/70 p-3">
                  <button
                    onClick={() => dispatch({ type: 'UPDATE_OFFICE_TASK', task: { id: t.id, status: t.status === 'done' ? 'todo' : 'done' } })}
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition ${
                      t.status === 'done' ? 'border-success bg-success text-white' : 'border-line text-transparent hover:border-teal hover:text-teal'
                    }`}
                    aria-label={t.status === 'done' ? `Reopen ${t.title}` : `Complete ${t.title}`}
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${t.status === 'done' ? 'text-muted line-through' : ''}`}>{t.title}</p>
                    {t.notes && <p className="mt-0.5 text-xs text-muted">{t.notes}</p>}
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-soft px-2 py-0.5 text-[11px] font-medium text-muted">{t.type}</span>
                      <PriorityBadge priority={t.priority} />
                      {Number(t.bugs) > 0 && (
                        <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[11px] font-semibold text-danger">{t.bugs} bug(s)</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => dispatch({ type: 'UPDATE_OFFICE_TASK', task: { id: t.id, status: NEXT_STATUS[t.status] } })}
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${TASK_STATUS[t.status].cls}`}
                    title="Change status"
                  >
                    {TASK_STATUS[t.status].label}
                  </button>
                  <button className="icon-btn h-8 w-8" onClick={() => setEditing(t)} aria-label={`Edit ${t.title}`}>
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button className="icon-btn h-8 w-8 hover:!text-danger" onClick={() => setToDelete(t)} aria-label={`Delete ${t.title}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Office schedule */}
        <Card className="p-5 xl:col-span-2">
          <CardHeader title="Office Schedule" subtitle={isWorkDay ? `${officeSchedule.length} blocks` : 'Not a work day'} icon={Briefcase} />
          {officeSchedule.length ? (
            <Timeline items={officeSchedule} categories={state.categories} currentId={current?.id} onToggle={toggleOfficeActivity} compact />
          ) : (
            <EmptyState icon={Briefcase} title="No office activities" text={isWorkDay ? 'Add office or QA activities in the planner.' : 'Enjoy your day off!'} />
          )}
        </Card>
      </div>

      {/* Summary */}
      <Card className="p-5">
        <CardHeader
          title="Daily Work Summary"
          subtitle="Useful for stand-ups and end-of-day reports"
          icon={FileText}
          action={
            <button className="btn-ghost px-3 py-1.5 text-xs" onClick={generateSummary}>
              <Wand2 className="h-4 w-4" /> Generate from tasks
            </button>
          }
        />
        <textarea
          className="input min-h-[160px] font-mono text-[13px] leading-relaxed"
          placeholder="What did you test today? Any blockers? What's next?"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          maxLength={5000}
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted">
            {summary !== (state.workSummary[date] || '') ? 'Unsaved changes' : summary ? 'Saved' : ''}
          </span>
          <button className="btn-primary" onClick={saveSummary} disabled={summary === (state.workSummary[date] || '')}>
            Save summary
          </button>
        </div>
      </Card>

      {editing && <TaskModal task={editing} date={date} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete task?"
        message={toDelete ? `“${toDelete.title}” will be permanently removed.` : ''}
        confirmLabel="Delete"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          dispatch({ type: 'DELETE_OFFICE_TASK', id: toDelete.id });
          toast('Task deleted.', 'info');
          setToDelete(null);
        }}
      />
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, hint }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-soft text-teal sm:flex">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xl font-bold leading-tight">
          {value} {hint && <span className="text-xs font-medium text-muted">{hint}</span>}
        </p>
        <p className="truncate text-xs text-muted">{label}</p>
      </div>
    </Card>
  );
}

function TaskModal({ task, date, onClose }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const isEdit = Boolean(task.id);
  const [form, setForm] = useState({
    title: '',
    type: OFFICE_TASK_TYPES[0],
    priority: 'medium',
    status: 'todo',
    notes: '',
    bugs: 0,
    date,
    ...task,
  });
  const [error, setError] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    const title = form.title.trim();
    if (title.length < 2) return setError('Task name must be at least 2 characters.');
    const payload = { ...form, title, notes: form.notes.trim(), bugs: Math.max(0, Number(form.bugs) || 0) };
    dispatch({ type: isEdit ? 'UPDATE_OFFICE_TASK' : 'ADD_OFFICE_TASK', task: payload });
    toast(isEdit ? 'Task updated.' : 'Task added.');
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Edit QA Task' : 'New QA Task'}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" type="submit" form="task-form">
            {isEdit ? 'Save' : 'Add task'}
          </button>
        </>
      }
    >
      <form id="task-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="task-title">
            Task *
          </label>
          <input
            id="task-title"
            className={`input ${error ? 'border-danger' : ''}`}
            value={form.title}
            onChange={(e) => {
              set('title', e.target.value);
              setError('');
            }}
            placeholder="e.g. Regression test checkout flow"
            maxLength={120}
            autoFocus
          />
          {error && <p className="mt-1 text-xs font-medium text-danger">{error}</p>}
        </div>
        <div>
          <label className="label" htmlFor="task-type">
            Type
          </label>
          <select id="task-type" className="input" value={form.type} onChange={(e) => set('type', e.target.value)}>
            {OFFICE_TASK_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="task-priority">
            Priority
          </label>
          <select id="task-priority" className="input" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="task-status">
            Status
          </label>
          <select id="task-status" className="input" value={form.status} onChange={(e) => set('status', e.target.value)}>
            {Object.entries(TASK_STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="task-bugs">
            Bugs found
          </label>
          <input id="task-bugs" type="number" min="0" className="input" value={form.bugs} onChange={(e) => set('bugs', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="task-date">
            Date
          </label>
          <input id="task-date" type="date" className="input" value={form.date} onChange={(e) => set('date', e.target.value || date)} />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="task-notes">
            Notes
          </label>
          <textarea id="task-notes" className="input min-h-[80px]" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Steps, test data, links…" maxLength={1000} />
        </div>
      </form>
    </Modal>
  );
}
