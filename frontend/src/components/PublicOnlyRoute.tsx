import { Navigate, Outlet } from 'react-router';

import { useAuth } from '@/hooks/useAuth';

import { FullPageSpinner } from './FullPageSpinner';

// Login and sign up pages: logged users go straight to the app
export function PublicOnlyRoute() {
  const { status } = useAuth();

  if (status === 'loading') return <FullPageSpinner />;
  if (status === 'authenticated') return <Navigate to="/" replace />;

  return <Outlet />;
}
