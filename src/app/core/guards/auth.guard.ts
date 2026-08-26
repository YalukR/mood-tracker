import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AppSettingsRepository } from '../repositories';
import { LockStateService } from '../services/lock-state.service';

export const authGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const appSettingsRepo = inject(AppSettingsRepository);
  const lockState = inject(LockStateService);

  const setupCompleted = await appSettingsRepo.isSetupCompleted();

  if (!setupCompleted) {
    // aún no hay contraseña que verificar, deja pasar al setup
    return true;
  }

  if (lockState.unlocked()) {
    return true;
  }

  return router.createUrlTree(['/lock']);
};