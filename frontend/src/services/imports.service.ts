import type { ColumnMapping, ImportPreview, TransactionType } from '@/types/api';

import { apiRequest } from './api';

export interface PreviewOptions {
  file: File;
  accountId: string;
  // Credit card statements list purchases as positive values
  invertSign: boolean;
  mapping?: ColumnMapping;
}

export interface ConfirmRow {
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string | null;
  notes: string | null;
}

export const importsService = {
  preview: ({ file, accountId, invertSign, mapping }: PreviewOptions) => {
    const form = new FormData();
    form.append('file', file);
    form.append('accountId', accountId);
    form.append('invertSign', String(invertSign));
    if (mapping) form.append('mapping', JSON.stringify(mapping));
    return apiRequest<ImportPreview>('/imports/preview', { method: 'POST', body: form });
  },
  confirm: (body: {
    accountId: string;
    rows: ConfirmRow[];
    skipDuplicates: boolean;
    fileName?: string;
  }) =>
    apiRequest<{ created: number; skipped: number }>('/imports/confirm', { method: 'POST', body }),
};
