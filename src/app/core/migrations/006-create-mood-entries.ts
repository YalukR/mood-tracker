import { Migration } from './migration.interface';

export const migration006CreateMoodEntries: Migration = {
  version: 6,
  name: 'create_mood_entries',
  statements: [
    `CREATE TABLE IF NOT EXISTS mood_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      occurred_at TEXT NOT NULL,
      local_date TEXT NOT NULL,
      intensity INTEGER NOT NULL CHECK (intensity BETWEEN 1 AND 10),
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );`,
  ],
};