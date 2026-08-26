import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SqliteService } from '../../core/services/sqlite.service';
import { waitForDatabase } from '../../core/utils/wait-for-database.util';
import {
  EmotionRepository,
  ColorPaletteRepository,
  UserEmotionColorRepository,
  AppSettingsRepository,
} from '../../core/repositories';
import { EmotionModel, ColorPaletteModel } from '../../core/models';
import { NotificationService } from '../../core/services/notification.service';

type SetupStep = 'name' | 'colors' | 'password' | 'notifications' | 'about';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './setup.html',
  styleUrl: './setup.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Setup implements OnInit {
  private router = inject(Router);
  private sqlite = inject(SqliteService);
  private emotionRepo = inject(EmotionRepository);
  private paletteRepo = inject(ColorPaletteRepository);
  private userColorRepo = inject(UserEmotionColorRepository);
  private appSettingsRepo = inject(AppSettingsRepository);
  private notificationService = inject(NotificationService);

  step = signal<SetupStep>('name');
  loading = signal(true);
  loadError = signal<string | null>(null);

  // ── Paso 1: nombre ──
  username = signal('');
  usernameError = signal<string | null>(null);
  private static readonly MAX_USERNAME_LENGTH = 30;

  // ── Paso 2: colores ──
  baseEmotions = signal<EmotionModel[]>([]);
  palette = signal<ColorPaletteModel[]>([]);
  selections = signal<Map<number, number>>(new Map()); // emotionId -> colorPaletteId

  currentEmotionIndex = signal(0);
  currentEmotion = computed(() => this.baseEmotions()[this.currentEmotionIndex()] ?? null);
  isLastEmotion = computed(() => this.currentEmotionIndex() === this.baseEmotions().length - 1);

  selectedColorForCurrentEmotion = computed(() => {
    const emotion = this.currentEmotion();
    if (!emotion) return null;
    return this.selections().get(emotion.id) ?? null;
  });

  canAdvance = computed(() => this.selectedColorForCurrentEmotion() !== null);

  // ── Paso 3: contraseña ──
  password = signal('');
  confirmPassword = signal('');
  passwordError = signal<string | null>(null);
  saving = signal(false);


  private static readonly MIN_PASSWORD_LENGTH = 4;

  async ngOnInit(): Promise<void> {
    await waitForDatabase(this.sqlite);
    await this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const [emotions, palette] = await Promise.all([
        this.emotionRepo.getBaseEmotions(),
        this.paletteRepo.getAll(),
      ]);
      this.baseEmotions.set(emotions);
      this.palette.set(palette);
    } catch (err) {
      console.error('[Setup] Error cargando datos:', err);
      this.loadError.set('No se pudo cargar la información inicial.');
    } finally {
      this.loading.set(false);
    }
  }

  // ── Paso 1: nombre ──
  nextFromName(): void {
    const trimmed = this.username().trim();

    if (!trimmed) {
      this.usernameError.set('Cuéntanos cómo te llamas.');
      return;
    }
    if (trimmed.length > Setup.MAX_USERNAME_LENGTH) {
      this.usernameError.set(`Máximo ${Setup.MAX_USERNAME_LENGTH} caracteres.`);
      return;
    }

    this.usernameError.set(null);
    this.username.set(trimmed);
    this.step.set('colors');
  }

  // ── Paso 2: colores ──
  selectColor(colorId: number): void {
    const emotion = this.currentEmotion();
    if (!emotion) return;

    const next = new Map(this.selections());
    next.set(emotion.id, colorId);
    this.selections.set(next);
  }

  nextEmotion(): void {
    if (this.isLastEmotion()) {
      this.step.set('password');
      return;
    }
    this.currentEmotionIndex.update(i => i + 1);
  }

  previousEmotion(): void {
    if (this.currentEmotionIndex() === 0) {
      // ya estamos en la primera emoción, regresa al paso de nombre
      this.step.set('name');
      return;
    }
    this.currentEmotionIndex.update(i => i - 1);
  }

  // ── Paso 3: contraseña ──
  backToColors(): void {
    this.step.set('colors');
  }
  // ── Paso 4: notificaciones ──
  savingNotifications = signal(false); // 👈 nuevo, evita doble tap mientras se pide permiso

  // ── Paso 5: about ──
  completingSetup = signal(false); // 👈 nuevo

  // ── Paso 3: contraseña (modificado) ──
  async finish(): Promise<void> {
    this.passwordError.set(null);

    const pwd = this.password();
    const confirm = this.confirmPassword();

    if (pwd.length < Setup.MIN_PASSWORD_LENGTH) {
      this.passwordError.set(`La contraseña debe tener al menos ${Setup.MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (pwd !== confirm) {
      this.passwordError.set('Las contraseñas no coinciden.');
      return;
    }

    this.saving.set(true);

    try {
      await this.appSettingsRepo.setUsername(this.username());

      for (const [emotionId, colorId] of this.selections()) {
        await this.userColorRepo.setColor(emotionId, colorId);
      }

      await this.appSettingsRepo.setPassword(pwd);

      this.step.set('notifications'); // 👈 antes: markSetupCompleted + navigate a /home
    } catch (err) {
      console.error('[Setup] Error guardando configuración inicial:', err);
      this.passwordError.set('No se pudo guardar tu configuración. Intenta de nuevo.');
    } finally {
      this.saving.set(false);
    }
  }

  // ── Paso 4: notificaciones ──
  async chooseNotifications(accepted: boolean): Promise<void> {
    if (this.savingNotifications()) return;
    this.savingNotifications.set(true);

    try {
      await this.appSettingsRepo.setNotificationsEnabled(accepted);
      if (accepted) {
        await this.notificationService.initialize();
      }
      this.step.set('about');
    } catch (err) {
      console.error('[Setup] Error configurando notificaciones:', err);
      // no bloqueamos el flujo por esto — seguimos a "about" de todos modos
      this.step.set('about');
    } finally {
      this.savingNotifications.set(false);
    }
  }

  // ── Paso 5: about ──
  async completeSetup(): Promise<void> {
    if (this.completingSetup()) return;
    this.completingSetup.set(true);

    try {
      await this.appSettingsRepo.markSetupCompleted();
      await this.router.navigate(['/home']);
    } catch (err) {
      console.error('[Setup] Error finalizando el setup:', err);
      this.completingSetup.set(false); // 👈 deja reintentar si falla
    }
  }
}