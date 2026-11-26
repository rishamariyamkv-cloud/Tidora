import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_DHIKR,
  DEFAULT_ISLAMIC_GOALS,
  DEFAULT_LEARNING_GOALS,
  DEFAULT_SETTINGS,
  DEFAULT_SKILLS,
  buildDefaultActivities,
} from '../data/defaults';
import { occursOn, uid } from '../utils/schedule';
import { todayKey } from '../utils/date';
import { durationMinutes, fromMinutes, toMinutes } from '../utils/time';

const STORAGE_KEY = 'daily-planner-state-v1';

export function createInitialState() {
  return {
    version: 1,
    settings: DEFAULT_SETTINGS,
    categories: DEFAULT_CATEGORIES,
    startedOn: todayKey(),
    activities: buildDefaultActivities(todayKey()),
    status: {},
    prayerLog: {},
    quranLog: {},
    dhikr: DEFAULT_DHIKR,
    dhikrLog: {},
    islamicGoals: DEFAULT_ISLAMIC_GOALS,
    islamicGoalLog: {},
    officeTasks: [],
    workSummary: {},
    skills: DEFAULT_SKILLS,
    learningGoals: DEFAULT_LEARNING_GOALS,
    learningSessions: [],
    dailyGoals: {},
    weeklyGoals: {},
  };
}

function loadState() {
  const base = createInitialState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw);
    return {
      ...base,
      ...saved,
      settings: {
        ...base.settings,
        ...saved.settings,
        profile: { ...base.settings.profile, ...saved.settings?.profile },
        notifications: { ...base.settings.notifications, ...saved.settings?.notifications },
        prayerTimes: { ...base.settings.prayerTimes, ...saved.settings?.prayerTimes },
        quran: { ...base.settings.quran, ...saved.settings?.quran },
      },
    };
  } catch {
    return base;
  }
}

/** Keep schedule entries linked to a prayer in sync with the configured prayer time. */
function syncPrayerActivities(activities, prayerTimes) {
  return activities.map((a) => {
    if (!a.prayerKey || !prayerTimes[a.prayerKey]) return a;
    const dur = durationMinutes(a.start, a.end) || 15;
    const start = prayerTimes[a.prayerKey];
    return { ...a, start, end: fromMinutes(toMinutes(start) + dur) };
  });
}

