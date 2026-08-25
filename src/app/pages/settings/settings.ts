import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { AppSettingsRepository } from '../../core/repositories';
import { LockStateService } from '../../core/services/lock-state.service';
import { Theme } from './theme/theme';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ToggleSwitchModule, Theme],
  templateUrl: './settings.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings implements OnInit {
  private appSettingsRepo = inject(AppSettingsRepository);
  private lockState = inject(LockStateService);

  lockEnabled = signal(true);

  async ngOnInit(): Promise<void> {
    this.lockEnabled.set(await this.appSettingsRepo.isLockEnabled());
  }

  async onLockToggle(enabled: boolean): Promise<void> {
    this.lockEnabled.set(enabled);
    await this.appSettingsRepo.setLockEnabled(enabled);

    // si lo acaban de apagar, no dejes la sesión "pendiente de bloqueo"
    if (!enabled) {
      this.lockState.unlockSession();
    }
  }
}