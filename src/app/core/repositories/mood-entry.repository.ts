import { Injectable, inject } from '@angular/core';
import { SqliteService } from '../services/sqlite.service';
import { MoodEntryModel, MoodEntryEmotionModel } from '../models';
import { mapRows } from './mapper.util';

const CURRENT_USER_ID = 1;

export interface CreateMoodEntryInput {
  emotionIds: number[];
  intensity: number; // 1-10
  note: string | null;
  occurredAt?: Date; // opcional, default "ahora"
}

@Injectable({ providedIn: 'root' })
export class MoodEntryRepository {
  private sqlite = inject(SqliteService);

  /**
   * Crea un registro de ánimo junto con sus N emociones asociadas, dentro
   * de una misma transacción para evitar dejar datos a medias si algo falla.
   */
  async create(input: CreateMoodEntryInput): Promise<number> {
    if (input.emotionIds.length === 0) {
      throw new Error('Un registro necesita al menos una emoción asociada.');
    }
    if (input.intensity < 1 || input.intensity > 10) {
      throw new Error('La intensidad debe estar entre 1 y 10.');
    }

    const db = this.sqlite.getDb();
    const now = input.occurredAt ?? new Date();
    const occurredAt = now.toISOString();
    const localDate = this.toLocalDateString(now);

    await db.beginTransaction();

    try {
      // 👇 tercer parámetro `false` — no dejar que run() abra su propia
      // transacción interna, ya estamos dentro de una manejada a mano
      const entryRes = await db.run(
        `INSERT INTO mood_entries (user_id, occurred_at, local_date, intensity, note)
         VALUES (?, ?, ?, ?, ?);`,
        [CURRENT_USER_ID, occurredAt, localDate, input.intensity, input.note],
        false
      );

      const moodEntryId = entryRes.changes?.lastId;
      if (!moodEntryId) throw new Error('No se pudo obtener el ID del registro creado.');

      for (const emotionId of input.emotionIds) {
        await db.run(
          `INSERT INTO mood_entry_emotions (mood_entry_id, emotion_id) VALUES (?, ?);`,
          [moodEntryId, emotionId],
          false
        );
      }

      await db.commitTransaction();
      await this.sqlite.persistWeb();

      return moodEntryId;
    } catch (err) {
      await db.rollbackTransaction();
      throw err;
    }
  }

  /** Registros de un día local específico (YYYY-MM-DD), más recientes primero */
  async getByLocalDate(localDate: string): Promise<MoodEntryModel[]> {
    const db = this.sqlite.getDb();
    const res = await db.query(
      `SELECT * FROM mood_entries WHERE local_date = ? ORDER BY occurred_at DESC;`,
      [localDate]
    );
    return mapRows<MoodEntryModel>(res.values);
  }

  /** Emociones asociadas a un registro específico */
  async getEmotionsForEntry(moodEntryId: number): Promise<MoodEntryEmotionModel[]> {
    const db = this.sqlite.getDb();
    const res = await db.query(
      `SELECT * FROM mood_entry_emotions WHERE mood_entry_id = ?;`,
      [moodEntryId]
    );
    return mapRows<MoodEntryEmotionModel>(res.values);
  }

  /** Convierte una fecha a YYYY-MM-DD en hora LOCAL del dispositivo (no UTC) */
  private toLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}