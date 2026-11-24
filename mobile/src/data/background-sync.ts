import Constants, { ExecutionEnvironment } from "expo-constants";
import { openDatabaseAsync } from "expo-sqlite";
import { Platform } from "react-native";

import { supabase } from "@/src/api/client";

import { NOMBRE_BASE_DATOS } from "./database";
import { sincronizarCola } from "./sync-runner";
import { getPendingSync } from "./trabajos";

// Tarea de segundo plano (ADR 0012). Es un RESPALDO de la sincronización en
// primer plano, no su base: el sistema decide cuándo corre (mínimo cada 15 min,
// y en iOS suele ignorar intervalos cortos). Solo funciona en un APK o
// development build; en Expo Go se desactiva, igual que el push.

export const TAREA_SYNC_SEGUNDO_PLANO = "cuadrilla-sync-segundo-plano";
const INTERVALO_MINUTOS = 15;

type Modulos = {
  TaskManager: typeof import("expo-task-manager");
  BackgroundTask: typeof import("expo-background-task");
};

function cargarModulos(): Modulos | null {
  const enExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  if (Platform.OS === "web" || enExpoGo) return null;
  try {
    // require y no import: si el módulo nativo no está, no se cae la app.
    /* eslint-disable @typescript-eslint/no-require-imports */
    return {
      TaskManager: require("expo-task-manager") as Modulos["TaskManager"],
      BackgroundTask: require("expo-background-task") as Modulos["BackgroundTask"],
    };
    /* eslint-enable @typescript-eslint/no-require-imports */
  } catch {
    return null;
  }
}

const modulos = cargarModulos();

// Corre sin pantallas ni React: abre la base por su cuenta, toma la sesión
// guardada y sincroniza solo lo de esa cuenta.
async function sincronizarEnSegundoPlano(): Promise<number> {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return 0;

  const { data: perfil } = await supabase.from("profiles").select("role").eq("id", userId).single();
  const role = perfil?.role;
  if (role !== "admin" && role !== "tecnico") return 0;

  const database = await openDatabaseAsync(NOMBRE_BASE_DATOS);
  try {
    const pendientes = await getPendingSync(database, userId, role);
    if (pendientes.length === 0) return 0;
    return await sincronizarCola(database, userId, role);
  } finally {
    await database.closeAsync();
  }
}

// defineTask debe llamarse en el ámbito global del bundle (no dentro de un
// componente), porque la app puede arrancar en segundo plano sin montar nada.
if (modulos && !modulos.TaskManager.isTaskDefined(TAREA_SYNC_SEGUNDO_PLANO)) {
  const { TaskManager, BackgroundTask } = modulos;
  TaskManager.defineTask(TAREA_SYNC_SEGUNDO_PLANO, async () => {
    try {
      await sincronizarEnSegundoPlano();
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

export async function registrarSyncSegundoPlano(): Promise<boolean> {
  if (!modulos) return false;
  const { TaskManager, BackgroundTask } = modulos;
  try {
    const estado = await BackgroundTask.getStatusAsync();
    if (estado !== BackgroundTask.BackgroundTaskStatus.Available) return false;
    if (await TaskManager.isTaskRegisteredAsync(TAREA_SYNC_SEGUNDO_PLANO)) return true;
    await BackgroundTask.registerTaskAsync(TAREA_SYNC_SEGUNDO_PLANO, { minimumInterval: INTERVALO_MINUTOS });
    return true;
  } catch {
    return false;
  }
}

export async function desregistrarSyncSegundoPlano(): Promise<void> {
  if (!modulos) return;
  try {
    if (await modulos.TaskManager.isTaskRegisteredAsync(TAREA_SYNC_SEGUNDO_PLANO)) {
      await modulos.BackgroundTask.unregisterTaskAsync(TAREA_SYNC_SEGUNDO_PLANO);
    }
  } catch {
    // Nada que hacer: sin sesión, la tarea termina sin sincronizar.
  }
}
