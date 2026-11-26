import { Check } from 'lucide-react';
import { CategoryIcon, StatusBadge } from '../ui';
import { findCategory } from '../../utils/schedule';
import { format12 } from '../../utils/time';

/** Compact vertical timeline used on the dashboard and Office page. */
export default function Timeline({ items, categories, currentId, onToggle, onSelect, compact = false }) {
  return (
    <ol className="relative">
      {items.map((a, i) => {
        const cat = findCategory(categories, a.categoryId);
        const current = a.id === currentId;
        const done = a.status === 'completed';
        return (
          <li key={a.id} data-current={current || undefined} className="relative flex gap-3 pb-1">
            {/* rail */}
            <div className={`flex shrink-0 flex-col items-end pt-3 text-right w-[68px] whitespace-nowrap`}>
              <span className={`text-[11px] font-semibold tabular-nums ${current ? 'text-teal' : 'text-muted'}`}>{format12(a.start)}</span>
            </div>
            <div className="relative flex flex-col items-center">
              <span
                className={`z-10 mt-3.5 h-3 w-3 rounded-full border-2 ${
                  done ? 'border-success bg-success' : current ? 'border-teal bg-teal ring-4 ring-teal/20' : a.status === 'missed' ? 'border-danger/60 bg-card' : 'border-line bg-card'
                }`}
              />
              {i < items.length - 1 && <span className="absolute top-6 h-full w-px bg-line" />}
            </div>
            <div
              className={`mb-1.5 flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                current ? 'bg-teal/10 ring-1 ring-teal/30' : 'hover:bg-soft'
              }`}
            >
              <CategoryIcon category={cat} icon={a.icon} size="sm" />
              <button className="min-w-0 flex-1 text-left" onClick={() => onSelect?.(a)} aria-label={`Open ${a.title}`} disabled={!onSelect}>
                <p className={`truncate text-sm font-semibold ${done ? 'text-muted line-through' : ''}`}>{a.title}</p>
                <p className="truncate text-xs text-muted">
                  {format12(a.start)} – {format12(a.end)}
                  {compact ? (a.status === 'missed' ? ' · Missed' : '') : ` · ${cat.name}`}
                  {current && <span className="ml-1.5 font-semibold text-teal">· Now</span>}
                </p>
              </button>
              {!compact && (
                <span className="hidden sm:inline">
                  <StatusBadge status={a.status} />
                </span>
              )}
              {onToggle && (
                <button
                  onClick={() => onToggle(a)}
                  aria-label={done ? `Mark ${a.title} as not completed` : `Mark ${a.title} as completed`}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition ${
                    done ? 'border-success bg-success text-white' : 'border-line text-transparent hover:border-teal hover:text-teal'
                  }`}
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
