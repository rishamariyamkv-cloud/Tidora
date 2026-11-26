import { useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertCircle, BarChart3, CalendarCheck, Flag, Layers, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CategoryIcon, Checklist, DateNavigator, EmptyState, PageHeader, ProgressBar, StatCard } from '../components/ui';
import ChartTooltip, { axisProps } from '../components/ui/ChartTooltip';
import { useStore } from '../store/StoreContext';
import { addDays, formatDayName, formatShort, startOfWeek, todayKey, weekDays } from '../utils/date';
import { dayStats, findCategory } from '../utils/schedule';
import { format12, formatHours } from '../utils/time';

export function useWeekStats(state, anyDayInWeek) {
  return useMemo(() => {
    const days = weekDays(anyDayInWeek);
    const now = new Date();
    return days.map((d) => ({ date: d, ...dayStats(state, d, now) }));
  }, [state, anyDayInWeek]);
}

export default function Weekly() {
  const { state, dispatch } = useStore();
  const [anchor, setAnchor] = useState(todayKey());
  const weekStart = startOfWeek(anchor);
  const thisWeek = weekStart === startOfWeek(todayKey());
  const days = useWeekStats(state, anchor);
  const today = todayKey();

  const totals = days.reduce(
    (t, d) => ({
      total: t.total + d.total,
      completed: t.completed + d.completed,
      missed: t.missed + d.missed,
      productive: t.productive + d.productiveMinutes,
    }),
    { total: 0, completed: 0, missed: 0, productive: 0 },
  );
  const pastDays = days.filter((d) => d.date <= today);
  const pastTotal = pastDays.reduce((s, d) => s + d.total, 0);
  const pastCompleted = pastDays.reduce((s, d) => s + d.completed, 0);
  const completionPct = pastTotal ? Math.round((pastCompleted / pastTotal) * 100) : 0;

  const chartData = days.map((d) => ({
    day: formatDayName(d.date),
    Completed: d.completed,
    Missed: d.missed,
    Pending: d.pending,
    hours: d.date > today ? null : d.productiveMinutes / 60,
  }));

  const categories = useMemo(() => {
    const agg = {};
    for (const d of days) {
      for (const [id, c] of Object.entries(d.byCategory)) {
        agg[id] = agg[id] || { total: 0, completed: 0, minutes: 0 };
        agg[id].total += c.total;
        agg[id].completed += c.completed;
        agg[id].minutes += c.minutes;
      }
    }
    return Object.entries(agg)
      .map(([id, v]) => ({ ...v, category: findCategory(state.categories, id), pct: Math.round((v.completed / v.total) * 100) }))
      .sort((a, b) => b.total - a.total);
  }, [days, state.categories]);

  const missedList = days.flatMap((d) => d.list.filter((a) => a.status === 'missed').map((a) => ({ ...a, date: d.date })));
  const goals = state.weeklyGoals[weekStart] || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weekly Overview"
        subtitle="See your week at a glance"
        actions={
          <DateNavigator
            label={thisWeek ? 'This week' : `Week of ${formatShort(weekStart)}`}
            sublabel={`${formatShort(weekStart)} – ${formatShort(addDays(weekStart, 6))}`}
            onPrev={() => setAnchor(addDays(weekStart, -7))}
            onNext={() => setAnchor(addDays(weekStart, 7))}
            onToday={() => setAnchor(todayKey())}
            isToday={thisWeek}
          />
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={CalendarCheck} label="Completion" value={`${completionPct}%`} hint="Days so far this week" accent="text-success">
          <ProgressBar value={completionPct} color="bg-success" className="mt-3 h-1.5" />
        </StatCard>
        <StatCard icon={Layers} label="Completed" value={totals.completed} hint={`of ${totals.total} scheduled`} />
        <StatCard icon={TrendingUp} label="Productive time" value={formatHours(totals.productive)} hint={`Avg ${formatHours(totals.productive / 7)} / day`} />
        <StatCard icon={AlertCircle} label="Missed" value={totals.missed} hint="Not completed in time" accent="text-danger" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <CardHeader title="Daily Activity Completion" subtitle="Completed vs missed vs pending" icon={BarChart3} />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: -24, right: 4 }}>
                <CartesianGrid vertical={false} stroke="rgb(var(--line))" />
                <XAxis dataKey="day" {...axisProps} />
                <YAxis {...axisProps} allowDecimals={false} />
                <Tooltip content={<ChartTooltip unit="" />} cursor={{ fill: 'rgb(var(--soft))' }} />
                <Bar dataKey="Completed" stackId="s" fill="#2A9D8F" maxBarSize={34} />
                <Bar dataKey="Missed" stackId="s" fill="#E76F51" maxBarSize={34} />
                <Bar dataKey="Pending" stackId="s" fill="#BFD7EA" radius={[6, 6, 0, 0]} maxBarSize={34} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Legend items={[['Completed', '#2A9D8F'], ['Missed', '#E76F51'], ['Pending', '#BFD7EA']]} />
        </Card>

        <Card className="p-5">
          <CardHeader title="Daily Productivity Hours" subtitle={`Goal ${state.settings.dailyProductiveHoursGoal}h per day · overlaps counted once`} icon={TrendingUp} />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: -24, right: 4, top: 8 }}>
                <defs>
                  <linearGradient id="prodFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2A9D8F" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#2A9D8F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgb(var(--line))" />
                <XAxis dataKey="day" {...axisProps} />
                <YAxis {...axisProps} domain={[0, (max) => Math.max(state.settings.dailyProductiveHoursGoal, Math.ceil(max))]} />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine y={state.settings.dailyProductiveHoursGoal} stroke="#F4B942" strokeDasharray="4 4" />
                <Area type="monotone" connectNulls={false} dot={{ r: 3, fill: "#2A9D8F" }} dataKey="hours" name="Productive" stroke="#2A9D8F" strokeWidth={2.5} fill="url(#prodFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <Legend items={[['Productive hours', '#2A9D8F'], ['Daily goal', '#F4B942']]} />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <CardHeader title="Category-wise Progress" subtitle="Completed / scheduled this week" icon={Layers} />
          {categories.length === 0 ? (
            <EmptyState icon={Layers} title="No activities this week" />
          ) : (
            <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {categories.map(({ category, total, completed, minutes, pct }) => (
                <li key={category.id} className="flex items-center gap-3">
                  <CategoryIcon category={category} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex justify-between gap-2 text-sm">
                      <span className="truncate font-semibold">{category.name}</span>
                      <span className="shrink-0 text-xs text-muted">
                        {completed}/{total} · {formatHours(minutes)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-soft">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: category.color }} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <CardHeader title="Weekly Goals" subtitle={`${goals.filter((g) => g.done).length} of ${goals.length} achieved`} icon={Flag} />
          <Checklist
            items={goals}
            onChange={(list) => dispatch({ type: 'SET_WEEKLY_GOALS', week: weekStart, list })}
            placeholder="e.g. Finish Playwright module 3"
            emptyText="No goals for this week yet."
          />
        </Card>
      </div>

      <Card className="p-5">
        <CardHeader title="Missed Activities" subtitle="Shown as missed — never auto-completed" icon={AlertCircle} />
        {missedList.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="Nothing missed" text="Great consistency this week!" />
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {missedList.slice(0, 30).map((a) => (
              <li key={`${a.date}-${a.id}`} className="flex items-center gap-3 rounded-xl bg-soft/60 px-3 py-2">
                <CategoryIcon category={findCategory(state.categories, a.categoryId)} icon={a.icon} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted">
                    {formatDayName(a.date)} {formatShort(a.date)} · {format12(a.start)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        {missedList.length > 30 && <p className="mt-3 text-xs text-muted">+{missedList.length - 30} more missed this week.</p>}
      </Card>
    </div>
  );
}

function Legend({ items }) {
  return (
    <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
      {items.map(([l, c]) => (
        <span key={l} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: c }} /> {l}
        </span>
      ))}
    </div>
  );
}
