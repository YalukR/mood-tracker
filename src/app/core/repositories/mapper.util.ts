/** Convierte una fila cruda de SQLite (snake_case) a un objeto camelCase tipado */
export function mapRow<T>(row: Record<string, unknown>): T {
  const result: Record<string, unknown> = {};

  for (const key in row) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = row[key];
  }

  return result as T;
}

/** Convierte un arreglo completo de filas crudas */
export function mapRows<T>(rows: Record<string, unknown>[] | undefined): T[] {
  return (rows ?? []).map(row => mapRow<T>(row));
}

/** SQLite no tiene BOOLEAN nativo — normaliza 0/1 a boolean real */
export function toBoolean(value: unknown): boolean {
  return value === 1 || value === true;
}