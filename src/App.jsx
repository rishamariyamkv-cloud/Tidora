import { Navigate, Route, Routes } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Layout from './components/layout/Layout';
import { Logo } from './components/ui';
import { useAuth } from './store/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Planner from './pages/Planner';
import Islamic from './pages/Islamic';
import Office from './pages/Office';
import Learning from './pages/Learning';
import Weekly from './pages/Weekly';
import Settings from './pages/Settings';

/** Shows the app only to signed-in users; everyone else is sent to the login page. */
function RequireAuth({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function Splash() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-page">
      <Logo size={52} />
      <Loader2 className="h-5 w-5 animate-spin text-teal" aria-label="Loading" />
    </div>
  );
}

export default function App() {
  const { ready } = useAuth();
  if (!ready) return <Splash />;

  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="planner" element={<Planner />} />
        <Route path="islamic" element={<Islamic />} />
        <Route path="office" element={<Office />} />
        <Route path="learning" element={<Learning />} />
        <Route path="weekly" element={<Weekly />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
