# 0004 - Backend HTTP delante de Supabase

- **Estado:** aceptada
- **Fecha:** 2026-09-14

## Contexto

El entregable académico requiere que la aplicación móvil consuma un backend
propio. La arquitectura anterior consumia Supabase directamente desde Expo,
lo que no cumplia ese contrato para autenticacion y CRUD.

## Decisión

Se añade `backend/` como API HTTP en Node.js, Express y TypeScript. El backend
valida el token Bearer emitido por Supabase y crea un cliente Supabase por
solicitud para conservar RLS. Supabase sigue siendo responsable de Auth,
PostgreSQL y Storage; no se expone `service_role` en la aplicación móvil.

La aplicación conserva SQLite como fuente local para el trabajo de campo. Las
acciones offline se mantienen en `sync_queue` y se sincronizarán mediante el
backend en la siguiente iteración del flujo de sincronización.

## Consecuencias

- Login, registro y CRUD pasan por HTTP.
- El backend centraliza validación y mensajes de error.
- Los secretos del servidor viven únicamente en `backend/.env`.
- El flujo offline no depende de la red para registrar acciones locales.
- La migración `docs/supabase/002_crud_backend.sql` debe ejecutarse después del
  esquema inicial.
