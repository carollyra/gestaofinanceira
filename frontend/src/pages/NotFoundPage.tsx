import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-sm font-medium text-emerald-400">404</p>
      <h1 className="text-2xl font-semibold text-zinc-50">Página não encontrada</h1>
      <Link
        to="/"
        className="text-sm text-zinc-400 underline-offset-4 hover:text-zinc-100 hover:underline"
      >
        Voltar ao início
      </Link>
    </main>
  );
}
