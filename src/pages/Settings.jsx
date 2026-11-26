import { useRef, useState } from 'react';
import { Bell, Briefcase, CalendarCog, Camera, Database, Download, ImageUp, Layers, LogOut, MoonStar, Palette, Plus, RotateCcw, Trash2, Upload, User } from 'lucide-react';
import { Avatar, Card, CardHeader, CategoryIcon, ConfirmDialog, PageHeader, Segmented, Toggle } from '../components/ui';
import { useStore } from '../store/StoreContext';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';
import { PRAYERS } from '../data/defaults';
import { ICON_NAMES } from '../utils/icons';
import { WEEKDAY_LABELS, todayKey } from '../utils/date';
import { toMinutes } from '../utils/time';

const SWATCHES = ['#2A9D8F', '#2F5D8A', '#3B82A0', '#4A90C2', '#5FB3AA', '#2E9D62', '#E0A93B', '#E76F51', '#6C8EA4', '#6B7A99', '#8E7CC3', '#C0687C'];

export default function Settings() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [confirm, setConfirm] = useState(null); // { title, message, onConfirm, label }
  const s = state.settings;
  const update = (settings) => dispatch({ type: 'UPDATE_SETTINGS', settings });

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Personalise your planner — all changes are saved automatically" />

      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileCard key={[s.profile.name, s.profile.role].join('|')} setConfirm={setConfirm} />
        <WorkingHoursCard key={[s.officeStart, s.officeEnd, s.workDays.join(), s.dailyProductiveHoursGoal].join('|')} />

        <Card className="p-5">
          <CardHeader title="Theme" subtitle="Light is the default" icon={Palette} />
          <Segmented
            value={s.theme}
            onChange={(theme) => update({ theme })}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ]}
          />
        </Card>

        <Card className="p-5">
          <CardHeader title="Notifications" subtitle="Reminders for activities with a reminder set" icon={Bell} />
          <div className="space-y-4">
            <Row label="In-app reminders" hint="Show a message when an activity is about to start">
              <Toggle
                label="In-app reminders"
                checked={s.notifications.enabled}
                onChange={(enabled) => update({ notifications: { ...s.notifications, enabled } })}
              />
            </Row>
            <Row label="Browser notifications" hint="Also show a system notification (needs permission)">
              <Toggle
                label="Browser notifications"
                checked={s.notifications.browser}
                onChange={async (browser) => {
                  if (browser) {
                    if (!('Notification' in window)) return toast('This browser does not support notifications.', 'error');
                    const perm = await Notification.requestPermission();
                    if (perm !== 'granted') return toast('Notification permission was not granted.', 'warning');
                  }
                  update({ notifications: { ...s.notifications, browser } });
                  toast(browser ? 'Browser notifications enabled.' : 'Browser notifications disabled.');
                }}
              />
            </Row>
          </div>
        </Card>

        <PrayerTimesCard key={JSON.stringify(s.prayerTimes)} />

        <Card className="p-5">
          <CardHeader title="Default Daily Schedule" subtitle={`${state.activities.length} activities in your schedule`} icon={CalendarCog} />
          <p className="mb-4 text-sm text-muted">
            Your schedule starts from a sample routine (morning, office, evening, learning and rest). You can edit everything in the planner, or restore the original sample here.
          </p>
          <button
            className="btn-ghost"
            onClick={() =>
              setConfirm({
                title: 'Restore default schedule?',
                message: 'This replaces all current activities with the sample daily schedule. Completion history for removed activities will no longer appear in your weekly overview.',
                label: 'Restore',
                onConfirm: () => {
                  dispatch({ type: 'RESTORE_DEFAULT_SCHEDULE' });
                  toast('Default schedule restored.');
                },
              })
            }
          >
            <RotateCcw className="h-4 w-4" /> Restore default schedule
          </button>
        </Card>
      </div>

      <CategoriesCard setConfirm={setConfirm} />
      <BackupCard setConfirm={setConfirm} />

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.label}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          confirm.onConfirm();
          setConfirm(null);
        }}
      />
    </div>
  );
}

