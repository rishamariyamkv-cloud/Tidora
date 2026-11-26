// Time helpers. Times are stored as "HH:MM" (24h).

export function toMinutes(time) {
  if (!time || !/^\d{1,2}:\d{2}$/.test(time)) return null;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function fromMinutes(mins) {
  const m = Math.max(0, Math.min(mins, 23 * 60 + 59));
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

export function format12(time) {
  const mins = toMinutes(time);
  if (mins === null) return '--';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function nowMinutes(date = new Date()) {
  return date.getHours() * 60 + date.getMinutes();
}

export function durationMinutes(start, end) {
  const s = toMinutes(start);
  const e = toMinutes(end);
  if (s === null || e === null) return 0;
  return Math.max(0, e - s);
}

export function overlaps(a, b) {
  const as = toMinutes(a.start);
  const ae = toMinutes(a.end);
  const bs = toMinutes(b.start);
  const be = toMinutes(b.end);
  return as < be && bs < ae;
}

/**
 * Total minutes covered by a list of intervals, counting overlapping
 * stretches only once (interval union).
 */
export function unionMinutes(items) {
  const ranges = items
    .map((i) => [toMinutes(i.start), toMinutes(i.end)])
    .filter(([s, e]) => s !== null && e !== null && e > s)
    .sort((a, b) => a[0] - b[0]);
  let total = 0;
  let curS = null;
  let curE = null;
  for (const [s, e] of ranges) {
    if (curE === null || s > curE) {
      if (curE !== null) total += curE - curS;
      curS = s;
      curE = e;
    } else if (e > curE) {
      curE = e;
    }
  }
  if (curE !== null) total += curE - curS;
  return total;
}

export function formatHours(mins) {
  const h = mins / 60;
  if (h === 0) return '0h';
  if (h < 1) return `${Math.round(mins)}m`;
  return `${Number.isInteger(h) ? h : h.toFixed(1)}h`;
}

export function formatDuration(mins) {
  if (!mins) return '0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}
