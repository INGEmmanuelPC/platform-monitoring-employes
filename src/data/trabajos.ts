import type { SQLiteDatabase } from "expo-sqlite";

import type { TrabajoLocal } from "./types";

const TRABAJO_COLUMNS = `
  id,
  tecnico_id,
  cliente,
  direccion,
  descripcion,
  hora_programada,
  llegada_at,
  estado,
  sync,
  reporte,
  created_at,
  updated_at
`;

export async function getTrabajos(database: SQLiteDatabase, tecnicoId: string) {
  return database.getAllAsync<TrabajoLocal>(
    `SELECT ${TRABAJO_COLUMNS}
     FROM trabajos
     WHERE tecnico_id = ?
     ORDER BY hora_programada IS NULL, hora_programada, created_at`,
    tecnicoId,
  );
}

export async function getTrabajo(
  database: SQLiteDatabase,
  tecnicoId: string,
  trabajoId: string,
) {
  return database.getFirstAsync<TrabajoLocal>(
    `SELECT ${TRABAJO_COLUMNS}
     FROM trabajos
     WHERE tecnico_id = ? AND id = ?`,
    tecnicoId,
    trabajoId,
  );
}

export async function upsertTrabajos(
  database: SQLiteDatabase,
  trabajos: TrabajoLocal[],
) {
  for (const trabajo of trabajos) {
    await database.runAsync(
      `INSERT INTO trabajos (
        id, tecnico_id, cliente, direccion, descripcion, hora_programada,
        llegada_at, estado, sync, reporte, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        cliente = excluded.cliente,
        direccion = excluded.direccion,
        descripcion = excluded.descripcion,
        hora_programada = excluded.hora_programada,
        estado = excluded.estado,
        reporte = excluded.reporte,
        updated_at = excluded.updated_at`,
      trabajo.id,
      trabajo.tecnico_id,
      trabajo.cliente,
      trabajo.direccion,
      trabajo.descripcion,
      trabajo.hora_programada,
      trabajo.llegada_at ?? null,
      trabajo.estado,
      trabajo.sync,
      trabajo.reporte,
      trabajo.created_at,
      trabajo.updated_at,
    );
  }
}

export async function marcarLlegada(
  database: SQLiteDatabase,
  tecnicoId: string,
  trabajoId: string,
) {
  const llegadaAt = new Date().toISOString();

  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `UPDATE trabajos
       SET estado = 'EN_SITIO', sync = 'EN_COLA', llegada_at = ?, updated_at = ?
       WHERE id = ? AND tecnico_id = ?`,
      llegadaAt,
      llegadaAt,
      trabajoId,
      tecnicoId,
    );
    await database.runAsync(
      `INSERT INTO sync_queue (entity, entity_id, operation, payload, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      "trabajos",
      trabajoId,
      "UPDATE",
      JSON.stringify({ estado: "EN_SITIO", llegada_at: llegadaAt }),
      llegadaAt,
    );
  });
}

export async function guardarEvidencia(
  database: SQLiteDatabase,
  trabajoId: string,
  tipo: "FOTO_ANTES" | "FOTO_DESPUES",
  storagePath: string,
) {
  const now = new Date().toISOString();
  const evidenciaId = `${tipo}-${Date.now()}`;

  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `INSERT INTO evidencias (
        id, trabajo_id, tipo, storage_path, captured_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      evidenciaId,
      trabajoId,
      tipo,
      storagePath,
      now,
      now,
    );
    await database.runAsync(
      `UPDATE trabajos SET sync = 'EN_COLA', updated_at = ? WHERE id = ?`,
      now,
      trabajoId,
    );
    await database.runAsync(
      `INSERT INTO sync_queue (entity, entity_id, operation, payload, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      "evidencias",
      evidenciaId,
      "INSERT",
      JSON.stringify({ trabajo_id: trabajoId, tipo, storage_path: storagePath }),
      now,
    );
  });
}
