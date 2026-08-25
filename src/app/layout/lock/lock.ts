import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppSettingsRepository } from '../../core/repositories';

@Component({
  selector: 'app-lock',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lock.html',
  styleUrl: './lock.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Lock {
  private router = inject(Router);
  private appSettingsRepo = inject(AppSettingsRepository);

  password = signal('');
  error = signal<string | null>(null);
  checking = signal(false);

  /** controla la animación de "sacudida" cuando la contraseña es incorrecta */
  shake = signal(false);

  async unlock(): Promise<void> {
    const pwd = this.password();
    if (!pwd || this.checking()) return;

    this.checking.set(true);
    this.error.set(null);

    try {
      const valid = await this.appSettingsRepo.verifyPassword(pwd);

      if (valid) {
        await this.router.navigate(['/home']);
        return;
      }

      this.password.set('');
      this.error.set('Contraseña incorrecta.');
      this.triggerShake();
    } catch (err) {
      console.error('[Lock] Error verificando contraseña:', err);
      this.error.set('No se pudo verificar la contraseña. Intenta de nuevo.');
    } finally {
      this.checking.set(false);
    }
  }

  /** doble rAF para asegurar que el navegador "vea" el reinicio antes de re-aplicar la animación */
  private triggerShake(): void {
    this.shake.set(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.shake.set(true));
    });
  }

  onShakeEnd(): void {
    this.shake.set(false);
  }
}