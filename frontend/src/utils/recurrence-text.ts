import type { RecurringTransaction } from '@/types/api';

const WEEKDAYS = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
];
const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

// "Todo mês, no dia 5" / "Toda semana, na sexta-feira" / "Todo ano, em 20 de março"
export function describeRecurrence({
  frequency,
  day,
  startDate,
}: Pick<RecurringTransaction, 'frequency' | 'day' | 'startDate'>) {
  switch (frequency) {
    case 'WEEKLY': {
      const weekday = WEEKDAYS[day] ?? '';
      return `Toda semana, ${day === 0 || day === 6 ? 'no' : 'na'} ${weekday}`;
    }
    case 'MONTHLY':
      return day > 28
        ? `Todo mês, no dia ${day} (ou no último dia, nos meses mais curtos)`
        : `Todo mês, no dia ${day}`;
    case 'YEARLY':
      return `Todo ano, em ${day} de ${MONTHS[Number(startDate.slice(5, 7)) - 1]}`;
  }
}
