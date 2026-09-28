# 0006 - Separar móvil y backend en la raíz del monorepo

- **Estado:** aceptada
- **Fecha:** 2026-09-28

## Contexto

El proyecto Expo y el servidor Express compartían una carpeta de proyecto. Esto
mezclaba configuraciones y dependencias de TypeScript distintas y dificultaba
identificar los dos módulos ejecutables.

## Decisión

La raíz del repositorio contiene `mobile/` y `backend/` como módulos hermanos.
Expo Router conserva `mobile/app/`; los componentes, hooks y constantes del
cliente viven bajo `mobile/src/`. Cada módulo mantiene su `package.json`, lockfile,
TypeScript config y `.gitignore` propios. Los imports móviles conservan los
alias `@/components`, `@/hooks`, `@/constants` y `@/src`, redirigidos desde el
`mobile/tsconfig.json`.

El backend lee su `.env` propio y usa `mobile/.env.local` solo como respaldo de
las variables públicas de Supabase en desarrollo.

## Consecuencias

- Las dependencias móvil y servidor se instalan y validan de forma independiente.
- Los comandos Expo se ejecutan desde `mobile/`; los comandos del backend desde
  `backend/`.
- Expo Router mantiene sus rutas en la raíz de su módulo móvil, como requiere
  el framework.