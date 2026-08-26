import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { SqliteService } from '../../core/services/sqlite.service';
import {
  EmotionRepository,
  CombinationRepository,
  UserEmotionColorRepository,
  ColorPaletteRepository,
  MoodEntryRepository,
  CombinationMatch,
} from '../../core/repositories';
import { EmotionModel, ColorPaletteModel } from '../../core/models';

interface EmotionChip {
  emotion: EmotionModel;
  color: string; // hex, con fallback si el usuario no ha elegido aún
}

type SaveState = 'idle' | 'saving' | 'success';

@Component({
  selector: 'app-mood-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mood-form.html',
  styleUrl: './mood-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoodForm implements OnInit {
  private router = inject(Router);
  private messageService = inject(MessageService);
  private sqlite = inject(SqliteService);
  private emotionRepo = inject(EmotionRepository);
  private combinationRepo = inject(CombinationRepository);
  private colorRepo = inject(UserEmotionColorRepository);
  private paletteRepo = inject(ColorPaletteRepository);
  private moodEntryRepo = inject(MoodEntryRepository);

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
  customColorId = signal<number | null>(null);
  customError = signal<string | null>(null);
  palette = signal<ColorPaletteModel[]>([]);

  // --- Estado de guardado ---
  saveState = signal<SaveState>('idle');
  saveError = signal<string | null>(null);

  selectedChips = computed(() =>
    this.chips().filter(c => this.selectedIds().has(c.emotion.id))
  );

  canSave = computed(() => this.selectedIds().size > 0 && this.saveState() === 'idle');

  private static readonly FALLBACK_COLOR = '#c5b8a8';
  private static readonly SUCCESS_DISPLAY_MS = 900;

  async ngOnInit(): Promise<void> {
    await this.waitForDatabase();
    await this.loadCatalog();
  }

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
      const [emotions, colorMap, palette] = await Promise.all([
        this.emotionRepo.getAll(),
        this.colorRepo.getAllColorsMap(),
        this.paletteRepo.getAll(),
      ]);

      this.chips.set(
        emotions.map(emotion => ({
          emotion,
          color: colorMap.get(emotion.id) ?? MoodForm.FALLBACK_COLOR,
        }))
      );
      this.palette.set(palette);
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
    this.suggestion.set(null);
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

  acceptSuggestion(): void {
    const match = this.suggestion();
    if (!match) return;

    const remaining = new Set(this.selectedIds());
    for (const id of match.consumedEmotionIds) {
      remaining.delete(id);
    }
    remaining.add(match.resultEmotion.id);

    if (!this.chips().some(c => c.emotion.id === match.resultEmotion.id)) {
      this.chips.update(list => [
        ...list,
        { emotion: match.resultEmotion, color: match.colorHex },
      ]);
    }

    this.selectedIds.set(remaining);
    this.suggestion.set(null);
  }

  dismissSuggestion(): void {
    this.suggestion.set(null);
  }

  selectCustomColor(colorId: number): void {
    this.customColorId.set(colorId);
    this.customError.set(null);
  }

  cancelCustomEmotion(): void {
    this.creatingCustom.set(false);
    this.customName.set('');
    this.customColorId.set(null);
    this.customError.set(null);
  }

  async createCustomEmotion(): Promise<void> {
    const name = this.customName().trim();
    const colorId = this.customColorId();

    if (!name) {
      this.customError.set('Ponle un nombre a tu emoción.');
      return;
    }
    if (colorId === null) {
      this.customError.set('Elige un color para esta emoción.');
      return;
    }

    this.customError.set(null);

    try {
      const newId = await this.emotionRepo.createCustom(name);
      const newEmotion = await this.emotionRepo.getById(newId);
      if (!newEmotion) return;

      await this.colorRepo.setColor(newId, colorId);
      const colorHex = this.palette().find(c => c.id === colorId)?.hex ?? MoodForm.FALLBACK_COLOR;

      this.chips.update(list => [
        ...list,
        { emotion: newEmotion, color: colorHex },
      ]);

      const current = new Set(this.selectedIds());
      current.add(newId);
      this.selectedIds.set(current);

      this.customName.set('');
      this.customColorId.set(null);
      this.creatingCustom.set(false);
    } catch (err) {
      this.customError.set(err instanceof Error ? err.message : 'No se pudo crear la emoción.');
    }
  }

  async save(): Promise<void> {
    if (!this.canSave()) return;

    this.saveState.set('saving');
    this.saveError.set(null);

    try {
      await this.moodEntryRepo.create({
        emotionIds: Array.from(this.selectedIds()),
        intensity: this.intensity(),
        note: this.note().trim() || null,
      });

      this.saveState.set('success');

      this.messageService.add({
        severity: 'success',
        summary: 'Registrado',
        detail: 'Tu momento quedó guardado.',
        life: 2500,
      });

      // Breve pausa para que el usuario vea la confirmación antes de salir
      setTimeout(() => {
        this.router.navigate(['/home']);
      }, MoodForm.SUCCESS_DISPLAY_MS);

    } catch (err) {
      this.saveState.set('idle');
      const message = err instanceof Error ? err.message : 'No se pudo guardar el registro.';
      this.saveError.set(message);

      this.messageService.add({
        severity: 'error',
        summary: 'No se pudo guardar',
        detail: message,
        life: 4000,
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/home']);
  }
}