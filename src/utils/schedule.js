import { todayKey, weekdayOf } from './date';
import { nowMinutes, overlaps, toMinutes, unionMinutes } from './time';

export const uid = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`);

export function occursOn(activity, dateKey) {
  // Recurring activities only exist from the day they were created (no fake past history)
  if (activity.createdOn && activity.recurrence !== 'once' && dateKey < activity.createdOn) return false;
  if (activity.recurrence === 'once') return activity.date === dateKey;
  if (activity.recurrence === 'weekly') return (activity.days || []).includes(weekdayOf(dateKey));
  return true; // daily
}

export function sortByTime(list) {
  return [...list].sort(
    (a, b) => toMinutes(a.start) - toMinutes(b.start) || toMinutes(a.end) - toMinutes(b.end) || a.order - b.order,
  );
}

export function sortByOrder(list) {
  return [...list].sort((a, b) => a.order - b.order);
}

export function activitiesForDate(activities, dateKey) {
  return sortByTime(activities.filter((a) => occursOn(a, dateKey)));
}

/**
 * Status is never auto-completed based on time.
 * A pending activity whose end time has passed becomes "missed".
 */
export function statusOf(statusMap, activity, dateKey, now = new Date()) {
  const stored = statusMap?.[dateKey]?.[activity.id];
  if (stored === 'completed' || stored === 'in_progress') return stored;
  const today = todayKey();
  if (dateKey < today) return 'missed';
  if (dateKey === today && toMinutes(activity.end) <= nowMinutes(now)) return 'missed';
  return 'pending';
}

export function isCurrent(activity, dateKey, now = new Date()) {
  if (dateKey !== todayKey()) return false;
  const n = nowMinutes(now);
  return toMinutes(activity.start) <= n && n < toMinutes(activity.end);
}

export function findCategory(categories, id) {
  return categories.find((c) => c.id === id) || { id, name: 'Uncategorised', color: '#6C8EA4', icon: 'circle-check' };
}

export function dayStats(state, dateKey, now = new Date()) {
  const list = activitiesForDate(state.activities, dateKey);
  const withStatus = list.map((a) => ({ ...a, status: statusOf(state.status, a, dateKey, now) }));
  const completed = withStatus.filter((a) => a.status === 'completed');
  const inProgress = withStatus.filter((a) => a.status === 'in_progress');
  const missed = withStatus.filter((a) => a.status === 'missed');
  const pending = withStatus.filter((a) => a.status === 'pending');
  const catMap = Object.fromEntries(state.categories.map((c) => [c.id, c]));

  const productiveDone = completed.filter((a) => catMap[a.categoryId]?.productive);
  const officeDone = completed.filter((a) => catMap[a.categoryId]?.office);

  const byCategory = {};
  for (const c of state.categories) {
    const all = withStatus.filter((a) => a.categoryId === c.id);
    if (!all.length) continue;
    const done = all.filter((a) => a.status === 'completed');
    byCategory[c.id] = {
      total: all.length,
      completed: done.length,
      minutes: unionMinutes(done),
      plannedMinutes: unionMinutes(all),
    };
  }

  const total = list.length;
  return {
    list: withStatus,
    total,
    completed: completed.length,
    inProgress: inProgress.length,
    pending: pending.length + inProgress.length,
    missed: missed.length,
    percent: total ? Math.round((completed.length / total) * 100) : 0,
    productiveMinutes: unionMinutes(productiveDone),
    officeMinutes: unionMinutes(officeDone),
    completedMinutes: unionMinutes(completed),
    byCategory,
  };
}

/** Other activities that share at least one day with `candidate` and overlap in time. */
export function findOverlaps(activities, candidate) {
  const sharesDay = (a, b) => {
    const days = (x) =>
      x.recurrence === 'daily'
        ? [0, 1, 2, 3, 4, 5, 6]
        : x.recurrence === 'weekly'
          ? x.days || []
          : x.date
            ? [weekdayOf(x.date)]
            : [];
    if (a.recurrence === 'once' && b.recurrence === 'once') return a.date === b.date;
    const da = days(a);
    return days(b).some((d) => da.includes(d));
  };
  return activities.filter((a) => a.id !== candidate.id && sharesDay(a, candidate) && overlaps(a, candidate));
}

export const STATUS_META = {
  completed: { label: 'Completed', cls: 'bg-success/10 text-success' },
  in_progress: { label: 'In Progress', cls: 'bg-teal/10 text-teal' },
  pending: { label: 'Pending', cls: 'bg-warning/15 text-[#B7861F] dark:text-warning' },
  missed: { label: 'Missed', cls: 'bg-danger/10 text-danger' },
};

export const PRIORITY_META = {
  high: { label: 'High', cls: 'bg-danger/10 text-danger' },
  medium: { label: 'Medium', cls: 'bg-warning/15 text-[#B7861F] dark:text-warning' },
  low: { label: 'Low', cls: 'bg-soft text-muted' },
};
