import type { SQLiteDatabase } from "expo-sqlite";

import { crearSincronizadorUnico } from "@/src/domain/sincronizadorUnico";

import { processSyncQueue } from "./trabajos";
import type { TrabajoListRole } from "./trabajos-query";

// Único camino para sincronizar la cola: lo usan la carga de listas, el botón
// manual, la sincronización automática y la tarea de segundo plano. El candado
// evita que dos ejecuciones simultáneas manden la misma cola dos veces.
const sincronizadorUnico = crearSincronizadorUnico<SQLiteDatabase, TrabajoListRole>(processSyncQueue);

export const sincronizarCola = sincronizadorUnico.sincronizar;
export const suscribirSincronizacion = sincronizadorUnico.suscribir;
export const notificarSincronizacion = sincronizadorUnico.notificar;