function Row({ label, hint, children }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function ProfileCard({ setConfirm }) {
  const { state, dispatch } = useStore();
  const { user, logout } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(state.settings.profile);
  const [error, setError] = useState('');
  const save = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Name is required.');
    dispatch({ type: 'UPDATE_SETTINGS', settings: { profile: { ...state.settings.profile, name: form.name.trim(), role: form.role.trim() } } });
    setError('');
    toast('Profile saved.');
  };
  return (
    <Card className="p-5">
      <CardHeader title="User Profile" icon={User} />
      <ProfilePicture setConfirm={setConfirm} />
      <form onSubmit={save} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="p-name">
              Name
            </label>
            <input id="p-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={40} />
          </div>
          <div>
            <label className="label" htmlFor="p-role">
              Role
            </label>
            <input id="p-role" className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} maxLength={40} />
          </div>
        </div>
        {error && <p className="text-xs font-medium text-danger">{error}</p>}
        <button className="btn-primary" type="submit">
          Save profile
        </button>
      </form>
      <div className="mt-5 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Account</p>
          <p className="truncate text-xs text-muted">Signed in as {user?.email}</p>
        </div>
        <button
          type="button"
          className="btn-ghost text-danger hover:border-danger/40 hover:bg-danger/5"
          onClick={() =>
            setConfirm({
              title: 'Log out of TIDORA?',
              message: 'You will need to sign in again to open your planner. Your activities and settings stay saved on this device.',
              label: 'Log out',
              onConfirm: () => logout().catch(() => toast('Could not log out. Please try again.', 'error')),
            })
          }
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </Card>
  );
}

const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const PHOTO_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const PHOTO_SIZE = 320; // stored as a 320×320 JPEG to keep localStorage small

/** Reads an image file and returns a centre-cropped square JPEG data URL. */
function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('decode'));
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = PHOTO_SIZE;
        canvas.height = PHOTO_SIZE;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#EAF2F8'; // background for transparent PNG/WEBP
        ctx.fillRect(0, 0, PHOTO_SIZE, PHOTO_SIZE);
        ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, PHOTO_SIZE, PHOTO_SIZE);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function ProfilePicture({ setConfirm }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const fileRef = useRef(null);
  const { name, avatar } = state.settings.profile;
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!PHOTO_TYPES.includes(file.type) || !PHOTO_EXTENSIONS.includes(ext)) {
      setError('Unsupported file type. Please choose a JPG, JPEG, PNG or WEBP image.');
      toast('Unsupported image format.', 'error');
      return;
    }
    if (file.size > PHOTO_MAX_BYTES) {
      setError(`Image is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 5 MB.`);
      toast('Image is larger than 5 MB.', 'error');
      return;
    }
    setBusy(true);
    try {
      setPreview(await resizeImage(file));
      setError('');
    } catch {
      setError('This image could not be read. Please try a different file.');
      toast('Could not read that image.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    dispatch({ type: 'UPDATE_SETTINGS', settings: { profile: { ...state.settings.profile, avatar: preview } } });
    setPreview(null);
    toast(avatar ? 'Profile picture updated.' : 'Profile picture saved.');
  };

  const remove = () =>
    setConfirm({
      title: 'Remove profile picture?',
      message: 'Your photo will be removed and the default avatar will be shown instead.',
      label: 'Remove photo',
      onConfirm: () => {
        dispatch({ type: 'UPDATE_SETTINGS', settings: { profile: { ...state.settings.profile, avatar: null } } });
        toast('Profile picture removed.', 'info');
      },
    });

  return (
    <section className="mb-5 border-b border-line pb-5" aria-labelledby="pp-title">
      <p id="pp-title" className="label">
        Profile picture
      </p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative w-fit">
          <Avatar src={preview || avatar} name={name} size={88} className={preview ? 'ring-4 ring-teal/40' : 'ring-4 ring-soft'} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-navy text-white transition hover:bg-teal dark:bg-teal"
            aria-label="Choose a photo"
          >
            <Camera className="h-4 w-4" />
          </button>
        </div>
        <div className="min-w-0 flex-1">
          {preview ? (
            <>
              <p className="text-sm font-semibold">Preview</p>
              <p className="mb-3 text-xs text-muted">This is how your photo will look. Save it to apply everywhere.</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-primary" onClick={save}>
                  Save photo
                </button>
                <button type="button" className="btn-ghost" onClick={() => fileRef.current?.click()}>
                  Choose another
                </button>
                <button type="button" className="btn-ghost" onClick={() => setPreview(null)}>
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mb-3 text-xs text-muted">JPG, JPEG, PNG or WEBP · max 5 MB. Shown in the sidebar and on your dashboard.</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-primary" onClick={() => fileRef.current?.click()} disabled={busy}>
                  <ImageUp className="h-4 w-4" /> {busy ? 'Processing…' : avatar ? 'Change Photo' : 'Upload Photo'}
                </button>
                {avatar && (
                  <button type="button" className="btn-ghost text-danger hover:border-danger/40 hover:bg-danger/5" onClick={remove}>
                    <Trash2 className="h-4 w-4" /> Remove Photo
                  </button>
                )}
              </div>
            </>
          )}
          {error && <p className="mt-2 text-xs font-medium text-danger">{error}</p>}
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={pick}
        aria-label="Profile picture file"
      />
    </section>
  );
}

