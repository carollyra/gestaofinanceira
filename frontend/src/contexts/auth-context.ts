import { createContext } from 'react';

import type { LoginInput, RegisterInput } from '@/services/auth.service';
import type { User } from '@/types/api';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
