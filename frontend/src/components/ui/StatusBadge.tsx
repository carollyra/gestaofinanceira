import { CircleAlert, CircleCheck, Clock, Minus, TriangleAlert } from 'lucide-react';

import { type StatusTone, statusTheme } from '@/utils/chart-theme';

const ICONS = {
  good: CircleCheck,
  warning: TriangleAlert,
  critical: CircleAlert,
  neutral: Minus,
} as const;

interface StatusBadgeProps {
  tone: StatusTone;
  label: string;
  // Replaces the default icon for the tone (e.g. a clock for "no deadline")
  icon?: 'clock';
}

// Status is never color alone: icon + label, color only reinforces
export function StatusBadge({ tone, label, icon }: StatusBadgeProps) {
  const Icon = icon === 'clock' ? Clock : ICONS[tone];
  const { text } = statusTheme[tone];

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap"
      style={{ color: text, borderColor: `${text}40`, backgroundColor: `${text}14` }}
    >
      <Icon aria-hidden className="size-3.5" />
      {label}
    </span>
  );
}
