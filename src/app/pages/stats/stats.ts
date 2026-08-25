import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { SqliteService } from '../../core/services/sqlite.service';
import { waitForDatabase } from '../../core/utils/wait-for-database.util';
import { getDateRangeForPeriod, StatsPeriod } from '../../core/utils/date-range.util';
import { StatsRepository, EmotionFrequency } from '../../core/repositories';
import { SlidingIndicator } from '../../shared/sliding-indicator'; // ajusta la ruta según tu estructura real

interface PeriodOption {
  value: StatsPeriod;
  label: string;
}

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [SlidingIndicator],
  templateUrl: './stats.html',
  styleUrl: './stats.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Stats implements OnInit {
  private sqlite = inject(SqliteService);
  private statsRepo = inject(StatsRepository);

  periodOptions: PeriodOption[] = [
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mes' },
    { value: 'year', label: 'Año' },
  ];

  period = signal<StatsPeriod>('week');
  periodIndex = computed(() =>
    Math.max(0, this.periodOptions.findIndex(o => o.value === this.period()))
  );

  loading = signal(true);
  loadError = signal<string | null>(null);

  entryCount = signal(0);
  frequencies = signal<EmotionFrequency[]>([]);

  /** Controla si las barras ya deben mostrar su ancho final (para poder animarlas desde 0) */
  barsAnimated = signal(false);

  hasData = computed(() => this.frequencies().length > 0);
  maxCount = computed(() => this.frequencies()[0]?.count ?? 0);

  /** Las 1-2 emociones más frecuentes, para el texto de predominancia */
  topEmotions = computed(() => this.frequencies().slice(0, 2));

  async ngOnInit(): Promise<void> {
    await waitForDatabase(this.sqlite);
    await this.load();
  }

  async setPeriod(period: StatsPeriod): Promise<void> {
    if (period === this.period()) return;
    this.period.set(period);
    await this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    this.barsAnimated.set(false);

    try {
      const range = getDateRangeForPeriod(this.period());

      const [count, frequencies] = await Promise.all([
        this.statsRepo.getEntryCount(range.start, range.end),
        this.statsRepo.getEmotionFrequency(range.start, range.end),
      ]);

      this.entryCount.set(count);
      this.frequencies.set(frequencies);
    } catch (err) {
      console.error('[Stats] Error cargando estadísticas:', err);
      this.loadError.set('No se pudieron cargar las estadísticas.');
    } finally {
      this.loading.set(false);
      this.triggerBarsAnimation();
    }
  }

  /**
   * Doble requestAnimationFrame: el primero garantiza que el navegador ya
   * pintó las barras en ancho 0 (recién insertadas al DOM); el segundo
   * dispara el cambio a su ancho final para que el `transition` de la
   * barra sí lo anime en vez de "saltar" directo al valor final.
   */
  private triggerBarsAnimation(): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.barsAnimated.set(true));
    });
  }

  barWidth(count: number): number {
    if (!this.barsAnimated()) return 0;
    if (this.maxCount() === 0) return 0;
    return Math.round((count / this.maxCount()) * 100);
  }

  /** Delay escalonado por fila, para que las barras entren una tras otra */
  barDelay(index: number): number {
    return index * 60;
  }
}