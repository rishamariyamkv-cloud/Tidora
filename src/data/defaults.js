// Default (sample) data. Everything here is editable by the user in the app.

export const DEFAULT_CATEGORIES = [
  { id: 'islamic', name: 'Islamic Activities', color: '#2A9D8F', icon: 'moon-star', productive: false },
  { id: 'office', name: 'Office Work', color: '#2F5D8A', icon: 'briefcase', productive: true, office: true },
  { id: 'qa', name: 'QA Testing', color: '#3B82A0', icon: 'bug', productive: true, office: true },
  { id: 'learning', name: 'Learning', color: '#4A90C2', icon: 'graduation-cap', productive: true },
  { id: 'productivity', name: 'Productivity', color: '#E0A93B', icon: 'target', productive: true },
  { id: 'health', name: 'Health & Fitness', color: '#2E9D62', icon: 'dumbbell', productive: false },
  { id: 'personal', name: 'Personal Activities', color: '#6C8EA4', icon: 'user', productive: false },
  { id: 'relaxation', name: 'Relaxation', color: '#5FB3AA', icon: 'coffee', productive: false },
  { id: 'family', name: 'Family Time', color: '#E76F51', icon: 'users', productive: false },
  { id: 'sleep', name: 'Sleep & Rest', color: '#6B7A99', icon: 'bed', productive: false },
];

export const PRAYERS = [
  { key: 'fajr', name: 'Fajr' },
  { key: 'dhuhr', name: 'Dhuhr' },
  { key: 'asr', name: 'Asr' },
  { key: 'maghrib', name: 'Maghrib' },
  { key: 'isha', name: 'Isha' },
];

// Sample local times only — the user should set their actual local prayer times in Settings / Islamic Routine.
export const DEFAULT_PRAYER_TIMES = {
  fajr: '05:45',
  dhuhr: '12:30',
  asr: '15:45',
  maghrib: '18:20',
  isha: '19:35',
};

const WORK_DAYS = [1, 2, 3, 4, 5];

// [title, category, start, end, icon, extra]
const RAW_SCHEDULE = [
  // A. Morning routine
  ['Wake Up', 'personal', '05:40', '05:45', 'alarm-clock'],
  ['Fajr Salah', 'islamic', '05:45', '05:55', 'moon-star', { prayerKey: 'fajr', priority: 'high' }],
  ['Quran Reading', 'islamic', '05:55', '06:05', 'book-open'],
  ['Thasbeeh / Dhikr', 'islamic', '06:05', '06:10', 'hand-heart'],
  ['Personal Care', 'personal', '06:10', '06:30', 'shower-head'],
  ['Exercise / Walking', 'health', '06:30', '07:15', 'footprints', { priority: 'high' }],
  ['Breakfast', 'personal', '08:30', '08:50', 'utensils'],
  ['Prepare for Office', 'personal', '08:50', '09:00', 'car', { recurrence: 'weekly', days: WORK_DAYS }],

  // B. Office routine (work days)
  ['Start Office Work', 'office', '09:00', '09:05', 'briefcase', { recurrence: 'weekly', days: WORK_DAYS }],
  ['Check Daily Tasks and Priorities', 'office', '09:05', '09:30', 'list-checks', { recurrence: 'weekly', days: WORK_DAYS, priority: 'high' }],
  ['QA Testing Activities', 'qa', '09:30', '11:00', 'bug', { recurrence: 'weekly', days: WORK_DAYS, priority: 'high' }],
  ['Learning / Research', 'office', '11:00', '13:00', 'brain', { recurrence: 'weekly', days: WORK_DAYS }],
  ['Lunch & Break', 'relaxation', '13:00', '14:00', 'coffee', { recurrence: 'weekly', days: WORK_DAYS }],
  ['Continue QA Testing', 'qa', '14:00', '16:00', 'clipboard-check', { recurrence: 'weekly', days: WORK_DAYS, priority: 'high' }],
  ['Bug Reporting & Documentation', 'qa', '16:00', '17:30', 'file-text', { recurrence: 'weekly', days: WORK_DAYS }],
  ['Review Daily Work', 'office', '17:30', '17:55', 'circle-check', { recurrence: 'weekly', days: WORK_DAYS }],
  ['Wrap Up — Office Ends', 'office', '17:55', '18:00', 'briefcase', { recurrence: 'weekly', days: WORK_DAYS, priority: 'low' }],

  // C. Evening routine
  ['Return Home / Relax', 'relaxation', '18:00', '18:20', 'house'],
  ['Maghrib Salah', 'islamic', '18:20', '18:35', 'sunset', { prayerKey: 'maghrib', priority: 'high' }],
  ['Quran / Islamic Reading', 'islamic', '18:35', '19:05', 'book-heart'],
  ['Family Time', 'family', '19:05', '19:35', 'users'],
  ['Isha Salah', 'islamic', '19:35', '19:50', 'moon', { prayerKey: 'isha', priority: 'high' }],
  ['Thasbeeh / Dhikr', 'islamic', '19:50', '20:00', 'hand-heart'],
  ['Dinner', 'family', '20:00', '20:30', 'utensils'],

  // D. Productivity & learning time
  ['MERN Stack Learning', 'learning', '20:30', '21:30', 'code', { recurrence: 'weekly', days: [1, 3, 5] }],
  ['Playwright Practice', 'learning', '20:30', '21:30', 'laptop', { recurrence: 'weekly', days: [2, 4] }],
  ['HTML, CSS & JavaScript Practice', 'learning', '20:30', '21:30', 'code', { recurrence: 'weekly', days: [6] }],
  ['QA Automation Learning', 'learning', '20:30', '21:30', 'bug', { recurrence: 'weekly', days: [0] }],
  ['Reading & Skill Development', 'productivity', '21:30', '21:50', 'book'],
  ['AI Prompt Engineering', 'learning', '16:00', '17:00', 'sparkles', { recurrence: 'weekly', days: [6] }],
  ['Personal Development', 'productivity', '16:00', '17:00', 'target', { recurrence: 'weekly', days: [0] }],

  // E. Relaxation & personal time
  ['Personal Hobbies', 'relaxation', '10:00', '11:30', 'music', { recurrence: 'weekly', days: [0, 6] }],
  ['Family Time', 'family', '11:30', '13:00', 'users', { recurrence: 'weekly', days: [0, 6] }],
  ['Entertainment', 'relaxation', '17:00', '18:00', 'tv', { recurrence: 'weekly', days: [0, 6] }],
  ['Short Break / Walk', 'health', '21:50', '22:00', 'footprints'],
  ['Rest & Sleep', 'sleep', '22:00', '22:15', 'bed', { priority: 'medium' }],
];

