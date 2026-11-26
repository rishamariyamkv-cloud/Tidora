import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '../ui';
import { useStore } from '../../store/StoreContext';
import { useToast } from '../../store/ToastContext';
import { ICONS, ICON_NAMES } from '../../utils/icons';
import { findOverlaps } from '../../utils/schedule';
import { format12, toMinutes } from '../../utils/time';
import { WEEKDAY_LABELS, todayKey } from '../../utils/date';

const ActivityModalContext = createContext(null);

const EMPTY = {
  title: '',
  description: '',
  notes: '',
  categoryId: 'personal',
  start: '09:00',
  end: '09:30',
  icon: 'circle-check',
  priority: 'medium',
  reminder: null,
  recurrence: 'once',
  days: [],
  date: todayKey(),
};

export function ActivityModalProvider({ children }) {
  const [modal, setModal] = useState({ open: false, activity: null, date: null, defaults: null });

  const openActivity = useCallback((activity = null, date = null, defaults = null) => {
    setModal({ open: true, activity, date, defaults });
  }, []);
  const close = useCallback(() => setModal((m) => ({ ...m, open: false })), []);

  return (
    <ActivityModalContext.Provider value={openActivity}>
      {children}
      {modal.open && <ActivityForm activity={modal.activity} date={modal.date} defaults={modal.defaults} onClose={close} />}
    </ActivityModalContext.Provider>
  );
}

export function useActivityModal() {
  return useContext(ActivityModalContext);
}

