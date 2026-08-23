import { Migration } from './migration.interface';

export const migration007CreateMoodEntryEmotions: Migration = {
  version: 7,
  name: 'create_mood_entry_emotions',
  statements: [
    `CREATE TABLE IF NOT EXISTS mood_entry_emotions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mood_entry_id INTEGER NOT NULL,
      emotion_id INTEGER NOT NULL,
      FOREIGN KEY (mood_entry_id) REFERENCES mood_entries(id) ON DELETE CASCADE,
      FOREIGN KEY (emotion_id) REFERENCES emotions(id),
      UNIQUE (mood_entry_id, emotion_id)
    );`,
  ],
};