import { Migration } from './migration.interface';

export const migration011CreateAppSettings: Migration = {
  version: 11,
  name: 'create_app_settings',
  statements: [
    `CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );`,
  ],
};