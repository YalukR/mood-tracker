import { Migration } from './migration.interface';

export const migration002CreateEmotions: Migration = {
  version: 2,
  name: 'create_emotions',
  statements: [
    `CREATE TABLE IF NOT EXISTS emotions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      is_base INTEGER NOT NULL DEFAULT 0,
      is_custom INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );`,
  ],
};