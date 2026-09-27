import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';

import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PublicOnlyRoute } from '@/components/PublicOnlyRoute';
import { AppShellSkeleton } from '@/components/skeletons';

// Each page is its own chunk: charts (Recharts) only load with the dashboard,
// the CSV import only when it is opened
const named = <K extends string>(loader: () => Promise<Record<K, React.ComponentType>>, name: K) =>
  lazy(() => loader().then((module) => ({ default: module[name] })));

const LoginPage = named(() => import('@/pages/LoginPage'), 'LoginPage');
const RegisterPage = named(() => import('@/pages/RegisterPage'), 'RegisterPage');
const DashboardPage = named(() => import('@/pages/DashboardPage'), 'DashboardPage');
const TransactionsPage = named(() => import('@/pages/TransactionsPage'), 'TransactionsPage');
const BudgetsPage = named(() => import('@/pages/BudgetsPage'), 'BudgetsPage');
const GoalsPage = named(() => import('@/pages/GoalsPage'), 'GoalsPage');
const AccountsPage = named(() => import('@/pages/AccountsPage'), 'AccountsPage');
const CategoriesPage = named(() => import('@/pages/CategoriesPage'), 'CategoriesPage');
const ImportPage = named(() => import('@/pages/ImportPage'), 'ImportPage');
const NotFoundPage = named(() => import('@/pages/NotFoundPage'), 'NotFoundPage');

export function AppRoutes() {
  return (
    <Suspense fallback={<AppShellSkeleton />}>
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
            <Route path="/importar" element={<ImportPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
