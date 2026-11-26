import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  CalendarDays,
  CalendarRange,
  CircleCheckBig,
  Clock,
  ListChecks,
  Plus,
  Quote,
  RotateCcw,
  Target,
  TrendingUp,
} from 'lucide-react';
import { Avatar, Card, CardHeader, ConfirmDialog, EmptyState, ProgressBar, ProgressRing, StatCard } from '../components/ui';
import Timeline from '../components/activities/Timeline';
import { useActivityModal } from '../components/activities/ActivityModal';
import { useStore } from '../store/StoreContext';
import { useToast } from '../store/ToastContext';
import { QUOTES } from '../data/defaults';
import { dayOfYear, formatLong, greeting, todayKey } from '../utils/date';
import { dayStats, isCurrent } from '../utils/schedule';
import { durationMinutes, format12, formatHours, nowMinutes, toMinutes } from '../utils/time';
import { useNow } from '../utils/useNow';

export default function Dashboard() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const openActivity = useActivityModal();
  const navigate = useNavigate();
  const now = useNow();
  const date = todayKey();
  const [confirmReset, setConfirmReset] = useState(false);
  const scrollRef = useRef(null);

  const stats = useMemo(() => dayStats(state, date, now), [state, date, now]);
  const current = stats.list.find((a) => isCurrent(a, date, now));
  const next = stats.list.find((a) => toMinutes(a.start) > nowMinutes(now) && a.status !== 'completed');
  const quote = QUOTES[dayOfYear(now) % QUOTES.length];
  const { name, avatar } = state.settings.profile;
  const isWorkDay = state.settings.workDays.includes(now.getDay());
  const officeSpan = durationMinutes(state.settings.officeStart, state.settings.officeEnd);
  const goalMins = state.settings.dailyProductiveHoursGoal * 60;

  // Bring the current activity into view inside the schedule list
  useEffect(() => {
    const box = scrollRef.current;
    const el = box?.querySelector('[data-current]');
    if (box && el) box.scrollTop = el.offsetTop - box.clientHeight / 3;
  }, [current?.id]);

  const toggle = (a) => {
    const next = a.status === 'completed' ? 'pending' : 'completed';
    dispatch({ type: 'SET_STATUS', date, id: a.id, status: next });
    toast(next === 'completed' ? `“${a.title}” completed 🎉` : `“${a.title}” marked as not completed`);
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-navy to-[#1F5F6B] p-6 text-white shadow-card sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-teal/25 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-sea/10 blur-2xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="flex items-center gap-4">
              <Avatar src={avatar} name={name} size={60} className="ring-4 ring-white/15" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white/70">{formatLong(date)}</p>
                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                  {greeting(now)}, {name || 'friend'} 👋
                </h1>
              </div>
            </div>
            <div className="mt-4 flex max-w-2xl gap-3 text-white/85">
              <Quote className="mt-0.5 h-5 w-5 shrink-0 text-teal-light" />
              <p className="text-sm leading-relaxed">
                {quote.text} <span className="text-white/55">— {quote.author}</span>
              </p>
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm lg:min-w-[260px]">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/60">{current ? 'Happening now' : 'Up next'}</p>
            {current || next ? (
              <>
                <p className="mt-1 font-semibold">{(current || next).title}</p>
                <p className="text-sm text-white/70">
                  {format12((current || next).start)} – {format12((current || next).end)}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-white/80">Nothing more scheduled today. Rest well!</p>
            )}
          </div>
        </div>
      </section>

      {/* Overview cards (kept to four) */}
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={ListChecks} label="Activities" value={stats.total} hint={`${stats.completed} completed · ${stats.pending} pending`} />
        <StatCard icon={CircleCheckBig} label="Completion" value={`${stats.percent}%`} accent="text-success">
          <ProgressBar value={stats.percent} color="bg-success" className="mt-3 h-1.5" />
        </StatCard>
        <StatCard
          icon={TrendingUp}
          label="Productivity"
          value={formatHours(stats.productiveMinutes)}
          hint={`Goal ${state.settings.dailyProductiveHoursGoal}h`}
        >
          <ProgressBar value={(stats.productiveMinutes / goalMins) * 100} className="mt-3 h-1.5" />
        </StatCard>
        <StatCard
          icon={Briefcase}
          label="Office Hours"
          value={isWorkDay ? formatHours(stats.officeMinutes) : 'Off'}
          hint={`${format12(state.settings.officeStart)} – ${format12(state.settings.officeEnd)}${isWorkDay ? '' : ' · not a work day'}`}
          accent="text-navy dark:text-sea"
        >
          {isWorkDay && <ProgressBar value={(stats.officeMinutes / officeSpan) * 100} color="bg-navy dark:bg-sea" className="mt-3 h-1.5" />}
        </StatCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {/* Schedule */}
        <Card className="p-5 lg:col-span-2">
          <CardHeader
            title="Today's Schedule"
            subtitle={`${stats.total} activities · current one highlighted`}
            icon={Clock}
            action={
              <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => navigate('/planner')}>
                Open planner
              </button>
            }
          />
          {stats.list.length ? (
            <div ref={scrollRef} className="relative max-h-[560px] overflow-y-auto pr-1">
              <Timeline
                items={stats.list}
                categories={state.categories}
                currentId={current?.id}
                onToggle={toggle}
                onSelect={(a) => openActivity(a, date)}
              />
            </div>
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="No activities today"
              text="Add your first activity to start planning the day."
              action={
                <button className="btn-primary" onClick={() => openActivity(null, date)}>
                  <Plus className="h-4 w-4" /> Add activity
                </button>
              }
            />
          )}
        </Card>

        <div className="space-y-6">
          {/* Progress */}
          <Card className="p-5">
            <CardHeader title="Today's Progress" subtitle="Updates instantly" icon={Target} />
            <div className="flex flex-col items-center">
              <ProgressRing value={stats.percent} sublabel="completed" />
              <div className="mt-5 w-full">
                <div className="mb-1.5 flex justify-between text-xs font-medium text-muted">
                  <span>
                    {stats.completed} of {stats.total} done
                  </span>
                  <span>{stats.percent}%</span>
                </div>
                <ProgressBar value={stats.percent} />
              </div>
              <div className="mt-5 grid w-full grid-cols-3 gap-2 text-center">
                {[
                  ['Completed', stats.completed, 'text-success'],
                  ['Pending', stats.pending, 'text-[#B7861F] dark:text-warning'],
                  ['Missed', stats.missed, 'text-danger'],
                ].map(([l, v, c]) => (
                  <div key={l} className="rounded-xl bg-soft py-2.5">
                    <p className={`text-lg font-bold ${c}`}>{v}</p>
                    <p className="text-[11px] font-medium text-muted">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Quick actions */}
          <Card className="p-5">
            <CardHeader title="Quick Actions" icon={Plus} />
            <div className="grid grid-cols-2 gap-2">
              <QuickAction icon={Plus} label="Add Activity" onClick={() => openActivity(null, date)} primary />
              <QuickAction icon={ListChecks} label="Today's Tasks" onClick={() => navigate('/planner')} />
              <QuickAction icon={CalendarRange} label="Weekly Overview" onClick={() => navigate('/weekly')} />
              <QuickAction icon={RotateCcw} label="Reset Day" onClick={() => setConfirmReset(true)} danger />
            </div>
          </Card>
        </div>
      </section>

      <ConfirmDialog
        open={confirmReset}
        title="Reset today's tasks?"
        message="This clears every completion and in-progress status for today. Your activities stay in the schedule."
        confirmLabel="Reset day"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          dispatch({ type: 'RESET_DAY', date });
          setConfirmReset(false);
          toast("Today's progress has been reset.", 'info');
        }}
      />
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick, primary, danger }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start gap-2 rounded-xl border p-3 text-left text-sm font-semibold transition ${
        primary
          ? 'border-teal bg-teal text-white hover:bg-teal-dark'
          : danger
            ? 'border-line hover:border-danger/40 hover:bg-danger/5 hover:text-danger'
            : 'border-line hover:border-teal/40 hover:bg-soft'
      }`}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}
