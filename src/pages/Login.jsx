import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Loader2, Lock, LogIn, User } from 'lucide-react';
import { Logo } from '../components/ui';
import { authErrorMessage, useAuth } from '../store/AuthContext';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const update = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    setErrors({ ...errors, [field]: '' });
    setAuthError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.username.trim()) next.username = 'Please enter your username.';
    if (!form.password) next.password = 'Please enter your password.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    setAuthError('');
    try {
      await login(form.username, form.password);
      navigate('/', { replace: true });
    } catch (err) {
      setAuthError(authErrorMessage(err?.code));
      setForm((f) => ({ ...f, password: '' }));
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-page">
      {/* Brand panel (desktop) */}
      <aside className="relative hidden w-[44%] overflow-hidden bg-gradient-to-br from-navy via-navy to-[#1F5F6B] p-12 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-teal/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-sea/10 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <Logo size={44} />
          <div>
            <p className="text-xl font-bold tracking-wide">TIDORA</p>
            <p className="text-xs text-white/60">Plan Smart. Live Balanced.</p>
          </div>
        </div>
        <div className="relative my-auto max-w-md">
          <h2 className="text-4xl font-bold leading-tight">Your day, in calm and steady flow.</h2>
          <p className="mt-4 text-white/70">
            Prayers, office work, learning and rest — planned together, tracked simply, all in one place.
          </p>
        </div>
        <svg className="relative w-full text-white/15" viewBox="0 0 400 40" fill="none" aria-hidden="true">
          <path d="M0 20c33-16 67-16 100 0s67 16 100 0 67-16 100 0 67 16 100 0" stroke="currentColor" strokeWidth="2" />
          <path d="M0 32c33-12 67-12 100 0s67 12 100 0 67-12 100 0 67 12 100 0" stroke="currentColor" strokeWidth="1.5" opacity=".6" />
        </svg>
      </aside>

      {/* Form */}
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <Logo size={56} />
            <p className="mt-3 text-2xl font-bold tracking-wide text-navy dark:text-ink">TIDORA</p>
            <p className="text-xs text-muted">Plan Smart. Live Balanced.</p>
          </div>

          <div className="card p-6 sm:p-8">
            <h1 className="text-2xl font-bold">Welcome Back!</h1>
            <p className="mt-1 text-sm text-muted">Sign in to continue planning your day.</p>

            <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
              <div>
                <label className="label" htmlFor="login-username">
                  Username
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    id="login-username"
                    className={`input py-2.5 pl-9 ${errors.username ? 'border-danger focus:border-danger focus:ring-danger/20' : ''}`}
                    value={form.username}
                    onChange={update('username')}
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="Enter your username"
                    aria-invalid={!!errors.username}
                    aria-describedby={errors.username ? 'login-username-error' : undefined}
                    disabled={busy}
                    autoFocus
                  />
                </div>
                {errors.username && (
                  <p id="login-username-error" className="mt-1.5 text-xs font-medium text-danger">
                    {errors.username}
                  </p>
                )}
              </div>

              <div>
                <label className="label" htmlFor="login-password">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className={`input py-2.5 pl-9 pr-10 ${errors.password ? 'border-danger focus:border-danger focus:ring-danger/20' : ''}`}
                    value={form.password}
                    onChange={update('password')}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'login-password-error' : undefined}
                    disabled={busy}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted transition hover:bg-soft hover:text-ink"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p id="login-password-error" className="mt-1.5 text-xs font-medium text-danger">
                    {errors.password}
                  </p>
                )}
              </div>

              {authError && (
                <div role="alert" className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm font-medium text-danger">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {authError}
                </div>
              )}

              <button type="submit" className="btn-primary w-full py-2.5" disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" /> Login
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-muted">Secured with Firebase Authentication</p>
        </div>
      </main>
    </div>
  );
}
