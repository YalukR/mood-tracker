import { Component, inject, signal, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SqliteService } from '../../../core/services/sqlite.service';
import { waitForDatabase } from '../../../core/utils/wait-for-database.util';
import { PageTitleService } from '../../../core/services/page-title.service';
import {
  MoodEntryRepository,
  EmotionRepository,
  UserEmotionColorRepository,
  CombinationRepository,
} from '../../../core/repositories';
import { EmotionModel, MoodEntryModel } from '../../../core/models';

interface EmotionBadge {
  name: string;
  color: string;
}

interface DayEntry {
  id: number;
  time: string; // hora legible, ej. "14:32"
  intensity: number;
  note: string | null;
  emotions: EmotionBadge[];
}

const FALLBACK_COLOR = '#c5b8a8';

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(dateStr: string): string {
  // dateStr viene como YYYY-MM-DD; se arma en local para evitar el corrimiento de día por UTC
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

@Component({
  selector: 'app-day',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './day.html',
  styleUrl: './day.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Day implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sqlite = inject(SqliteService);
  private pageTitleService = inject(PageTitleService);
  private moodEntryRepo = inject(MoodEntryRepository);
  private emotionRepo = inject(EmotionRepository);
  private userColorRepo = inject(UserEmotionColorRepository);
  private combinationRepo = inject(CombinationRepository);

  loading = signal(true);
  loadError = signal<string | null>(null);

  dateStr = signal('');
  dateLabel = signal('');
  entries = signal<DayEntry[]>([]);

  async ngOnInit(): Promise<void> {
    const date = this.route.snapshot.paramMap.get('date');
    if (!date) {
      this.loadError.set('Fecha inválida.');
      this.loading.set(false);
      return;
    }

    this.dateStr.set(date);
    const label = formatDateLabel(date);
    this.dateLabel.set(label);

    // le "manda" el título y el botón de volver al header
    this.pageTitleService.setTitle(label.charAt(0).toUpperCase() + label.slice(1));
    this.pageTitleService.setBackPath('/calendar');

    await waitForDatabase(this.sqlite);
    await this.load(date);
  }

  ngOnDestroy(): void {
    // al salir de Day, el header vuelve a su estado normal (sin override, sin flecha)
    this.pageTitleService.clear();
  }
  async load(date: string): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const [rawEntries, allEmotions, colorsMap] = await Promise.all([
        this.moodEntryRepo.getByLocalDate(date),
        this.emotionRepo.getAll(),
        this.userColorRepo.getAllColorsMap(),
      ]);

      const dayEntries: DayEntry[] = [];

      for (const entry of rawEntries) {
        const entryEmotions = await this.moodEntryRepo.getEmotionsForEntry(entry.id);
        const emotionIds = entryEmotions.map(e => e.emotionId);
        const selectedEmotions = allEmotions.filter(e => emotionIds.includes(e.id));

        const badges: EmotionBadge[] = [];
        for (const emotion of selectedEmotions) {
          const color = await this.colorForEmotion(emotion, colorsMap);
          badges.push({ name: emotion.name, color });
        }

        dayEntries.push({
          id: entry.id,
          time: formatTime(entry.occurredAt),
          intensity: entry.intensity,
          note: entry.note,
          emotions: badges,
        });
      }

      this.entries.set(dayEntries);
    } catch (err) {
      console.error('[Day] Error cargando los registros del día:', err);
      this.loadError.set('No se pudieron cargar los registros de este día.');
    } finally {
      this.loading.set(false);
    }
  }

  /** Mismo criterio que en Pet: primero color elegido por el usuario, luego color fijo de combinación */
  private async colorForEmotion(emotion: EmotionModel, colorsMap: Map<number, string>): Promise<string> {
    const ownColor = colorsMap.get(emotion.id);
    if (ownColor) return ownColor;

    const comboColor = await this.combinationRepo.getColorForResultEmotion(emotion.id);
    return comboColor ?? FALLBACK_COLOR;
  }

  goBack(): void {
    this.router.navigate(['/calendar']);
  }
}