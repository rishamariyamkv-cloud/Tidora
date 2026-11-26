import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BookOpenCheck, Clock, GraduationCap, ListTodo, Pencil, Plus, Target, Trash2, TrendingUp, X } from 'lucide-react';
import { Card, CardHeader, Checklist, ConfirmDialog, EmptyState, Modal, PageHeader, ProgressBar } from '../components/ui';
import ChartTooltip from '../components/ui/ChartTooltip';
import { useStore } from '../store/StoreContext';
import { useToast } from '../store/ToastContext';
import { formatDayName, formatShort, todayKey, weekDays } from '../utils/date';
import { activitiesForDate, statusOf, uid } from '../utils/schedule';
import { formatDuration, formatHours, unionMinutes } from '../utils/time';

export default function Learning() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const today = todayKey();
  const [goalModal, setGoalModal] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [session, setSession] = useState({ goalId: '', minutes: 30, notes: '', date: today });
  const [sessionError, setSessionError] = useState('');
  const [newSkill, setNewSkill] = useState('');

  const learningCats = state.categories.filter((c) => c.id === 'learning').map((c) => c.id);
  const week = weekDays(today);

  // Study minutes per day = completed learning activities (planner) + logged sessions
  const weekData = useMemo(
    () =>
      week.map((d) => {
        const done = activitiesForDate(state.activities, d).filter(
          (a) => learningCats.includes(a.categoryId) && statusOf(state.status, a, d) === 'completed',
        );
        const planner = unionMinutes(done);
        const logged = state.learningSessions.filter((s) => s.date === d).reduce((s, x) => s + Number(x.minutes || 0), 0);
        return { day: formatDayName(d), planner: planner / 60, logged: logged / 60 };
      }),
    [state, week, learningCats],
  );
  const weekMinutes = weekData.reduce((s, d) => s + (d.planner + d.logged) * 60, 0);
  const weekGoal = state.settings.weeklyLearningHoursGoal;

  const goalMinutes = (goalId) =>
    state.learningSessions.filter((s) => s.goalId === goalId).reduce((s, x) => s + Number(x.minutes || 0), 0);

  const recentSessions = [...state.learningSessions].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8);
  const dailyGoals = state.dailyGoals[today] || [];

  const logSession = (e) => {
    e.preventDefault();
    const minutes = Number(session.minutes);
    if (!minutes || minutes < 5 || minutes > 600) return setSessionError('Duration must be between 5 and 600 minutes.');
    if (!session.goalId && !session.notes.trim()) return setSessionError('Choose a goal or describe what you studied.');
    dispatch({ type: 'ADD_SESSION', session: { ...session, minutes, notes: session.notes.trim() } });
    setSession({ goalId: session.goalId, minutes: 30, notes: '', date: today });
    setSessionError('');
    toast(`Logged ${formatDuration(minutes)} of learning. Keep going!`);
  };

  const addSkill = (e) => {
    e.preventDefault();
    const name = newSkill.trim();
    if (!name) return;
    if (state.skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) return toast('That skill is already listed.', 'warning');
    dispatch({ type: 'SET_SKILLS', list: [...state.skills, { id: uid(), name, level: 10 }] });
    setNewSkill('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Learning & Productivity"
        subtitle="Grow one focused session at a time"
        actions={
          <button className="btn-primary" onClick={() => setGoalModal({})}>
            <Plus className="h-4 w-4" /> Learning goal
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Weekly chart */}
        <Card className="p-5 lg:col-span-2">
          <CardHeader
            title="Weekly Learning Progress"
            subtitle={`${formatHours(weekMinutes)} of ${weekGoal}h weekly goal`}
            icon={TrendingUp}
            action={
              <label className="flex items-center gap-2 text-xs text-muted">
                Goal
                <input
                  type="number"
                  min="1"
                  max="80"
                  className="input w-16 py-1 text-xs"
                  value={weekGoal}
                  onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', settings: { weeklyLearningHoursGoal: Math.max(1, Number(e.target.value) || 1) } })}
                  aria-label="Weekly learning hours goal"
                />
                h
              </label>
            }
          />
          <ProgressBar value={(weekMinutes / 60 / weekGoal) * 100} className="mb-5 h-2" />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData} margin={{ left: -20, right: 4 }}>
                <CartesianGrid vertical={false} stroke="rgb(var(--line))" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'rgb(var(--muted))' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'rgb(var(--muted))' }} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgb(var(--soft))' }} />
                <Bar dataKey="planner" name="Planner" stackId="a" fill="#2A9D8F" radius={[0, 0, 0, 0]} maxBarSize={36} />
                <Bar dataKey="logged" name="Logged sessions" stackId="a" fill="#4A90C2" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex gap-4 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-teal" /> Completed learning activities
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#4A90C2]" /> Logged sessions
            </span>
          </div>
        </Card>

        {/* Daily productivity goals */}
        <Card className="p-5">
          <CardHeader
            title="Today's Productivity Goals"
            subtitle={`${dailyGoals.filter((g) => g.done).length} of ${dailyGoals.length} done`}
            icon={ListTodo}
          />
          <Checklist
            items={dailyGoals}
            onChange={(list) => dispatch({ type: 'SET_DAILY_GOALS', date: today, list })}
            placeholder="e.g. Write 10 test cases"
            emptyText="Set 2–3 meaningful goals for today."
          />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Learning goals */}
        <Card className="p-5">
          <CardHeader title="Learning Goals" subtitle="Progress from logged study sessions" icon={Target} />
          {state.learningGoals.length === 0 ? (
            <EmptyState
              icon={Target}
              title="No learning goals yet"
              action={
                <button className="btn-primary" onClick={() => setGoalModal({})}>
                  <Plus className="h-4 w-4" /> Add goal
                </button>
              }
            />
          ) : (
            <ul className="space-y-4">
              {state.learningGoals.map((g) => {
                const mins = goalMinutes(g.id);
                const pct = Math.round((mins / 60 / g.targetHours) * 100);
                return (
                  <li key={g.id}>
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{g.title}</p>
                        <p className="text-xs text-muted">
                          {g.skill} · {formatHours(mins)} / {g.targetHours}h{g.deadline && ` · due ${formatShort(g.deadline)}`}
                        </p>
                      </div>
                      <span className={`text-sm font-bold ${pct >= 100 ? 'text-success' : 'text-teal'}`}>{Math.min(100, pct)}%</span>
                      <button className="icon-btn h-8 w-8" onClick={() => setGoalModal(g)} aria-label={`Edit ${g.title}`}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button className="icon-btn h-8 w-8 hover:!text-danger" onClick={() => setToDelete(g)} aria-label={`Delete ${g.title}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <ProgressBar value={pct} color={pct >= 100 ? 'bg-success' : 'bg-teal'} className="mt-2 h-1.5" />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Log session */}
        <Card className="p-5">
          <CardHeader title="Log a Study Session" subtitle="Track study duration" icon={Clock} />
          <form onSubmit={logSession} className="grid gap-3 sm:grid-cols-2" noValidate>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="ses-goal">
                Learning goal
              </label>
              <select id="ses-goal" className="input" value={session.goalId} onChange={(e) => setSession({ ...session, goalId: e.target.value })}>
                <option value="">General study (no goal)</option>
                {state.learningGoals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="ses-min">
                Minutes
              </label>
              <input id="ses-min" type="number" min="5" max="600" step="5" className="input" value={session.minutes} onChange={(e) => setSession({ ...session, minutes: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="ses-date">
                Date
              </label>
              <input id="ses-date" type="date" max={today} className="input" value={session.date} onChange={(e) => setSession({ ...session, date: e.target.value || today })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="ses-notes">
                What did you learn?
              </label>
              <input id="ses-notes" className="input" value={session.notes} onChange={(e) => setSession({ ...session, notes: e.target.value })} placeholder="e.g. Playwright locators & assertions" maxLength={200} />
            </div>
            {sessionError && <p className="text-xs font-medium text-danger sm:col-span-2">{sessionError}</p>}
            <button className="btn-primary sm:col-span-2" type="submit">
              <Plus className="h-4 w-4" /> Log session
            </button>
          </form>

          <h4 className="mb-2 mt-6 text-xs font-bold uppercase tracking-wider text-muted">Completed sessions</h4>
          {recentSessions.length === 0 ? (
            <p className="text-sm text-muted">No sessions logged yet.</p>
          ) : (
            <ul className="divide-y divide-line/70">
              {recentSessions.map((s) => {
                const g = state.learningGoals.find((x) => x.id === s.goalId);
                return (
                  <li key={s.id} className="flex items-center gap-3 py-2">
                    <BookOpenCheck className="h-4 w-4 shrink-0 text-teal" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{s.notes || g?.title || 'Study session'}</p>
                      <p className="text-xs text-muted">
                        {formatShort(s.date)} · {formatDuration(Number(s.minutes))}
                        {g && s.notes ? ` · ${g.title}` : ''}
                      </p>
                    </div>
                    <button className="icon-btn h-8 w-8 hover:!text-danger" onClick={() => dispatch({ type: 'DELETE_SESSION', id: s.id })} aria-label="Delete session">
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* Skills */}
      <Card className="p-5">
        <CardHeader title="Skills to Improve" subtitle="Drag the slider to update your self-assessed level" icon={GraduationCap} />
        <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
          {state.skills.map((s) => (
            <div key={s.id}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-semibold">{s.name}</span>
                <span className="flex items-center gap-1 text-xs text-muted">
                  {s.level}%
                  <button
                    className="rounded p-1 hover:text-danger"
                    onClick={() => dispatch({ type: 'SET_SKILLS', list: state.skills.filter((x) => x.id !== s.id) })}
                    aria-label={`Remove ${s.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={s.level}
                className="w-full accent-teal"
                onChange={(e) =>
                  dispatch({ type: 'SET_SKILLS', list: state.skills.map((x) => (x.id === s.id ? { ...x, level: Number(e.target.value) } : x)) })
                }
                aria-label={`${s.name} level`}
              />
            </div>
          ))}
        </div>
        <form onSubmit={addSkill} className="mt-5 flex max-w-md gap-2">
          <input className="input" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="Add a skill…" maxLength={60} />
          <button className="btn-primary px-3" type="submit">
            Add
          </button>
        </form>
      </Card>

      {goalModal && <GoalModal goal={goalModal} skills={state.skills} onClose={() => setGoalModal(null)} />}
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete learning goal?"
        message={toDelete ? `“${toDelete.title}” will be removed. Logged sessions are kept as general study.` : ''}
        confirmLabel="Delete"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          dispatch({ type: 'SET_LEARNING_GOALS', list: state.learningGoals.filter((g) => g.id !== toDelete.id) });
          toast('Goal deleted.', 'info');
          setToDelete(null);
        }}
      />
    </div>
  );
}

function GoalModal({ goal, skills, onClose }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const isEdit = Boolean(goal.id);
  const [form, setForm] = useState({ title: '', skill: skills[0]?.name || '', targetHours: 10, deadline: '', ...goal });
  const [error, setError] = useState('');

  const save = (e) => {
    e.preventDefault();
    if (form.title.trim().length < 2) return setError('Goal title must be at least 2 characters.');
    const targetHours = Number(form.targetHours);
    if (!targetHours || targetHours <= 0) return setError('Target hours must be greater than 0.');
    const item = { ...form, title: form.title.trim(), targetHours };
    const list = isEdit ? state.learningGoals.map((g) => (g.id === goal.id ? item : g)) : [...state.learningGoals, { ...item, id: uid() }];
    dispatch({ type: 'SET_LEARNING_GOALS', list });
    toast(isEdit ? 'Goal updated.' : 'Learning goal added.');
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Edit Learning Goal' : 'New Learning Goal'}
      size="sm"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" type="submit" form="goal-form">
            Save
          </button>
        </>
      }
    >
      <form id="goal-form" onSubmit={save} className="space-y-4" noValidate>
        <div>
          <label className="label" htmlFor="g-title">
            Goal
          </label>
          <input id="g-title" className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={100} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="g-skill">
              Skill
            </label>
            <input id="g-skill" className="input" list="skill-list" value={form.skill} onChange={(e) => setForm({ ...form, skill: e.target.value })} />
            <datalist id="skill-list">
              {skills.map((s) => (
                <option key={s.id} value={s.name} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="label" htmlFor="g-hours">
              Target hours
            </label>
            <input id="g-hours" type="number" min="1" className="input" value={form.targetHours} onChange={(e) => setForm({ ...form, targetHours: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="g-deadline">
            Deadline (optional)
          </label>
          <input id="g-deadline" type="date" className="input" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
        </div>
        {error && <p className="text-xs font-medium text-danger">{error}</p>}
      </form>
    </Modal>
  );
}
