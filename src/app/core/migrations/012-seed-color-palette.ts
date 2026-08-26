import { Migration } from './migration.interface';

export const migration012SeedColorPalette: Migration = {
  version: 12,
  name: 'seed_color_palette',
  statements: [
    `INSERT INTO color_palette (hex, label, sort_order) VALUES
      ('#8b7ec8', 'Lavanda', 1),
      ('#ec8f6e', 'Coral', 2),
      ('#c96450', 'Terracota', 3),
      ('#d99aa7', 'Rosa polvo', 4),
      ('#9c6b98', 'Ciruela', 5),
      ('#7fa8c9', 'Azul cielo', 6),
      ('#8faf8a', 'Verde salvia', 7),
      ('#7ec9ab', 'Verde menta', 8),
      ('#d1a54e', 'Mostaza', 9),
      ('#e0a458', 'Ámbar', 10),
      ('#b8623f', 'Óxido', 11),
      ('#8c4a5c', 'Vino', 12),
      ('#5c6ba8', 'Índigo', 13),
      ('#5fa8a3', 'Turquesa', 14),
      ('#9c9a5e', 'Oliva', 15),
      ('#c9ab7e', 'Arena', 16),
      ('#6d4c6b', 'Ciruela oscuro', 17),
      ('#d9724f', 'Coral oscuro', 18),
      ('#6f8299', 'Azul grisáceo', 19),
      ('#b98a9e', 'Rosa mauve', 20);`,
  ],
};