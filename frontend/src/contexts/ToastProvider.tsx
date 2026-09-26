import { AnimatePresence, motion } from 'framer-motion';
import { CircleAlert, CircleCheck, X } from 'lucide-react';
import { type ReactNode, useCallback, useMemo, useRef, useState } from 'react';

import { spring } from '@/utils/motion';

import { type Toast, ToastContext } from './toast-context';

const DURATION_MS = 4000;

// Short confirmations after an action, announced politely to screen readers.
// They dismiss themselves (errors stay a little longer) or on the close button.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: Toast['tone'] = 'success') => {
      const id = nextId.current++;
      setToasts((current) => [...current.slice(-2), { id, message, tone }]);
      setTimeout(() => dismiss(id), tone === 'error' ? DURATION_MS * 1.5 : DURATION_MS);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              role="status"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={spring}
              className="pointer-events-auto flex w-full max-w-sm items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 shadow-xl"
            >
              {t.tone === 'success' ? (
                <CircleCheck aria-hidden className="size-4 shrink-0 text-emerald-400" />
              ) : (
                <CircleAlert aria-hidden className="size-4 shrink-0 text-red-400" />
              )}
              <span className="flex-1">{t.message}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Fechar aviso"
                className="flex size-6 items-center justify-center rounded text-zinc-400 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-emerald-400"
              >
                <X aria-hidden className="size-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
