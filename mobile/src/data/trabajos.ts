import type { SQLiteDatabase } from "expo-sqlite";

import type { TrabajoLocal } from "./types";
import { syncOperations, uploadEvidence, type SyncOperation } from "@/src/api/entities";
import { ApiRequestError } from "@/src/api/http";
import { firmaSvgTieneTrazo, transicionarTrabajo } from "@/src/domain/estadoTrabajo";
import {
  buildTrabajosListQuery,
  buildTrabajoScopeFilter,
  buildSyncQueueActorFilter,
  TRABAJO_COLUMNS,
  type TrabajoListRole,
  uniquePendingTrabajoMissingFromSnapshot,
} from "./trabajos-query";

export async function getTrabajos(
  database: SQLiteDatabase,
  userId: string,
  role: TrabajoListRole = "tecnico",
) {
  const { sql } = buildTrabajosListQuery(role);
  return role === "admin"
    ? database.getAllAsync<TrabajoLocal>(sql)
    : database.getAllAsync<TrabajoLocal>(sql, userId);
}

export async function getTrabajo(
  database: SQLiteDatabase,
  actorId: string,
  trabajoId: string,
  role: TrabajoListRole = "tecnico",
) {
  const ownership = buildTrabajoScopeFilter(role);
  const values = role === "admin" ? [trabajoId] : [actorId, trabajoId];
  return database.getFirstAsync<TrabajoLocal>(
    `SELECT ${TRABAJO_COLUMNS}
     FROM trabajos
     WHERE ${ownership}`,
    ...values,
  );
}

function workPredicate(role: TrabajoListRole) {
  return role === "admin" ? "id = ?" : "id = ? AND tecnico_id = ?";
}

function workBindings(actorId: string, trabajoId: string, role: TrabajoListRole) {
  return role === "admin" ? [trabajoId] : [trabajoId, actorId];
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
        llegada_at, hora_salida, observaciones, motivo_cancelacion, estado, sync, reporte, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        tecnico_id = excluded.tecnico_id,
        cliente = excluded.cliente,
        direccion = excluded.direccion,
        descripcion = excluded.descripcion,
        hora_programada = excluded.hora_programada,
        motivo_cancelacion = CASE
          WHEN trabajos.sync IN ('SOLO_LOCAL', 'EN_COLA', 'CONFLICTO') THEN trabajos.motivo_cancelacion
          ELSE excluded.motivo_cancelacion
        END,
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
      trabajo.motivo_cancelacion ?? null,
      trabajo.estado,
      trabajo.sync,
      trabajo.reporte,
      trabajo.created_at,
      trabajo.updated_at,
    );
  }
}