function WorkingHoursCard() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const s = state.settings;
  const [form, setForm] = useState({ officeStart: s.officeStart, officeEnd: s.officeEnd, workDays: s.workDays, goal: s.dailyProductiveHoursGoal });
  const [error, setError] = useState('');
  const save = (e) => {
    e.preventDefault();
    if (toMinutes(form.officeStart) === null || toMinutes(form.officeEnd) === null) return setError('Both times are required.');
    if (toMinutes(form.officeEnd) <= toMinutes(form.officeStart)) return setError('Office end must be after office start.');
    if (!form.workDays.length) return setError('Select at least one work day.');
    const goal = Number(form.goal);
    if (!goal || goal < 1 || goal > 16) return setError('Productive hours goal must be between 1 and 16.');
    dispatch({
      type: 'UPDATE_SETTINGS',
      settings: { officeStart: form.officeStart, officeEnd: form.officeEnd, workDays: [...form.workDays].sort(), dailyProductiveHoursGoal: goal },
    });
    setError('');
    toast('Working hours saved.');
  };
  return (
    <Card className="p-5">
      <CardHeader title="Working Hours" subtitle="Default 9:00 AM – 6:00 PM" icon={Briefcase} />
      <form onSubmit={save} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="w-start">
              Start
            </label>
            <input id="w-start" type="time" className="input" value={form.officeStart} onChange={(e) => setForm({ ...form, officeStart: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="w-end">
              End
            </label>
            <input id="w-end" type="time" className="input" value={form.officeEnd} onChange={(e) => setForm({ ...form, officeEnd: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="w-goal">
              Goal (h)
            </label>
            <input id="w-goal" type="number" min="1" max="16" className="input" value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} title="Daily productive hours goal" />
          </div>
        </div>
        <div>
          <span className="label">Work days</span>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAY_LABELS.map((d, i) => {
              const on = form.workDays.includes(i);
              return (
                <button
                  type="button"
                  key={d}
                  aria-pressed={on}
                  onClick={() => setForm({ ...form, workDays: on ? form.workDays.filter((x) => x !== i) : [...form.workDays, i] })}
                  className={`h-9 w-11 rounded-lg text-xs font-semibold transition ${on ? 'bg-navy text-white dark:bg-teal' : 'bg-soft text-muted hover:text-ink'}`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
        {error && <p className="text-xs font-medium text-danger">{error}</p>}
        <button className="btn-primary" type="submit">
          Save working hours
        </button>
      </form>
    </Card>
  );
}

function PrayerTimesCard() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [times, setTimes] = useState(state.settings.prayerTimes);
  const [error, setError] = useState('');
  const save = () => {
    const mins = PRAYERS.map((p) => toMinutes(times[p.key]));
    if (mins.some((m) => m === null)) return setError('Please fill in every prayer time.');
    if (mins.some((m, i) => i > 0 && m <= mins[i - 1])) return setError('Prayer times must be in order: Fajr → Isha.');
    dispatch({ type: 'UPDATE_SETTINGS', settings: { prayerTimes: times } });
    setError('');
    toast('Prayer times saved.');
  };
  return (
    <Card className="p-5">
      <CardHeader title="Prayer Times" subtitle="Set your actual local timings" icon={MoonStar} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {PRAYERS.map((p) => (
          <div key={p.key}>
            <label className="label" htmlFor={`pt-${p.key}`}>
              {p.name}
            </label>
            <input
              id={`pt-${p.key}`}
              type="time"
              className="input"
              value={times[p.key]}
              onChange={(e) => {
                setTimes({ ...times, [p.key]: e.target.value });
                setError('');
              }}
            />
          </div>
        ))}
      </div>
      {error && <p className="mt-2 text-xs font-medium text-danger">{error}</p>}
      <button className="btn-primary mt-4" onClick={save}>
        Save prayer times
      </button>
    </Card>
  );
}

function CategoriesCard({ setConfirm }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', color: SWATCHES[0], icon: 'star', productive: false });
  const [error, setError] = useState('');

  const add = (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (name.length < 2) return setError('Category name must be at least 2 characters.');
    if (state.categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) return setError('A category with this name already exists.');
    dispatch({ type: 'ADD_CATEGORY', category: { ...form, name } });
    setForm({ ...form, name: '' });
    setError('');
    toast(`Category “${name}” created.`);
  };

  const usage = (id) => state.activities.filter((a) => a.categoryId === id).length;

  return (
    <Card className="p-5">
      <CardHeader title="Activity Categories" subtitle="Edit colours and icons, or create your own" icon={Layers} />
      <ul className="grid gap-2 md:grid-cols-2">
        {state.categories.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-line/70 p-2.5">
            <CategoryIcon category={c} size="sm" />
            <input
              className="input min-w-0 flex-1 py-1.5"
              value={c.name}
              onChange={(e) => dispatch({ type: 'UPDATE_CATEGORY', category: { id: c.id, name: e.target.value } })}
              onBlur={(e) => !e.target.value.trim() && dispatch({ type: 'UPDATE_CATEGORY', category: { id: c.id, name: 'Untitled' } })}
              aria-label="Category name"
              maxLength={40}
            />
            <input
              type="color"
              className="h-8 w-8 cursor-pointer rounded-lg border border-line bg-card p-0.5"
              value={c.color}
              onChange={(e) => dispatch({ type: 'UPDATE_CATEGORY', category: { id: c.id, color: e.target.value } })}
              aria-label={`${c.name} colour`}
            />
            <select
              className="input w-auto py-1.5 text-xs"
              value={c.icon}
              onChange={(e) => dispatch({ type: 'UPDATE_CATEGORY', category: { id: c.id, icon: e.target.value } })}
              aria-label={`${c.name} icon`}
            >
              {ICON_NAMES.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 text-xs text-muted" title="Counts toward productivity hours">
              <input
                type="checkbox"
                className="accent-teal"
                checked={Boolean(c.productive)}
                onChange={(e) => dispatch({ type: 'UPDATE_CATEGORY', category: { id: c.id, productive: e.target.checked } })}
              />
              Productive
            </label>
            {c.custom && (
              <button
                className="icon-btn h-8 w-8 hover:!text-danger"
                aria-label={`Delete ${c.name}`}
                onClick={() =>
                  setConfirm({
                    title: `Delete “${c.name}”?`,
                    message: usage(c.id)
                      ? `${usage(c.id)} activit${usage(c.id) > 1 ? 'ies use' : 'y uses'} this category and will move to Personal Activities.`
                      : 'This category is not used by any activity.',
                    label: 'Delete',
                    onConfirm: () => {
                      dispatch({ type: 'DELETE_CATEGORY', id: c.id });
                      toast('Category deleted.', 'info');
                    },
                  })
                }
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={add} className="mt-5 rounded-xl bg-soft/60 p-4" noValidate>
        <p className="mb-3 text-sm font-semibold">New custom category</p>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input className="input md:max-w-xs" placeholder="e.g. Side Project" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={40} aria-label="New category name" />
          <div className="flex flex-wrap gap-1.5">
            {SWATCHES.map((col) => (
              <button
                type="button"
                key={col}
                onClick={() => setForm({ ...form, color: col })}
                className={`h-7 w-7 rounded-full transition ${form.color === col ? 'ring-2 ring-offset-2 ring-offset-card' : ''}`}
                style={{ backgroundColor: col, '--tw-ring-color': col }}
                aria-label={`Colour ${col}`}
                aria-pressed={form.color === col}
              />
            ))}
          </div>
          <select className="input w-auto" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} aria-label="New category icon">
            {ICON_NAMES.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-xs text-muted">
            <input type="checkbox" className="accent-teal" checked={form.productive} onChange={(e) => setForm({ ...form, productive: e.target.checked })} />
            Productive
          </label>
          <button className="btn-primary md:ml-auto" type="submit">
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
        {error && <p className="mt-2 text-xs font-medium text-danger">{error}</p>}
      </form>
    </Card>
  );
}

function BackupCard({ setConfirm }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const fileRef = useRef(null);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-planner-backup-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Backup downloaded.');
  };

  const importJson = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data || !Array.isArray(data.activities) || !Array.isArray(data.categories) || !data.settings) {
        throw new Error('invalid');
      }
      setConfirm({
        title: 'Restore this backup?',
        message: `Your current data will be replaced with the backup (${data.activities.length} activities).`,
        label: 'Restore',
        onConfirm: () => {
          dispatch({ type: 'IMPORT_STATE', state: data });
          toast('Backup restored successfully.');
        },
      });
    } catch {
      toast('That file is not a valid planner backup.', 'error');
    }
  };

  return (
    <Card className="p-5">
      <CardHeader title="Data Backup & Restore" subtitle="Data is stored in this browser (localStorage)" icon={Database} />
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" onClick={exportJson}>
          <Download className="h-4 w-4" /> Export backup
        </button>
        <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
          <Upload className="h-4 w-4" /> Import backup
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={importJson} />
        <button
          className="btn-ghost text-danger hover:border-danger/40 hover:bg-danger/5"
          onClick={() =>
            setConfirm({
              title: 'Reset all data?',
              message: 'Every activity, completion, log and setting will be erased and the sample schedule restored. Export a backup first if you might need it. This cannot be undone.',
              label: 'Erase everything',
              onConfirm: () => {
                dispatch({ type: 'RESET_ALL' });
                toast('All data has been reset.', 'info');
              },
            })
          }
        >
          <Trash2 className="h-4 w-4" /> Reset all data
        </button>
      </div>
    </Card>
  );
}
