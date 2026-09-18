import { supabase } from "./client";
import Constants from "expo-constants";

const apiUrl =
  process.env.EXPO_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  Constants.expoConfig?.extra?.apiUrl ??
  "http://localhost:3000";

// En un dispositivo físico, una IP LAN inaccesible puede dejar fetch pendiente
// durante varios minutos. El límite evita que la interfaz de inicio de sesión
// quede bloqueada esperando una red que no está disponible.
const REQUEST_TIMEOUT_MS = 15_000;

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");

  if (data.session?.access_token) {
    headers.set("Authorization", `Bearer ${data.session.access_token}`);
  }

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      ...init,
      headers,
      signal: timeoutController.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("La conexión con el backend tardó demasiado. Verifica la red e inténtalo de nuevo.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const revision = response.headers.get("x-backend-revision");
    const source = revision ? ` [API: ${revision}]` : "";
    throw new Error(`${body?.error ?? "No fue posible completar la solicitud."}${source}`);
  }

  return body as T;
}

export { apiUrl };
