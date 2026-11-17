import { apiRequest } from "./http";

// null = este teléfono deja de recibir avisos de esta cuenta (cierre de sesión).
export async function savePushToken(pushToken: string | null): Promise<void> {
  await apiRequest<void>("/auth/token-push", {
    method: "PUT",
    body: JSON.stringify({ token: pushToken }),
  });
}
