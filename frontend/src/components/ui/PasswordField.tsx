import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useState } from 'react';

import { TextField, type TextFieldProps } from './TextField';

type PasswordFieldProps = Omit<TextFieldProps, 'type' | 'trailing'>;

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField(props, ref) {
    const [visible, setVisible] = useState(false);
    const Icon = visible ? EyeOff : Eye;

    return (
      <TextField
        ref={ref}
        type={visible ? 'text' : 'password'}
        // Keeps the browser from offering to capitalize or correct the password when shown
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        trailing={
          <button
            type="button"
            onClick={() => setVisible((value) => !value)}
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={visible}
            className="flex size-9 items-center justify-center rounded-md text-zinc-400 transition-colors hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-emerald-400"
          >
            <Icon aria-hidden className="size-4" />
          </button>
        }
        {...props}
      />
    );
  },
);
