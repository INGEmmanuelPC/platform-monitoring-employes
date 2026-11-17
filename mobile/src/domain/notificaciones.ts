// Decide a dónde navegar al tocar un aviso. Código puro, sin Expo.
// Los datos los puso el backend (backend/src/notificaciones.ts).
export type DestinoAviso = { tipo: "hoy" } | { tipo: "trabajo"; id: string };

export function destinoDeAviso(datos: unknown): DestinoAviso | null {
  if (!datos || typeof datos !== "object") return null;
  const { trabajoId, tipo } = datos as Record<string, unknown>;
  if (typeof trabajoId !== "string" || !/^[0-9a-fA-F-]{36}$/.test(trabajoId)) return null;
  // Un trabajo recién asignado todavía no está en SQLite: se abre Hoy, que lo
  // descarga al enfocarse, en vez de un detalle que diría "no se encontró".
  if (tipo === "asignado") return { tipo: "hoy" };
  return { tipo: "trabajo", id: trabajoId };
}
