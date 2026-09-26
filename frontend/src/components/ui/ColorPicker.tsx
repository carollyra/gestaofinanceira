import { Check } from 'lucide-react';

import { cn } from '@/utils/cn';
import { COLOR_NAMES, IDENTITY_COLORS } from '@/utils/palette';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

// Native radios: arrow keys move between swatches, each swatch has a name
export function ColorPicker({ value, onChange, label = 'Cor' }: ColorPickerProps) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-medium text-zinc-200">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {IDENTITY_COLORS.map((color) => (
          <label
            key={color}
            className={cn(
              'relative flex size-8 cursor-pointer items-center justify-center rounded-full ring-offset-2 ring-offset-zinc-900 transition-shadow',
              'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-400',
              value === color && 'ring-2 ring-zinc-100',
            )}
            style={{ backgroundColor: color }}
          >
            <input
              type="radio"
              name={`color-${label}`}
              value={color}
              checked={value === color}
              onChange={() => onChange(color)}
              className="sr-only"
              aria-label={COLOR_NAMES[color] ?? color}
            />
            {value === color && <Check aria-hidden className="size-4 text-white" />}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
