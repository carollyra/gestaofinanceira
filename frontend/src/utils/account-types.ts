import {
  CircleEllipsis,
  CreditCard,
  Landmark,
  type LucideIcon,
  PiggyBank,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import type { AccountType } from '@/types/api';

export const ACCOUNT_TYPES: Record<AccountType, { label: string; icon: LucideIcon }> = {
  WALLET: { label: 'Carteira', icon: Wallet },
  CHECKING: { label: 'Conta corrente', icon: Landmark },
  SAVINGS: { label: 'Poupança', icon: PiggyBank },
  CREDIT_CARD: { label: 'Cartão de crédito', icon: CreditCard },
  INVESTMENT: { label: 'Investimentos', icon: TrendingUp },
  OTHER: { label: 'Outra', icon: CircleEllipsis },
};
