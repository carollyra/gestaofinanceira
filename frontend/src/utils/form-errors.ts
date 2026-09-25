import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

import { ApiError } from '@/services/api';

// Puts field errors returned by the API (400 details) on the matching inputs.
// Returns the message to show at the top of the form, if any is left.
export function applyApiErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
): string | null {
  if (!(error instanceof ApiError)) return 'Erro inesperado. Tente novamente.';

  let placed = false;
  for (const field of fields) {
    const message = error.details?.[field]?.[0];
    if (message) {
      setError(field, { type: 'server', message });
      placed = true;
    }
  }

  return placed ? null : error.message;
}
