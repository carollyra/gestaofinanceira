import {
  ArrowLeftRight,
  LayoutDashboard,
  LogOut,
  type LucideIcon,
  Menu,
  PiggyBank,
  Tags,
  Target,
  Wallet,
  WalletCards,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';

import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/transacoes', label: 'Transações', icon: ArrowLeftRight },
  { to: '/orcamentos', label: 'Orçamentos', icon: PiggyBank },
  { to: '/metas', label: 'Metas', icon: Target },
  { to: '/contas', label: 'Contas', icon: WalletCards },
  { to: '/categorias', label: 'Categorias', icon: Tags },
];

// Phones: the four most used destinations in the bottom bar, the rest under "Mais"
const MOBILE_PRIMARY = NAV_ITEMS.slice(0, 4);
const MOBILE_MORE = NAV_ITEMS.slice(4);

export function AppLayout() {
  const { user, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const { pathname } = useLocation();
  const moreActive = MOBILE_MORE.some((item) => pathname.startsWith(item.to));

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
                title={label}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm whitespace-nowrap transition-colors',
                    isActive ? 'bg-zinc-800 text-zinc-50' : 'text-zinc-400 hover:text-zinc-100',
                  )
                }
              >
                <Icon aria-hidden className="size-4" />
                {/* Labels from lg; icons with a tooltip in between */}
                <span className="sr-only lg:not-sr-only">{label}</span>
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

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-10 border-t border-zinc-800 bg-zinc-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="flex">
          {MOBILE_PRIMARY.map(({ to, label, icon: Icon, end }) => (
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
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              className={cn(
                'flex w-full flex-col items-center gap-1 py-2.5 text-xs transition-colors',
                moreActive ? 'text-emerald-400' : 'text-zinc-400',
              )}
            >
              <Menu aria-hidden className="size-5" />
              Mais
            </button>
          </li>
        </ul>
      </nav>

      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="Mais">
        <ul className="flex flex-col gap-1">
          {MOBILE_MORE.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors',
                    isActive ? 'bg-zinc-800 text-zinc-50' : 'text-zinc-300 hover:bg-zinc-800',
                  )
                }
              >
                <Icon aria-hidden className="size-5" />
                {label}
              </NavLink>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-zinc-300 hover:bg-zinc-800"
            >
              <LogOut aria-hidden className="size-5" />
              Sair
            </button>
          </li>
        </ul>
      </Modal>
    </div>
  );
}
