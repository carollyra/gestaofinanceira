import { Repeat } from 'lucide-react';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAccounts, useCategories } from '@/hooks/useLookups';
import { useToast } from '@/hooks/useToast';
import {
  useCreateTransaction,
  useDeleteTransaction,
  useUpdateTransaction,
} from '@/hooks/useTransactionMutations';
import type { Transaction } from '@/types/api';
import { formatDate } from '@/utils/date';
import { formatCurrency } from '@/utils/money';
import {
  changedFields,
  emptyFormValues,
  formValuesFromTransaction,
  toTransactionInput,
} from '@/utils/transaction-form';

import { TransactionForm } from './TransactionForm';

export type TransactionDialogState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; transaction: Transaction }
  | { kind: 'delete'; transaction: Transaction };

interface TransactionDialogsProps {
  state: TransactionDialogState;
  onChange: (state: TransactionDialogState) => void;
  // Pre-selected account when creating (e.g. the account filter in use)
  defaultAccountId?: string;
  // Focus target after closing when the opener is gone (see Modal)
  returnFocusTo?: () => HTMLElement | null | undefined;
  // Called as soon as a deletion is confirmed (the row is about to disappear)
  onDeleteConfirmed?: (transaction: Transaction) => void;
}

export function TransactionDialogs({
  state,
  onChange,
  defaultAccountId,
  returnFocusTo,
  onDeleteConfirmed,
}: TransactionDialogsProps) {
  const accounts = useAccounts(true);
  const categories = useCategories();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();
  const toast = useToast();

  const close = () => onChange({ kind: 'closed' });
  const allAccounts = accounts.data ?? [];
  const activeAccounts = allAccounts.filter((a) => !a.archived);
  const editing = state.kind === 'edit' ? state.transaction : null;

  // Editing keeps the transaction's own account even if archived since then
  const formAccounts = editing
    ? allAccounts.filter((a) => !a.archived || a.id === editing.account.id)
    : activeAccounts;
  const initialAccount =
    activeAccounts.find((a) => a.id === defaultAccountId)?.id ?? activeAccounts[0]?.id ?? '';

  const toDelete = state.kind === 'delete' ? state.transaction : null;

  const confirmDelete = async () => {
    if (!toDelete) return;
    onDeleteConfirmed?.(toDelete);
    close();
    try {
      await deleteTransaction.mutateAsync(toDelete.id);
      toast('Transação excluída');
    } catch {
      toast('Não foi possível excluir a transação. Ela foi mantida.', 'error');
    }
  };

  return (
    <>
      <Modal
        open={state.kind === 'create' || state.kind === 'edit'}
        onClose={close}
        title={editing ? 'Editar transação' : 'Nova transação'}
        returnFocusTo={returnFocusTo}
      >
        {accounts.isSuccess && categories.isSuccess && activeAccounts.length === 0 && !editing ? (
          <Alert>Cadastre uma conta antes de lançar transações.</Alert>
        ) : (
          accounts.isSuccess &&
          categories.isSuccess && (
            <TransactionForm
              // Remounts with fresh values for each transaction
              key={editing?.id ?? 'new'}
              initialValues={
                editing ? formValuesFromTransaction(editing) : emptyFormValues(initialAccount)
              }
              accounts={formAccounts}
              categories={categories.data}
              submitLabel={editing ? 'Salvar alterações' : 'Adicionar'}
              onCancel={close}
              onDelete={
                editing ? () => onChange({ kind: 'delete', transaction: editing }) : undefined
              }
              onSubmit={async (values) => {
                if (editing) {
                  const changes = changedFields(editing, values);
                  if (Object.keys(changes).length > 0) {
                    await updateTransaction.mutateAsync({ id: editing.id, changes });
                    toast('Transação atualizada');
                  }
                } else {
                  await createTransaction.mutateAsync(toTransactionInput(values));
                  toast('Transação adicionada');
                }
                close();
              }}
            />
          )
        )}
      </Modal>

      <Modal
        open={state.kind === 'delete'}
        onClose={close}
        title="Excluir transação?"
        description="Esta ação não pode ser desfeita."
        returnFocusTo={returnFocusTo}
      >
        {toDelete && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm">
              <p className="font-medium text-zinc-100">{toDelete.description}</p>
              <p className="text-zinc-400 tabular-nums">
                {formatDate(toDelete.date)} · {toDelete.type === 'INCOME' ? '+' : '−'}
                {formatCurrency(toDelete.amount)} · {toDelete.account.name}
              </p>
            </div>
            {toDelete.recurringTransactionId && (
              <p className="flex items-start gap-2 text-sm text-zinc-400">
                <Repeat aria-hidden className="mt-0.5 size-4 shrink-0" />
                Gerada por uma recorrência. Só esta ocorrência será excluída; as próximas continuam
                e esta não será recriada.
              </p>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={close}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={() => void confirmDelete()}>
                Excluir
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
