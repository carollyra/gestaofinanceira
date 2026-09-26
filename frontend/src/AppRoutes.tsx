import { Route, Routes } from 'react-router';

import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PublicOnlyRoute } from '@/components/PublicOnlyRoute';
import { AccountsPage } from '@/pages/AccountsPage';
import { BudgetsPage } from '@/pages/BudgetsPage';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { GoalsPage } from '@/pages/GoalsPage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { TransactionsPage } from '@/pages/TransactionsPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/transacoes" element={<TransactionsPage />} />
          <Route path="/orcamentos" element={<BudgetsPage />} />
          <Route path="/metas" element={<GoalsPage />} />
          <Route path="/contas" element={<AccountsPage />} />
          <Route path="/categorias" element={<CategoriesPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
