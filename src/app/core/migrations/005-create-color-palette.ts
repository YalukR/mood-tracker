import { Migration } from './migration.interface';

export const migration005CreateColorPalette: Migration = {
  version: 5,
  name: 'create_color_palette',
  statements: [
    `CREATE TABLE IF NOT EXISTS color_palette (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hex TEXT NOT NULL UNIQUE,
      label TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0
    );`,
  ],
};