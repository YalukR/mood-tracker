import { Migration } from './migration.interface';

export const migration004CreateCombinationComponents: Migration = {
  version: 4,
  name: 'create_combination_components',
  statements: [
    `CREATE TABLE IF NOT EXISTS combination_components (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      combination_id INTEGER NOT NULL,
      emotion_id INTEGER NOT NULL,
      FOREIGN KEY (combination_id) REFERENCES combinations(id) ON DELETE CASCADE,
      FOREIGN KEY (emotion_id) REFERENCES emotions(id),
      UNIQUE (combination_id, emotion_id)
    );`,
  ],
};