import { Injectable, inject } from '@angular/core';
import { SqliteService } from '../services/sqlite.service';
import { CombinationModel, EmotionModel } from '../models';
import { mapRows } from './mapper.util';

export interface CombinationMatch {
  combinationId: number;
  resultEmotion: EmotionModel;
  colorHex: string;
  /** IDs de las emociones seleccionadas que fueron "consumidas" por este match */
  consumedEmotionIds: number[];
  /** IDs seleccionados que no formaron parte del match (deben conservarse) */
  leftoverEmotionIds: number[];
}

@Injectable({ providedIn: 'root' })
export class CombinationRepository {
  private sqlite = inject(SqliteService);

  /**
   * Busca la combinación más específica (mayor número de componentes) cuyo
   * conjunto exacto de componentes esté completamente contenido en las
   * emociones-base seleccionadas por el usuario.
   *
   * @param selectedBaseEmotionIds IDs de emociones con is_base = true que el usuario marcó
   * @param allSelectedEmotionIds Todos los IDs seleccionados (base + no-base), para calcular sobrantes
   */
  async findBestMatch(
    selectedBaseEmotionIds: number[],
    allSelectedEmotionIds: number[]
  ): Promise<CombinationMatch | null> {
    if (selectedBaseEmotionIds.length < 2) return null;

    const db = this.sqlite.getDb();

    // Traemos todas las combinaciones candidatas cuyo tamaño quepa dentro
    // de lo seleccionado, de mayor a menor tamaño — así la primera que
    // coincida exactamente ya es la más específica posible.
    const res = await db.query(
      `SELECT c.id AS combination_id, c.result_emotion_id, c.color_hex, c.component_count
         FROM combinations c
        WHERE c.component_count <= ?
        ORDER BY c.component_count DESC;`,
      [selectedBaseEmotionIds.length]
    );

    const candidates = mapRows<{
      combinationId: number;
      resultEmotionId: number;
      colorHex: string;
      componentCount: number;
    }>(res.values);

    const selectedSet = new Set(selectedBaseEmotionIds);

    for (const candidate of candidates) {
      const componentsRes = await db.query(
        `SELECT emotion_id FROM combination_components WHERE combination_id = ?;`,
        [candidate.combinationId]
      );
      const componentIds: number[] = (componentsRes.values ?? []).map(r => r['emotion_id'] as number);

      const isExactSubsetMatch =
        componentIds.length > 0 &&
        componentIds.every(id => selectedSet.has(id));

      if (isExactSubsetMatch) {
        const resultEmotionRes = await db.query(`SELECT * FROM emotions WHERE id = ?;`, [candidate.resultEmotionId]);
        const resultEmotion = mapRows<EmotionModel>(resultEmotionRes.values)[0];

        const leftover = allSelectedEmotionIds.filter(id => !componentIds.includes(id));

        return {
          combinationId: candidate.combinationId,
          resultEmotion: {
            ...resultEmotion,
            isBase: false,
            isCustom: false,
          },
          colorHex: candidate.colorHex,
          consumedEmotionIds: componentIds,
          leftoverEmotionIds: leftover,
        };
      }
    }

    return null;
  }
}