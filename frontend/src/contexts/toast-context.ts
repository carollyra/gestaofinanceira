import { createContext } from 'react';

export interface Toast {
  id: number;
  message: string;
  tone: 'success' | 'error';
}

export interface ToastContextValue {
  toast: (message: string, tone?: Toast['tone']) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
