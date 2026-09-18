import type { SQLiteDatabase } from "expo-sqlite";

import type { TrabajoLocal } from "./types";
import { syncOperations, uploadEvidence, type SyncOperation } from "@/src/api/entities";

const TRABAJO_COLUMNS = `
  id,
  tecnico_id,
  cliente,
  direccion,
  descripcion,
  hora_programada,
  llegada_at,
  hora_salida,
  observaciones,
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

export async function getEvidencias(database: SQLiteDatabase, trabajoId: string) {
  return database.getAllAsync<{
    tipo: "FOTO_ANTES" | "FOTO_DESPUES";
    storage_path: string | null;
  }>(
    `SELECT tipo, storage_path FROM evidencias
     WHERE trabajo_id = ? AND tipo IN ('FOTO_ANTES', 'FOTO_DESPUES')
     ORDER BY created_at`,
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
        llegada_at, hora_salida, observaciones, estado, sync, reporte, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      trabajo.hora_salida ?? null,
      trabajo.observaciones ?? "",
      trabajo.estado,
      trabajo.sync,
      trabajo.reporte,
      trabajo.created_at,
      trabajo.updated_at,
    );
  }
}

export async function guardarNota(database: SQLiteDatabase, trabajoId: string, contenido: string) {
  const now = new Date().toISOString();
  const evidenciaId = `NOTA-${Date.now()}`;
  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `INSERT INTO evidencias (id, trabajo_id, tipo, contenido, captured_at, created_at)
       VALUES (?, ?, 'NOTA', ?, ?, ?)`, evidenciaId, trabajoId, contenido, now, now,
    );
    await database.runAsync(
      `UPDATE trabajos SET sync = 'EN_COLA', updated_at = ? WHERE id = ?`, now, trabajoId,
    );
    await database.runAsync(
      `INSERT INTO sync_queue (entity, entity_id, operation, payload, created_at)
       VALUES ('evidencias', ?, 'INSERT', ?, ?)`, evidenciaId,
      JSON.stringify({ trabajo_id: trabajoId, tipo: "NOTA", contenido }), now,
    );
  });
}

export async function guardarFirma(database: SQLiteDatabase, trabajoId: string, trazos: string) {
  const now = new Date().toISOString();
  const evidenciaId = `FIRMA-${Date.now()}`;
  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `INSERT INTO evidencias (id, trabajo_id, tipo, contenido, captured_at, created_at)
       VALUES (?, ?, 'FIRMA', ?, ?, ?)`, evidenciaId, trabajoId, trazos, now, now,
    );
    await database.runAsync(
      `UPDATE trabajos SET sync = 'EN_COLA', updated_at = ? WHERE id = ?`, now, trabajoId,
    );
    await database.runAsync(
      `INSERT INTO sync_queue (entity, entity_id, operation, payload, created_at)
       VALUES ('evidencias', ?, 'INSERT', ?, ?)`, evidenciaId,
      JSON.stringify({ trabajo_id: trabajoId, tipo: "FIRMA", contenido: trazos }), now,
    );
  });
}

export async function finalizarTrabajo(database: SQLiteDatabase, tecnicoId: string, trabajoId: string) {
  const now = new Date().toISOString();
  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `UPDATE trabajos SET estado = 'COMPLETADO', sync = 'EN_COLA', hora_salida = ?, updated_at = ?
       WHERE id = ? AND tecnico_id = ?`, now, now, trabajoId, tecnicoId,
    );
    await database.runAsync(
      `INSERT INTO sync_queue (entity, entity_id, operation, payload, created_at)
       VALUES ('trabajos', ?, 'UPDATE', ?, ?)`, trabajoId,
      JSON.stringify({ estado: "COMPLETADO", hora_salida: now }), now,
    );
  });
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

export async function getPendingSync(database: SQLiteDatabase) {
  const rows = await database.getAllAsync<{
    id: number;
    entity: "trabajos" | "evidencias";
    entity_id: string;
    operation: "UPDATE" | "INSERT";
    payload: string;
  }>(
    `SELECT id, entity, entity_id, operation, payload
     FROM sync_queue ORDER BY created_at LIMIT 50`,
  );
  return rows.map((row): SyncOperation => ({ ...row, payload: JSON.parse(row.payload) }));
}

export async function processSyncQueue(database: SQLiteDatabase) {
  const pending = await getPendingSync(database);
  if (pending.length === 0) return 0;

  const prepared = [];
  for (const operation of pending) {
    if (
      operation.entity === "evidencias" &&
      typeof operation.payload.storage_path === "string" &&
      /^(file:|content:)/.test(operation.payload.storage_path)
    ) {
      const storagePath = await uploadEvidence(operation.payload.storage_path, operation.payload.tipo as "FOTO_ANTES" | "FOTO_DESPUES");
      prepared.push({ ...operation, payload: { ...operation.payload, storage_path: storagePath } });
    } else {
      prepared.push(operation);
    }
  }

  const { results } = await syncOperations(prepared);
  for (const result of results) {
    if (result.synced) {
      await database.runAsync("DELETE FROM sync_queue WHERE id = ?", result.id);
    }
  }
  for (const operation of prepared) {
    const trabajoId = operation.entity === "trabajos"
      ? operation.entity_id
      : (operation.payload as { trabajo_id?: unknown }).trabajo_id;
    if (typeof trabajoId === "string") {
      await database.runAsync(
        `UPDATE trabajos SET sync = 'SINCRONIZADO' WHERE id = ?`, trabajoId,
      );
    }
  }
  return results.length;
}
