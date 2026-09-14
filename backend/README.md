# Backend HTTP

API HTTP en Express para la aplicación móvil. Supabase permanece como
proveedor de Auth, PostgreSQL, RLS y Storage. El backend no usa ni requiere una
`service_role`; valida el token Bearer y crea un cliente de Supabase por
solicitud para que las políticas RLS continúen aplicándose.

## Requisitos

- Node.js LTS y npm.
- Un proyecto de Supabase con las migraciones de `../docs/supabase/` aplicadas.

## Configuración

## Ejecutar

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Configura estas variables en `backend/.env` sin versionar valores reales:

| Variable | Uso |
| --- | --- |
| `PORT` | Puerto HTTP; por defecto `3000`. |
| `SUPABASE_URL` | URL del proyecto Supabase. |
| `SUPABASE_ANON_KEY` | Clave pública o publishable de Supabase. |
| `CORS_ORIGIN` | Origen permitido por CORS; por defecto `*` para desarrollo. |

Como respaldo local, el servidor puede leer `EXPO_PUBLIC_SUPABASE_URL` y
`EXPO_PUBLIC_SUPABASE_ANON_KEY` desde el `.env.local` de la raíz.

La aplicación móvil debe enviar el access token de Supabase como:

```text
Authorization: Bearer <access_token>
```

## Rutas

Las rutas públicas son `GET /health`, `POST /auth/register` y
`POST /auth/login`. Todas las demás requieren un token Bearer.

| Recurso | Operaciones |
| --- | --- |
| `/auth/logout` | `POST`. |
| `/sync` | `POST` de operaciones locales de `trabajos` y `evidencias`. |
| `/evidencias/upload` | `POST` multipart de imágenes; límite de 8 MB. |
| `/tecnicos` | Listar, crear, consultar, actualizar y desactivar. |
| `/clientes` | CRUD autenticado. |
| `/ordenes` | CRUD autenticado sobre la tabla `trabajos`. |

## Validación

```powershell
npm run typecheck
```

No hay pruebas automatizadas configuradas para este backend.
