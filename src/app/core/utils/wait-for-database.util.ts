import { SqliteService } from '../services/sqlite.service';

/** Espera activamente a que SqliteService termine su inicialización */
export async function waitForDatabase(sqlite: SqliteService): Promise<void> {
  if (sqlite.ready()) return;

  return new Promise((resolve) => {
    const check = setInterval(() => {
      if (sqlite.ready()) {
        clearInterval(check);
        resolve();
      }
    }, 50);
  });
}