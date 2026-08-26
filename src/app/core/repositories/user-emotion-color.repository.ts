import { Injectable, inject } from '@angular/core';
import { SqliteService } from '../services/sqlite.service';
import { UserEmotionColorModel } from '../models';
import { mapRow, mapRows } from './mapper.util';

const CURRENT_USER_ID = 1; // usuario local único, ver nota 7.1 del documento técnico

@Injectable({ providedIn: 'root' })
export class UserEmotionColorRepository {
  private sqlite = inject(SqliteService);

  /** Color hexadecimal elegido por el usuario para una emoción, o null si no ha elegido aún */
  async getColorForEmotion(emotionId: number): Promise<string | null> {
    const db = this.sqlite.getDb();
    const res = await db.query(
      `SELECT cp.hex
         FROM user_emotion_colors uec
         INNER JOIN color_palette cp ON cp.id = uec.color_palette_id
        WHERE uec.user_id = ? AND uec.emotion_id = ?
        LIMIT 1;`,
      [CURRENT_USER_ID, emotionId]
    );
    return res.values?.[0]?.['hex'] ?? null;
  }

  /** Mapa completo emotionId -> hex, útil para pintar catálogos completos sin N consultas */
  async getAllColorsMap(): Promise<Map<number, string>> {
    const db = this.sqlite.getDb();
    const res = await db.query(
      `SELECT uec.emotion_id, cp.hex
         FROM user_emotion_colors uec
         INNER JOIN color_palette cp ON cp.id = uec.color_palette_id
        WHERE uec.user_id = ?;`,
      [CURRENT_USER_ID]
    );

    const map = new Map<number, string>();
    for (const row of res.values ?? []) {
      map.set(row['emotion_id'] as number, row['hex'] as string);
    }
    return map;
  }

  /** Crea o reemplaza la elección de color del usuario para una emoción */
  async setColor(emotionId: number, colorPaletteId: number): Promise<void> {
    const db = this.sqlite.getDb();
    await db.run(
      `INSERT INTO user_emotion_colors (user_id, emotion_id, color_palette_id)
       VALUES (?, ?, ?)
       ON CONFLICT (user_id, emotion_id)
       DO UPDATE SET color_palette_id = excluded.color_palette_id;`,
      [CURRENT_USER_ID, emotionId, colorPaletteId]
    );
    await this.sqlite.persistWeb();
  }
}