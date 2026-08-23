import { Migration } from './migration.interface';

export const migration001CreateUsers: Migration = {
  version: 1,
  name: 'create_users',
  statements: [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );`,
  ],
};