import type { SQLiteDatabase } from "expo-sqlite";

import type { TrabajoLocal } from "./types";
import { syncOperations, uploadEvidence, type SyncOperation } from "@/src/api/entities";
import { transicionarTrabajo } from "@/src/domain/estadoTrabajo";

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
    tipo: "FOTO_ANTES" | "FOTO_DESPUES" | "NOTA" | "FIRMA";
    storage_path: string | null;
  }>(
    `SELECT tipo, storage_path FROM evidencias
     WHERE trabajo_id = ? AND tipo IN ('FOTO_ANTES', 'FOTO_DESPUES', 'NOTA', 'FIRMA')
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
        estado = CASE
          WHEN trabajos.sync IN ('SOLO_LOCAL', 'EN_COLA', 'CONFLICTO') THEN trabajos.estado
          ELSE excluded.estado
        END,
        reporte = excluded.reporte,
        updated_at = CASE
          WHEN trabajos.sync IN ('SOLO_LOCAL', 'EN_COLA', 'CONFLICTO') THEN trabajos.updated_at
          ELSE excluded.updated_at
        END`,
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
    const trabajo = await database.getFirstAsync<Pick<TrabajoLocal, "estado">>(
      "SELECT estado FROM trabajos WHERE id = ? AND tecnico_id = ?",
      trabajoId,
      tecnicoId,
    );
    if (!trabajo) throw new Error("No se encontró el trabajo de este técnico.");

    const evidencias = await database.getFirstAsync<{ tieneFirma: number; tieneFoto: number }>(
      `SELECT
         EXISTS(SELECT 1 FROM evidencias WHERE trabajo_id = ? AND tipo = 'FIRMA') AS tieneFirma,
         EXISTS(SELECT 1 FROM evidencias WHERE trabajo_id = ? AND tipo IN ('FOTO_ANTES', 'FOTO_DESPUES')) AS tieneFoto`,
      trabajoId,
      trabajoId,
    );
    const nuevoEstado = transicionarTrabajo(trabajo.estado, "completar", {
      tieneFirma: Boolean(evidencias?.tieneFirma),
      tieneFoto: Boolean(evidencias?.tieneFoto),
    });
    const updated = await database.runAsync(
      `UPDATE trabajos SET estado = ?, sync = 'EN_COLA', hora_salida = ?, updated_at = ?
       WHERE id = ? AND tecnico_id = ? AND estado = ?`,
      nuevoEstado,
      now,
      now,
      trabajoId,
      tecnicoId,
      trabajo.estado,
    );
    if (updated.changes !== 1) throw new Error("El trabajo cambió de estado. Vuelve a abrirlo e inténtalo de nuevo.");
    await database.runAsync(
      `INSERT INTO sync_queue (entity, entity_id, operation, payload, created_at)
       VALUES ('trabajos', ?, 'UPDATE', ?, ?)`, trabajoId,
      JSON.stringify({ estado: nuevoEstado, hora_salida: now }), now,
    );
  });
}

export async function marcarEnCamino(
  database: SQLiteDatabase,
  tecnicoId: string,
  trabajoId: string,
) {
  const now = new Date().toISOString();
  await database.withTransactionAsync(async () => {
    const trabajo = await database.getFirstAsync<Pick<TrabajoLocal, "estado">>(
      "SELECT estado FROM trabajos WHERE id = ? AND tecnico_id = ?",
      trabajoId,
      tecnicoId,
    );
    if (!trabajo) throw new Error("No se encontró el trabajo de este técnico.");

    const nuevoEstado = transicionarTrabajo(trabajo.estado, "marcarEnCamino");
    const updated = await database.runAsync(
      `UPDATE trabajos SET estado = ?, sync = 'EN_COLA', updated_at = ?
       WHERE id = ? AND tecnico_id = ? AND estado = ?`,
      nuevoEstado,
      now,
      trabajoId,
      tecnicoId,
      trabajo.estado,
    );
    if (updated.changes !== 1) throw new Error("El trabajo cambió de estado. Vuelve a abrirlo e inténtalo de nuevo.");
    await database.runAsync(
      `INSERT INTO sync_queue (entity, entity_id, operation, payload, created_at)
       VALUES ('trabajos', ?, 'UPDATE', ?, ?)`,
      trabajoId,
      JSON.stringify({ estado: nuevoEstado }),
      now,
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
    const trabajo = await database.getFirstAsync<Pick<TrabajoLocal, "estado">>(
      "SELECT estado FROM trabajos WHERE id = ? AND tecnico_id = ?",
      trabajoId,
      tecnicoId,
    );
    if (!trabajo) throw new Error("No se encontró el trabajo de este técnico.");

    const nuevoEstado = transicionarTrabajo(trabajo.estado, "marcarLlegada");
    const updated = await database.runAsync(
      `UPDATE trabajos
       SET estado = ?, sync = 'EN_COLA', llegada_at = ?, updated_at = ?
       WHERE id = ? AND tecnico_id = ? AND estado = ?`,
      nuevoEstado,
      llegadaAt,
      llegadaAt,
      trabajoId,
      tecnicoId,
      trabajo.estado,
    );
    if (updated.changes !== 1) throw new Error("El trabajo cambió de estado. Vuelve a abrirlo e inténtalo de nuevo.");
    await database.runAsync(
      `INSERT INTO sync_queue (entity, entity_id, operation, payload, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      "trabajos",
      trabajoId,
      "UPDATE",
      JSON.stringify({ estado: nuevoEstado, llegada_at: llegadaAt }),
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
  const affectedWorkIds = new Set<string>();
  for (const result of results) {
    if (result.synced) {
      await database.runAsync("DELETE FROM sync_queue WHERE id = ?", result.id);
      const operation = prepared.find((item) => item.id === result.id);
      const trabajoId = operation?.entity === "trabajos"
        ? operation.entity_id
        : (operation?.payload as { trabajo_id?: unknown } | undefined)?.trabajo_id;
      if (typeof trabajoId === "string") affectedWorkIds.add(trabajoId);
    }
  }

  for (const trabajoId of affectedWorkIds) {
    const queued = await database.getAllAsync<{
      entity: "trabajos" | "evidencias";
      entity_id: string;
      payload: string;
    }>("SELECT entity, entity_id, payload FROM sync_queue");
    const stillPending = queued.some((operation) => {
      if (operation.entity === "trabajos") return operation.entity_id === trabajoId;
      try {
        return JSON.parse(operation.payload).trabajo_id === trabajoId;
      } catch {
        return false;
      }
    });
    if (!stillPending) {
      await database.runAsync(
        "UPDATE trabajos SET sync = 'SINCRONIZADO' WHERE id = ?",
        trabajoId,
      );
    }
  }
  return results.length;
}
