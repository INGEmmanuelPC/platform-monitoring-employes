# 0002 — Autenticación con Supabase

- **Estado:** aceptada
- **Fecha:** 2026-09-07

## Decisión

El backend HTTP usa `@supabase/supabase-js` para registro y login. La app
recibe la sesión del backend y usa `@supabase/supabase-js` únicamente para
persistirla y restaurarla mediante `expo-secure-store`.

`AuthProvider` escucha los cambios de sesión y `RouteGuard` separa las rutas
públicas de las rutas del técnico. Los endpoints `/auth/*` pertenecen al
backend HTTP; no existe un repositorio de usuarios en memoria. Supabase Auth
sigue siendo el proveedor de identidad detrás del backend.

## Consecuencias

- Se deben configurar `EXPO_PUBLIC_SUPABASE_URL` y
  `EXPO_PUBLIC_SUPABASE_ANON_KEY` en `.env.local`.
- El primer registro o login requiere conexión; una sesión válida persistida
  permite abrir la app sin señal.
- La confirmación por correo depende de la configuración del proyecto Supabase.
- Las tablas de negocio y sus políticas RLS se agregarán posteriormente,
  relacionadas con `auth.users`.