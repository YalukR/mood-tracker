import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  EmotionRepository,
  UserEmotionColorRepository,
  MoodEntryRepository,
  CombinationRepository,
} from '../../core/repositories';
import { EmotionModel } from '../../core/models';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number; // s, desfase del parpadeo continuo
  opacity: number;
  color: string;
  enterDelay: number; // ms, desfase de la animación de "nacimiento" al cargar
}

const FALLBACK_COLOR = '#9CA3AF';
const STAR_FALLBACK_COLOR = '#ffffff';

const STARS_PER_ZOOM_LEVEL = 15;
const ZOOM_STEP = 0.12;
const MIN_ZOOM_FACTOR = 0.35;

/** Máximo desfase total de la cascada de nacimiento, sin importar cuántas estrellas haya */
const MAX_ENTER_CASCADE_MS = 1400;

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function zoomFactorForIndex(index: number): number {
  const level = Math.floor(index / STARS_PER_ZOOM_LEVEL);
  const factor = 1 - level * ZOOM_STEP;
  return Math.max(factor, MIN_ZOOM_FACTOR);
}

@Component({
  selector: 'app-pet',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pet.html',
  styleUrl: './pet.css',
})
export class Pet implements OnInit {
  private emotionRepo = inject(EmotionRepository);
  private userColorRepo = inject(UserEmotionColorRepository);
  private moodEntryRepo = inject(MoodEntryRepository);
  private combinationRepo = inject(CombinationRepository);

  loading = signal(true);

  sunColor = signal<string>(FALLBACK_COLOR);
  stars = signal<Star[]>([]);

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);

    try {
      const entries = await this.moodEntryRepo.getAllEntries();

      if (entries.length === 0) {
        this.sunColor.set(FALLBACK_COLOR);
        this.stars.set([]);
        return;
      }

      const allEmotions = await this.emotionRepo.getAll();
      const colorsMap = await this.userColorRepo.getAllColorsMap();

      const stars: Star[] = [];
      const cascadeStep = Math.min(60, MAX_ENTER_CASCADE_MS / entries.length);

      for (let index = 0; index < entries.length; index++) {
        const entry = entries[index];
        const color = await this.colorForEntry(entry.id, allEmotions, colorsMap);
        const zoom = zoomFactorForIndex(index);

        const rx = seededRandom(entry.id);
        const ry = seededRandom(entry.id * 7.31);
        const rs = seededRandom(entry.id * 3.14);
        const rd = seededRandom(entry.id * 1.61);

        stars.push({
          id: entry.id,
          x: 5 + rx * 90,
          y: 6 + ry * 55,
          size: (2 + rs * 2) * zoom,
          delay: rd * 3,
          opacity: 0.55 + 0.45 * zoom,
          color,
          enterDelay: Math.round(index * cascadeStep),
        });
      }
      this.stars.set(stars);

      const latestEntry = entries[0];
      const sunColor = await this.colorForEntry(latestEntry.id, allEmotions, colorsMap);
      this.sunColor.set(sunColor);
    } catch (err) {
      console.error('[Pet] Error cargando el cielo:', err);
      this.sunColor.set(FALLBACK_COLOR);
      this.stars.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  private async colorForEntry(
    moodEntryId: number,
    allEmotions: EmotionModel[],
    colorsMap: Map<number, string>
  ): Promise<string> {
    const entryEmotions = await this.moodEntryRepo.getEmotionsForEntry(moodEntryId);
    const emotionIds = entryEmotions.map(e => e.emotionId);

    const selectedEmotions = allEmotions.filter(e => emotionIds.includes(e.id));
    if (selectedEmotions.length === 0) {
      return STAR_FALLBACK_COLOR;
    }

    const chosen = selectedEmotions[Math.floor(Math.random() * selectedEmotions.length)];

    const ownColor = colorsMap.get(chosen.id);
    if (ownColor) return ownColor;

    const comboColor = await this.combinationRepo.getColorForResultEmotion(chosen.id);
    return comboColor ?? STAR_FALLBACK_COLOR;
  }
}