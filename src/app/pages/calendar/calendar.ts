import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { SqliteService } from '../../core/services/sqlite.service';
import { waitForDatabase } from '../../core/utils/wait-for-database.util';
import { StatsRepository, DailyDominantColor } from '../../core/repositories';

interface CalendarDay {
  date: Date;
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  colors: string[];
  emotionNames: string[];
}

const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Calendar implements OnInit {
  private sqlite = inject(SqliteService);
  private statsRepo = inject(StatsRepository);

  weekdayLabels = WEEKDAY_LABELS;

  viewDate = signal(new Date());

  loading = signal(true);
  loadError = signal<string | null>(null);

  private dailyColors = signal<Map<string, DailyDominantColor[]>>(new Map());

  monthLabel = computed(() =>
    this.viewDate().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
  );

  weeks = computed<CalendarDay[][]>(() => {
    const view = this.viewDate();
    const year = view.getFullYear();
    const month = view.getMonth();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstOfMonth = new Date(year, month, 1);
    // getDay(): 0 = domingo ... 6 = sábado -> lo convertimos a semana que empieza en lunes
    const firstWeekday = (firstOfMonth.getDay() + 6) % 7;
    const gridStart = new Date(year, month, 1 - firstWeekday);

    const colorsMap = this.dailyColors();
    const days: CalendarDay[] = [];

    for (let i = 0; i < 42; i++) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + i);
      const dateStr = toLocalDateStr(date);
      const dayData = colorsMap.get(dateStr) ?? [];

      days.push({
        date,
        dateStr,
        dayNumber: date.getDate(),
        isCurrentMonth: date.getMonth() === month,
        isToday: isSameDay(date, today),
        colors: dayData.map(d => d.colorHex),
        emotionNames: dayData.map(d => d.name),
      });
    }

    const weeksArr: CalendarDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeksArr.push(days.slice(i, i + 7));
    }

    // recorta la última fila si es enteramente del mes siguiente (evita filas vacías)
    while (weeksArr.length > 4 && weeksArr[weeksArr.length - 1].every(d => !d.isCurrentMonth)) {
      weeksArr.pop();
    }

    return weeksArr;
  });

  async ngOnInit(): Promise<void> {
    await waitForDatabase(this.sqlite);
    await this.load();
  }

  async prevMonth(): Promise<void> {
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
    await this.load();
  }

  async nextMonth(): Promise<void> {
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
    await this.load();
  }

  async goToday(): Promise<void> {
    this.viewDate.set(new Date());
    await this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const view = this.viewDate();
      const year = view.getFullYear();
      const month = view.getMonth();

      const start = toLocalDateStr(new Date(year, month, 1));
      const end = toLocalDateStr(new Date(year, month + 1, 0));

      const map = await this.statsRepo.getDailyDominantColors(start, end);
      this.dailyColors.set(map);
    } catch (err) {
      console.error('[Calendar] Error cargando el calendario:', err);
      this.loadError.set('No se pudo cargar el calendario.');
    } finally {
      this.loading.set(false);
    }
  }

  /** Sólido si hay un solo color; conic-gradient partido en partes iguales si hay empate */
  dayBackground(day: CalendarDay): string {
    if (day.colors.length === 0) return '';
    if (day.colors.length === 1) return day.colors[0];

    const slice = 100 / day.colors.length;
    const stops = day.colors
      .map((color, i) => `${color} ${i * slice}% ${(i + 1) * slice}%`)
      .join(', ');
    return `conic-gradient(${stops})`;
  }

  dayTitle(day: CalendarDay): string {
    return day.emotionNames.join(' / ');
  }
}