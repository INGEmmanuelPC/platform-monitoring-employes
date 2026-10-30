import type { AuthError } from "@supabase/supabase-js";

export type AuthAction = "login" | "register";

export function getAuthErrorMessage(error: AuthError, action: AuthAction) {
  const normalizedMessage = error.message.toLowerCase();

  if (
    normalizedMessage.includes("email not confirmed") ||
    normalizedMessage.includes("confirma tu correo electrónico")
  ) {
    return "Confirma tu correo electrónico antes de iniciar sesión.";
  }
  if (normalizedMessage.includes("invalid refresh token") || normalizedMessage.includes("session missing")) {
    return "No se pudo guardar la sesión. Cierra Expo Go por completo y vuelve a abrir la aplicación.";
  }
  if (
    normalizedMessage.includes("invalid login credentials") ||
    normalizedMessage.includes("el correo o la contraseña no son correctos")
  ) {
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
    normalizedMessage.includes("network request failed") ||
    normalizedMessage.includes("tardó demasiado") ||
    normalizedMessage.includes("conexión con el backend") ||
    normalizedMessage.includes("no se pudo conectar")
  ) {
    return "No se pudo conectar con el servicio de inicio de sesión. Comprueba la conexión e inténtalo de nuevo.";
  }

  return action === "login"
    ? "No fue posible iniciar sesión. Revisa tu conexión e inténtalo de nuevo."
    : "No fue posible crear la cuenta. Comprueba los datos e inténtalo de nuevo.";
}
