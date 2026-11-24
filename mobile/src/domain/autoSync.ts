// Reglas puras de la sincronización automática. Sin Expo, sin red, sin reloj:
// el reloj entra como parámetro, así se prueba con node:test.
//
// Principio: sincronizar es un reintento barato y seguro, nunca algo que el
// técnico tenga que esperar (regla 1). Si falla, se vuelve a intentar más tarde
// con espera creciente; un evento del usuario (volver la red, abrir la app)
// siempre cuenta como una oportunidad nueva.

export type MotivoSync = "inicio" | "reconexion" | "primer_plano" | "periodico";

export const INTERVALO_REVISION_MS = 30_000;
export const ESPERA_BASE_MS = 15_000;
export const ESPERA_TOPE_MS = 300_000;

type EstadoRed = { isConnected?: boolean; isInternetReachable?: boolean } | null | undefined;

// "Desconocido" no cuenta como conectado: al arrancar, expo-network todavía no
// respondió y un intento ahí fallaría sin necesidad. Si isInternetReachable es
// false (hay Wi-Fi pero sin salida a internet) tampoco se intenta.
export function hayRed(estado: EstadoRed): boolean {
  return estado?.isConnected === true && estado.isInternetReachable !== false;
}

export function esReconexion(antes: boolean, ahora: boolean): boolean {
  return !antes && ahora;
}

export function esVueltaAPrimerPlano(antes: string, ahora: string): boolean {
  return ahora === "active" && antes !== "active";
}

// 15 s, 30 s, 1 min, 2 min, 4 min y tope de 5 min.
export function esperaTrasFallo(fallos: number): number {
  if (!Number.isFinite(fallos) || fallos <= 0) return 0;
  return Math.min(ESPERA_BASE_MS * 2 ** (fallos - 1), ESPERA_TOPE_MS);
}

export type DatosDecision = {
  hayRed: boolean;
  sesionLista: boolean;
  pendientes: number;
  motivo: MotivoSync;
  ahora: number;
  noAntesDe: number;
};

export function debeSincronizar(datos: DatosDecision): boolean {
  if (!datos.sesionLista || !datos.hayRed || datos.pendientes <= 0) return false;
  // Los eventos (volver la red, abrir la app, iniciar sesión) ignoran la espera:
  // son justo el momento en que más probable es que ahora sí funcione.
  if (datos.motivo !== "periodico") return true;
  return datos.ahora >= datos.noAntesDe;
}
