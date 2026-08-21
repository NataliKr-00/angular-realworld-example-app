import { Navigate, Outlet } from 'react-router';
import { useAuth } from './auth-context';

export function RequireAuth() {
  const { isAuthenticated, authState } = useAuth();

  if (authState === 'loading') {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function RequireGuest() {
  const { isAuthenticated, authState } = useAuth();

  if (authState === 'loading') {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
