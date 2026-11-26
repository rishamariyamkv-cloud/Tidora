# TIDORA

**Plan Smart. Live Balanced.**

Personal daily planner & productivity app for a QA Trainee — balancing Islamic routine, office/QA work, learning, family and rest.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Stack

React 18 · Vite · Tailwind CSS · Lucide React · Recharts · React Router (hash routing) · localStorage persistence.

## Structure

```
src/
  components/
    ui/            Reusable UI kit (Card, Modal, ConfirmDialog, ProgressRing, badges, Checklist…)
    layout/        Sidebar, top bar, mobile bottom nav, reminder engine
    activities/    Add/Edit activity modal (validation + overlap warning), Timeline
  pages/           Dashboard, Planner, Islamic, Office, Learning, Weekly, Settings
  store/           StoreContext (useReducer + localStorage), ToastContext
  data/defaults.js Sample schedule, categories, prayer times, quotes (all editable in-app)
  utils/           date/time helpers, schedule logic (recurrence, status, overlap-free hours)
```

## Rules implemented

- Activities are never auto-completed; past, unfinished ones show as **Missed**.
- Productive / office hours use an interval union — overlapping time is counted once.
- Recurring activities: daily, weekly (chosen weekdays) or one-time.
- Prayer times are editable; schedule items linked to Fajr / Maghrib / Isha move with them,
  and ticking a prayer on the Islamic page also completes the linked schedule item (and vice versa).
- Office hours default to 9:00 AM – 6:00 PM, configurable with work days in Settings.
- Backup/restore as JSON.
- Profile picture upload (JPG/PNG/WEBP, resized and stored in localStorage).
