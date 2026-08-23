import { Migration } from './migration.interface';

export const migration008CreateUserEmotionColors: Migration = {
  version: 8,
  name: 'create_user_emotion_colors',
  statements: [
    `CREATE TABLE IF NOT EXISTS user_emotion_colors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      emotion_id INTEGER NOT NULL,
      color_palette_id INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (emotion_id) REFERENCES emotions(id),
      FOREIGN KEY (color_palette_id) REFERENCES color_palette(id),
      UNIQUE (user_id, emotion_id)
    );`,
  ],
};