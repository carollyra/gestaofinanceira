import { motion } from 'framer-motion';

import { spring } from '@/utils/motion';

interface ProgressMeterProps {
  // 0-100+; the bar is capped at 100% but the value is shown as is
  percentage: number;
  color: string;
  label: string;
}

// Meter: the fill carries the state; the track is a faint step of the same color
export function ProgressMeter({ percentage, color, label }: ProgressMeterProps) {
  const width = Math.min(Math.max(percentage, 0), 100);

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(Math.min(percentage, 100))}
      aria-valuetext={`${percentage.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}
      className="h-2 overflow-hidden rounded-full"
      style={{ backgroundColor: `${color}26` }}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${width}%` }}
        transition={spring}
      />
    </div>
  );
}