export async function refreshTrabajosFromServer(
  database: SQLiteDatabase,
  trabajos: TrabajoLocal[],
  userId: string,
  role: TrabajoListRole,
) {
  await database.withTransactionAsync(async () => {
    await upsertTrabajos(database, trabajos);

    const remoteIds = new Set(trabajos.map((trabajo) => trabajo.id));

    // Administración obtiene la lista completa permitida por RLS. Si una
    // orden pendiente local ya fue eliminada del servidor, elimina solo esa
    // copia y sus operaciones locales para que no vuelva a aparecer.
    if (role === "admin") {
      const cachedPending = await database.getAllAsync<{ id: string; sync: string }>(
        "SELECT id, sync FROM trabajos WHERE sync IN ('SOLO_LOCAL', 'EN_COLA')",
      );
      const removedId = uniquePendingTrabajoMissingFromSnapshot(cachedPending, remoteIds);
      // No adivinar entre varios pendientes: solo limpiar automáticamente si
      // el snapshot identifica un único trabajo local ya eliminado.
      if (!removedId) return;
      const evidenceRows = await database.getAllAsync<{ id: string }>(
        "SELECT id FROM evidencias WHERE trabajo_id = ?",
        removedId,
      );
      const evidenceIds = new Set(evidenceRows.map((evidence) => evidence.id));
      const queued = await database.getAllAsync<{
        id: number;
        entity: "trabajos" | "evidencias";
        entity_id: string;
        payload: string;
      }>("SELECT id, entity, entity_id, payload FROM sync_queue");

      for (const operation of queued) {
        const belongsToRemovedTrabajo = operation.entity === "trabajos"
          ? operation.entity_id === removedId
          : evidenceIds.has(operation.entity_id) || (() => {
              try {
                return JSON.parse(operation.payload).trabajo_id === removedId;
              } catch {
                return false;
              }
            })();
        if (belongsToRemovedTrabajo) {
          await database.runAsync("DELETE FROM sync_queue WHERE id = ?", operation.id);
        }
      }
      await database.runAsync("DELETE FROM evidencias WHERE trabajo_id = ?", removedId);
      await database.runAsync("DELETE FROM trabajos WHERE id = ?", removedId);
      return;
    }

    // Si una orden se reasignó o dejó de estar disponible, el técnico anterior
    // no debe seguir viéndola desde una copia SQLite obsoleta. Las operaciones
    // offline pendientes y sus evidencias se conservan para no perder trabajo.
    if (role !== "tecnico") return;
    const queued = await database.getAllAsync<{
      entity: "trabajos" | "evidencias";
      entity_id: string;
      payload: string;
    }>("SELECT entity, entity_id, payload FROM sync_queue");
    const pendingWorkIds = new Set<string>();
    for (const operation of queued) {
      if (operation.entity === "trabajos") {
        pendingWorkIds.add(operation.entity_id);
        continue;
      }
      try {
        const trabajoId = JSON.parse(operation.payload).trabajo_id;
        if (typeof trabajoId === "string") pendingWorkIds.add(trabajoId);
      } catch {
        // Una operación inválida queda en la cola para diagnóstico; no se borra
        // ningún trabajo local que pudiera estar relacionado.
      }
    }

    const cached = await database.getAllAsync<{ id: string }>(
      `SELECT id FROM trabajos
       WHERE tecnico_id = ? AND sync NOT IN ('SOLO_LOCAL', 'EN_COLA', 'CONFLICTO')`,
      userId,
    );
    for (const trabajo of cached) {
      if (remoteIds.has(trabajo.id) || pendingWorkIds.has(trabajo.id)) continue;
      await database.runAsync("DELETE FROM trabajos WHERE id = ? AND tecnico_id = ?", trabajo.id, userId);
    }
  });
}

export async function guardarNota(
  database: SQLiteDatabase,
  trabajoId: string,
  contenido: string,
  actorId: string,
  role: TrabajoListRole = "tecnico",
) {
  const now = new Date().toISOString();
  const evidenciaId = `NOTA-${Date.now()}`;
  await database.withTransactionAsync(async () => {
    const trabajo = await database.getFirstAsync<{ id: string }>(
      `SELECT id FROM trabajos WHERE ${workPredicate(role)}`,
      ...workBindings(actorId, trabajoId, role),
    );
    if (!trabajo) throw new Error("No se encontró el trabajo disponible para esta cuenta.");
    await database.runAsync(
      `INSERT INTO evidencias (id, trabajo_id, tipo, contenido, captured_at, created_at)
       VALUES (?, ?, 'NOTA', ?, ?, ?)`, evidenciaId, trabajoId, contenido, now, now,
    );
    await database.runAsync(
      `UPDATE trabajos SET sync = 'EN_COLA', updated_at = ? WHERE id = ?`, now, trabajoId,
    );
    await database.runAsync(
      `INSERT INTO sync_queue (entity, entity_id, operation, payload, actor_id, created_at)
       VALUES ('evidencias', ?, 'INSERT', ?, ?, ?)`, evidenciaId,
      JSON.stringify({ trabajo_id: trabajoId, tipo: "NOTA", contenido }), actorId, now,
    );
  });
}

