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
const PERSIST_DEBOUNCE_MS = 800;

@Injectable({ providedIn: 'root' })
export class SqliteService {
  private sqlite = new SQLiteConnection(CapacitorSQLite);
  private db: SQLiteDBConnection | null = null;
  private platform = Capacitor.getPlatform();

  private initPromise: Promise<void> | null = null;
  private persistTimer: ReturnType<typeof setTimeout> | null = null;
  private persistQueue: Promise<void> = Promise.resolve();

  ready = signal(false);

  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    if (this.ready()) return;

    this.initPromise = this.doInit();
    try {
      await this.initPromise;
    } finally {
      this.initPromise = null;
    }
  }

  private async doInit(): Promise<void> {
    if (this.platform === 'web') {
      await this.setupWebStore();
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

  private async setupWebStore(): Promise<void> {
    await jeepSqlite(window);
    await customElements.whenDefined('jeep-sqlite');

    let el = document.querySelector('jeep-sqlite') as (HTMLElement & { componentOnReady?: () => Promise<unknown> }) | null;

    if (!el) {
      el = document.createElement('jeep-sqlite');
      document.body.appendChild(el);
      await customElements.whenDefined('jeep-sqlite');
    }

    if (typeof el.componentOnReady === 'function') {
      await el.componentOnReady();
    }

    await this.sqlite.initWebStore();
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
  }

  getDb(): SQLiteDBConnection {
    if (!this.db) throw new Error('DB no inicializada — llama a init() primero');
    return this.db;
  }

  /**
   * Persiste a IndexedDB en web, con debounce para agrupar escrituras seguidas.
   * En lugar de saveToStore (que en esta combinación de versiones de
   * @capacitor-community/sqlite + jeep-sqlite nunca encuentra la conexión),
   * se fuerza un ciclo cerrar→reabrir la conexión, que según la documentación
   * de jeep-sqlite es el mecanismo que realmente dispara el guardado a IndexedDB.
   */
  persistWeb(): void {
    if (this.platform !== 'web') return;
    if (!this.ready()) return;

    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
    }

    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      this.persistQueue = this.persistQueue.then(() => this.doPersistWeb());
    }, PERSIST_DEBOUNCE_MS);
  }

  /** Espera explícitamente a que la última persistencia pendiente termine */
  async flushPersist(): Promise<void> {
    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }
    await this.persistQueue;
  }

  private async doPersistWeb(): Promise<void> {
    if (!this.db) return;

    try {
      // Cerrar la conexión: según jeep-sqlite, esto dispara el guardado real a IndexedDB
      await this.db.close();

      // Reabrir inmediatamente para que el resto de la app siga funcionando sin fricción
      const isConn = (await this.sqlite.isConnection(DB_NAME, false)).result;
      this.db = isConn
        ? await this.sqlite.retrieveConnection(DB_NAME, false)
        : await this.sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);

      await this.db.open();

      console.log('[SQLite] Persistido a IndexedDB vía ciclo close/reopen.');
    } catch (err) {
      console.warn('[SQLite] No se pudo persistir a IndexedDB (close/reopen falló):', err);
    }
  }
}