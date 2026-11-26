// Date helpers. Dates are stored as local "YYYY-MM-DD" keys.

const pad = (n) => String(n).padStart(2, '0');

export function toKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey() {
  return toKey(new Date());
}

export function addDays(key, n) {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

export function weekdayOf(key) {
  return fromKey(key).getDay();
}

/** Monday-based start of week. */
export function startOfWeek(key) {
  const day = weekdayOf(key);
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(key, diff);
}

export function weekDays(key) {
  const start = startOfWeek(key);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function monthDays(key) {
  const d = fromKey(key);
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const count = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return Array.from({ length: count }, (_, i) => toKey(new Date(first.getFullYear(), first.getMonth(), i + 1)));
}

export function addMonths(key, n) {
  const d = fromKey(key);
  return toKey(new Date(d.getFullYear(), d.getMonth() + n, 1));
}

export function formatLong(key) {
  return fromKey(key).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatShort(key) {
  return fromKey(key).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function formatDayName(key, style = 'short') {
  return fromKey(key).toLocaleDateString(undefined, { weekday: style });
}

export function formatMonth(key) {
  return fromKey(key).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function dayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
