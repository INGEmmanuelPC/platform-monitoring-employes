# 0009 - Notificaciones push con Expo Push y tokens solo en el servidor

- **Estado:** aceptada
- **Fecha:** 2026-11-12

## Contexto

La guía GUIA-NOTIFICACIONES-PUSH.md (característica F09) pide avisar cuando un
trabajo cambia de estado. `AGENTS.md` había descartado el push porque Expo Go en
Android no lo trae desde el SDK 53. Se decidió implementarlo igual, sin romper
el flujo actual en Expo Go. La guía está escrita para otro proyecto (Prisma,
Expo SDK 57); aquí se adapta a Express + Supabase y Expo SDK 54.

## Decisión

- **Servidor decide a quién avisar** (`backend/src/notificaciones.ts`, función
  pura `avisoPorCambioDeEstado`): orden nueva y cambios del admin avisan al
  técnico; `COMPLETADO` del técnico avisa a los administradores. Los pasos
  intermedios (en camino, en sitio) no generan aviso.
- **Puerto `Notificador`** con adaptador `NotificadorExpoPush` (un `fetch` a
  `exp.host`). Los errores no se relanzan: el cambio de estado ya se guardó.
- **Tokens en `push_tokens`** (migración 009): RLS activo y sin políticas, solo
  accede el backend con `service_role`. Un token pertenece a una cuenta; si otra
  lo tenía, se le quita. El id sale de la sesión, nunca del cuerpo.
- **App:** `usePushNotifications` registra el token al iniciar sesión, lo borra
  antes de cerrarla y abre el trabajo al tocar el aviso. `expo-notifications`
  se carga con `import()` dinámico y **no se carga en Expo Go de Android**.

## Alternativas

- Columna `token_push` en `profiles`: la leería el admin por RLS; descartada.
- Instalar `expo-dev-client`: cambia `expo start` a development build y rompe
  el flujo con Expo Go; se pospone. El push se prueba con el APK `preview`.

## Consecuencias

- Expo Go sigue funcionando; solo no recibe push en Android (modelo de jalar).
- Para recibir push hace falta un APK con FCM (`google-services.json` +
  credencial FCM V1 en EAS) y aplicar la migración 009.
- La regla 1 se respeta: registrar o borrar el token nunca bloquea al técnico.
