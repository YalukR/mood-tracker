import { Injectable, inject } from '@angular/core';
import { SqliteService } from '../services/sqlite.service';
import { EmotionModel } from '../models';
import { mapRow, mapRows, toBoolean } from './mapper.util';

@Injectable({ providedIn: 'root' })
export class EmotionRepository {
  private sqlite = inject(SqliteService);

  /** Catálogo completo, ordenado alfabéticamente */
  async getAll(): Promise<EmotionModel[]> {
    const db = this.sqlite.getDb();
    const res = await db.query(`SELECT * FROM emotions ORDER BY name COLLATE NOCASE;`);
    return this.mapList(res.values);
  }

  /** Solo las que pueden participar en combinaciones (bases del sistema) */
  async getBaseEmotions(): Promise<EmotionModel[]> {
    const db = this.sqlite.getDb();
    const res = await db.query(`SELECT * FROM emotions WHERE is_base = 1 ORDER BY name COLLATE NOCASE;`);
    return this.mapList(res.values);
  }

  async getById(id: number): Promise<EmotionModel | null> {
    const db = this.sqlite.getDb();
    const res = await db.query(`SELECT * FROM emotions WHERE id = ?;`, [id]);
    const rows = this.mapList(res.values);
    return rows[0] ?? null;
  }

  /**
   * Valida si un nombre propuesto por el usuario ya existe como emoción
   * resultado de alguna combinación curada — no se permite duplicar un
   * concepto ya definido por el sistema (regla 5.3 del documento técnico).
   */
  async isNameReservedAsCombinationResult(name: string): Promise<boolean> {
    const db = this.sqlite.getDb();
    const res = await db.query(
      `SELECT e.id
         FROM emotions e
         INNER JOIN combinations c ON c.result_emotion_id = e.id
        WHERE LOWER(e.name) = LOWER(?)
        LIMIT 1;`,
      [name]
    );
    return (res.values?.length ?? 0) > 0;
  }

  /**
   * Crea una emoción custom. Nunca puede ser is_base = true — esto es lo
   * que impide que "se reproduzca" con otras en futuras combinaciones.
   */
  async createCustom(name: string, description: string | null = null): Promise<number> {
    const isReserved = await this.isNameReservedAsCombinationResult(name);
    if (isReserved) {
      throw new Error(`"${name}" ya existe como resultado de una combinación del sistema.`);
    }

    const db = this.sqlite.getDb();
    const res = await db.run(
      `INSERT INTO emotions (name, description, is_base, is_custom) VALUES (?, ?, 0, 1);`,
      [name, description]
    );
    await this.sqlite.persistWeb();

    return res.changes?.lastId ?? 0;
  }

  private mapList(rows: Record<string, unknown>[] | undefined): EmotionModel[] {
    return mapRows<EmotionModel>(rows).map(e => ({
      ...e,
      isBase: toBoolean((e as any).isBase),
      isCustom: toBoolean((e as any).isCustom),
    }));
  }
}