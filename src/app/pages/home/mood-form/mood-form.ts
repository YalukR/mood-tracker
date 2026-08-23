import { Component, inject, signal, computed, output, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SqliteService } from '../../../core/services/sqlite.service';
import {
  EmotionRepository,
  CombinationRepository,
  UserEmotionColorRepository,
  MoodEntryRepository,
  CombinationMatch,
} from '../../../core/repositories';
import { EmotionModel } from '../../../core/models';

interface EmotionChip {
  emotion: EmotionModel;
  color: string; // hex, con fallback si el usuario no ha elegido aún
}

@Component({
  selector: 'app-mood-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mood-form.html',
  styleUrl: './mood-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoodForm implements OnInit {
  private sqlite = inject(SqliteService);
  private emotionRepo = inject(EmotionRepository);
  private combinationRepo = inject(CombinationRepository);
  private colorRepo = inject(UserEmotionColorRepository);
  private moodEntryRepo = inject(MoodEntryRepository);

  /** Emitido cuando el registro se guarda con éxito, para que Home cierre el formulario */
  saved = output<void>();
  cancelled = output<void>();

  // --- Estado del catálogo ---
  chips = signal<EmotionChip[]>([]);
  loading = signal(true);
  loadError = signal<string | null>(null);

  // --- Estado de la selección del usuario ---
  selectedIds = signal<Set<number>>(new Set());
  intensity = signal(5);
  note = signal('');

  // --- Estado de la sugerencia de combinación ---
  suggestion = signal<CombinationMatch | null>(null);
  checkingSuggestion = signal(false);

  // --- Estado de creación de emoción custom ---
  creatingCustom = signal(false);
  customName = signal('');
  customError = signal<string | null>(null);

  saving = signal(false);
  saveError = signal<string | null>(null);

  selectedChips = computed(() =>
    this.chips().filter(c => this.selectedIds().has(c.emotion.id))
  );

  canSave = computed(() => this.selectedIds().size > 0 && !this.saving());

  private static readonly FALLBACK_COLOR = '#c5b8a8';

  async ngOnInit(): Promise<void> {
    await this.waitForDatabase();
    await this.loadCatalog();
  }

  /** Espera activamente a que SqliteService termine su inicialización */
  private async waitForDatabase(): Promise<void> {
    if (this.sqlite.ready()) return;

    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (this.sqlite.ready()) {
          clearInterval(check);
          resolve();
        }
      }, 50);
    });
  }

  async loadCatalog(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const [emotions, colorMap] = await Promise.all([
        this.emotionRepo.getAll(),
        this.colorRepo.getAllColorsMap(),
      ]);

      this.chips.set(
        emotions.map(emotion => ({
          emotion,
          color: colorMap.get(emotion.id) ?? MoodForm.FALLBACK_COLOR,
        }))
      );
    } catch (err) {
      console.error('[MoodForm] Error cargando catálogo:', err);
      this.loadError.set(err instanceof Error ? err.message : 'No se pudo cargar el catálogo de emociones.');
    } finally {
      this.loading.set(false);
    }
  }

  async toggleEmotion(id: number): Promise<void> {
    const current = new Set(this.selectedIds());

    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }

    this.selectedIds.set(current);
    this.suggestion.set(null); // cualquier cambio de selección invalida la sugerencia anterior
    await this.checkForCombination();
  }

  private async checkForCombination(): Promise<void> {
    const selected = this.selectedChips();
    const baseIds = selected
      .filter(c => c.emotion.isBase)
      .map(c => c.emotion.id);

    if (baseIds.length < 2) {
      this.suggestion.set(null);
      return;
    }

    this.checkingSuggestion.set(true);

    const allSelectedIds = selected.map(c => c.emotion.id);
    const match = await this.combinationRepo.findBestMatch(baseIds, allSelectedIds);

    this.suggestion.set(match);
    this.checkingSuggestion.set(false);
  }

  /** El usuario acepta la sugerencia: reemplaza las emociones consumidas por la resultado */
  acceptSuggestion(): void {
    const match = this.suggestion();
    if (!match) return;

    const remaining = new Set(this.selectedIds());
    for (const id of match.consumedEmotionIds) {
      remaining.delete(id);
    }
    remaining.add(match.resultEmotion.id);

    // Aseguramos que la emoción resultado exista como chip visible aunque
    // no estuviera antes en el catálogo cargado en pantalla
    if (!this.chips().some(c => c.emotion.id === match.resultEmotion.id)) {
      this.chips.update(list => [
        ...list,
        { emotion: match.resultEmotion, color: match.colorHex },
      ]);
    }

    this.selectedIds.set(remaining);
    this.suggestion.set(null);
  }

  /** El usuario rechaza: se queda con su selección original tal cual */
  dismissSuggestion(): void {
    this.suggestion.set(null);
  }

  async createCustomEmotion(): Promise<void> {
    const name = this.customName().trim();
    if (!name) return;

    this.customError.set(null);

    try {
      const newId = await this.emotionRepo.createCustom(name);
      const newEmotion = await this.emotionRepo.getById(newId);
      if (!newEmotion) return;

      this.chips.update(list => [
        ...list,
        { emotion: newEmotion, color: MoodForm.FALLBACK_COLOR },
      ]);

      // La seleccionamos automáticamente, ya que el usuario la creó para usarla ahora
      const current = new Set(this.selectedIds());
      current.add(newId);
      this.selectedIds.set(current);

      this.customName.set('');
      this.creatingCustom.set(false);
    } catch (err) {
      this.customError.set(err instanceof Error ? err.message : 'No se pudo crear la emoción.');
    }
  }

  async save(): Promise<void> {
    if (!this.canSave()) return;

    this.saving.set(true);
    this.saveError.set(null);

    try {
      await this.moodEntryRepo.create({
        emotionIds: Array.from(this.selectedIds()),
        intensity: this.intensity(),
        note: this.note().trim() || null,
      });

      this.saved.emit();
    } catch (err) {
      this.saveError.set(err instanceof Error ? err.message : 'No se pudo guardar el registro.');
    } finally {
      this.saving.set(false);
    }
  }

  cancel(): void {
    this.cancelled.emit();
  }
}