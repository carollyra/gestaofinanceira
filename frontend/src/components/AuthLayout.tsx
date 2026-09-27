import { BellRing, FileUp, LineChart } from 'lucide-react';
import type { ReactNode } from 'react';

import { BrandLogo } from './BrandMark';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

const HIGHLIGHTS = [
  { icon: LineChart, text: 'Saldo, receitas e despesas de todas as contas em um só lugar' },
  { icon: BellRing, text: 'Orçamentos que avisam antes de estourar' },
  { icon: FileUp, text: 'Importe o extrato do seu banco sem digitar nada' },
];

// Decorative: a calm upward line, echoing the logo
function HeroChart() {
  return (
    <svg viewBox="0 0 400 160" aria-hidden className="w-full max-w-md">
      <defs>
        <linearGradient id="hero-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#10b981" stopOpacity="0.25" />
          <stop offset="1" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[40, 80, 120].map((y) => (
        <line key={y} x1="0" x2="400" y1={y} y2={y} stroke="#27272a" strokeWidth="1" />
      ))}
      <path
        d="M0 130 C60 120 90 110 130 96 S210 88 250 64 S330 40 400 22 V160 H0 Z"
        fill="url(#hero-fill)"
      />
      <path
        d="M0 130 C60 120 90 110 130 96 S210 88 250 64 S330 40 400 22"
        fill="none"
        stroke="#34d399"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="400" cy="22" r="5" fill="#34d399" stroke="#09090b" strokeWidth="3" />
    </svg>
  );
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-zinc-800/80 bg-zinc-900/40 p-12 lg:flex">
        <BrandLogo />
        <div className="flex flex-col gap-8">
          <h2 className="max-w-md text-5xl leading-[1.05] font-semibold text-zinc-50">
            Seu dinheiro, <span className="text-emerald-400">com clareza.</span>
          </h2>
          <ul className="flex flex-col gap-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-zinc-300">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-emerald-400">
                  <Icon aria-hidden className="size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
          <HeroChart />
        </div>
        <p className="text-sm text-zinc-500">Controle financeiro pessoal</p>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <BrandLogo className="mb-10 justify-center lg:hidden" />
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-zinc-50">{title}</h1>
            <p className="mt-1.5 text-zinc-400">{subtitle}</p>
          </div>
          {children}
          <p className="mt-8 text-sm text-zinc-400">{footer}</p>
        </div>
      </main>
    </div>
  );
}
