import {
  keepPreviousData,
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  type AccountInput,
  accountsService,
  type TransferInput,
} from '@/services/accounts.service';
import { budgetsService } from '@/services/budgets.service';
import { type CategoryInput, categoriesService } from '@/services/categories.service';
import { type GoalInput, goalsService } from '@/services/goals.service';

// Each mutation invalidates every query whose numbers it can change
const invalidate = (queryClient: QueryClient, keys: string[]) =>
  Promise.all(keys.map((key) => queryClient.invalidateQueries({ queryKey: [key] })));

function useInvalidatingMutation<TVariables, TResult>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
  keys: string[],
) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn, onSuccess: () => invalidate(queryClient, keys) });
}

// Accounts ------------------------------------------------------------------

export function useCreateAccount() {
  return useInvalidatingMutation(
    (input: AccountInput) => accountsService.create(input),
    ['accounts', 'dashboard'],
  );
}

export function useUpdateAccount() {
  return useInvalidatingMutation(
    ({ id, changes }: { id: string; changes: Partial<AccountInput> & { archived?: boolean } }) =>
      accountsService.update(id, changes),
    ['accounts', 'dashboard', 'transactions'],
  );
}

export function useDeleteAccount() {
  return useInvalidatingMutation(
    (id: string) => accountsService.remove(id),
    ['accounts', 'dashboard'],
  );
}

export function useCreateTransfer() {
  // Transfers change account balances only, never income/expense totals
  return useInvalidatingMutation(
    (input: TransferInput) => accountsService.transfer(input),
    ['accounts'],
  );
}

// Categories ----------------------------------------------------------------

export function useCreateCategory() {
  return useInvalidatingMutation(
    (input: CategoryInput) => categoriesService.create(input),
    ['categories'],
  );
}

export function useUpdateCategory() {
  return useInvalidatingMutation(
    ({ id, changes }: { id: string; changes: Partial<Omit<CategoryInput, 'type'>> }) =>
      categoriesService.update(id, changes),
    ['categories', 'transactions', 'dashboard', 'budgets'],
  );
}

export function useDeleteCategory() {
  return useInvalidatingMutation(
    ({ id, replaceWith }: { id: string; replaceWith?: string }) =>
      categoriesService.remove(id, replaceWith),
    ['categories', 'transactions', 'dashboard', 'budgets'],
  );
}

// Budgets -------------------------------------------------------------------

export function useBudgets(month: string) {
  return useQuery({
    queryKey: ['budgets', month],
    queryFn: () => budgetsService.list(month),
    placeholderData: keepPreviousData,
  });
}

export function useCreateBudget() {
  return useInvalidatingMutation(
    (input: { categoryId: string; amount: number; month: string }) => budgetsService.create(input),
    ['budgets'],
  );
}

export function useUpdateBudget() {
  return useInvalidatingMutation(
    ({ id, amount }: { id: string; amount: number }) => budgetsService.update(id, amount),
    ['budgets'],
  );
}

export function useDeleteBudget() {
  return useInvalidatingMutation((id: string) => budgetsService.remove(id), ['budgets']);
}

export function useCopyBudgets() {
  return useInvalidatingMutation(
    ({ fromMonth, toMonth }: { fromMonth: string; toMonth: string }) =>
      budgetsService.copy(fromMonth, toMonth),
    ['budgets'],
  );
}

// Goals ---------------------------------------------------------------------

export function useGoals() {
  return useQuery({ queryKey: ['goals'], queryFn: goalsService.list });
}

export function useCreateGoal() {
  return useInvalidatingMutation((input: GoalInput) => goalsService.create(input), ['goals']);
}

export function useUpdateGoal() {
  return useInvalidatingMutation(
    ({ id, changes }: { id: string; changes: Partial<GoalInput> }) =>
      goalsService.update(id, changes),
    ['goals'],
  );
}

export function useDeleteGoal() {
  return useInvalidatingMutation((id: string) => goalsService.remove(id), ['goals']);
}

export function useGoalMovement() {
  return useInvalidatingMutation(
    ({ id, amount, kind }: { id: string; amount: number; kind: 'deposit' | 'withdraw' }) =>
      kind === 'deposit' ? goalsService.deposit(id, amount) : goalsService.withdraw(id, amount),
    ['goals'],
  );
}
