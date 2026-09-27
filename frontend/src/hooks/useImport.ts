import { useMutation, useQueryClient } from '@tanstack/react-query';

import { importsService } from '@/services/imports.service';

export function useImportPreview() {
  return useMutation({ mutationFn: importsService.preview });
}

export function useConfirmImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importsService.confirm,
    onSuccess: () =>
      Promise.all(
        ['transactions', 'dashboard', 'accounts', 'budgets', 'categories'].map((key) =>
          queryClient.invalidateQueries({ queryKey: [key] }),
        ),
      ),
  });
}