function ActivityForm({ activity, date, defaults, onClose }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const isEdit = Boolean(activity);
  const [form, setForm] = useState(() =>
    activity ? { ...EMPTY, ...activity, date: activity.date || date || todayKey() } : { ...EMPTY, date: date || todayKey(), ...defaults },
  );
  const [errors, setErrors] = useState({});
  const [overlapAck, setOverlapAck] = useState(false);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
    if (['start', 'end', 'recurrence', 'days', 'date'].includes(k)) setOverlapAck(false);
  };

  // Default icon follows the category until the user picks one
  const [iconTouched, setIconTouched] = useState(isEdit);
  useEffect(() => {
    if (iconTouched) return;
    const cat = state.categories.find((c) => c.id === form.categoryId);
    if (cat) setForm((f) => ({ ...f, icon: cat.icon }));
  }, [form.categoryId, iconTouched, state.categories]);

  const conflicts = useMemo(() => {
    if (toMinutes(form.start) === null || toMinutes(form.end) === null || toMinutes(form.end) <= toMinutes(form.start)) return [];
    return findOverlaps(state.activities, { ...form, id: activity?.id });
  }, [form, state.activities, activity]);

  const validate = () => {
    const e = {};
    const title = form.title.trim();
    if (!title) e.title = 'Activity name is required.';
    else if (title.length < 2) e.title = 'Name must be at least 2 characters.';
    else if (title.length > 80) e.title = 'Name must be 80 characters or less.';
    if (toMinutes(form.start) === null) e.start = 'Start time is required.';
    if (toMinutes(form.end) === null) e.end = 'End time is required.';
    if (!e.start && !e.end && toMinutes(form.end) <= toMinutes(form.start)) e.end = 'End time must be after start time.';
    if (form.recurrence === 'weekly' && form.days.length === 0) e.days = 'Pick at least one day.';
    if (form.recurrence === 'once' && !form.date) e.date = 'Pick a date.';
    if (!state.categories.some((c) => c.id === form.categoryId)) e.categoryId = 'Choose a category.';
    return e;
  };

  const submit = (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      toast('Please fix the highlighted fields.', 'error');
      return;
    }
    if (conflicts.length && !overlapAck) {
      setOverlapAck(true);
      toast('This activity overlaps with others. Review and save again to confirm.', 'warning');
      return;
    }
    const payload = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      notes: form.notes.trim(),
      days: form.recurrence === 'weekly' ? [...form.days].sort() : [],
      date: form.recurrence === 'once' ? form.date : null,
      reminder: form.reminder === '' || form.reminder === null ? null : Number(form.reminder),
      createdOn: isEdit ? activity.createdOn : date && date < todayKey() ? date : todayKey(),
    };
    if (isEdit) {
      dispatch({ type: 'UPDATE_ACTIVITY', activity: payload });
      toast('Activity updated.');
    } else {
      dispatch({ type: 'ADD_ACTIVITY', activity: payload });
      toast('Activity added.');
    }
    onClose();
  };

  const err = (k) => errors[k] && <p className="mt-1 text-xs font-medium text-danger">{errors[k]}</p>;
  const inputCls = (k) => `input ${errors[k] ? 'border-danger focus:border-danger focus:ring-danger/20' : ''}`;

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Edit Activity' : 'Add New Activity'}
      size="lg"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="activity-form" className="btn-primary">
            {conflicts.length && overlapAck ? 'Save anyway' : isEdit ? 'Save changes' : 'Add activity'}
          </button>
        </>
      }
    >
      <form id="activity-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="act-title">
            Activity name *
          </label>
          <input id="act-title" className={inputCls('title')} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Playwright practice" maxLength={80} autoFocus />
          {err('title')}
        </div>

        <div>
          <label className="label" htmlFor="act-cat">
            Category
          </label>
          <select id="act-cat" className={inputCls('categoryId')} value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
            {state.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {err('categoryId')}
        </div>
        <div>
          <label className="label" htmlFor="act-priority">
            Priority
          </label>
          <select id="act-priority" className="input" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div>
          <label className="label" htmlFor="act-start">
            Start time *
          </label>
          <input id="act-start" type="time" className={inputCls('start')} value={form.start} onChange={(e) => set('start', e.target.value)} />
          {err('start')}
        </div>
        <div>
          <label className="label" htmlFor="act-end">
            End time *
          </label>
          <input id="act-end" type="time" className={inputCls('end')} value={form.end} onChange={(e) => set('end', e.target.value)} />
          {err('end')}
        </div>
        {form.prayerKey && (
          <p className="text-xs text-muted sm:col-span-2">
            Linked to the {form.prayerKey} prayer time — changing prayer times in Islamic Routine will move this activity.
          </p>
        )}

        <div>
          <label className="label" htmlFor="act-rec">
            Repeats
          </label>
          <select id="act-rec" className="input" value={form.recurrence} onChange={(e) => set('recurrence', e.target.value)}>
            <option value="once">Does not repeat</option>
            <option value="daily">Every day</option>
            <option value="weekly">Weekly on selected days</option>
          </select>
        </div>
        <div>
          {form.recurrence === 'once' && (
            <>
              <label className="label" htmlFor="act-date">
                Date
              </label>
              <input id="act-date" type="date" className={inputCls('date')} value={form.date || ''} onChange={(e) => set('date', e.target.value)} />
              {err('date')}
            </>
          )}
          {form.recurrence === 'weekly' && (
            <>
              <span className="label">Days</span>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAY_LABELS.map((d, i) => {
                  const on = form.days.includes(i);
                  return (
                    <button
                      type="button"
                      key={d}
                      onClick={() => set('days', on ? form.days.filter((x) => x !== i) : [...form.days, i])}
                      className={`h-9 w-10 rounded-lg text-xs font-semibold transition ${on ? 'bg-teal text-white' : 'bg-soft text-muted hover:text-ink'}`}
                      aria-pressed={on}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
              {err('days')}
            </>
          )}
          {form.recurrence === 'daily' && <p className="pt-7 text-xs text-muted">Shows on every day of the week.</p>}
        </div>

        <div>
          <label className="label" htmlFor="act-rem">
            Reminder
          </label>
          <select id="act-rem" className="input" value={form.reminder ?? ''} onChange={(e) => set('reminder', e.target.value === '' ? null : Number(e.target.value))}>
            <option value="">No reminder</option>
            <option value="0">At start time</option>
            <option value="5">5 minutes before</option>
            <option value="10">10 minutes before</option>
            <option value="15">15 minutes before</option>
            <option value="30">30 minutes before</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <span className="label">Icon</span>
          <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-line p-2">
            {ICON_NAMES.map((name) => {
              const Icon = ICONS[name];
              const on = form.icon === name;
              return (
                <button
                  type="button"
                  key={name}
                  title={name}
                  aria-label={`Icon ${name}`}
                  aria-pressed={on}
                  onClick={() => {
                    setIconTouched(true);
                    set('icon', name);
                  }}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${on ? 'bg-teal text-white' : 'text-muted hover:bg-soft hover:text-ink'}`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="label" htmlFor="act-desc">
            Description
          </label>
          <input id="act-desc" className="input" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Short description (optional)" maxLength={160} />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="act-notes">
            Notes
          </label>
          <textarea id="act-notes" className="input min-h-[72px]" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Notes (optional)" maxLength={1000} />
        </div>

        {conflicts.length > 0 && (
          <div className="flex gap-3 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm sm:col-span-2">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <div>
              <p className="font-semibold">Overlaps with {conflicts.length} activit{conflicts.length > 1 ? 'ies' : 'y'}</p>
              <ul className="mt-1 text-xs text-muted">
                {conflicts.slice(0, 4).map((c) => (
                  <li key={c.id}>
                    {c.title} · {format12(c.start)} – {format12(c.end)}
                  </li>
                ))}
                {conflicts.length > 4 && <li>…and {conflicts.length - 4} more</li>}
              </ul>
              <p className="mt-1 text-xs text-muted">Overlapping time is counted only once in productivity hours.</p>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
