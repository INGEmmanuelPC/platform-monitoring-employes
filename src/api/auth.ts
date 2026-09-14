import type { AuthError, Session, User } from "@supabase/supabase-js";

import { supabase } from "./client";
import { apiRequest } from "./http";

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type AuthAction = "login" | "register";

type AuthResponse = {
  user: User | null;
  session: Session | null;
};

export async function register(input: RegisterInput) {
  try {
    const result = await apiRequest<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (result.session) {
      await supabase.auth.setSession(result.session);
    }
    return { data: result, error: null };
  } catch (error) {
    return { data: { user: null, session: null }, error: toAuthError(error) };
  }
}

export async function login(email: string, password: string) {
  try {
    const result = await apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (!result.session) {
      throw new Error("El servidor no devolvió una sesión válida.");
    }
    await supabase.auth.setSession(result.session);
    return { data: result, error: null };
  } catch (error) {
    return { data: { user: null, session: null }, error: toAuthError(error) };
  }
}

export async function logout() {
  try {
    await apiRequest<void>("/auth/logout", { method: "POST" });
  } catch {
    // El cierre local debe completarse aunque el servidor no esté disponible.
  }
  return supabase.auth.signOut();
}

function toAuthError(error: unknown): AuthError {
  const message = error instanceof Error ? error.message : "No fue posible autenticarte.";
  return { name: "AuthApiError", message, status: 400 } as AuthError;
}

export function getAuthErrorMessage(error: AuthError, action: AuthAction) {
  const normalizedMessage = error.message.toLowerCase();

  if (normalizedMessage.includes("email not confirmed")) {
    return "Confirma tu correo electrónico antes de iniciar sesión.";
  }
  if (normalizedMessage.includes("invalid login credentials")) {
    return "El correo o la contraseña no son correctos.";
  }
  if (normalizedMessage.includes("already registered")) {
    return "Ya existe una cuenta con ese correo.";
  }
  if (normalizedMessage.includes("email address") && normalizedMessage.includes("invalid")) {
    return "El correo electrónico no es válido.";
  }
  if (normalizedMessage.includes("password") && normalizedMessage.includes("weak")) {
    return "La contraseña es demasiado débil. Usa una más segura.";
  }
  if (normalizedMessage.includes("signup") && normalizedMessage.includes("disabled")) {
    return "El registro está deshabilitado en Supabase.";
  }
  if (
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("too many") ||
    normalizedMessage.includes("email rate") ||
    normalizedMessage.includes("email_send")
  ) {
    return "Supabase limitó los correos de confirmación. Configura SMTP propio o inténtalo más tarde.";
  }
  if (
    normalizedMessage.includes("network") ||
    normalizedMessage.includes("fetch") ||
    normalizedMessage.includes("failed to fetch") ||
    normalizedMessage.includes("network request failed")
  ) {
    return "No hay conexión con el backend. Comprueba que el celular esté en la misma red y que la API esté activa.";
  }

  return action === "login"
    ? "No fue posible iniciar sesión. Revisa tu conexión e inténtalo de nuevo."
    : "No fue posible crear la cuenta. Comprueba los datos e inténtalo de nuevo.";
}
