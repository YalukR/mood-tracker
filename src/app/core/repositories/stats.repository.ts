import { Injectable, inject } from '@angular/core';
import { SqliteService } from '../services/sqlite.service';

export interface EmotionFrequency {
  emotionId: number;
  name: string;
  colorHex: string;
  count: number;
  /** Porcentaje relativo al total de etiquetas emocionales del período, no al número de registros */
  percentage: number;
}

const CURRENT_USER_ID = 1;
const FALLBACK_COLOR = '#c5b8a8';

@Injectable({ providedIn: 'root' })
export class StatsRepository {
  private sqlite = inject(SqliteService);

  /**
   * Frecuencia de cada emoción en el rango dado, ordenada de mayor a menor.
   * El color se resuelve así: si la emoción es resultado de una combinación,
   * usa el color curado de esa combinación; si no, usa el color que el
   * usuario le asignó (o un gris neutro si aún no eligió ninguno).
   */
  async getEmotionFrequency(start: string, end: string): Promise<EmotionFrequency[]> {
    const db = this.sqlite.getDb();

    const res = await db.query(
      `SELECT
         e.id AS emotion_id,
         e.name AS name,
         COUNT(*) AS count,
         COALESCE(c.color_hex, cp.hex) AS color_hex
       FROM mood_entry_emotions mee
       INNER JOIN mood_entries me ON me.id = mee.mood_entry_id
       INNER JOIN emotions e ON e.id = mee.emotion_id
       LEFT JOIN combinations c ON c.result_emotion_id = e.id
       LEFT JOIN user_emotion_colors uec ON uec.emotion_id = e.id AND uec.user_id = ?
       LEFT JOIN color_palette cp ON cp.id = uec.color_palette_id
       WHERE me.local_date BETWEEN ? AND ?
       GROUP BY e.id
       ORDER BY count DESC;`,
      [CURRENT_USER_ID, start, end]
    );

    const rows = res.values ?? [];
    const totalTags = rows.reduce((sum, row) => sum + (row['count'] as number), 0);

    return rows.map(row => ({
      emotionId: row['emotion_id'] as number,
      name: row['name'] as string,
      colorHex: (row['color_hex'] as string) ?? FALLBACK_COLOR,
      count: row['count'] as number,
      percentage: totalTags > 0 ? Math.round(((row['count'] as number) / totalTags) * 100) : 0,
    }));
  }

  /** Número de registros (no de etiquetas emocionales) en el rango dado */
  async getEntryCount(start: string, end: string): Promise<number> {
    const db = this.sqlite.getDb();
    const res = await db.query(
      `SELECT COUNT(*) AS total FROM mood_entries WHERE local_date BETWEEN ? AND ?;`,
      [start, end]
    );
    return (res.values?.[0]?.['total'] as number) ?? 0;
  }
}