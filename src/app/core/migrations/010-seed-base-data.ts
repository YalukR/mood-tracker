import { Migration } from './migration.interface';

export const migration010SeedBaseData: Migration = {
  version: 10,
  name: 'seed_base_data',
  statements: [
    // Usuario local único
    `INSERT INTO users (id) VALUES (1);`,

    // Las 5 emociones base
    `INSERT INTO emotions (name, description, is_base, is_custom) VALUES
      ('Alegría', 'Sentir bienestar, satisfacción o placer ante algo.', 1, 0),
      ('Tristeza', 'Sentir pena, desánimo o pérdida.', 1, 0),
      ('Miedo', 'Sentir temor o alerta ante una amenaza percibida.', 1, 0),
      ('Enojo', 'Sentir molestia, frustración o indignación.', 1, 0),
      ('Desagrado', 'Sentir rechazo o aversión hacia algo.', 1, 0);`,
  ],
};