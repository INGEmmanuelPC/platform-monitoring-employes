import { createAdminClient } from "./supabase.js";
import type { AlmacenTokensPush } from "./notificaciones.js";

// El token identifica al teléfono, no a la persona. Se guarda en una tabla
// aparte (push_tokens) con RLS activo y sin políticas: ningún cliente la lee ni
// la escribe, solo el backend con service_role. Así un token nunca viaja al móvil.
export class AlmacenTokensPushSupabase implements AlmacenTokensPush {
  async tokenPush(usuarioId: string): Promise<string | null> {
    const { data, error } = await createAdminClient()
      .from("push_tokens")
      .select("token")
      .eq("user_id", usuarioId)
      .maybeSingle();
    if (error) throw error;
    return data?.token ?? null;
  }

  async guardarTokenPush(usuarioId: string, token: string): Promise<void> {
    const admin = createAdminClient();
    // Un teléfono es de UNA persona: si otra cuenta lo tenía, se le quita. Sin
    // esto, dos cuentas en el mismo teléfono recibirían avisos cruzados.
    const { error: releaseError } = await admin
      .from("push_tokens")
      .delete()
      .eq("token", token)
      .neq("user_id", usuarioId);
    if (releaseError) throw releaseError;
    const { error } = await admin
      .from("push_tokens")
      .upsert({ user_id: usuarioId, token, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) throw error;
  }

  async borrarTokenPush(usuarioId: string): Promise<void> {
    const { error } = await createAdminClient().from("push_tokens").delete().eq("user_id", usuarioId);
    if (error) throw error;
  }

  async idsDeAdministradores(): Promise<string[]> {
    const { data, error } = await createAdminClient()
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .eq("estado", "ACTIVO");
    if (error) throw error;
    return (data ?? []).map((fila) => fila.id as string);
  }
}
