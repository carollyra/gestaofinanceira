import { AnimatePresence, motion } from 'framer-motion';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { CategoryForm } from '@/components/categories/CategoryForm';
import { CategoryIcon } from '@/components/CategoryIcon';
import { ErrorState } from '@/components/dashboard/states';
import { PageHeader } from '@/components/layout/PageHeader';
import { Skeleton } from '@/components/skeletons';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useCreateCategory, useDeleteCategory, useUpdateCategory } from '@/hooks/useFinanceData';
import { useCategories } from '@/hooks/useLookups';
import { useToast } from '@/hooks/useToast';
import { ApiError } from '@/services/api';
import type { Category, TransactionType } from '@/types/api';
import { cn } from '@/utils/cn';
import { spring, staggerDelay } from '@/utils/motion';

type Dialog =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; category: Category }
  | { kind: 'delete'; category: Category };

const TABS: [TransactionType, string][] = [
  ['EXPENSE', 'Despesas'],
  ['INCOME', 'Receitas'],
];

const iconButton =
  'flex size-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-emerald-400';

export function CategoriesPage() {
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [dialog, setDialog] = useState<Dialog>({ kind: 'closed' });
  const [replaceWith, setReplaceWith] = useState('');
  const categories = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const toast = useToast();

  const list = (categories.data ?? []).filter((c) => c.type === type);
  const close = () => setDialog({ kind: 'closed' });
  const toDelete = dialog.kind === 'delete' ? dialog.category : null;
  const replacements = toDelete
    ? (categories.data ?? []).filter((c) => c.type === toDelete.type && c.id !== toDelete.id)
    : [];

  const openDelete = (category: Category) => {
    setReplaceWith('');
    setDialog({ kind: 'delete', category });
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteCategory.mutateAsync({ id: toDelete.id, replaceWith: replaceWith || undefined });
      toast('Categoria excluída');
    } catch (error) {
      toast(
        error instanceof ApiError ? error.message : 'Não foi possível excluir a categoria',
        'error',
      );
    }
    close();
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Categorias"
        subtitle="Organize receitas e despesas"
        actions={
          <Button onClick={() => setDialog({ kind: 'create' })}>
            <Plus aria-hidden className="size-4" />
            Nova categoria
          </Button>
        }
      />

      <div
        role="tablist"
        aria-label="Tipo de categoria"
        className="flex w-fit rounded-lg border border-zinc-800 bg-zinc-900 p-1"
      >
        {TABS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            id={`tab-${value}`}
            aria-selected={type === value}
            aria-controls="categories-panel"
            onClick={() => setType(value)}
            className={cn(
              'rounded-md px-4 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-emerald-400',
              type === value ? 'bg-zinc-800 text-zinc-50' : 'text-zinc-400 hover:text-zinc-100',
            )}
          >
            {label}{' '}
            {categories.data && (
              <span className="text-zinc-500">
                ({categories.data.filter((c) => c.type === value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <div id="categories-panel" role="tabpanel" aria-labelledby={`tab-${type}`}>
        {categories.isPending ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : categories.isError ? (
          <ErrorState
            message="Não foi possível carregar as categorias."
            onRetry={() => void categories.refetch()}
          />
        ) : list.length === 0 ? (
          <p className="rounded-2xl border border-zinc-800 bg-zinc-900 py-12 text-center text-sm text-zinc-400">
            Nenhuma categoria de {type === 'INCOME' ? 'receita' : 'despesa'}.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-800/60 rounded-2xl border border-zinc-800 bg-zinc-900">
            <AnimatePresence initial={false}>
              {list.map((category, index) => (
                <motion.li
                  key={category.id}
                  layout="position"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    height: 'auto',
                    transition: { ...spring, delay: staggerDelay(index) },
                  }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={spring}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <CategoryIcon icon={category.icon} color={category.color} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-zinc-100">{category.name}</p>
                      <p className="text-xs text-zinc-500">
                        {category._count.transactions === 1
                          ? '1 transação'
                          : `${category._count.transactions} transações`}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={iconButton}
                      aria-label={`Editar ${category.name}`}
                      onClick={() => setDialog({ kind: 'edit', category })}
                    >
                      <Pencil aria-hidden className="size-4" />
                    </button>
                    <button
                      type="button"
                      className={cn(iconButton, 'hover:bg-red-500/10 hover:text-red-400')}
                      aria-label={`Excluir ${category.name}`}
                      onClick={() => openDelete(category)}
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      <Modal
        open={dialog.kind === 'create' || dialog.kind === 'edit'}
        onClose={close}
        title={
          dialog.kind === 'edit'
            ? 'Editar categoria'
            : `Nova categoria de ${type === 'INCOME' ? 'receita' : 'despesa'}`
        }
      >
        <CategoryForm
          key={dialog.kind === 'edit' ? dialog.category.id : `new-${type}`}
          category={dialog.kind === 'edit' ? dialog.category : undefined}
          type={dialog.kind === 'edit' ? dialog.category.type : type}
          onCancel={close}
          onSubmit={async (input) => {
            if (dialog.kind === 'edit') {
              const { name, color, icon } = input;
              await updateCategory.mutateAsync({
                id: dialog.category.id,
                changes: { name, color, icon },
              });
              toast('Categoria atualizada');
            } else {
              await createCategory.mutateAsync(input);
              toast('Categoria criada');
            }
            close();
          }}
        />
      </Modal>

      <ConfirmDialog
        open={dialog.kind === 'delete'}
        title="Excluir categoria?"
        description={
          toDelete && toDelete._count.transactions > 0
            ? `${toDelete.name} tem ${toDelete._count.transactions} transações. Escolha para onde elas vão.`
            : 'Orçamentos desta categoria também serão excluídos.'
        }
        confirmLabel="Excluir"
        loading={deleteCategory.isPending}
        onClose={close}
        onConfirm={() => void confirmDelete()}
      >
        {toDelete && toDelete._count.transactions > 0 && (
          <Select
            label="Mover transações para"
            value={replaceWith}
            onChange={(event) => setReplaceWith(event.target.value)}
          >
            <option value="">Deixar sem categoria</option>
            {replacements.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        )}
      </ConfirmDialog>
    </div>
  );
}
