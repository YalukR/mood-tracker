import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SqliteService } from '../services/sqlite.service';
import { AppSettingsRepository } from '../repositories';
import { waitForDatabase } from '../utils/wait-for-database.util';

/** Protege las rutas normales de la app — si el setup no se ha hecho, redirige a /setup */
export const setupCompletedGuard: CanActivateFn = async () => {
  const sqlite = inject(SqliteService);
  const appSettings = inject(AppSettingsRepository);
  const router = inject(Router);

  await waitForDatabase(sqlite);
  const completed = await appSettings.isSetupCompleted();

  return completed ? true : router.parseUrl('/setup');
};

/** Protege la ruta /setup — si ya se completó, no deja volver a entrar */
export const setupNotCompletedGuard: CanActivateFn = async () => {
  const sqlite = inject(SqliteService);
  const appSettings = inject(AppSettingsRepository);
  const router = inject(Router);

  await waitForDatabase(sqlite);
  const completed = await appSettings.isSetupCompleted();

  return completed ? router.parseUrl('/home') : true;
};