import { Migration } from './migration.interface';

export const migration009CreateIndexes: Migration = {
  version: 9,
  name: 'create_indexes',
  statements: [
    // Estadísticas por rango de fecha — la consulta más frecuente de toda la app
    `CREATE INDEX IF NOT EXISTS idx_mood_entries_local_date ON mood_entries(local_date);`,

    // Filtrar registros por usuario (relevante ya cuando exista multi-usuario)
    `CREATE INDEX IF NOT EXISTS idx_mood_entries_user_id ON mood_entries(user_id);`,

    // Contar frecuencia por emoción — el corazón de "predominancia"
    `CREATE INDEX IF NOT EXISTS idx_mood_entry_emotions_emotion_id ON mood_entry_emotions(emotion_id);`,

    // Buscar coincidencias de combinación por emoción componente
    `CREATE INDEX IF NOT EXISTS idx_combination_components_emotion_id ON combination_components(emotion_id);`,
  ],
};