export async function finalizarTrabajo(
  database: SQLiteDatabase,
  actorId: string,
  trabajoId: string,
  firmaSvg: string,
  role: TrabajoListRole = "tecnico",
) {
  const now = new Date().toISOString();
  const evidenciaId = `FIRMA-${Date.now()}`;
  await database.withTransactionAsync(async () => {
    const trabajo = await database.getFirstAsync<Pick<TrabajoLocal, "estado">>(
      `SELECT estado FROM trabajos WHERE ${workPredicate(role)}`,
      ...workBindings(actorId, trabajoId, role),
    );
    if (!trabajo) throw new Error("No se encontró el trabajo de este técnico.");

    const evidencias = await database.getFirstAsync<{ firma: string | null; tieneFoto: number }>(
      `SELECT
         (SELECT contenido FROM evidencias WHERE trabajo_id = ? AND tipo = 'FIRMA' ORDER BY created_at DESC LIMIT 1) AS firma,
         EXISTS(SELECT 1 FROM evidencias WHERE trabajo_id = ? AND tipo IN ('FOTO_ANTES', 'FOTO_DESPUES')) AS tieneFoto`,
      trabajoId,
      trabajoId,
    );
    const nuevoEstado = transicionarTrabajo(trabajo.estado, "completar", {
      tieneFirma: firmaSvgTieneTrazo(firmaSvg) || firmaSvgTieneTrazo(evidencias?.firma),
      tieneFoto: Boolean(evidencias?.tieneFoto),
    });
    if (firmaSvg.trim()) {
      await database.runAsync(
        `INSERT INTO evidencias (id, trabajo_id, tipo, contenido, captured_at, created_at)
         VALUES (?, ?, 'FIRMA', ?, ?, ?)`,
        evidenciaId,
        trabajoId,
        firmaSvg,
        now,
        now,
      );
      await database.runAsync(
        `INSERT INTO sync_queue (entity, entity_id, operation, payload, actor_id, created_at)
         VALUES ('evidencias', ?, 'INSERT', ?, ?, ?)`,
        evidenciaId,
        JSON.stringify({ trabajo_id: trabajoId, tipo: "FIRMA", contenido: firmaSvg }),
        actorId,
        now,
      );
    }
    const updated = await database.runAsync(
      `UPDATE trabajos SET estado = ?, sync = 'EN_COLA', hora_salida = ?, updated_at = ?
       WHERE ${workPredicate(role)} AND estado = ?`,
      nuevoEstado,
      now,
      now,
      ...workBindings(actorId, trabajoId, role),
      trabajo.estado,
    );
    if (updated.changes !== 1) throw new Error("El trabajo cambió de estado. Vuelve a abrirlo e inténtalo de nuevo.");
    await database.runAsync(
      `INSERT INTO sync_queue (entity, entity_id, operation, payload, actor_id, created_at)
       VALUES ('trabajos', ?, 'UPDATE', ?, ?, ?)`, trabajoId,
      JSON.stringify({ estado: nuevoEstado, hora_salida: now }), actorId, now,
    );
  });
}

export async function marcarEnCamino(
  database: SQLiteDatabase,
  actorId: string,
  trabajoId: string,
  role: TrabajoListRole = "tecnico",
) {
  const now = new Date().toISOString();
  await database.withTransactionAsync(async () => {
    const trabajo = await database.getFirstAsync<Pick<TrabajoLocal, "estado">>(
      `SELECT estado FROM trabajos WHERE ${workPredicate(role)}`,
      ...workBindings(actorId, trabajoId, role),
    );
    if (!trabajo) throw new Error("No se encontró el trabajo de este técnico.");

    const nuevoEstado = transicionarTrabajo(trabajo.estado, "marcarEnCamino");
    const updated = await database.runAsync(
      `UPDATE trabajos SET estado = ?, sync = 'EN_COLA', updated_at = ?
       WHERE ${workPredicate(role)} AND estado = ?`,
      nuevoEstado,
      now,
      ...workBindings(actorId, trabajoId, role),
      trabajo.estado,
    );
    if (updated.changes !== 1) throw new Error("El trabajo cambió de estado. Vuelve a abrirlo e inténtalo de nuevo.");
    await database.runAsync(
      `INSERT INTO sync_queue (entity, entity_id, operation, payload, actor_id, created_at)
       VALUES ('trabajos', ?, 'UPDATE', ?, ?, ?)`,
      trabajoId,
      JSON.stringify({ estado: nuevoEstado }),
      actorId,
      now,
    );
  });
}

