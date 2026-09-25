import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import { UNAUTHORIZED_EVENT } from '@/services/api';
import { authService, type LoginInput, type RegisterInput } from '@/services/auth.service';
import type { AuthResponse, User } from '@/types/api';
import { tokenStorage } from '@/utils/token-storage';

import { AuthContext, type AuthStatus } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() =>
    tokenStorage.get() ? 'loading' : 'unauthenticated',
  );

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  // Restores the session on load: a stored token is only trusted after /auth/me
  useEffect(() => {
    if (!tokenStorage.get()) return;

    const controller = new AbortController();

    authService
      .me(controller.signal)
      .then(({ user }) => {
        setUser(user);
        setStatus('authenticated');
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        logout();
      });

    return () => controller.abort();
  }, [logout]);

  // Any request answered with 401 (expired token) ends the session
  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, logout);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, logout);
  }, [logout]);

  const startSession = useCallback(({ user, token }: AuthResponse) => {
    tokenStorage.set(token);
    setUser(user);
    setStatus('authenticated');
  }, []);

  const login = useCallback(
    async (input: LoginInput) => startSession(await authService.login(input)),
    [startSession],
  );

  const register = useCallback(
    async (input: RegisterInput) => startSession(await authService.register(input)),
    [startSession],
  );

  const value = useMemo(
    () => ({ user, status, login, register, logout }),
    [user, status, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
