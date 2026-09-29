import { AnimatePresence, motion } from 'framer-motion';
import { Archive, ArchiveRestore, ArrowLeftRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';

import { AccountForm } from '@/components/accounts/AccountForm';
import { RecentTransfers } from '@/components/accounts/RecentTransfers';
import { TransferForm } from '@/components/accounts/TransferForm';
import { ErrorState } from '@/components/dashboard/states';
import { TransferDetailDrawer } from '@/components/details/TransferDetailDrawer';
import { PageHeader } from '@/components/layout/PageHeader';
import { AnimatedNumber } from '@/components/motion/AnimatedNumber';
import { HoverCard } from '@/components/motion/HoverCard';
import { Skeleton } from '@/components/skeletons';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import {
  useCreateAccount,
  useCreateTransfer,
  useDeleteAccount,
  useUpdateAccount,
} from '@/hooks/useFinanceData';
import { useDeleteTransfer, useUpdateTransfer } from '@/hooks/useDetailQueries';
import { useDetailRoute } from '@/hooks/useDetailRoute';
import { useAccounts } from '@/hooks/useLookups';
import { useToast } from '@/hooks/useToast';
import { ApiError } from '@/services/api';
import type { TransferInput } from '@/services/accounts.service';
import type { Account, Transfer } from '@/types/api';
import { ACCOUNT_TYPES } from '@/utils/account-types';
import { cn } from '@/utils/cn';
import { TRANSFER_DETAIL_KEYS } from '@/utils/detail-keys';
import { formatCurrency } from '@/utils/money';
import { spring, staggerDelay } from '@/utils/motion';

type Dialog =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; account: Account }
  | { kind: 'delete'; account: Account }
  | { kind: 'transfer' }
  | { kind: 'editTransfer'; transfer: Transfer }
  | { kind: 'deleteTransfer'; transfer: Transfer };

// PATCH only what changed: accounts are re-validated only when they change
function transferChanges(transfer: Transfer, input: TransferInput): Partial<TransferInput> {
  const before: TransferInput = {
    fromAccountId: transfer.fromAccount.id,
    toAccountId: transfer.toAccount.id,
    amount: transfer.amount,
    date: transfer.date,
    description: transfer.description,
  };
  return Object.fromEntries(
    (Object.keys(input) as (keyof TransferInput)[])
      .filter((k) => input[k] !== before[k])
      .map((k) => [k, input[k]]),
  ) as Partial<TransferInput>;
}

const iconButton =
  'flex size-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-emerald-400';

