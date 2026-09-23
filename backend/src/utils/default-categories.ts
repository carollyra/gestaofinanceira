import type { TransactionType } from '../generated/prisma/enums';

export interface DefaultCategory {
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
}

// Created for every new user on sign up. Icons are lucide-react names.
export const DEFAULT_CATEGORIES: readonly DefaultCategory[] = [
  { name: 'Salário', type: 'INCOME', color: '#10b981', icon: 'briefcase' },
  { name: 'Freelance', type: 'INCOME', color: '#14b8a6', icon: 'laptop' },
  { name: 'Investimentos', type: 'INCOME', color: '#22c55e', icon: 'trending-up' },
  { name: 'Presentes', type: 'INCOME', color: '#84cc16', icon: 'gift' },
  { name: 'Outras receitas', type: 'INCOME', color: '#06b6d4', icon: 'circle-plus' },

  { name: 'Alimentação', type: 'EXPENSE', color: '#f97316', icon: 'utensils' },
  { name: 'Mercado', type: 'EXPENSE', color: '#f59e0b', icon: 'shopping-cart' },
  { name: 'Moradia', type: 'EXPENSE', color: '#8b5cf6', icon: 'house' },
  { name: 'Contas e serviços', type: 'EXPENSE', color: '#6366f1', icon: 'receipt' },
  { name: 'Transporte', type: 'EXPENSE', color: '#3b82f6', icon: 'car' },
  { name: 'Saúde', type: 'EXPENSE', color: '#ef4444', icon: 'heart-pulse' },
  { name: 'Educação', type: 'EXPENSE', color: '#0ea5e9', icon: 'graduation-cap' },
  { name: 'Lazer', type: 'EXPENSE', color: '#ec4899', icon: 'gamepad-2' },
  { name: 'Assinaturas', type: 'EXPENSE', color: '#a855f7', icon: 'repeat' },
  { name: 'Compras', type: 'EXPENSE', color: '#d946ef', icon: 'shopping-bag' },
  { name: 'Viagem', type: 'EXPENSE', color: '#0891b2', icon: 'plane' },
  { name: 'Pets', type: 'EXPENSE', color: '#ca8a04', icon: 'paw-print' },
  { name: 'Impostos e taxas', type: 'EXPENSE', color: '#dc2626', icon: 'landmark' },
  { name: 'Outras despesas', type: 'EXPENSE', color: '#64748b', icon: 'circle-ellipsis' },
];
