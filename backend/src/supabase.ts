import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { config } from "./config.js";

export function createRequestClient(accessToken?: string): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  });
}

// Se limita a operaciones de Supabase Auth que requieren privilegios de
// administrador. Las consultas de datos siguen usando createRequestClient
// para que RLS aplique con el token del usuario.
export function createAdminClient(): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
