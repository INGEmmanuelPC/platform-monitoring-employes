# Backend HTTP

API HTTP en Express para la aplicación móvil. Supabase permanece como
proveedor de Auth, PostgreSQL, RLS y Storage. El backend valida el token Bearer
y crea un cliente de Supabase por solicitud para que las políticas RLS continúen
aplicándose. Una `service_role` separada se usa exclusivamente para invitar o
bloquear cuentas mediante Supabase Auth Admin.

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
| `SUPABASE_SERVICE_ROLE_KEY` | Clave administrativa exclusiva del backend para Auth Admin. Nunca usar `EXPO_PUBLIC_*` ni incluirla en la app. |
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

Las rutas de `/tecnicos` exigen un perfil activo con `role = 'admin'`; un
técnico recibe `403`. Aplica también `003_tecnicos_admin_rls.sql` antes de
usarlas.

`GET /health` devuelve la revisión y hora de inicio de la instancia actual.
Úsalo al depurar dispositivos físicos para confirmar que Expo llama al backend
esperado.

## Configuración de TypeScript: no la "arregles" copiando la de la app

`backend/tsconfig.json` es **autónomo a propósito**. No extiende
`expo/tsconfig.base` ni incluye `nativewind-env.d.ts`, y no debe hacerlo:

- **Esto es Node, no React Native.** La base de Expo trae `jsx`, tipos del DOM
  y `moduleResolution: bundler`. El servidor necesita `NodeNext`.
- **`expo` no está en `backend/node_modules`.** Un `extends` a un paquete de
  Expo solo resuelve porque TypeScript sube hasta el `node_modules` de la raíz.
  Funciona por la disposición de las carpetas, no por diseño: el día que el
  backend se mueva a su propio repositorio, deja de compilar.
- **`nativewind-env.d.ts` declara la prop `className`** de componentes de React
  Native. Un servidor Express no renderiza componentes.

El `tsconfig.json` de la raíz **excluye** esta carpeta, así que cada proyecto
revisa lo suyo:

| Dónde | Comando | Qué revisa |
| --- | --- | --- |
| Raíz | `npx tsc --noEmit` | Solo la app móvil |
| `backend/` | `npm run typecheck` | Solo el servidor |

Si la raíz vuelve a incluir `backend/`, el código del servidor se revisa con la
configuración de React Native: eso puede inventar errores que no existen y, peor,
esconder errores que sí.
