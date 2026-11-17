// Notificaciones push (F09). Este archivo es puro a propósito: no importa
// Supabase ni Express, así se prueba con node:test sin red ni base de datos.

export type AvisoDTO = {
  titulo: string;
  cuerpo: string;
  // Viaja oculto en la notificación; la app lo usa para decidir a dónde navegar.
  datos: Record<string, string>;
};

// El dominio dice "avisa al usuario X" y no sabe cómo. Hoy es push de Expo;
// mañana puede ser correo, sin tocar las rutas.
export interface Notificador {
  avisar(usuarioId: string, aviso: AvisoDTO): Promise<void>;
}

export interface AlmacenTokensPush {
  tokenPush(usuarioId: string): Promise<string | null>;
  borrarTokenPush(usuarioId: string): Promise<void>;
}

export const FORMATO_TOKEN_EXPO = /^(?:Exponent|Expo)PushToken\[[^\]\s]+\]$/;

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

type FetchLike = (url: string, init: RequestInit) => Promise<{ json(): Promise<unknown> }>;

export class NotificadorExpoPush implements Notificador {
  constructor(
    private readonly almacen: AlmacenTokensPush,
    private readonly tokenAccesoExpo?: string,
    private readonly fetchFn: FetchLike = fetch as unknown as FetchLike,
  ) {}

  async avisar(usuarioId: string, aviso: AvisoDTO): Promise<void> {
    // Los errores nunca se relanzan: el trabajo ya cambió de estado y que el
    // aviso no salga no puede convertir esa operación en un 500.
    try {
      const destino = await this.almacen.tokenPush(usuarioId);
      if (!destino) return;

      const respuesta = await this.fetchFn(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.tokenAccesoExpo ? { Authorization: `Bearer ${this.tokenAccesoExpo}` } : {}),
        },
        body: JSON.stringify({
          to: destino,
          title: aviso.titulo,
          body: aviso.cuerpo,
          data: aviso.datos,
          sound: "default",
          channelId: "default",
        }),
        signal: AbortSignal.timeout(5_000),
      });
      const cuerpo = (await respuesta.json()) as { data?: { status?: string; details?: { error?: string } } };
      // DeviceNotRegistered: desinstalaron la app o quitaron el permiso.
      if (cuerpo?.data?.details?.error === "DeviceNotRegistered") {
        await this.almacen.borrarTokenPush(usuarioId);
      }
    } catch (error) {
      console.error("No se pudo contactar a Expo Push:", error instanceof Error ? error.message : error);
    }
  }
}

export type CambioDeEstado = {
  trabajoId: string;
  cliente: string;
  tecnicoId: string;
  estadoAnterior: string | null; // null = la orden acaba de crearse
  estadoNuevo: string;
  actorId: string;
  actorRol: "admin" | "tecnico";
  motivoCancelacion?: string | null;
};

export type AvisoDestinado = {
  destinatario: "tecnico" | "admins";
  aviso: AvisoDTO;
};

const legible = (estado: string) => estado.replaceAll("_", " ").toLowerCase();

// Decide a quién y qué avisar. Es una regla de negocio, por eso vive en el
// servidor y no en la app. Devuelve null cuando no hay nada que avisar.
export function avisoPorCambioDeEstado(cambio: CambioDeEstado): AvisoDestinado | null {
  if (cambio.estadoAnterior === cambio.estadoNuevo) return null;

  const datos = { trabajoId: cambio.trabajoId, estado: cambio.estadoNuevo };

  // Orden nueva: avisa al técnico asignado, salvo que se la haya creado él mismo.
  if (cambio.estadoAnterior === null) {
    if (cambio.tecnicoId === cambio.actorId) return null;
    return {
      destinatario: "tecnico",
      aviso: {
        titulo: "Nuevo trabajo asignado",
        cuerpo: `Tienes un trabajo para ${cambio.cliente}.`,
        datos: { ...datos, tipo: "asignado" },
      },
    };
  }

  // El administrador cambió el trabajo de un técnico: se le avisa al técnico.
  if (cambio.actorRol === "admin") {
    if (cambio.tecnicoId === cambio.actorId) return null;
    const motivo = cambio.estadoNuevo === "CANCELADO" && cambio.motivoCancelacion?.trim()
      ? ` Motivo: ${cambio.motivoCancelacion.trim()}`
      : "";
    return {
      destinatario: "tecnico",
      aviso: {
        titulo: "Tu trabajo cambió de estado",
        cuerpo: `El trabajo de ${cambio.cliente} ahora está ${legible(cambio.estadoNuevo)}.${motivo}`,
        datos: { ...datos, tipo: "estado" },
      },
    };
  }

  // El técnico terminó el trabajo: la oficina necesita enterarse para aprobar y
  // cerrar. Los pasos intermedios (en camino, en sitio) no generan ruido.
  if (cambio.estadoNuevo === "COMPLETADO") {
    return {
      destinatario: "admins",
      aviso: {
        titulo: "Trabajo completado",
        cuerpo: `El trabajo de ${cambio.cliente} quedó completado y espera tu revisión.`,
        datos: { ...datos, tipo: "completado" },
      },
    };
  }
  return null;
}