export async function marcarLlegada(
  database: SQLiteDatabase,
  actorId: string,
  trabajoId: string,
  role: TrabajoListRole = "tecnico",
) {
  const llegadaAt = new Date().toISOString();

  await database.withTransactionAsync(async () => {
    const trabajo = await database.getFirstAsync<Pick<TrabajoLocal, "estado">>(
      `SELECT estado FROM trabajos WHERE ${workPredicate(role)}`,
      ...workBindings(actorId, trabajoId, role),
    );
    if (!trabajo) throw new Error("No se encontró el trabajo de este técnico.");

    const nuevoEstado = transicionarTrabajo(trabajo.estado, "marcarLlegada");
    const updated = await database.runAsync(
      `UPDATE trabajos
       SET estado = ?, sync = 'EN_COLA', llegada_at = ?, updated_at = ?
       WHERE ${workPredicate(role)} AND estado = ?`,
      nuevoEstado,
      llegadaAt,
      llegadaAt,
      ...workBindings(actorId, trabajoId, role),
      trabajo.estado,
    );
    if (updated.changes !== 1) throw new Error("El trabajo cambió de estado. Vuelve a abrirlo e inténtalo de nuevo.");
    await database.runAsync(
      `INSERT INTO sync_queue (entity, entity_id, operation, payload, actor_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      "trabajos",
      trabajoId,
      "UPDATE",
      JSON.stringify({ estado: nuevoEstado, llegada_at: llegadaAt }),
      actorId,
      llegadaAt,
    );
  });
}

export async function cancelarTrabajo(
  database: SQLiteDatabase,
  actorId: string,
  trabajoId: string,
  motivoCancelacion: string,
  role: TrabajoListRole = "tecnico",
) {
  const motivo = motivoCancelacion.trim();
  const now = new Date().toISOString();
  await database.withTransactionAsync(async () => {
    const trabajo = await database.getFirstAsync<Pick<TrabajoLocal, "estado">>(
      `SELECT estado FROM trabajos WHERE ${workPredicate(role)}`,
      ...workBindings(actorId, trabajoId, role),
    );
    if (!trabajo) throw new Error("No se encontró el trabajo de este técnico.");

    const nuevoEstado = transicionarTrabajo(trabajo.estado, "cancelar", { motivoCancelacion: motivo });
    const updated = await database.runAsync(
      `UPDATE trabajos SET estado = ?, motivo_cancelacion = ?, sync = 'EN_COLA', updated_at = ?
       WHERE ${workPredicate(role)} AND estado = ?`,
      nuevoEstado,
      motivo,
      now,
      ...workBindings(actorId, trabajoId, role),
      trabajo.estado,
    );
    if (updated.changes !== 1) throw new Error("El trabajo cambió de estado. Vuelve a abrirlo e inténtalo de nuevo.");
    await database.runAsync(
      `INSERT INTO sync_queue (entity, entity_id, operation, payload, actor_id, created_at)
       VALUES ('trabajos', ?, 'UPDATE', ?, ?, ?)`,
      trabajoId,
      JSON.stringify({ estado: nuevoEstado, motivo_cancelacion: motivo }),
      actorId,
      now,
    );
  });
}

export async function guardarEvidencia(
  database: SQLiteDatabase,
  trabajoId: string,
  tipo: "FOTO_ANTES" | "FOTO_DESPUES",
  storagePath: string,
  actorId: string,
  role: TrabajoListRole = "tecnico",
) {
  const now = new Date().toISOString();
  const evidenciaId = `${tipo}-${Date.now()}`;

  await database.withTransactionAsync(async () => {
    const trabajo = await database.getFirstAsync<{ id: string }>(
      `SELECT id FROM trabajos WHERE ${workPredicate(role)}`,
      ...workBindings(actorId, trabajoId, role),
    );
    if (!trabajo) throw new Error("No se encontró el trabajo disponible para esta cuenta.");
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
      `UPDATE trabajos SET sync = 'EN_COLA', updated_at = ? WHERE ${workPredicate(role)}`,
      now,
      ...workBindings(actorId, trabajoId, role),
    );
    await database.runAsync(
      `INSERT INTO sync_queue (entity, entity_id, operation, payload, actor_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      "evidencias",
      evidenciaId,
      "INSERT",
      JSON.stringify({ trabajo_id: trabajoId, tipo, storage_path: storagePath }),
      actorId,
      now,
    );
  });
}

export async function getPendingSync(database: SQLiteDatabase, actorId: string, role: TrabajoListRole) {
  const rows = await database.getAllAsync<{
    id: number;
    entity: "trabajos" | "evidencias";
    entity_id: string;
    operation: "UPDATE" | "INSERT";
    payload: string;
  }>(
    `SELECT id, entity, entity_id, operation, payload
     FROM sync_queue
     WHERE ${buildSyncQueueActorFilter(role)}
     ORDER BY created_at, id LIMIT 50`,
    actorId,
  );
  return rows.map((row): SyncOperation => ({ ...row, payload: JSON.parse(row.payload) }));
}

export async function processSyncQueue(database: SQLiteDatabase, actorId: string, role: TrabajoListRole) {
  const pending = await getPendingSync(database, actorId, role);
  if (pending.length === 0) return 0;

  const prepared = [];
  for (const operation of pending) {
    if (
      operation.entity === "evidencias" &&
      typeof operation.payload.storage_path === "string" &&
      /^(file:|content:)/.test(operation.payload.storage_path)
    ) {
      const storagePath = await uploadEvidence(
        operation.payload.storage_path,
        operation.payload.tipo as "FOTO_ANTES" | "FOTO_DESPUES",
        operation.entity_id,
      );
      prepared.push({ ...operation, payload: { ...operation.payload, storage_path: storagePath } });
    } else {
      prepared.push(operation);
    }
  }

  let results: { id: number; synced: boolean }[];
  try {
    ({ results } = await syncOperations(prepared));
  } catch (cause) {
    const errorMessage = cause instanceof Error ? cause.message : "No se pudo sincronizar.";
    await database.withTransactionAsync(async () => {
      for (const operation of pending) {
        await database.runAsync(
          "UPDATE sync_queue SET attempts = attempts + 1, last_error = ? WHERE id = ?",
          errorMessage.slice(0, 500),
          operation.id,
        );
        if (cause instanceof ApiRequestError && cause.status === 409) {
          const trabajoId = operation.entity === "trabajos"
            ? operation.entity_id
            : (operation.payload as { trabajo_id?: unknown }).trabajo_id;
          if (typeof trabajoId === "string") {
            await database.runAsync("UPDATE trabajos SET sync = 'CONFLICTO' WHERE id = ?", trabajoId);
          }
        }
      }
    });
    throw cause;
  }
  const affectedWorkIds = new Set<string>();
  for (const result of results) {
    if (!result.synced) continue;
    const operation = prepared.find((item) => item.id === result.id);
    const trabajoId = operation?.entity === "trabajos"
      ? operation.entity_id
      : (operation?.payload as { trabajo_id?: unknown } | undefined)?.trabajo_id;
    if (typeof trabajoId === "string") affectedWorkIds.add(trabajoId);
  }

  await database.withTransactionAsync(async () => {
    for (const result of results) {
      if (result.synced) await database.runAsync("DELETE FROM sync_queue WHERE id = ?", result.id);
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
  });
  return results.length;
}
