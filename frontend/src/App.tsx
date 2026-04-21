import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { JournalPage } from './pages/JournalPage';
import { StudyPage } from './pages/StudyPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { TipsPage } from './pages/TipsPage';
import { CognitiveTrainingPage } from './pages/CognitiveTrainingPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminStatsPage } from './pages/admin/AdminStatsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminUserFormPage } from './pages/admin/AdminUserFormPage';
import { AdminSessionsPage } from './pages/admin/AdminSessionsPage';
import { AdminJournalsPage } from './pages/admin/AdminJournalsPage';
import { TopNavbar } from './components/TopNavbar';
import { userService } from './services/userService';

function RequireAuth({ children }: { children: React.ReactElement }) {
  return userService.isSignedIn() ? children : <Navigate to="/sign-in" replace />;
}

function RequireGuest({ children }: { children: React.ReactElement }) {
  return userService.isSignedIn() ? <Navigate to="/dashboard" replace /> : children;
}

function RequireAdmin({ children }: { children: React.ReactElement }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'checking' | 'allowed' | 'denied' | 'needs-login'>('checking');

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!userService.isSignedIn()) {
        if (alive) setStatus('needs-login');
        return;
      }

      try {
        await userService.hydrateUser({ force: true });
      } catch {
        if (!alive) return;
        if (!userService.isSignedIn()) {
          setStatus('needs-login');
          return;
        }
      }

      if (!alive) return;
      setStatus(userService.isAdmin() ? 'allowed' : 'denied');
    })();

    return () => {
      alive = false;
    };
  }, []);

  if (!userService.isSignedIn() || status === 'needs-login') return <Navigate to="/sign-in" replace />;
  if (status === 'checking') return null;
  if (status === 'allowed') return children;

  return (
    <div className="min-h-[100dvh] bg-background text-on-background">
      <main className="mx-auto flex max-w-2xl flex-col gap-4 px-6 pb-24 pt-28 md:px-12">
        <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
          Access denied
        </h1>
        <p className="text-on-surface-variant">
          This page is available to staff accounts only.
        </p>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              userService.signOut();
              navigate('/sign-in', { replace: true });
            }}
            className="rounded-full bg-surface-container-highest/70 px-5 py-3 text-sm font-semibold text-on-surface shadow-sm ring-1 ring-outline-variant/10 transition-transform transition-colors duration-200 hover:scale-105 hover:bg-surface-container-highest active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Sign out
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard', { replace: true })}
            className="rounded-full bg-surface-container-low px-5 py-3 text-sm font-semibold text-on-surface-variant ring-1 ring-outline-variant/10 transition-colors hover:text-on-surface"
          >
            Go to dashboard
          </button>
        </div>
      </main>
    </div>
  );
}

function AppInner() {
  const location = useLocation();
  const isAdminRoute = location.pathname === "/admin" || location.pathname.startsWith("/admin/");

  return (
    <>
      {isAdminRoute ? null : <TopNavbar />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/journal"
          element={
            <RequireAuth>
              <JournalPage />
            </RequireAuth>
          }
        />
        <Route
          path="/study"
          element={
            <RequireAuth>
              <StudyPage />
            </RequireAuth>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <SettingsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="/tips"
          element={
            <RequireAuth>
              <TipsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/cognitive"
          element={
            <RequireAuth>
              <CognitiveTrainingPage />
            </RequireAuth>
          }
        />
        <Route
          path="/sign-in"
          element={
            <RequireGuest>
              <SignInPage />
            </RequireGuest>
          }
        />
        <Route
          path="/sign-up"
          element={
            <RequireGuest>
              <SignUpPage />
            </RequireGuest>
          }
        />

        <Route
          path="/reset-password"
          element={
            <RequireGuest>
              <ResetPasswordPage />
            </RequireGuest>
          }
        />

        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminStatsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="users/new" element={<AdminUserFormPage />} />
          <Route path="users/:userId/edit" element={<AdminUserFormPage />} />
          <Route path="sessions" element={<AdminSessionsPage />} />
          <Route path="journals" element={<AdminJournalsPage />} />
        </Route>
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppInner />
    </Router>
  );
}

export default App;
