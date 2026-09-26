import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { type ReactNode, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { spring } from '@/utils/motion';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  // Decides where focus goes when the dialog finishes closing. Needed when
  // the opener is gone or about to go (a row deleted by this dialog, a dialog
  // opened from another one). Returning nothing falls back to the opener.
  returnFocusTo?: () => HTMLElement | null | undefined;
  children: ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Accessible dialog: focus moves inside and is trapped, Esc and the backdrop
// close it, and focus returns to the element that opened it. The panel grows
// from that element (transform-origin at the trigger), so it reads as coming
// from the button the user pressed.
export function Modal({ open, onClose, title, description, returnFocusTo, children }: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [origin, setOrigin] = useState('50% 50%');

  useLayoutEffect(() => {
    if (!open || !panelRef.current) return;
    // Runs before focus moves into the dialog: the focused element is the trigger
    triggerRef.current ??= document.activeElement as HTMLElement | null;
    const trigger = triggerRef.current?.getBoundingClientRect();
    const panel = panelRef.current.getBoundingClientRect();
    if (trigger && trigger.width > 0) {
      setOrigin(
        `${trigger.left + trigger.width / 2 - panel.left}px ${trigger.top + trigger.height / 2 - panel.top}px`,
      );
    }
    panelRef.current.querySelector<HTMLElement>(FOCUSABLE)?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  const handleExitComplete = () => {
    const target =
      returnFocusTo?.() ?? (triggerRef.current?.isConnected ? triggerRef.current : null);
    target?.focus();
    triggerRef.current = null;
  };

  return createPortal(
    <AnimatePresence onExitComplete={handleExitComplete}>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm"
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
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            style={{ transformOrigin: origin }}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={spring}
            className="relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-zinc-800 bg-zinc-900 shadow-2xl sm:max-w-lg sm:rounded-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-zinc-800 px-5 py-4">
              <div>
                <h2 id={titleId} className="text-lg font-semibold text-zinc-50">
                  {title}
                </h2>
                {description && (
                  <p id={descriptionId} className="mt-0.5 text-sm text-zinc-400">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-emerald-400"
              >
                <X aria-hidden className="size-4" />
              </button>
            </header>
            <div className="overflow-y-auto px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
