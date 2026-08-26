import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from './use-auth';

export function ProtectedRoute() {
  const { user, isBootstrapping } = useAuth();
  const location = useLocation();

  if (isBootstrapping) return <SessionLoading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  return <Outlet />;
}

export function GuestRoute() {
  const { user, isBootstrapping } = useAuth();

  if (isBootstrapping) return <SessionLoading />;
  if (user) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}

function SessionLoading() {
  return (
    <main className="auth-shell" aria-busy="true">
      <div className="session-loader" role="status">
        <span className="spinner" aria-hidden="true" />
        <span>Memuat sesi aman…</span>
      </div>
    </main>
  );
}
