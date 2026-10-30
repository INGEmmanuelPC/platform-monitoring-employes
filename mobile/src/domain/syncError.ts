export function describeSyncFailure(cause: unknown, role?: "admin" | "tecnico") {
  if (cause instanceof Error) {
    const status = "status" in cause && typeof cause.status === "number" ? cause.status : null;
    if (/PGRST202|sync_trabajos|schema cache/i.test(cause.message)) {
      return "La API no encuentra sync_trabajos en el proyecto conectado. Confirma que API y app usen el mismo Supabase y revisa el esquema publicado.";
    }
    if (role === "admin" && /no pertenece al técnico autenticado|no tienes permiso para ejecutarla/i.test(cause.message)) {
      return "Supabase aún no permite ejecutar órdenes como administrador. Aplica 008_admin_ejecuta_trabajos.sql en el proyecto conectado y confirma que la cuenta tenga rol admin.";
    }
    if (role === "admin" && /Supabase bloqueó la operación por RLS/i.test(cause.message)) {
      return "Supabase rechazó el acceso de administrador. Verifica que aplicaste 005_admin_gestiona_trabajos.sql y 008_admin_ejecuta_trabajos.sql, y que la cuenta tenga rol admin activo.";
    }
    if (status !== null) return cause.message;
    if (cause.message.trim()) return cause.message;
  }

  return "No se pudo sincronizar. Comprueba la conexión y vuelve a intentarlo.";
}
