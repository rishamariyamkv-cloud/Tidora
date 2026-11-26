import { useEffect, useId, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getIcon } from '../../utils/icons';
import { PRIORITY_META, STATUS_META } from '../../utils/schedule';

export function Card({ className = '', children, ...rest }) {
  return (
    <div className={`card ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, icon: Icon, action }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-soft text-teal">
            <Icon className="h-[18px] w-[18px]" />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold">{title}</h3>
          {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy dark:text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="no-print flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function ProgressBar({ value, color = 'bg-teal', className = 'h-2' }) {
  const v = Math.max(0, Math.min(100, value || 0));
  return (
    <div className={`w-full overflow-hidden rounded-full bg-soft ${className}`} role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${v}%` }} />
    </div>
  );
}

export function ProgressRing({ value, size = 140, stroke = 12, label, sublabel, color = '#2A9D8F' }) {
  const v = Math.max(0, Math.min(100, value || 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-soft" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (v / 100) * c}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-bold">{label ?? `${v}%`}</div>
        {sublabel && <div className="text-[11px] font-medium text-muted">{sublabel}</div>}
      </div>
    </div>
  );
}

export function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.pending;
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${m.cls}`}>{m.label}</span>;
}

export function PriorityBadge({ priority }) {
  const m = PRIORITY_META[priority] || PRIORITY_META.medium;
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${m.cls}`}>{m.label}</span>;
}

export function CategoryIcon({ category, icon, size = 'md' }) {
  const Icon = getIcon(icon || category?.icon);
  const dims = size === 'sm' ? 'h-8 w-8 rounded-lg' : size === 'lg' ? 'h-12 w-12 rounded-2xl' : 'h-10 w-10 rounded-xl';
  const iconDims = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';
  const color = category?.color || '#2A9D8F';
  return (
    <span className={`flex shrink-0 items-center justify-center ${dims}`} style={{ backgroundColor: `${color}1F`, color }}>
      <Icon className={iconDims} />
    </span>
  );
}

export function CategoryChip({ category }) {
  if (!category) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-soft px-2 py-0.5 text-[11px] font-medium text-muted">
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: category.color }} />
      {category.name}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      {Icon && (
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-soft text-teal">
          <Icon className="h-6 w-6" />
        </span>
      )}
      <p className="font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  if (!open) return null;
  const width = size === 'lg' ? 'max-w-2xl' : size === 'sm' ? 'max-w-md' : 'max-w-xl';
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-dark/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className={`card flex max-h-[92vh] w-full ${width} flex-col rounded-b-none sm:rounded-2xl`}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger = true, onConfirm, onCancel }) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <button className="btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-muted">{message}</p>
    </Modal>
  );
}

export function DateNavigator({ label, sublabel, onPrev, onNext, onToday, isToday, children }) {
  return (
    <div className="flex items-center gap-1 rounded-2xl border border-line bg-card p-1 shadow-card">
      <button className="icon-btn" onClick={onPrev} aria-label="Previous">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <div className="min-w-[150px] px-2 text-center">
        <div className="text-sm font-semibold">{label}</div>
        {sublabel && <div className="text-[11px] text-muted">{sublabel}</div>}
      </div>
      <button className="icon-btn" onClick={onNext} aria-label="Next">
        <ChevronRight className="h-5 w-5" />
      </button>
      {children}
      {!isToday && (
        <button className="btn ml-1 px-3 py-1.5 text-xs text-teal hover:bg-soft" onClick={onToday}>
          Today
        </button>
      )}
    </div>
  );
}

export function Segmented({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded-xl bg-soft p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            value === o.value ? 'bg-card text-ink shadow-sm' : 'text-muted hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${checked ? 'bg-teal' : 'bg-line'}`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

export function StatCard({ icon: Icon, label, value, hint, accent = 'text-teal', children }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-2 text-[28px] font-bold leading-none">{value}</p>
          {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
        </div>
        {Icon && (
          <span className={`hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-soft sm:flex ${accent}`}>
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
      {children}
    </Card>
  );
}

/** Small list editor: add/remove text items with optional "done" toggle. */
export function Checklist({ items, onChange, placeholder = 'Add an item…', emptyText = 'Nothing here yet.' }) {
  const inputRef = useRef(null);
  const add = (e) => {
    e.preventDefault();
    const text = inputRef.current.value.trim();
    if (!text) return;
    onChange([...items, { id: Math.random().toString(36).slice(2), text, done: false }]);
    inputRef.current.value = '';
  };
  return (
    <div>
      {items.length === 0 && <p className="py-2 text-sm text-muted">{emptyText}</p>}
      <ul className="space-y-1.5">
        {items.map((it) => (
          <li key={it.id} className="group flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-soft">
            <input
              type="checkbox"
              className="h-4 w-4 accent-teal"
              checked={it.done}
              onChange={() => onChange(items.map((x) => (x.id === it.id ? { ...x, done: !x.done } : x)))}
            />
            <span className={`flex-1 text-sm ${it.done ? 'text-muted line-through' : ''}`}>{it.text}</span>
            <button
              className="text-muted transition hover:text-danger focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              onClick={() => onChange(items.filter((x) => x.id !== it.id))}
              aria-label={`Remove ${it.text}`}
            >
              <X className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="mt-3 flex gap-2">
        <input ref={inputRef} className="input" placeholder={placeholder} maxLength={120} />
        <button className="btn-primary px-3" type="submit">
          Add
        </button>
      </form>
    </div>
  );
}

/** TIDORA brand mark: a "T" over a calm wave, on a teal→navy tile. */
export function Logo({ size = 40 }) {
  // Unique gradient id per instance: a shared id breaks when the first copy sits in a hidden panel
  const gradient = `tidora-logo-${useId().replace(/:/g, '')}`;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2A9D8F" />
          <stop offset="1" stopColor="#1F5F6B" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradient})`} />
      <path d="M10 10.5h12M16 10.5v11" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 26c2.3-1.6 4.7-1.6 7 0s4.7 1.6 7 0" fill="none" stroke="#EAF2F8" strokeOpacity=".7" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Profile picture, or initials on a teal circle when no picture is set. */
export function Avatar({ src, name, size = 36, className = '' }) {
  const initials = (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) };
  if (src) {
    return <img src={src} alt={name ? `${name}'s profile picture` : 'Profile picture'} style={style} className={`shrink-0 rounded-full object-cover ${className}`} />;
  }
  return (
    <span style={style} className={`flex shrink-0 items-center justify-center rounded-full bg-teal font-bold text-white ${className}`} aria-label="Default avatar">
      {initials || '?'}
    </span>
  );
}
