import type { AuthResponse, User } from '@/types/api';

import { apiRequest } from './api';

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  name: string;
}

export const authService = {
  login: (input: LoginInput) =>
    apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: input }),
  register: (input: RegisterInput) =>
    apiRequest<AuthResponse>('/auth/register', { method: 'POST', body: input }),
  me: (signal?: AbortSignal) => apiRequest<{ user: User }>('/auth/me', { signal }),
};
