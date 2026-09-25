import { Navigate, Outlet, useLocation } from 'react-router';

import { useAuth } from '@/hooks/useAuth';

import { FullPageSpinner } from './FullPageSpinner';

export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullPageSpinner />;

  if (status === 'unauthenticated') {
    // Remembers the page so the user returns to it after logging in
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
