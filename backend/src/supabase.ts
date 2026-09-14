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
