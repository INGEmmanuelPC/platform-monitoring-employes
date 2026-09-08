import type { SQLiteDatabase } from "expo-sqlite";

export async function initializeDatabase(database: SQLiteDatabase) {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS trabajos (
      id TEXT PRIMARY KEY NOT NULL,
      tecnico_id TEXT NOT NULL,
      cliente TEXT NOT NULL,
      direccion TEXT NOT NULL DEFAULT '',
      descripcion TEXT NOT NULL DEFAULT '',
      hora_programada TEXT,
      llegada_at TEXT,
      estado TEXT NOT NULL DEFAULT 'ASIGNADO',
      sync TEXT NOT NULL DEFAULT 'SOLO_LOCAL',
      reporte TEXT NOT NULL DEFAULT 'SIN_AUDIO',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS evidencias (
      id TEXT PRIMARY KEY NOT NULL,
      trabajo_id TEXT NOT NULL REFERENCES trabajos(id) ON DELETE CASCADE,
      tipo TEXT NOT NULL,
      storage_path TEXT,
      contenido TEXT,
      captured_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS trabajos_tecnico_idx ON trabajos(tecnico_id);
    CREATE INDEX IF NOT EXISTS trabajos_estado_idx ON trabajos(estado);
    CREATE INDEX IF NOT EXISTS evidencias_trabajo_idx ON evidencias(trabajo_id);
    CREATE INDEX IF NOT EXISTS sync_queue_created_idx ON sync_queue(created_at);
  `);

  try {
    await database.execAsync("ALTER TABLE trabajos ADD COLUMN llegada_at TEXT");
  } catch {
    // La columna ya existe en bases inicializadas anteriormente.
  }
}
