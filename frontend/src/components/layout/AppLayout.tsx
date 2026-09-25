import { ArrowLeftRight, LayoutDashboard, LogOut, Wallet } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';

import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/transacoes', label: 'Transações', icon: ArrowLeftRight, end: false },
];

export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <span className="flex items-center gap-2 font-semibold text-zinc-50">
            <Wallet aria-hidden className="size-5 text-emerald-400" />
            Finanças
          </span>

          <nav aria-label="Principal" className="hidden flex-1 gap-1 md:flex">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm whitespace-nowrap transition-colors',
                    isActive ? 'bg-zinc-800 text-zinc-50' : 'text-zinc-400 hover:text-zinc-100',
                  )
                }
              >
                <Icon aria-hidden className="size-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <span className="ml-auto hidden truncate text-sm text-zinc-400 sm:block md:ml-0">
            {user?.name}
          </span>
          <button
            type="button"
            onClick={logout}
            aria-label="Sair"
            className="ml-auto flex size-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-emerald-400 sm:ml-0"
          >
            <LogOut aria-hidden className="size-4" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-6 pb-24 md:pb-10">
        <Outlet />
      </main>

      {/* Phones: navigation within thumb reach at the bottom */}
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-10 border-t border-zinc-800 bg-zinc-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="flex">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-1 py-2.5 text-xs transition-colors',
                    isActive ? 'text-emerald-400' : 'text-zinc-400',
                  )
                }
              >
                <Icon aria-hidden className="size-5" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
