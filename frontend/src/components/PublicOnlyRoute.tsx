import { Navigate, Outlet } from 'react-router';

import { useAuth } from '@/hooks/useAuth';

import { AppShellSkeleton } from './skeletons';

// Login and sign up pages: logged users go straight to the app
export function PublicOnlyRoute() {
  const { status } = useAuth();

  if (status === 'loading') return <AppShellSkeleton />;
  if (status === 'authenticated') return <Navigate to="/" replace />;

  return <Outlet />;
}
