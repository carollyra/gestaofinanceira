import { LogOut } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

// Placeholder until the dashboard step
export function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-400">Bem-vindo(a),</p>
          <h1 className="text-2xl font-semibold text-zinc-50">{user?.name}</h1>
        </div>
        <Button variant="ghost" onClick={logout}>
          <LogOut aria-hidden className="size-4" />
          Sair
        </Button>
      </header>
      <p className="text-zinc-400">O dashboard será construído na próxima etapa.</p>
    </main>
  );
}
