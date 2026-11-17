import { usePushNotifications } from "@/src/hooks/usePushNotifications";
import { useAuth } from "@/src/session/AuthProvider";

// Componente sin interfaz: conecta la sesión con las notificaciones.
export function PushNotificationsBridge() {
  const { session } = useAuth();
  usePushNotifications(Boolean(session));
  return null;
}
