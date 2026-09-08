import type { AuthError } from "@supabase/supabase-js";

import { supabase } from "./client";

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type AuthAction = "login" | "register";

export async function register(input: RegisterInput) {
  return supabase.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: {
      data: {
        full_name: input.name.trim(),
      },
    },
  });
}

export async function login(email: string, password: string) {
  return supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
}

export async function logout() {
  return supabase.auth.signOut();
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
  if (normalizedMessage.includes("network") || normalizedMessage.includes("fetch")) {
    return "No hay conexión con Supabase. Comprueba la red del celular.";
  }

  return action === "login"
    ? "No fue posible iniciar sesión. Revisa tu conexión e inténtalo de nuevo."
    : "No fue posible crear la cuenta. Comprueba los datos e inténtalo de nuevo.";
}
