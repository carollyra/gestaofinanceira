import type { ApiErrorBody } from '@/types/api';
import { tokenStorage } from '@/utils/token-storage';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333/api';

export const UNAUTHORIZED_EVENT = 'financas:unauthorized';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: ApiErrorBody['details'],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = tokenStorage.get();
  const headers: Record<string, string> = { Accept: 'application/json' };
  const isFormData = options.body instanceof FormData;

  if (options.body !== undefined && !isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: isFormData
        ? (options.body as FormData)
        : options.body !== undefined
          ? JSON.stringify(options.body)
          : undefined,
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError('Não foi possível conectar ao servidor. Verifique sua conexão.', 0);
  }

  if (response.status === 204) return undefined as T;

  const data = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    const body = (data ?? {}) as Partial<ApiErrorBody>;

    // Expired or invalid session on an authenticated request: let the auth
    // context log the user out
    if (response.status === 401 && token) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }

    throw new ApiError(
      body.message ?? 'Erro inesperado. Tente novamente.',
      response.status,
      body.details,
    );
  }

  return data as T;
}
