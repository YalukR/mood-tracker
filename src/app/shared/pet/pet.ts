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

interface Planet {
  id: number;
  name: string;
  color: string;
  size: number;
  orbitRadius: number;
  orbitDuration: number;
  angleOffset: number;
  enterDelay: number;
  gravityFactor: number; // qué tanto lo jala el sol al arrastrarlo
}

const FALLBACK_COLOR = '#9CA3AF';
const STAR_FALLBACK_COLOR = '#ffffff';

const STARS_PER_ZOOM_LEVEL = 15;
const ZOOM_STEP = 0.12;
const MIN_ZOOM_FACTOR = 0.35;

/** Máximo desfase total de la cascada de nacimiento, sin importar cuántas estrellas haya */
const MAX_ENTER_CASCADE_MS = 1400;

// ── Planetas ──
const PLANET_BASE_RADIUS = 70; // px, radio de la órbita más cercana
const PLANET_RADIUS_STEP = 38; // px, separación entre órbitas
const PLANET_BASE_SIZE = 10; // px
const PLANET_SIZE_STEP = 2; // px, los planetas más externos son un poco más grandes
const PLANET_BASE_DURATION = 18; // s, la órbita más cercana es la más rápida
const PLANET_DURATION_STEP = 7; // s

// ── Jalón gravitacional al arrastrar el sol ──
const GRAVITY_PULL_STRENGTH = 0.3; // fracción del offset del sol que "siente" el planeta más cercano
const GRAVITY_FALLOFF = 0.35; // qué tan rápido decae el jalón con cada órbita hacia afuera
const SPIN_KICK_FACTOR = 0.6; // grados extra de giro por cada px de jalón (según gravityFactor)
//const WOBBLE_SPEED_FACTOR = 0.4; // qué tan más rápido gira la órbita mientras arrastras

// ── Frases del sol (easter egg al tocarlo) ──
const SUN_PHRASES = [
  'Hoy también brillaste.',
  'Sigues aquí. Eso ya es algo.',
  '¿Y si hoy no te apuras a nombrar lo que sientes?',
  'Un día más orbitando alrededor de ti mismx.',
  'Nada que arreglar, solo algo que notar.',
  'Tu luz de hoy también cuenta.',
  'Cada estrella empezó siendo un día cualquiera.',
  'Gracias por pasar a verte.',
];

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
  planets = signal<Planet[]>([]);

  // ── Interacción con el sol ──
  sunDragOffset = signal<{ x: number; y: number }>({ x: 0, y: 0 });
  sunDragging = signal(false);
  sunSnapping = signal(false);
  sunFlare = signal(false);
  sunMessage = signal<string | null>(null);

  // expuesto para el template
  // readonly WOBBLE_SPEED_FACTOR = WOBBLE_SPEED_FACTOR;

  private dragStart: { x: number; y: number; pointerId: number } | null = null;
  private readonly TAP_THRESHOLD_PX = 6;
  private readonly MAX_DRAG_PX = 34;
  private messageTimeout?: ReturnType<typeof setTimeout>;
  private flareTimeout?: ReturnType<typeof setTimeout>;

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);

    try {
      const entries = await this.moodEntryRepo.getAllEntries();
      const allEmotions = await this.emotionRepo.getAll();
      const colorsMap = await this.userColorRepo.getAllColorsMap();

      // Planetas: fijos, no dependen de los registros del usuario
      await this.loadPlanets(colorsMap);

      if (entries.length === 0) {
        this.sunColor.set(FALLBACK_COLOR);
        this.stars.set([]);
        return;
      }

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

  private async loadPlanets(colorsMap: Map<number, string>): Promise<void> {
    try {
      const baseEmotions = await this.emotionRepo.getBaseEmotions();

      const planets: Planet[] = baseEmotions.map((emotion, index) => {
        const ra = seededRandom(emotion.id * 5.17);

        return {
          id: emotion.id,
          name: emotion.name,
          color: colorsMap.get(emotion.id) ?? FALLBACK_COLOR,
          size: PLANET_BASE_SIZE + index * PLANET_SIZE_STEP,
          orbitRadius: PLANET_BASE_RADIUS + index * PLANET_RADIUS_STEP,
          orbitDuration: PLANET_BASE_DURATION + index * PLANET_DURATION_STEP,
          angleOffset: Math.round(ra * 360),
          enterDelay: 300 + index * 120,
          gravityFactor: GRAVITY_PULL_STRENGTH / (1 + index * GRAVITY_FALLOFF),
        };
      });

      this.planets.set(planets);
    } catch (err) {
      console.error('[Pet] Error cargando planetas:', err);
      this.planets.set([]);
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

  // ── Interacción con el sol ──

  onSunPointerDown(event: PointerEvent): void {
    this.dragStart = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
    this.sunSnapping.set(false);
    this.sunDragging.set(true);
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }

  onSunPointerMove(event: PointerEvent): void {
    if (!this.dragStart || event.pointerId !== this.dragStart.pointerId) return;

    const dx = event.clientX - this.dragStart.x;
    const dy = event.clientY - this.dragStart.y;

    // Rubber-band: entre más lejos arrastras, menos responde (resistencia elástica)
    const clampedX = this.rubberBand(dx);
    const clampedY = this.rubberBand(dy);

    this.sunDragOffset.set({ x: clampedX, y: clampedY });
  }

  onSunPointerUp(event: PointerEvent): void {
    if (!this.dragStart || event.pointerId !== this.dragStart.pointerId) return;

    const dx = event.clientX - this.dragStart.x;
    const dy = event.clientY - this.dragStart.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    this.dragStart = null;
    this.sunDragging.set(false);

    // Rebote elástico de vuelta al centro
    this.sunSnapping.set(true);
    this.sunDragOffset.set({ x: 0, y: 0 });
    setTimeout(() => this.sunSnapping.set(false), 500);

    if (distance <= this.TAP_THRESHOLD_PX) {
      this.triggerSunFlare();
    }
  }

  /** Transform del ancla de órbita, incluye jalón gravitacional (traslación) + giro extra (rotación) */
  planetAnchorTransform(planet: Planet): string {
    const offset = this.sunDragOffset();
    const pullX = offset.x * planet.gravityFactor;
    const pullY = offset.y * planet.gravityFactor;

    const dragMagnitude = Math.sqrt(offset.x ** 2 + offset.y ** 2);
    const spinKick = dragMagnitude * planet.gravityFactor * SPIN_KICK_FACTOR;

    return `translate(calc(-50% + ${pullX}px), calc(50% + ${pullY}px)) rotate(${planet.angleOffset + spinKick}deg)`;
  }

  private rubberBand(delta: number): number {
    const sign = Math.sign(delta);
    const abs = Math.abs(delta);
    // Resistencia progresiva: se acerca a MAX_DRAG_PX pero nunca lo excede
    const resisted = this.MAX_DRAG_PX * (1 - Math.exp(-abs / (this.MAX_DRAG_PX * 1.2)));
    return sign * resisted;
  }

  private triggerSunFlare(): void {
    clearTimeout(this.flareTimeout);
    clearTimeout(this.messageTimeout);

    this.sunFlare.set(false);
    // truco para forzar el re-trigger de la animación de destello
    requestAnimationFrame(() => this.sunFlare.set(true));
    this.flareTimeout = setTimeout(() => this.sunFlare.set(false), 900);

    const phrase = SUN_PHRASES[Math.floor(Math.random() * SUN_PHRASES.length)];
    this.sunMessage.set(phrase);
    this.messageTimeout = setTimeout(() => this.sunMessage.set(null), 2600);
  }
}