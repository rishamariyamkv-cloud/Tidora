export default function ChartTooltip({ active, payload, label, unit = 'h' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-xs">
      <p className="mb-1 font-semibold">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-muted">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
          {p.name}: <b className="text-ink">{typeof p.value === 'number' ? `${Math.round(p.value * 10) / 10}${unit}` : p.value}</b>
        </p>
      ))}
    </div>
  );
}

export const axisProps = {
  tickLine: false,
  axisLine: false,
  tick: { fontSize: 12, fill: 'rgb(var(--muted))' },
};
