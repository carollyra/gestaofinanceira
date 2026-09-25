import { LayoutDashboard, LogOut, Wallet } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';

import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

const NAV_ITEMS = [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }];

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

          <nav aria-label="Principal" className="flex flex-1 gap-1 overflow-x-auto">
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

          <span className="hidden truncate text-sm text-zinc-400 sm:block">{user?.name}</span>
          <button
            type="button"
            onClick={logout}
            aria-label="Sair"
            className="flex size-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-emerald-400"
          >
            <LogOut aria-hidden className="size-4" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
