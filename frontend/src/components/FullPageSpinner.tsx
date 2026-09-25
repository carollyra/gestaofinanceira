import { Spinner } from './ui/Spinner';

export function FullPageSpinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center text-emerald-400">
      <Spinner className="size-8" />
    </div>
  );
}
