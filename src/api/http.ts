import { supabase } from "./client";
import Constants from "expo-constants";

const apiUrl =
  process.env.EXPO_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  Constants.expoConfig?.extra?.apiUrl ??
  "http://localhost:3000";

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");

  if (data.session?.access_token) {
    headers.set("Authorization", `Bearer ${data.session.access_token}`);
  }

  const response = await fetch(`${apiUrl}${path}`, { ...init, headers });
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const revision = response.headers.get("x-backend-revision");
    const source = revision ? ` [API: ${revision}]` : "";
    throw new Error(`${body?.error ?? "No fue posible completar la solicitud."}${source}`);
  }

  return body as T;
}

export { apiUrl };
