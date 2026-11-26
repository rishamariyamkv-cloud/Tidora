import { useMemo, useRef, useState } from 'react';
import { BookOpen, Check, HandHeart, Minus, MoonStar, Plus, RotateCcw, Settings2, Sparkles, Target, X } from 'lucide-react';
import { Card, CardHeader, DateNavigator, EmptyState, Modal, PageHeader, ProgressBar, ProgressRing } from '../components/ui';
import { useStore } from '../store/StoreContext';
import { useToast } from '../store/ToastContext';
import { PRAYERS } from '../data/defaults';
import { addDays, formatDayName, formatLong, todayKey, weekDays } from '../utils/date';
import { format12, nowMinutes, toMinutes } from '../utils/time';
import { uid } from '../utils/schedule';

export default function Islamic() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [date, setDate] = useState(todayKey());
  const [editTimes, setEditTimes] = useState(false);
  const [manage, setManage] = useState(null); // 'dhikr' | 'goals'

  const prayerLog = state.prayerLog[date] || {};
  const prayersDone = PRAYERS.filter((p) => prayerLog[p.key]).length;
  const { prayerTimes, quran } = state.settings;
  const pagesToday = state.quranLog[date] || 0;
  const totalRead = Object.values(state.quranLog).reduce((s, n) => s + (Number(n) || 0), 0);
  const khatmPct = Math.min(100, Math.round((((quran.startPage || 1) - 1 + totalRead) / quran.totalPages) * 100));
  const dhikrLog = state.dhikrLog[date] || {};
  const goalLog = state.islamicGoalLog[date] || {};
  const goalsDone = state.islamicGoals.filter((g) => goalLog[g.id]).length;
  const isToday = date === todayKey();

  const week = useMemo(() => weekDays(date), [date]);

  // Next upcoming prayer (today only)
  const nextPrayer = isToday
    ? PRAYERS.find((p) => toMinutes(prayerTimes[p.key]) > nowMinutes() && !prayerLog[p.key])
    : null;

  const togglePrayer = (p) => {
    dispatch({ type: 'TOGGLE_PRAYER', date, key: p.key });
    if (!prayerLog[p.key]) toast(`${p.name} Salah recorded. May Allah accept it.`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Islamic Routine"
        subtitle="Salah, Quran and Dhikr — tracked with care"
        actions={
          <DateNavigator
            label={isToday ? 'Today' : formatDayName(date, 'long')}
            sublabel={formatLong(date).split(', ').slice(1).join(', ')}
            onPrev={() => setDate(addDays(date, -1))}
            onNext={() => setDate(addDays(date, 1))}
            onToday={() => setDate(todayKey())}
            isToday={isToday}
          />
        }
      />

      {/* Prayers */}
      <Card className="p-5">
        <CardHeader
          title="Daily Salah"
          subtitle={`${prayersDone} of 5 prayers completed${nextPrayer ? ` · next: ${nextPrayer.name} at ${format12(prayerTimes[nextPrayer.key])}` : ''}`}
          icon={MoonStar}
          action={
            <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => setEditTimes(true)}>
              <Settings2 className="h-4 w-4" /> Prayer times
            </button>
          }
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {PRAYERS.map((p) => {
            const done = Boolean(prayerLog[p.key]);
            const isNext = nextPrayer?.key === p.key;
            return (
              <button
                key={p.key}
                onClick={() => togglePrayer(p)}
                aria-pressed={done}
                className={`flex flex-col items-start rounded-2xl border p-4 text-left transition ${
                  done
                    ? 'border-teal bg-teal text-white'
                    : isNext
                      ? 'border-teal/50 bg-teal/5 hover:bg-teal/10'
                      : 'border-line hover:border-teal/40 hover:bg-soft'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-semibold">{p.name}</span>
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full ${done ? 'bg-white/25' : 'border-2 border-line'}`}>
                    {done && <Check className="h-4 w-4" strokeWidth={3} />}
                  </span>
                </div>
                <span className={`mt-3 text-sm tabular-nums ${done ? 'text-white/85' : 'text-muted'}`}>{format12(prayerTimes[p.key])}</span>
                <span className={`text-[11px] font-medium ${done ? 'text-white/80' : isNext ? 'text-teal' : 'text-muted'}`}>
                  {done ? 'Prayed' : isNext ? 'Up next' : 'Tap to mark'}
                </span>
              </button>
            );
          })}
        </div>
        <ProgressBar value={(prayersDone / 5) * 100} className="mt-5 h-2" />
        <p className="mt-2 text-xs text-muted">Prayer times are editable — set them to your actual local timings.</p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quran */}
        <Card className="p-5">
          <CardHeader title="Quran Reading" subtitle={`Daily goal: ${quran.dailyPages} pages`} icon={BookOpen} />
          <div className="flex flex-col items-center gap-6 sm:flex-row lg:flex-col xl:flex-row">
            <ProgressRing
              value={Math.round((pagesToday / Math.max(1, quran.dailyPages)) * 100)}
              label={pagesToday}
              sublabel={`of ${quran.dailyPages} pages`}
              size={130}
            />
            <div className="w-full flex-1 space-y-4">
              <div>
                <span className="label">Pages read {isToday ? 'today' : 'this day'}</span>
                <div className="flex items-center gap-2">
                  <button className="btn-ghost h-10 w-10 p-0" onClick={() => dispatch({ type: 'SET_QURAN', date, pages: pagesToday - 1 })} aria-label="One page less">
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="604"
                    className="input h-10 w-20 text-center font-semibold"
                    value={pagesToday}
                    onChange={(e) => dispatch({ type: 'SET_QURAN', date, pages: Math.min(604, Number(e.target.value) || 0) })}
                    aria-label="Pages read"
                  />
                  <button className="btn-primary h-10 w-10 p-0" onClick={() => dispatch({ type: 'SET_QURAN', date, pages: pagesToday + 1 })} aria-label="One page more">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex justify-between text-xs font-medium text-muted">
                  <span>Khatm progress</span>
                  <span>
                    {Math.min(quran.totalPages, (quran.startPage || 1) - 1 + totalRead)} / {quran.totalPages} pages · {khatmPct}%
                  </span>
                </div>
                <ProgressBar value={khatmPct} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-muted">
                  Daily goal (pages)
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="input mt-1"
                    value={quran.dailyPages}
                    onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', settings: { quran: { ...quran, dailyPages: Math.max(1, Number(e.target.value) || 1) } } })}
                  />
                </label>
                <label className="text-xs text-muted">
                  Started from page
                  <input
                    type="number"
                    min="1"
                    max="604"
                    className="input mt-1"
                    value={quran.startPage || 1}
                    onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', settings: { quran: { ...quran, startPage: Math.max(1, Number(e.target.value) || 1) } } })}
                  />
                </label>
              </div>
            </div>
          </div>
        </Card>

        {/* Dhikr */}
        <Card className="p-5">
          <CardHeader
            title="Thasbeeh / Dhikr"
            subtitle="Tap + to count"
            icon={HandHeart}
            action={
              <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => setManage('dhikr')}>
                Customize
              </button>
            }
          />
          {state.dhikr.length === 0 ? (
            <EmptyState icon={HandHeart} title="No dhikr added" text="Add the dhikr you want to track daily." />
          ) : (
            <ul className="space-y-3">
              {state.dhikr.map((d) => {
                const count = dhikrLog[d.id] || 0;
                const done = count >= d.target;
                return (
                  <li key={d.id} className="rounded-xl bg-soft/60 p-3">
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{d.name}</p>
                        <p className={`text-xs ${done ? 'font-semibold text-success' : 'text-muted'}`}>
                          {count} / {d.target} {done && '· complete'}
                        </p>
                      </div>
                      <button className="icon-btn" onClick={() => dispatch({ type: 'SET_DHIKR_COUNT', date, id: d.id, count: 0 })} aria-label={`Reset ${d.name}`}>
                        <RotateCcw className="h-4 w-4" />
                      </button>
                      <button className="btn-ghost h-9 px-2.5 text-xs" onClick={() => dispatch({ type: 'SET_DHIKR_COUNT', date, id: d.id, count: count + 10 })}>
                        +10
                      </button>
                      <button className="btn-primary h-9 w-9 p-0" onClick={() => dispatch({ type: 'SET_DHIKR_COUNT', date, id: d.id, count: count + 1 })} aria-label={`Count ${d.name}`}>
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <ProgressBar value={(count / d.target) * 100} color={done ? 'bg-success' : 'bg-teal'} className="mt-2 h-1.5" />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Islamic goals */}
        <Card className="p-5">
          <CardHeader
            title="Daily Islamic Goals"
            subtitle={`${goalsDone} of ${state.islamicGoals.length} achieved`}
            icon={Target}
            action={
              <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => setManage('goals')}>
                Customize
              </button>
            }
          />
          {state.islamicGoals.length === 0 ? (
            <EmptyState icon={Sparkles} title="No goals yet" text="Add small daily goals to build consistency." />
          ) : (
            <ul className="space-y-1.5">
              {state.islamicGoals.map((g) => (
                <li key={g.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 hover:bg-soft">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-teal"
                      checked={Boolean(goalLog[g.id])}
                      onChange={() => dispatch({ type: 'TOGGLE_ISLAMIC_GOAL', date, id: g.id })}
                    />
                    <span className={`text-sm ${goalLog[g.id] ? 'text-muted line-through' : ''}`}>{g.text}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Weekly prayer grid */}
        <Card className="p-5">
          <CardHeader title="This Week's Salah" subtitle="Prayer completion by day" icon={MoonStar} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[340px] text-center text-xs">
              <thead>
                <tr className="text-muted">
                  <th className="pb-2 text-left font-medium">Prayer</th>
                  {week.map((d) => (
                    <th key={d} className={`pb-2 font-medium ${d === date ? 'text-teal' : ''}`}>
                      {formatDayName(d)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PRAYERS.map((p) => (
                  <tr key={p.key}>
                    <td className="py-1.5 text-left font-semibold">{p.name}</td>
                    {week.map((d) => {
                      const done = state.prayerLog[d]?.[p.key];
                      const future = d > todayKey();
                      return (
                        <td key={d} className="py-1.5">
                          <span
                            className={`mx-auto flex h-6 w-6 items-center justify-center rounded-md ${
                              done ? 'bg-teal text-white' : future ? 'bg-soft/50' : 'bg-soft'
                            }`}
                          >
                            {done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {editTimes && <PrayerTimesModal open onClose={() => setEditTimes(false)} />}
      {manage === 'dhikr' && (
      <ListManager
        open
        title="Customize Dhikr"
        items={state.dhikr}
        withTarget
        onClose={() => setManage(null)}
        onSave={(list) => {
          dispatch({ type: 'SET_DHIKR_LIST', list });
          toast('Dhikr list updated.');
        }}
      />
      )}
      {manage === 'goals' && (
      <ListManager
        open
        title="Customize Islamic Goals"
        items={state.islamicGoals}
        onClose={() => setManage(null)}
        onSave={(list) => {
          dispatch({ type: 'SET_ISLAMIC_GOALS', list });
          toast('Islamic goals updated.');
        }}
      />
      )}
    </div>
  );
}

function PrayerTimesModal({ open, onClose }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [times, setTimes] = useState(state.settings.prayerTimes);
  const [error, setError] = useState('');

  const save = () => {
    const mins = PRAYERS.map((p) => toMinutes(times[p.key]));
    if (mins.some((m) => m === null)) return setError('Please fill in every prayer time.');
    if (mins.some((m, i) => i > 0 && m <= mins[i - 1])) return setError('Prayer times must be in order: Fajr → Isha.');
    dispatch({ type: 'UPDATE_SETTINGS', settings: { prayerTimes: times } });
    toast('Prayer times saved. Linked schedule items were updated.');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Local Prayer Times"
      size="sm"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={save}>
            Save times
          </button>
        </>
      }
    >
      <p className="mb-4 text-sm text-muted">Enter the prayer times for your city. Schedule items linked to Fajr, Maghrib and Isha move automatically.</p>
      <div className="space-y-3">
        {PRAYERS.map((p) => (
          <label key={p.key} className="flex items-center justify-between gap-4">
            <span className="text-sm font-semibold">{p.name}</span>
            <input
              type="time"
              className="input w-36"
              value={times[p.key]}
              onChange={(e) => {
                setTimes({ ...times, [p.key]: e.target.value });
                setError('');
              }}
            />
          </label>
        ))}
      </div>
      {error && <p className="mt-3 text-xs font-medium text-danger">{error}</p>}
    </Modal>
  );
}

function ListManager({ open, title, items, withTarget, onClose, onSave }) {
  const [list, setList] = useState(items);
  const nameRef = useRef(null);
  const targetRef = useRef(null);
  const [error, setError] = useState('');
  const key = withTarget ? 'name' : 'text';

  const add = (e) => {
    e.preventDefault();
    const name = nameRef.current.value.trim();
    if (!name) return setError('Please enter a name.');
    const item = { id: uid(), [key]: name };
    if (withTarget) {
      const t = Number(targetRef.current.value);
      if (!t || t < 1) return setError('Target must be at least 1.');
      item.target = t;
    }
    setList([...list, item]);
    nameRef.current.value = '';
    if (targetRef.current) targetRef.current.value = '33';
    setError('');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              onSave(list);
              onClose();
            }}
          >
            Save
          </button>
        </>
      }
    >
      <ul className="mb-4 space-y-2">
        {list.map((it) => (
          <li key={it.id} className="flex items-center gap-2">
            <input
              className="input"
              value={it[key]}
              onChange={(e) => setList(list.map((x) => (x.id === it.id ? { ...x, [key]: e.target.value } : x)))}
              aria-label="Name"
            />
            {withTarget && (
              <input
                type="number"
                min="1"
                className="input w-24"
                value={it.target}
                onChange={(e) => setList(list.map((x) => (x.id === it.id ? { ...x, target: Math.max(1, Number(e.target.value) || 1) } : x)))}
                aria-label="Target"
              />
            )}
            <button className="icon-btn hover:!text-danger" onClick={() => setList(list.filter((x) => x.id !== it.id))} aria-label="Remove">
              <X className="h-4 w-4" />
            </button>
          </li>
        ))}
        {list.length === 0 && <p className="text-sm text-muted">The list is empty.</p>}
      </ul>
      <form onSubmit={add} className="flex gap-2 border-t border-line pt-4">
        <input ref={nameRef} className="input" placeholder={withTarget ? 'New dhikr' : 'New goal'} maxLength={80} />
        {withTarget && <input ref={targetRef} type="number" min="1" defaultValue={33} className="input w-24" aria-label="Target count" />}
        <button className="btn-primary px-3" type="submit">
          Add
        </button>
      </form>
      {error && <p className="mt-2 text-xs font-medium text-danger">{error}</p>}
    </Modal>
  );
}
