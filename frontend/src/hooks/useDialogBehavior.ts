import { type RefObject, useEffect, useLayoutEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Open dialogs, bottom to top. Only the topmost one reacts to Esc and Tab, so
// a modal opened over a drawer closes alone and keeps focus to itself.
const openDialogs: symbol[] = [];
let savedOverflow = '';

interface Options {
  // Decides where focus goes when the dialog finishes closing. Needed when the
  // opener is gone or about to go (a deleted row, a dialog opened from another
  // one). Returning nothing falls back to the element that opened the dialog.
  returnFocusTo?: () => HTMLElement | null | undefined;
}

// Shared by Modal and Drawer: focus moves inside and is trapped, Esc closes,
// page scroll is locked, and focus returns to the opener afterwards.
export function useDialogBehavior(
  open: boolean,
  panelRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  { returnFocusTo }: Options = {},
) {
  const triggerRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (!open || !panelRef.current) return;
    // Runs before focus moves into the dialog: the focused element is the opener
    triggerRef.current ??= document.activeElement as HTMLElement | null;
    panelRef.current.querySelector<HTMLElement>(FOCUSABLE)?.focus();
  }, [open, panelRef]);

  useEffect(() => {
    if (!open) return;

    const id = Symbol('dialog');
    openDialogs.push(id);
    if (openDialogs.length === 1) {
      savedOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (openDialogs[openDialogs.length - 1] !== id) return;

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

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      openDialogs.splice(openDialogs.indexOf(id), 1);
      if (openDialogs.length === 0) document.body.style.overflow = savedOverflow;
    };
  }, [open, onClose, panelRef]);

  // Call when the exit animation ends
  const restoreFocus = () => {
    const target =
      returnFocusTo?.() ?? (triggerRef.current?.isConnected ? triggerRef.current : null);
    target?.focus();
    triggerRef.current = null;
  };

  return { triggerRef, restoreFocus };
}
