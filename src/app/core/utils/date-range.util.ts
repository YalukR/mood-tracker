export type StatsPeriod = 'day' | 'week' | 'month' | 'year';

export interface DateRange {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Misma lógica de fecha LOCAL (no UTC) que usamos en MoodEntryRepository */
function toLocalDateString(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Calcula el rango de fechas [start, end] para el período dado, en base a la fecha local actual */
export function getDateRangeForPeriod(period: StatsPeriod, reference: Date = new Date()): DateRange {
  const start = new Date(reference);
  const end = new Date(reference);

  switch (period) {
    case 'day':
      // start === end === hoy
      break;

    case 'week': {
      const day = start.getDay(); // 0 = domingo ... 6 = sábado
      const diffToMonday = day === 0 ? -6 : 1 - day;
      start.setDate(start.getDate() + diffToMonday);
      end.setTime(start.getTime());
      end.setDate(start.getDate() + 6);
      break;
    }

    case 'month':
      start.setDate(1);
      end.setMonth(end.getMonth() + 1, 0); // día 0 del mes siguiente = último día de este mes
      break;

    case 'year':
      start.setMonth(0, 1);
      end.setMonth(11, 31);
      break;
  }

  return {
    start: toLocalDateString(start),
    end: toLocalDateString(end),
  };
}