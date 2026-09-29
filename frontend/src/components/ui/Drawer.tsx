import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { type ReactNode, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

import { useDialogBehavior } from '@/hooks/useDialogBehavior';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/utils/cn';
import { spring } from '@/utils/motion';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  // Visible header title; also the dialog's accessible name
  title: string;
  // Fuller accessible name when the title alone is ambiguous
  ariaLabel?: string;
  // Header action on the left of the close button (e.g. "Voltar")
  headerStart?: ReactNode;
  footer?: ReactNode;
  returnFocusTo?: () => HTMLElement | null | undefined;
  children: ReactNode;
}

// Side panel for details: slides in from the right on wide screens and rises
// from the bottom on phones. It sits below Modal (z-40 vs z-50), so editing or
// confirming a deletion opens on top of it.
export function Drawer({
  open,
  onClose,
  title,
  ariaLabel,
  headerStart,
  footer,
  returnFocusTo,
  children,
}: DrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const isWide = useMediaQuery('(min-width: 768px)');
  const { restoreFocus } = useDialogBehavior(open, panelRef, onClose, { returnFocusTo });

  // Sheet on phones, side panel from md
  const offscreen = isWide ? { x: '100%' } : { y: '100%' };

  return createPortal(
    <AnimatePresence onExitComplete={restoreFocus}>
      {open && (
        <div className="fixed inset-0 z-40">
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={spring}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={ariaLabel ? undefined : titleId}
            aria-label={ariaLabel}
            data-variant={isWide ? 'side' : 'sheet'}
            initial={offscreen}
            animate={{ x: 0, y: 0 }}
            exit={offscreen}
            transition={spring}
            className={cn(
              'absolute flex flex-col border-zinc-800 bg-zinc-900 shadow-2xl',
              isWide
                ? 'inset-y-0 right-0 w-full max-w-md border-l'
                : 'inset-x-0 bottom-0 max-h-[88dvh] rounded-t-2xl border-t',
            )}
          >
            {!isWide && (
              <div aria-hidden className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-zinc-700" />
            )}
            <header className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
              {headerStart}
              <h2 id={titleId} className="flex-1 truncate text-base font-semibold text-zinc-100">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="flex size-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-emerald-400"
              >
                <X aria-hidden className="size-4" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
            {footer && (
              <footer className="border-t border-zinc-800 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                {footer}
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
