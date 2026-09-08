# 0002 — Autenticación con Supabase

- **Estado:** aceptada
- **Fecha:** 2026-09-07

## Decisión

La app usa `@supabase/supabase-js` directamente desde `src/api/`. El registro
usa `supabase.auth.signUp`, el login usa `signInWithPassword` y el cierre de
sesión usa `signOut`. La sesión se persiste mediante `expo-secure-store`.

`AuthProvider` escucha los cambios de sesión y `RouteGuard` separa las rutas
públicas de las rutas del técnico. No se crean endpoints `/auth/*`, un servidor
Express ni un repositorio de usuarios en memoria: Supabase Auth es el backend
oficial definido por la arquitectura del proyecto.

## Consecuencias

- Se deben configurar `EXPO_PUBLIC_SUPABASE_URL` y
  `EXPO_PUBLIC_SUPABASE_ANON_KEY` en `.env.local`.
- El primer registro o login requiere conexión; una sesión válida persistida
  permite abrir la app sin señal.
- La confirmación por correo depende de la configuración del proyecto Supabase.
- Las tablas de negocio y sus políticas RLS se agregarán posteriormente,
  relacionadas con `auth.users`.