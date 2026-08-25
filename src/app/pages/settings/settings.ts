import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MessageService } from 'primeng/api';
import { AppSettingsRepository } from '../../core/repositories';
import { LockStateService } from '../../core/services/lock-state.service';
import { PasswordPromptService } from '../../core/services/password-prompt.service';
import { Theme } from './theme/theme';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ToggleSwitchModule, Theme], // 👈 sin DialogModule
  templateUrl: './settings.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings implements OnInit {
  private appSettingsRepo = inject(AppSettingsRepository);
  private lockState = inject(LockStateService);
  private passwordPrompt = inject(PasswordPromptService);
  private messageService = inject(MessageService);

  // ── Privacidad: bloqueo ──
  lockEnabled = signal(true);

  // ── Privacidad: notificaciones ──
  notificationsEnabled = signal(true);

  // ── Seguridad: cambio de contraseña (inline, sin dialog) ──
  currentPassword = signal('');
  newPassword = signal('');
  confirmNewPassword = signal('');
  changePasswordError = signal<string | null>(null);
  changingPassword = signal(false);

  private static readonly MIN_PASSWORD_LENGTH = 4;

  async ngOnInit(): Promise<void> {
    this.lockEnabled.set(await this.appSettingsRepo.isLockEnabled());
    this.notificationsEnabled.set(await this.appSettingsRepo.isNotificationsEnabled());
  }

  // ── Bloqueo ──
  async onLockToggle(enabled: boolean): Promise<void> {
    const original = this.lockEnabled();
    const ok = await this.passwordPrompt.request();

    if (!ok) {
      this.revertToggle(this.lockEnabled, enabled, original);
      return;
    }

    this.lockEnabled.set(enabled);
    await this.appSettingsRepo.setLockEnabled(enabled);
    if (!enabled) this.lockState.unlockSession();
  }

  // ── Notificaciones ──
  async onNotificationsToggle(enabled: boolean): Promise<void> {
    this.notificationsEnabled.set(enabled);
    await this.appSettingsRepo.setNotificationsEnabled(enabled);
  }

  private revertToggle(target: typeof this.lockEnabled, attempted: boolean, original: boolean): void {
    target.set(attempted);
    queueMicrotask(() => target.set(original));
  }

  // ── Cambio de contraseña ──
  async submitChangePassword(): Promise<void> {
    this.changePasswordError.set(null);

    const current = this.currentPassword();
    const next = this.newPassword();
    const confirm = this.confirmNewPassword();

    if (next.length < Settings.MIN_PASSWORD_LENGTH) {
      this.changePasswordError.set(`La nueva contraseña debe tener al menos ${Settings.MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (next !== confirm) {
      this.changePasswordError.set('Las contraseñas nuevas no coinciden.');
      return;
    }
    if (next === current) {
      this.changePasswordError.set('La nueva contraseña debe ser distinta a la actual.');
      return;
    }

    this.changingPassword.set(true);

    try {
      const valid = await this.appSettingsRepo.verifyPassword(current);
      if (!valid) {
        this.changePasswordError.set('Tu contraseña actual no es correcta.');
        return;
      }

      await this.appSettingsRepo.setPassword(next);

      this.currentPassword.set('');
      this.newPassword.set('');
      this.confirmNewPassword.set('');

      this.messageService.add({
        severity: 'success',
        summary: 'Contraseña actualizada',
        detail: 'Tu contraseña se cambió correctamente.',
      });
    } catch (err) {
      console.error('[Settings] Error cambiando contraseña:', err);
      this.changePasswordError.set('No se pudo cambiar la contraseña. Intenta de nuevo.');
    } finally {
      this.changingPassword.set(false);
    }
  }
}