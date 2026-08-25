import { Injectable, inject } from '@angular/core';
import { SqliteService } from '../services/sqlite.service';
import { generateSaltHex, hashWithSalt } from '../utils/crypto.util';

const KEY_SETUP_COMPLETED_AT = 'setup_completed_at';
const KEY_PASSWORD_HASH = 'password_hash';
const KEY_PASSWORD_SALT = 'password_salt';
const KEY_USERNAME = 'username';
const KEY_LOCK_ENABLED = 'lock_enabled';

@Injectable({ providedIn: 'root' })
export class AppSettingsRepository {
  private sqlite = inject(SqliteService);

  private async getValue(key: string): Promise<string | null> {
    const db = this.sqlite.getDb();
    const res = await db.query(`SELECT value FROM app_settings WHERE key = ?;`, [key]);
    return res.values?.[0]?.['value'] ?? null;
  }

  private async setValue(key: string, value: string): Promise<void> {
    const db = this.sqlite.getDb();
    await db.run(
      `INSERT INTO app_settings (key, value) VALUES (?, ?)
       ON CONFLICT (key) DO UPDATE SET value = excluded.value;`,
      [key, value]
    );
    await this.sqlite.persistWeb();
  }

  async isSetupCompleted(): Promise<boolean> {
    const value = await this.getValue(KEY_SETUP_COMPLETED_AT);
    return value !== null;
  }

  async markSetupCompleted(): Promise<void> {
    await this.setValue(KEY_SETUP_COMPLETED_AT, new Date().toISOString());
  }

  async setUsername(name: string): Promise<void> {
    await this.setValue(KEY_USERNAME, name);
  }

  async getUsername(): Promise<string | null> {
    return this.getValue(KEY_USERNAME);
  }

  async setPassword(password: string): Promise<void> {
    const salt = generateSaltHex();
    const hash = await hashWithSalt(password, salt);
    await this.setValue(KEY_PASSWORD_SALT, salt);
    await this.setValue(KEY_PASSWORD_HASH, hash);
  }

  async verifyPassword(password: string): Promise<boolean> {
    const salt = await this.getValue(KEY_PASSWORD_SALT);
    const storedHash = await this.getValue(KEY_PASSWORD_HASH);
    if (!salt || !storedHash) return false;

    const hash = await hashWithSalt(password, salt);
    return hash === storedHash;
  }

  async isLockEnabled(): Promise<boolean> {
    const value = await this.getValue(KEY_LOCK_ENABLED);
    return value === null ? true : value === '1';
  }

  async setLockEnabled(enabled: boolean): Promise<void> {
    await this.setValue(KEY_LOCK_ENABLED, enabled ? '1' : '0');
  }
}