export function buildDefaultActivities(createdOn = null) {
  return RAW_SCHEDULE.map(([title, categoryId, start, end, icon, extra = {}], i) => ({
    id: `default-${i + 1}`,
    title,
    description: '',
    notes: '',
    categoryId,
    start,
    end,
    icon,
    priority: 'medium',
    reminder: null,
    recurrence: 'daily',
    days: [],
    date: null,
    order: i,
    createdOn,
    ...extra,
  }));
}

export const DEFAULT_SETTINGS = {
  profile: { name: 'Risha', role: 'QA Trainee' },
  officeStart: '09:00',
  officeEnd: '18:00',
  workDays: WORK_DAYS,
  theme: 'light',
  notifications: { enabled: true, browser: false, sound: false },
  prayerTimes: DEFAULT_PRAYER_TIMES,
  quran: { dailyPages: 5, totalPages: 604, startPage: 1 },
  dailyProductiveHoursGoal: 8,
  weeklyLearningHoursGoal: 7,
};

export const DEFAULT_DHIKR = [
  { id: 'dh-1', name: 'SubhanAllah', target: 33 },
  { id: 'dh-2', name: 'Alhamdulillah', target: 33 },
  { id: 'dh-3', name: 'Allahu Akbar', target: 34 },
  { id: 'dh-4', name: 'Astaghfirullah', target: 100 },
];

export const DEFAULT_ISLAMIC_GOALS = [
  { id: 'ig-1', text: 'Pray all five Salah on time' },
  { id: 'ig-2', text: 'Morning & evening adhkar' },
  { id: 'ig-3', text: 'Give a small sadaqah' },
  { id: 'ig-4', text: 'Learn one new dua' },
];

export const OFFICE_TASK_TYPES = [
  'Manual Testing',
  'Functional Testing',
  'UI/UX Testing',
  'Regression Testing',
  'Bug Reporting',
  'Test Case Writing',
  'Playwright Automation',
  'Learning & Research',
];

export const DEFAULT_SKILLS = [
  { id: 'sk-1', name: 'Manual Testing', level: 60 },
  { id: 'sk-2', name: 'Playwright Automation', level: 25 },
  { id: 'sk-3', name: 'JavaScript', level: 40 },
  { id: 'sk-4', name: 'MERN Stack', level: 20 },
  { id: 'sk-5', name: 'AI Prompt Engineering', level: 30 },
];

export const DEFAULT_LEARNING_GOALS = [
  { id: 'lg-1', title: 'Finish Playwright basics course', skill: 'Playwright Automation', targetHours: 15, deadline: '' },
  { id: 'lg-2', title: 'Build a MERN to-do app', skill: 'MERN Stack', targetHours: 20, deadline: '' },
  { id: 'lg-3', title: 'Master JavaScript async/await', skill: 'JavaScript', targetHours: 6, deadline: '' },
];

export const QUOTES = [
  { text: 'Small daily improvements are the key to staggering long-term results.', author: 'Unknown' },
  { text: 'Indeed, with hardship comes ease.', author: 'Quran 94:6' },
  { text: 'Quality is not an act, it is a habit.', author: 'Aristotle' },
  { text: 'The most beloved deeds to Allah are those done consistently, even if small.', author: 'Prophet Muhammad ﷺ' },
  { text: 'Testing shows the presence, not the absence, of bugs.', author: 'Edsger Dijkstra' },
  { text: 'Focus on being productive instead of busy.', author: 'Tim Ferriss' },
  { text: 'Verily, in the remembrance of Allah do hearts find rest.', author: 'Quran 13:28' },
  { text: 'You do not rise to the level of your goals; you fall to the level of your systems.', author: 'James Clear' },
  { text: 'Take advantage of five before five: your youth, health, wealth, free time and life.', author: 'Prophet Muhammad ﷺ' },
  { text: 'An investment in knowledge pays the best interest.', author: 'Benjamin Franklin' },
  { text: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln' },
  { text: 'Be curious. Ask questions. Break things — then document them.', author: 'QA wisdom' },
];
