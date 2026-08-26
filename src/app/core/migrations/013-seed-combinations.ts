import { Migration } from './migration.interface';

export const migration013SeedCombinations: Migration = {
  version: 13,
  name: 'seed_combinations',
  statements: [
    // ── Emociones resultado de combinaciones (is_base = 0, is_custom = 0) ──
    `INSERT INTO emotions (name, description, is_base, is_custom) VALUES
      ('Nostalgia', 'Alegría y tristeza mezcladas al recordar algo que ya pasó.', 0, 0),
      ('Emoción', 'Alegría con un toque de miedo, como antes de algo nuevo o riesgoso.', 0, 0),
      ('Triunfo', 'Alegría mezclada con enojo, como ganar tras una lucha difícil.', 0, 0),
      ('Regodeo', 'Alegría con desagrado, disfrutar algo con un dejo incómodo.', 0, 0),
      ('Desesperación', 'Tristeza y miedo juntos, sentir que la situación se sale de control.', 0, 0),
      ('Frustración', 'Tristeza y enojo combinados ante algo que no sale como se esperaba.', 0, 0),
      ('Decepción', 'Tristeza con desagrado, cuando algo o alguien no cumple lo esperado.', 0, 0),
      ('Pánico', 'Miedo y enojo juntos, una reacción defensiva intensa.', 0, 0),
      ('Horror', 'Miedo y desagrado combinados ante algo perturbador.', 0, 0),
      ('Desprecio', 'Enojo y desagrado juntos hacia algo o alguien.', 0, 0);`,

    // ── Nostalgia = Alegría + Tristeza ──
    `INSERT INTO combinations (result_emotion_id, color_hex, component_count)
      SELECT id, '#C99B6B', 2 FROM emotions WHERE name = 'Nostalgia';`,
    `INSERT INTO combination_components (combination_id, emotion_id)
      SELECT c.id, e.id FROM combinations c
      JOIN emotions re ON re.id = c.result_emotion_id
      JOIN emotions e ON e.name IN ('Alegría', 'Tristeza')
      WHERE re.name = 'Nostalgia';`,

    // ── Emoción = Alegría + Miedo ──
    `INSERT INTO combinations (result_emotion_id, color_hex, component_count)
      SELECT id, '#E8B84B', 2 FROM emotions WHERE name = 'Emoción';`,
    `INSERT INTO combination_components (combination_id, emotion_id)
      SELECT c.id, e.id FROM combinations c
      JOIN emotions re ON re.id = c.result_emotion_id
      JOIN emotions e ON e.name IN ('Alegría', 'Miedo')
      WHERE re.name = 'Emoción';`,

    // ── Triunfo = Alegría + Enojo ──
    `INSERT INTO combinations (result_emotion_id, color_hex, component_count)
      SELECT id, '#D97B4F', 2 FROM emotions WHERE name = 'Triunfo';`,
    `INSERT INTO combination_components (combination_id, emotion_id)
      SELECT c.id, e.id FROM combinations c
      JOIN emotions re ON re.id = c.result_emotion_id
      JOIN emotions e ON e.name IN ('Alegría', 'Enojo')
      WHERE re.name = 'Triunfo';`,

    // ── Regodeo = Alegría + Desagrado ──
    `INSERT INTO combinations (result_emotion_id, color_hex, component_count)
      SELECT id, '#9B8B5C', 2 FROM emotions WHERE name = 'Regodeo';`,
    `INSERT INTO combination_components (combination_id, emotion_id)
      SELECT c.id, e.id FROM combinations c
      JOIN emotions re ON re.id = c.result_emotion_id
      JOIN emotions e ON e.name IN ('Alegría', 'Desagrado')
      WHERE re.name = 'Regodeo';`,

    // ── Desesperación = Tristeza + Miedo ──
    `INSERT INTO combinations (result_emotion_id, color_hex, component_count)
      SELECT id, '#5B6B8C', 2 FROM emotions WHERE name = 'Desesperación';`,
    `INSERT INTO combination_components (combination_id, emotion_id)
      SELECT c.id, e.id FROM combinations c
      JOIN emotions re ON re.id = c.result_emotion_id
      JOIN emotions e ON e.name IN ('Tristeza', 'Miedo')
      WHERE re.name = 'Desesperación';`,

    // ── Frustración = Tristeza + Enojo ──
    `INSERT INTO combinations (result_emotion_id, color_hex, component_count)
      SELECT id, '#8C5B6B', 2 FROM emotions WHERE name = 'Frustración';`,
    `INSERT INTO combination_components (combination_id, emotion_id)
      SELECT c.id, e.id FROM combinations c
      JOIN emotions re ON re.id = c.result_emotion_id
      JOIN emotions e ON e.name IN ('Tristeza', 'Enojo')
      WHERE re.name = 'Frustración';`,

    // ── Decepción = Tristeza + Desagrado ──
    `INSERT INTO combinations (result_emotion_id, color_hex, component_count)
      SELECT id, '#6B7B8C', 2 FROM emotions WHERE name = 'Decepción';`,
    `INSERT INTO combination_components (combination_id, emotion_id)
      SELECT c.id, e.id FROM combinations c
      JOIN emotions re ON re.id = c.result_emotion_id
      JOIN emotions e ON e.name IN ('Tristeza', 'Desagrado')
      WHERE re.name = 'Decepción';`,

    // ── Pánico = Miedo + Enojo ──
    `INSERT INTO combinations (result_emotion_id, color_hex, component_count)
      SELECT id, '#7A3B3B', 2 FROM emotions WHERE name = 'Pánico';`,
    `INSERT INTO combination_components (combination_id, emotion_id)
      SELECT c.id, e.id FROM combinations c
      JOIN emotions re ON re.id = c.result_emotion_id
      JOIN emotions e ON e.name IN ('Miedo', 'Enojo')
      WHERE re.name = 'Pánico';`,

    // ── Horror = Miedo + Desagrado ──
    `INSERT INTO combinations (result_emotion_id, color_hex, component_count)
      SELECT id, '#4B4B5C', 2 FROM emotions WHERE name = 'Horror';`,
    `INSERT INTO combination_components (combination_id, emotion_id)
      SELECT c.id, e.id FROM combinations c
      JOIN emotions re ON re.id = c.result_emotion_id
      JOIN emotions e ON e.name IN ('Miedo', 'Desagrado')
      WHERE re.name = 'Horror';`,

    // ── Desprecio = Enojo + Desagrado ──
    `INSERT INTO combinations (result_emotion_id, color_hex, component_count)
      SELECT id, '#6B4B3B', 2 FROM emotions WHERE name = 'Desprecio';`,
    `INSERT INTO combination_components (combination_id, emotion_id)
      SELECT c.id, e.id FROM combinations c
      JOIN emotions re ON re.id = c.result_emotion_id
      JOIN emotions e ON e.name IN ('Enojo', 'Desagrado')
      WHERE re.name = 'Desprecio';`,
  ],
};