const setIn = (obj, date, key, value) => ({ ...obj, [date]: { ...(obj[date] || {}), [key]: value } });

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_ACTIVITY': {
      const maxOrder = Math.max(-1, ...state.activities.map((a) => a.order));
      return { ...state, activities: [...state.activities, { ...action.activity, id: uid(), order: maxOrder + 1, createdOn: action.activity.createdOn || todayKey() }] };
    }
    case 'UPDATE_ACTIVITY':
      return {
        ...state,
        activities: state.activities.map((a) => (a.id === action.activity.id ? { ...a, ...action.activity } : a)),
      };
    case 'DELETE_ACTIVITY':
      return { ...state, activities: state.activities.filter((a) => a.id !== action.id) };
    case 'REORDER_ACTIVITIES': {
      // action.ids: ordered list of activity ids (subset); assign their existing order slots in new sequence
      const slots = action.ids
        .map((id) => state.activities.find((a) => a.id === id)?.order)
        .filter((o) => o !== undefined)
        .sort((a, b) => a - b);
      const orderMap = Object.fromEntries(action.ids.map((id, i) => [id, slots[i]]));
      return {
        ...state,
        activities: state.activities.map((a) => (a.id in orderMap ? { ...a, order: orderMap[a.id] } : a)),
      };
    }
    case 'SET_STATUS': {
      const { date, id, status } = action;
      const dayMap = { ...(state.status[date] || {}) };
      if (status === 'pending') delete dayMap[id];
      else dayMap[id] = status;
      const act = state.activities.find((a) => a.id === id);
      let prayerLog = state.prayerLog;
      if (act?.prayerKey) prayerLog = setIn(prayerLog, date, act.prayerKey, status === 'completed');
      return { ...state, status: { ...state.status, [date]: dayMap }, prayerLog };
    }
    case 'RESET_DAY': {
      const status = { ...state.status };
      delete status[action.date];
      const prayerLog = { ...state.prayerLog };
      delete prayerLog[action.date];
      return { ...state, status, prayerLog };
    }
    case 'TOGGLE_PRAYER': {
      const { date, key } = action;
      const done = !state.prayerLog[date]?.[key];
      const prayerLog = setIn(state.prayerLog, date, key, done);
      const linked = state.activities.filter((a) => a.prayerKey === key && occursOn(a, date));
      const dayMap = { ...(state.status[date] || {}) };
      linked.forEach((a) => {
        if (done) dayMap[a.id] = 'completed';
        else delete dayMap[a.id];
      });
      return { ...state, prayerLog, status: { ...state.status, [date]: dayMap } };
    }
    case 'SET_QURAN':
      return { ...state, quranLog: { ...state.quranLog, [action.date]: Math.max(0, action.pages) } };
    case 'SET_DHIKR_COUNT':
      return { ...state, dhikrLog: setIn(state.dhikrLog, action.date, action.id, Math.max(0, action.count)) };
    case 'SET_DHIKR_LIST':
      return { ...state, dhikr: action.list };
    case 'TOGGLE_ISLAMIC_GOAL':
      return {
        ...state,
        islamicGoalLog: setIn(state.islamicGoalLog, action.date, action.id, !state.islamicGoalLog[action.date]?.[action.id]),
      };
    case 'SET_ISLAMIC_GOALS':
      return { ...state, islamicGoals: action.list };

    case 'ADD_OFFICE_TASK':
      return { ...state, officeTasks: [...state.officeTasks, { ...action.task, id: uid(), createdAt: Date.now() }] };
    case 'UPDATE_OFFICE_TASK':
      return { ...state, officeTasks: state.officeTasks.map((t) => (t.id === action.task.id ? { ...t, ...action.task } : t)) };
    case 'DELETE_OFFICE_TASK':
      return { ...state, officeTasks: state.officeTasks.filter((t) => t.id !== action.id) };
    case 'SET_WORK_SUMMARY':
      return { ...state, workSummary: { ...state.workSummary, [action.date]: action.text } };

    case 'SET_SKILLS':
      return { ...state, skills: action.list };
    case 'SET_LEARNING_GOALS':
      return { ...state, learningGoals: action.list };
    case 'ADD_SESSION':
      return { ...state, learningSessions: [...state.learningSessions, { ...action.session, id: uid() }] };
    case 'DELETE_SESSION':
      return { ...state, learningSessions: state.learningSessions.filter((s) => s.id !== action.id) };
    case 'SET_DAILY_GOALS':
      return { ...state, dailyGoals: { ...state.dailyGoals, [action.date]: action.list } };
    case 'SET_WEEKLY_GOALS':
      return { ...state, weeklyGoals: { ...state.weeklyGoals, [action.week]: action.list } };

    case 'UPDATE_SETTINGS': {
      const settings = { ...state.settings, ...action.settings };
      const activities = action.settings.prayerTimes
        ? syncPrayerActivities(state.activities, settings.prayerTimes)
        : state.activities;
      return { ...state, settings, activities };
    }
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, { ...action.category, id: uid(), custom: true }] };
    case 'UPDATE_CATEGORY':
      return { ...state, categories: state.categories.map((c) => (c.id === action.category.id ? { ...c, ...action.category } : c)) };
    case 'DELETE_CATEGORY': {
      // Move activities of a removed category to "personal" so nothing is orphaned
      const others = state.categories.filter((c) => c.id !== action.id);
      const fallback = (others.find((c) => c.id === 'personal') || others[0])?.id || 'personal';
      return {
        ...state,
        categories: state.categories.filter((c) => c.id !== action.id),
        activities: state.activities.map((a) => (a.categoryId === action.id ? { ...a, categoryId: fallback } : a)),
      };
    }
    case 'RESTORE_DEFAULT_SCHEDULE':
      return { ...state, activities: syncPrayerActivities(buildDefaultActivities(state.startedOn || todayKey()), state.settings.prayerTimes) };
    case 'IMPORT_STATE':
      return { ...createInitialState(), ...action.state };
    case 'RESET_ALL':
      return createInitialState();
    default:
      return state;
  }
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or unavailable — the app keeps working in memory */
    }
  }, [state]);

  // Theme
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const t = state.settings.theme;
      const dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      root.classList.toggle('dark', dark);
    };
    apply();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [state.settings.theme]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

export { STORAGE_KEY };
