import { Migration } from './migration.interface';

export const migration003CreateCombinations: Migration = {
  version: 3,
  name: 'create_combinations',
  statements: [
    `CREATE TABLE IF NOT EXISTS combinations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      result_emotion_id INTEGER NOT NULL,
      color_hex TEXT NOT NULL,
      component_count INTEGER NOT NULL,
      FOREIGN KEY (result_emotion_id) REFERENCES emotions(id)
    );`,
  ],
};