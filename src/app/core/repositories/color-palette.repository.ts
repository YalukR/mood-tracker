import { Injectable, inject } from '@angular/core';
import { SqliteService } from '../services/sqlite.service';
import { ColorPaletteModel } from '../models';
import { mapRows } from './mapper.util';

@Injectable({ providedIn: 'root' })
export class ColorPaletteRepository {
  private sqlite = inject(SqliteService);

  async getAll(): Promise<ColorPaletteModel[]> {
    const db = this.sqlite.getDb();
    const res = await db.query(`SELECT * FROM color_palette ORDER BY sort_order ASC;`);
    return mapRows<ColorPaletteModel>(res.values);
  }
}