export function AccountsPage() {
  const [showArchived, setShowArchived] = useState(false);
  const [dialog, setDialog] = useState<Dialog>({ kind: 'closed' });
  const accounts = useAccounts(true);
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const createTransfer = useCreateTransfer();
  const toast = useToast();

  const all = accounts.data ?? [];
  const active = all.filter((a) => !a.archived);
  const visible = showArchived ? all : active;
  const archivedCount = all.length - active.length;
  const total = active.reduce((sum, a) => sum + a.balance, 0);
  const close = () => setDialog({ kind: 'closed' });

  // Transfer detail drawer, open state in the URL (?transferencia=<id>)
  const transferDetail = useDetailRoute(TRANSFER_DETAIL_KEYS);
  const updateTransfer = useUpdateTransfer();
  const deleteTransfer = useDeleteTransfer();
  const lastTransfer = useRef<string | null>(null);
  const openTransfer = (transfer: Transfer) => {
    lastTransfer.current = transfer.id;
    transferDetail.open('transferencia', transfer.id);
  };
  const focusAfterTransfer = () => {
    const id = lastTransfer.current ?? transferDetail.values.transferencia;
    return (
      (id &&
        document.querySelector<HTMLElement>(`[data-transfer-id="${id}"] [data-detail-trigger]`)) ||
      document.querySelector<HTMLElement>('[data-transfer-id] [data-detail-trigger]')
    );
  };
  // Editing keeps the transfer's own accounts even if archived since then
  const transferAccounts = (transfer?: Transfer) =>
    transfer
      ? all.filter(
          (a) => !a.archived || a.id === transfer.fromAccount.id || a.id === transfer.toAccount.id,
        )
      : active;

  const toggleArchive = async (account: Account) => {
    try {
      await updateAccount.mutateAsync({ id: account.id, changes: { archived: !account.archived } });
      toast(
        account.archived
          ? `${account.name} voltou para as contas ativas`
          : `${account.name} foi arquivada`,
      );
    } catch (error) {
      toast(
        error instanceof ApiError ? error.message : 'Não foi possível atualizar a conta',
        'error',
      );
    }
  };

  const confirmDelete = async (account: Account) => {
    try {
      await deleteAccount.mutateAsync(account.id);
      toast('Conta excluída');
      close();
    } catch (error) {
      close();
      // 409: the account has movements; the API message suggests archiving it
      toast(
        error instanceof ApiError ? error.message : 'Não foi possível excluir a conta',
        'error',
      );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Contas"
        subtitle="Carteiras, contas bancárias e cartões"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => setDialog({ kind: 'transfer' })}
              disabled={active.length < 2}
            >
              <ArrowLeftRight aria-hidden className="size-4" />
              Transferir
            </Button>
            <Button onClick={() => setDialog({ kind: 'create' })}>
              <Plus aria-hidden className="size-4" />
              Nova conta
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3">
          <p className="text-sm text-zinc-400">Saldo total das contas ativas</p>
          <AnimatedNumber
            value={total}
            format={formatCurrency}
            className="text-2xl font-semibold text-zinc-50"
          />
        </div>
        {archivedCount > 0 && (
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(event) => setShowArchived(event.target.checked)}
              className="size-4 accent-emerald-500"
            />
            Mostrar arquivadas ({archivedCount})
          </label>
        )}
      </div>

      {accounts.isPending ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : accounts.isError ? (
        <ErrorState
          message="Não foi possível carregar as contas."
          onRetry={() => void accounts.refetch()}
        />
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 py-12 text-center text-sm text-zinc-400">
          Nenhuma conta ainda. Crie a primeira para lançar transações.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false} mode="popLayout">
            {visible.map((account, index) => {
              const { label, icon: Icon } = ACCOUNT_TYPES[account.type];
              return (
                <motion.li
                  key={account.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: { ...spring, delay: staggerDelay(index, 0.04) },
                  }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={spring}
                >
                  <HoverCard
                    aria-label={account.name}
                    className={cn(
                      'flex h-full flex-col gap-3 rounded-2xl border bg-zinc-900 p-4',
                      account.archived && 'opacity-60',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        aria-hidden
                        className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${account.color}26`, color: account.color }}
                      >
                        <Icon className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-zinc-100">{account.name}</p>
                        <p className="text-xs text-zinc-500">
                          {label}
                          {account.archived ? ' · Arquivada' : ''}
                        </p>
                      </div>
                    </div>
                    <div>
                      <AnimatedNumber
                        value={account.balance}
                        format={formatCurrency}
                        className="text-xl font-semibold text-zinc-50"
                      />
                      <p className="text-xs text-zinc-500">
                        Saldo inicial {formatCurrency(account.initialBalance)}
                      </p>
                    </div>
                    <div className="mt-auto flex justify-end gap-1 border-t border-zinc-800 pt-2">
                      <button
                        type="button"
                        className={iconButton}
                        aria-label={`Editar ${account.name}`}
                        onClick={() => setDialog({ kind: 'edit', account })}
                      >
                        <Pencil aria-hidden className="size-4" />
                      </button>
                      <button
                        type="button"
                        className={iconButton}
                        aria-label={
                          account.archived
                            ? `Desarquivar ${account.name}`
                            : `Arquivar ${account.name}`
                        }
                        onClick={() => void toggleArchive(account)}
                      >
                        {account.archived ? (
                          <ArchiveRestore aria-hidden className="size-4" />
                        ) : (
                          <Archive aria-hidden className="size-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        className={cn(iconButton, 'hover:bg-red-500/10 hover:text-red-400')}
                        aria-label={`Excluir ${account.name}`}
                        onClick={() => setDialog({ kind: 'delete', account })}
                      >
                        <Trash2 aria-hidden className="size-4" />
                      </button>
                    </div>
                  </HoverCard>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      <RecentTransfers onOpen={openTransfer} />

      <TransferDetailDrawer
        onEdit={(transfer) => setDialog({ kind: 'editTransfer', transfer })}
        onDelete={(transfer) => setDialog({ kind: 'deleteTransfer', transfer })}
        returnFocusTo={focusAfterTransfer}
      />

      <Modal open={dialog.kind === 'editTransfer'} onClose={close} title="Editar transferência">
        {dialog.kind === 'editTransfer' && (
          <TransferForm
            key={dialog.transfer.id}
            transfer={dialog.transfer}
            accounts={transferAccounts(dialog.transfer)}
            onCancel={close}
            onSubmit={async (input) => {
              const changes = transferChanges(dialog.transfer, input);
              if (Object.keys(changes).length > 0) {
                await updateTransfer.mutateAsync({ id: dialog.transfer.id, changes });
                toast('Transferência atualizada');
              }
              close();
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={dialog.kind === 'deleteTransfer'}
        title="Excluir transferência?"
        description="Os saldos das duas contas voltam ao que eram antes dela."
        confirmLabel="Excluir"
        loading={deleteTransfer.isPending}
        onClose={close}
        onConfirm={async () => {
          if (dialog.kind !== 'deleteTransfer') return;
          const { transfer } = dialog;
          close();
          if (transferDetail.values.transferencia === transfer.id) transferDetail.close();
          try {
            await deleteTransfer.mutateAsync(transfer.id);
            toast('Transferência excluída');
          } catch {
            toast('Não foi possível excluir a transferência', 'error');
          }
        }}
      >
        {dialog.kind === 'deleteTransfer' && (
          <p className="text-sm text-zinc-300">
            {dialog.transfer.description} · {formatCurrency(dialog.transfer.amount)}
          </p>
        )}
      </ConfirmDialog>

      <Modal
        open={dialog.kind === 'create' || dialog.kind === 'edit'}
        onClose={close}
        title={dialog.kind === 'edit' ? 'Editar conta' : 'Nova conta'}
      >
        <AccountForm
          key={dialog.kind === 'edit' ? dialog.account.id : 'new'}
          account={dialog.kind === 'edit' ? dialog.account : undefined}
          onCancel={close}
          onSubmit={async (input) => {
            if (dialog.kind === 'edit') {
              await updateAccount.mutateAsync({ id: dialog.account.id, changes: input });
              toast('Conta atualizada');
            } else {
              await createAccount.mutateAsync(input);
              toast('Conta criada');
            }
            close();
          }}
        />
      </Modal>

      <Modal
        open={dialog.kind === 'transfer'}
        onClose={close}
        title="Transferir entre contas"
        description="Não conta como receita nem despesa: só muda os saldos."
      >
        <TransferForm
          accounts={active}
          onCancel={close}
          onSubmit={async (input) => {
            await createTransfer.mutateAsync(input);
            toast('Transferência registrada');
            close();
          }}
        />
      </Modal>

      <ConfirmDialog
        open={dialog.kind === 'delete'}
        title="Excluir conta?"
        description="Só é possível excluir contas sem movimentações. Contas com histórico podem ser arquivadas."
        confirmLabel="Excluir"
        loading={deleteAccount.isPending}
        onClose={close}
        onConfirm={() => dialog.kind === 'delete' && void confirmDelete(dialog.account)}
      >
        {dialog.kind === 'delete' && <p className="text-sm text-zinc-300">{dialog.account.name}</p>}
      </ConfirmDialog>
    </div>
  );
}
