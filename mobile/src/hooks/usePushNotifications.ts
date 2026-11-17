import Constants, { ExecutionEnvironment } from "expo-constants";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

import { savePushToken } from "@/src/api/push";
import { CANAL_AVISOS } from "@/src/constants/notificaciones";
import { destinoDeAviso } from "@/src/domain/notificaciones";

type NotificationsModule = typeof import("expo-notifications");
type RespuestaAviso = import("expo-notifications").NotificationResponse;

// Expo Go en Android no trae push remoto desde el SDK 53. Se evita siquiera
// cargar el módulo ahí: la app funciona igual, solo que sin avisos.
const pushDisponible =
  Platform.OS !== "web" &&
  !(Platform.OS === "android" && Constants.executionEnvironment === ExecutionEnvironment.StoreClient);

async function cargarModulo(): Promise<NotificationsModule | null> {
  if (!pushDisponible) return null;
  return import("expo-notifications");
}

async function obtenerPushToken(Notifications: NotificationsModule): Promise<string | null> {
  // Android 13+: el canal debe existir ANTES de pedir permiso o el diálogo no aparece.
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CANAL_AVISOS.id, {
      name: CANAL_AVISOS.nombre,
      importance: Notifications.AndroidImportance.MAX,
    });
  }
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") ({ status } = await Notifications.requestPermissionsAsync());
  if (status !== "granted") return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
}

/**
 * Registra el teléfono al iniciar sesión y abre el trabajo al tocar un aviso.
 * Nunca bloquea al técnico: si algo falla, la app sigue sin avisos (regla 1).
 */
export function usePushNotifications(signedIn: boolean): void {
  const router = useRouter();
  const [pendiente, setPendiente] = useState<RespuestaAviso | null>(null);

  // Mostrar el aviso aunque la app esté abierta, y escuchar los toques.
  useEffect(() => {
    let activo = true;
    let suscripcion: { remove(): void } | undefined;
    void cargarModulo().then(async (Notifications) => {
      if (!Notifications || !activo) return;
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
      suscripcion = Notifications.addNotificationResponseReceivedListener(setPendiente);
      // App cerrada: el aviso que la abrió.
      const ultima = await Notifications.getLastNotificationResponseAsync();
      if (activo && ultima) setPendiente(ultima);
    }).catch(() => undefined);
    return () => {
      activo = false;
      suscripcion?.remove();
    };
  }, []);

  // Registrar el token cuando hay sesión. Nunca se imprime: identifica al teléfono.
  useEffect(() => {
    if (!signedIn) return;
    void cargarModulo()
      .then(async (Notifications) => {
        if (!Notifications) return;
        const token = await obtenerPushToken(Notifications);
        if (token) await savePushToken(token);
      })
      .catch((failure: Error) => console.warn("Notificaciones push no disponibles:", failure.message));
  }, [signedIn]);

  // Navegar solo con sesión: si la app estaba cerrada, primero se inicia sesión.
  useEffect(() => {
    if (!pendiente || !signedIn) return;
    const destino = destinoDeAviso(pendiente.notification.request.content.data);
    setPendiente(null);
    void cargarModulo().then((Notifications) => Notifications?.clearLastNotificationResponse());
    if (!destino) return;
    if (destino.tipo === "hoy") router.navigate("/");
    else router.push({ pathname: "/trabajo/[id]", params: { id: destino.id } });
  }, [pendiente, signedIn, router]);
}
