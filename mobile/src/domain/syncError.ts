export function describeSyncFailure(cause: unknown) {
  if (cause instanceof Error) {
    const status = "status" in cause && typeof cause.status === "number" ? cause.status : null;
    if (/PGRST202|sync_trabajos|schema cache/i.test(cause.message)) {
      return "La API no encuentra sync_trabajos en el proyecto conectado. Confirma que API y app usen el mismo Supabase y revisa el esquema publicado.";
    }
    if (status !== null) return cause.message;
    if (cause.message.trim()) return cause.message;
  }

  return "No se pudo sincronizar. Comprueba la conexión y vuelve a intentarlo.";
}
