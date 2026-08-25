import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmotionRepository, UserEmotionColorRepository, MoodEntryRepository } from '../../../core/repositories';
import { EmotionModel } from '../../../core/models';

interface Star {
  id: number;
  x: number; // posición horizontal, 0-100 (%)
  y: number; // posición vertical, 0-100 (%)
  size: number; // px, ya con el "alejamiento" aplicado
  delay: number; // s, desfase del parpadeo para que no titilen todas al unísono
  opacity: number; // 0-1, baja conforme se "alejan"
  color: string;
}

const FALLBACK_COLOR = '#9CA3AF'; // gris, sol sin registros aún
const STAR_FALLBACK_COLOR = '#ffffff'; // blanco, si por alguna razón no hay color asignado

/** Cada cuántas estrellas se activa un nivel más de "alejamiento" */
const STARS_PER_ZOOM_LEVEL = 15;
/** Cuánto se reduce el tamaño/brillo por cada nivel (0.12 = -12% por nivel) */
const ZOOM_STEP = 0.12;
/** Nunca bajar de este factor, para que las estrellas más viejas no desaparezcan del todo */
const MIN_ZOOM_FACTOR = 0.35;

/**
 * Pseudoaleatorio determinista a partir de un id: la misma emoción siempre
 * cae en la misma posición del cielo, en vez de saltar cada vez que se
 * recarga la pantalla.
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Factor de "distancia" según cuántas estrellas más nuevas hay por encima
 * de esta (index 0 = la más reciente = la más "cercana", sin alejar).
 */
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

  loading = signal(true);

  sunColor = signal<string>(FALLBACK_COLOR);
  stars = signal<Star[]>([]);

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);

    try {
      const entries = await this.moodEntryRepo.getAllEntries(); // más recientes primero

      if (entries.length === 0) {
        this.sunColor.set(FALLBACK_COLOR);
        this.stars.set([]);
        return;
      }

      const allEmotions = await this.emotionRepo.getAll();
      const colorsMap = await this.userColorRepo.getAllColorsMap();

      // ── estrellas: una por cada registro histórico, del color de su emoción ──
      // entries[0] es la más reciente -> index 0 -> zoom factor 1 (la más "cercana")
      const stars: Star[] = [];
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
          x: 5 + rx * 90, // margen 5%-95%, no se pegan a los bordes
          y: 6 + ry * 55, // parte de arriba del cielo, deja espacio abajo para el sol
          size: (2 + rs * 2) * zoom, // tamaño base 2px-4px, reducido según qué tan "vieja" es
          delay: rd * 3, // 0s-3s de desfase
          opacity: 0.55 + 0.45 * zoom, // las más "lejanas" titilan más tenue
          color,
        });
      }
      this.stars.set(stars);

      // ── sol: color de la última emoción registrada, siempre al frente, sin alejarse ──
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

  /** Color de un registro: si combina varias emociones base, elige una al azar entre ellas */
  private async colorForEntry(
    moodEntryId: number,
    allEmotions: EmotionModel[],
    colorsMap: Map<number, string>
  ): Promise<string> {
    const entryEmotions = await this.moodEntryRepo.getEmotionsForEntry(moodEntryId);
    const emotionIds = entryEmotions.map(e => e.emotionId);

    const selectedBaseEmotions = allEmotions.filter(
      e => e.isBase && emotionIds.includes(e.id)
    );

    if (selectedBaseEmotions.length === 0) {
      return STAR_FALLBACK_COLOR;
    }

    const chosen = selectedBaseEmotions[Math.floor(Math.random() * selectedBaseEmotions.length)];
    return colorsMap.get(chosen.id) ?? STAR_FALLBACK_COLOR;
  }
}