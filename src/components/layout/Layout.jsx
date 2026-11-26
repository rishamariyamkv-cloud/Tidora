import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Briefcase,
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Moon,
  MoonStar,
  Plus,
  Settings,
  Sun,
  X,
} from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { useAuth } from '../../store/AuthContext';
import { Avatar, Logo } from '../ui';
import { useToast } from '../../store/ToastContext';
import { useActivityModal } from '../activities/ActivityModal';
import { useNow } from '../../utils/useNow';
import { todayKey } from '../../utils/date';
import { activitiesForDate, statusOf } from '../../utils/schedule';
import { format12, nowMinutes, toMinutes } from '../../utils/time';

export const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/planner', label: 'My Daily Planner', short: 'Planner', icon: ListChecks },
  { to: '/islamic', label: 'Islamic Routine', short: 'Islamic', icon: MoonStar },
  { to: '/office', label: 'Office & QA Tasks', short: 'Office', icon: Briefcase },
  { to: '/learning', label: 'Learning & Productivity', icon: GraduationCap },
  { to: '/weekly', label: 'Weekly Overview', icon: CalendarDays },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const MOBILE_NAV = ['/', '/planner', '/islamic', '/office'];

function NavItems({ onNavigate }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              isActive ? 'bg-white/10 text-white' : 'text-white/65 hover:bg-white/5 hover:text-white'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={`h-[18px] w-[18px] ${isActive ? 'text-teal-light' : ''}`} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function SidebarContent({ onNavigate }) {
  const { state } = useStore();
  const { logout } = useAuth();
  const { name, role, avatar } = state.settings.profile;
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-3 pb-6 pt-1">
        <Logo size={40} />
        <div>
          <p className="text-lg font-bold leading-tight tracking-wide text-white">TIDORA</p>
          <p className="whitespace-nowrap text-[11px] text-white/55">Plan Smart. Live Balanced.</p>
        </div>
      </div>
      <NavItems onNavigate={onNavigate} />
      <div className="mt-auto flex items-center gap-3 rounded-xl bg-white/5 p-3">
        <Avatar src={avatar} name={name} size={36} className="ring-2 ring-white/15" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{name || 'Guest'}</p>
          <p className="truncate text-xs text-white/55">{role}</p>
        </div>
        <button
          onClick={logout}
          className="ml-auto shrink-0 rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
          aria-label="Logout"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/** Fires in-app (and optional browser) reminders for today's activities. */
function useReminders() {
  const { state } = useStore();
  const toast = useToast();
  const now = useNow(20000);
  const fired = useRef(new Set());

  useEffect(() => {
    if (!state.settings.notifications.enabled) return;
    const date = todayKey();
    const n = nowMinutes(now);
    for (const a of activitiesForDate(state.activities, date)) {
      if (a.reminder === null || a.reminder === undefined) continue;
      const at = toMinutes(a.start) - a.reminder;
      const key = `${date}:${a.id}:${a.start}`;
      if (n >= at && n < toMinutes(a.start) + 1 && !fired.current.has(key)) {
        fired.current.add(key);
        if (statusOf(state.status, a, date, now) === 'completed') continue;
        const msg = a.reminder ? `${a.title} starts in ${a.reminder} min (${format12(a.start)})` : `${a.title} is starting now`;
        toast(msg, 'info', 8000);
        if (state.settings.notifications.browser && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('TIDORA reminder', { body: msg });
          } catch {
            /* some browsers only allow notifications from a service worker */
          }
        }
      }
    }
  }, [now, state.activities, state.status, state.settings.notifications, toast]);
}

export default function Layout() {
  const { state, dispatch } = useStore();
  const openActivity = useActivityModal();
  const [drawer, setDrawer] = useState(false);
  const location = useLocation();
  const now = useNow(1000 * 15);
  useReminders();

  useEffect(() => {
    setDrawer(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const theme = state.settings.theme;
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const toggleTheme = () => dispatch({ type: 'UPDATE_SETTINGS', settings: { theme: dark ? 'light' : 'dark' } });
  const page = NAV.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)));

  return (
    <div className="min-h-screen lg:pl-64">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-navy p-4 dark:bg-[#0A1724] lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-navy-dark/60" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-navy p-4 dark:bg-[#0A1724]">
            <button className="absolute right-3 top-3 rounded-lg p-2 text-white/70 hover:bg-white/10" onClick={() => setDrawer(false)} aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-20 border-b border-line/70 bg-page/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <button className="icon-btn lg:hidden" onClick={() => setDrawer(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold lg:hidden">{page?.label || 'TIDORA'}</p>
            <p className="hidden text-sm text-muted lg:block">
              {now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <span className="hidden rounded-xl bg-soft px-3 py-1.5 text-sm font-semibold tabular-nums text-navy dark:text-ink sm:inline-block">
            {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle dark mode" title="Toggle theme">
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button className="btn-primary px-3 sm:px-4" onClick={() => openActivity()} aria-label="Add activity">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Activity</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12">
        <Outlet />
      </main>

      {/* Mobile bottom navigation */}
      <nav className="no-print fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-card/95 backdrop-blur lg:hidden">
        {NAV.filter((n) => MOBILE_NAV.includes(n.to)).map(({ to, label, short, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${isActive ? 'text-teal' : 'text-muted'}`}
          >
            <Icon className="h-5 w-5" />
            {short || label}
          </NavLink>
        ))}
        <button onClick={() => setDrawer(true)} className="flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium text-muted">
          <BarChart3 className="h-5 w-5" />
          More
        </button>
      </nav>
    </div>
  );
}
