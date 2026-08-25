import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { SqliteService } from '../../core/services/sqlite.service';
import { waitForDatabase } from '../../core/utils/wait-for-database.util';
import { StatsRepository, DailyDominantColor } from '../../core/repositories';
import { Router } from '@angular/router';

interface CalendarDay {
  date: Date;
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  colors: string[];
  emotionNames: string[];
}

type SlideDirection = 'left' | 'right';

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
  private router = inject(Router);
  private sqlite = inject(SqliteService);
  private statsRepo = inject(StatsRepository);

  weekdayLabels = WEEKDAY_LABELS;

  viewDate = signal(new Date());

  loading = signal(true);
  loadError = signal<string | null>(null);

  /** Hacia dónde "entra" la cuadrícula completa al cambiar de mes (prev/next) */
  slideDirection = signal<SlideDirection>('right');

  /** Controla la entrada en cascada de las celdas SOLO la primera vez que se abre el calendario */
  daysAnimated = signal(false);

  private dailyColors = signal<Map<string, DailyDominantColor[]>>(new Map());

  monthLabel = computed(() =>
    this.viewDate().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
  );

  /** Cambia cada vez que cambia el mes visible; se usa como key para forzar
   *  que Angular recree el contenedor de semanas y así se repita la animación de slide */
  monthKey = computed(() => `${this.viewDate().getFullYear()}-${this.viewDate().getMonth()}`);

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
    this.triggerDaysCascade();
  }

  async prevMonth(): Promise<void> {
    this.slideDirection.set('left');
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
    await this.load();
  }

  async nextMonth(): Promise<void> {
    this.slideDirection.set('right');
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
    await this.load();
  }

  async goToday(): Promise<void> {
    const current = this.viewDate();
    const today = new Date();
    const isSameMonth =
      current.getFullYear() === today.getFullYear() && current.getMonth() === today.getMonth();
    if (isSameMonth) return;

    this.slideDirection.set(today.getTime() > current.getTime() ? 'right' : 'left');
    this.viewDate.set(new Date(today.getFullYear(), today.getMonth(), 1));
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

  /**
   * Doble requestAnimationFrame: garantiza que el navegador ya pintó las
   * celdas en su estado "oculto" antes de pasarlas a visible, para que la
   * transición sí se anime en vez de aparecer de golpe. Solo se llama una
   * vez, al abrir el calendario.
   */
  private triggerDaysCascade(): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.daysAnimated.set(true));
    });
  }

  /** Delay en cascada por celda, según su posición en la cuadrícula (fila-columna) */
  dayDelay(weekIndex: number, dayIndex: number): number {
    return (weekIndex * 7 + dayIndex) * 12;
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
  
  openDay(day: CalendarDay): void {
    if (!day.isCurrentMonth) return; // evita abrir días "fantasma" de otro mes
    this.router.navigate(['/day', day.dateStr]);
  }
}