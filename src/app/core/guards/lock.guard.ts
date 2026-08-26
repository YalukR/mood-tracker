import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AppSettingsRepository } from '../repositories';
import { LockStateService } from '../services/lock-state.service';

export const lockGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const appSettingsRepo = inject(AppSettingsRepository);
  const lockState = inject(LockStateService);

  const setupCompleted = await appSettingsRepo.isSetupCompleted();
  if (!setupCompleted) return true; // sin password aún, no hay nada que bloquear

  if (lockState.unlocked()) return true;

  return router.createUrlTree(['/lock']);
};