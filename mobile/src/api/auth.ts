import type { AuthError, Session, User } from "@supabase/supabase-js";

import { supabase } from "./client";
import { apiRequest } from "./http";

export { getAuthErrorMessage, type AuthAction } from "./auth-errors";

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

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
      const { error } = await supabase.auth.setSession(result.session);
      if (error) throw error;
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
    const { error } = await supabase.auth.setSession(result.session);
    if (error) throw error;
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
