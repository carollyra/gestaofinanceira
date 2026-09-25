import { Check, Circle } from 'lucide-react';

import { cn } from '@/utils/cn';
import { PASSWORD_RULES } from '@/utils/password-rules';

// Checklist updated as the user types
export function PasswordRequirements({ password }: { password: string }) {
  return (
    <ul
      className="flex flex-col gap-1 text-sm sm:flex-row sm:flex-wrap sm:gap-x-4"
      aria-label="Requisitos da senha"
    >
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        const Icon = met ? Check : Circle;

        return (
          <li
            key={rule.id}
            data-met={met}
            className={cn(
              'flex items-center gap-1.5 transition-colors',
              met ? 'text-emerald-400' : 'text-zinc-400',
            )}
          >
            <Icon aria-hidden className={cn('size-3.5', !met && 'size-3')} />
            <span>{rule.label}</span>
            <span className="sr-only">{met ? '(atendido)' : '(pendente)'}</span>
          </li>
        );
      })}
    </ul>
  );
}
