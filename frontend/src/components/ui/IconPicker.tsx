import { createElement } from 'react';

import { CATEGORY_ICONS } from '@/utils/category-icons';
import { cn } from '@/utils/cn';

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  color: string;
}

const ICON_LABELS: Record<string, string> = {
  briefcase: 'Maleta',
  laptop: 'Notebook',
  'trending-up': 'Gráfico subindo',
  gift: 'Presente',
  'circle-plus': 'Mais',
  utensils: 'Talheres',
  'shopping-cart': 'Carrinho',
  house: 'Casa',
  receipt: 'Recibo',
  car: 'Carro',
  'heart-pulse': 'Saúde',
  'graduation-cap': 'Formatura',
  'gamepad-2': 'Videogame',
  repeat: 'Repetir',
  'shopping-bag': 'Sacola',
  plane: 'Avião',
  'paw-print': 'Pata',
  landmark: 'Banco',
  'circle-ellipsis': 'Outros',
  coffee: 'Café',
  fuel: 'Combustível',
  smartphone: 'Celular',
  wifi: 'Internet',
  zap: 'Energia',
  shirt: 'Roupa',
  baby: 'Bebê',
  dumbbell: 'Academia',
  film: 'Filme',
  music: 'Música',
  'book-open': 'Livro',
  wallet: 'Carteira',
  'piggy-bank': 'Cofrinho',
  target: 'Alvo',
  shield: 'Escudo',
  lock: 'Cadeado',
};

export function IconPicker({ value, onChange, color }: IconPickerProps) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-medium text-zinc-200">Ícone</legend>
      <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-9">
        {Object.entries(CATEGORY_ICONS).map(([name, Icon]) => (
          <label
            key={name}
            className={cn(
              'flex aspect-square cursor-pointer items-center justify-center rounded-lg border transition-colors',
              'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-emerald-400',
              value === name
                ? 'border-zinc-400 bg-zinc-800'
                : 'border-zinc-800 text-zinc-400 hover:border-zinc-600',
            )}
            style={value === name ? { color } : undefined}
          >
            <input
              type="radio"
              name="icon"
              value={name}
              checked={value === name}
              onChange={() => onChange(name)}
              className="sr-only"
              aria-label={ICON_LABELS[name] ?? name}
            />
            {createElement(Icon, { 'aria-hidden': true, className: 'size-4' })}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
