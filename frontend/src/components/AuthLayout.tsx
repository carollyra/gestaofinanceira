import { Wallet } from 'lucide-react';
import type { ReactNode } from 'react';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <Wallet aria-hidden className="size-6" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-zinc-50">{title}</h1>
            <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">{children}</div>
        <p className="mt-6 text-center text-sm text-zinc-400">{footer}</p>
      </div>
    </main>
  );
}
