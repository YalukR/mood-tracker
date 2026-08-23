import { Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from '@capacitor-community/sqlite';
import { defineCustomElements as jeepSqlite } from 'jeep-sqlite/loader';
import { MIGRATIONS } from '../migrations';

const DB_NAME = 'moodtracker.db';

@Injectable({ providedIn: 'root' })
export class SqliteService {
  private sqlite = new SQLiteConnection(CapacitorSQLite);
  private db: SQLiteDBConnection | null = null;
  private platform = Capacitor.getPlatform();

  ready = signal(false);

  async init(): Promise<void> {
    if (this.platform === 'web') {
      await jeepSqlite(window);
      await customElements.whenDefined('jeep-sqlite');
      const el = document.createElement('jeep-sqlite');
      document.body.appendChild(el);
      await customElements.whenDefined('jeep-sqlite');
      await this.sqlite.initWebStore();
    }

    const isConn = (await this.sqlite.isConnection(DB_NAME, false)).result;
    const consistent = (await this.sqlite.checkConnectionsConsistency()).result;

    this.db = isConn && consistent
      ? await this.sqlite.retrieveConnection(DB_NAME, false)
      : await this.sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);

    await this.db.open();
    await this.runMigrations();

    this.ready.set(true);
  }

  private async runMigrations(): Promise<void> {
    if (!this.db) return;

    const versionResult = await this.db.query('PRAGMA user_version;');
    const currentVersion: number = versionResult.values?.[0]?.['user_version'] ?? 0;

    const pending = MIGRATIONS.filter(m => m.version > currentVersion)
      .sort((a, b) => a.version - b.version);

    for (const migration of pending) {
      console.log(`[SQLite] Aplicando migración ${migration.version}: ${migration.name}`);

      for (const statement of migration.statements) {
        await this.db.execute(statement);
      }

      await this.db.execute(`PRAGMA user_version = ${migration.version};`);
    }

    if (this.platform === 'web') {
      await this.sqlite.saveToStore(DB_NAME);
    }
  }

  getDb(): SQLiteDBConnection {
    if (!this.db) throw new Error('DB no inicializada — llama a init() primero');
    return this.db;
  }

  async persistWeb(): Promise<void> {
    if (this.platform === 'web') {
      await this.sqlite.saveToStore(DB_NAME);
    }
  }
}