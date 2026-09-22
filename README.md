# Platform Monitoring Employees

Aplicacion movil para tecnicos de servicio en campo. Permite autenticarse,
consultar trabajos asignados y registrar avances desde el dispositivo, incluso
cuando la conectividad es intermitente.

## Características

- Registro, inicio y cierre de sesión mediante la API HTTP y Supabase Auth.
- Persistencia segura de la sesión con `expo-secure-store`.
- Rutas protegidas para el tecnico mediante Expo Router.
- SQLite local como fuente de lectura para el trabajo de campo.
- Refresco de trabajos desde Supabase cuando hay conectividad.
- Registro local de llegada con hora y cola de sincronizacion.
- Captura local de evidencias fotográficas antes y después, con subida diferida.
- Notas de servicio y captura local de trazos de firma SVG.
- CRUD autenticado de técnicos, clientes y órdenes de trabajo.
- Políticas RLS para proteger perfiles, trabajos, clientes y evidencias.

## Tecnologias

- Expo SDK 54
- React Native
- TypeScript estricto
- Expo Router
- NativeWind v5 y Tailwind CSS v4
- Supabase Auth y PostgreSQL
- `expo-sqlite`
- `expo-secure-store`
- `expo-image-picker`
- Zustand

## Configuración de Tailwind: NativeWind v5, no v4

Este proyecto usa **NativeWind v5**, que es *CSS-first*: reemplaza los cuatro
archivos clásicos de v4 (`tailwind.config.ts`, `@tailwind` en el CSS,
`babel.config.js`) por una configuración más corta. La tabla equivale cada
punto esperado a dónde vive de verdad en este repo:

| Se espera (NativeWind v4) | En este proyecto (NativeWind v5) | Por qué cambia |
| --- | --- | --- |
| `tailwind.config.ts` con el preset de NativeWind y `content` apuntando a `app/` y `src/` | **No existe.** No hace falta: v5 no lee `content`, escanea el proyecto directamente. | v4 requería un archivo JS para decirle a Tailwind qué escanear; v5 lo detecta solo. |
| `global.css` con las tres directivas `@tailwind base/components/utilities` | `global.css` (ver abajo), con `@import` en vez de `@tailwind` | Tailwind v4 cambió su propia sintaxis de configuración; NativeWind v5 sigue esa sintaxis, no la de v3/v4. |
| `babel.config.js` con el plugin de NativeWind | **No existe, y no debe crearse.** | v5 eliminó el *JSX transform* de Babel; la transformación de `className` ahora la hace el plugin de Metro. |
| `metro.config.js` ajustado para NativeWind | `metro.config.js` (ver abajo) | Igual en ambas versiones: es la única pieza de configuración de build que v5 conserva sin cambios de fondo. |

Contenido real de los dos archivos que sí existen:

```css
/* global.css */
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "tailwindcss/utilities.css";

@import "nativewind/theme";
```

```js
// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
config.resolver.assetExts = [...config.resolver.assetExts, "wasm"];

module.exports = withNativewind(config);
```

`global.css` se importa una sola vez en `app/_layout.tsx`, igual que pide la
lista de requisitos. `postcss.config.mjs` es la única pieza adicional que v5
sí necesita y v4 no: conecta Tailwind v4 con PostCSS.

**No degradar a NativeWind v4 para que los cuatro archivos "clásicos"
existan.** v5 ya está instalado, verificado en dispositivo físico y en el
bundle de Android — bajar de versión sería cambiar código que funciona por
código que no se ha probado, solo para calzar con una lista pensada para la
versión anterior.

## Requisitos

- Node.js LTS
- npm
- Expo Go compatible con Expo SDK 54, o un development build compatible
- Proyecto de Supabase

## Instalacion

```bash
npm install
```

## Estilos

NativeWind v5 usa Tailwind CSS v4 con configuración basada en CSS. Las rutas
que contienen clases están declaradas en `tailwind.config.js` y en `global.css`.
`babel.config.js` conserva el preset estándar de Expo; NativeWind v5 aplica la
transformación de `className` desde `metro.config.js`, por lo que no se debe
agregar el preset heredado `nativewind/babel`.

## Configuración de Supabase

1. Crea un proyecto en Supabase.
2. En **Authentication > Providers > Email**, habilita el proveedor Email.
3. Abre **SQL Editor** y ejecuta todo el archivo
  `docs/supabase/001_schema_inicial.sql`.
4. Ejecuta `docs/supabase/002_crud_backend.sql` para habilitar los tres CRUD,
  las relaciones de clientes y el bucket privado de evidencias.
5. Configura la confirmacion de correo segun el entorno.
6. Crea un usuario desde la aplicacion o desde **Authentication > Users**.

El esquema crea las tablas `profiles`, `trabajos`, `evidencias` y `clientes`,
relacionadas con `auth.users`. También crea triggers, índices, un bucket privado
para evidencias y políticas RLS. Las políticas aplicadas limitan el acceso a los
datos que pertenecen al usuario autenticado.

## Variables de entorno

Copia el archivo de ejemplo:

```powershell
Copy-Item .env.example .env.local
```

Completa `.env.local` con valores públicos. Este archivo lo lee Expo, por lo
que solo puede contener variables con prefijo `EXPO_PUBLIC_`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-clave-publica
EXPO_PUBLIC_API_URL=http://localhost:3000
```

Puedes obtenerlos en **Project Settings > API**:

- **Project URL** -> `EXPO_PUBLIC_SUPABASE_URL`
- **Publishable key** o antigua **anon key** -> `EXPO_PUBLIC_SUPABASE_ANON_KEY`

`EXPO_PUBLIC_API_URL` debe apuntar al servidor backend. En un celular físico no
uses `localhost`: reemplázalo por la IP LAN del computador que ejecuta el
backend, por ejemplo `http://192.168.1.20:3000`.

Nunca uses `service_role`, claves secretas, contraseñas ni tokens privados en
la aplicación móvil. `.env.local` está excluido de Git.

## Crear un trabajo de prueba

Despues de crear un usuario, ejecuta esta consulta en Supabase reemplazando el
correo:

```sql
insert into public.trabajos (
  tecnico_id,
  cliente,
  direccion,
  descripcion,
  hora_programada,
  estado
)
select
  id,
  'Cliente de prueba',
  'Carrera 10 #20-30',
  'Revision de mantenimiento',
  now(),
  'ASIGNADO'
from auth.users
where email = 'tu-correo@ejemplo.com';
```

## Ejecutar

Inicia el servidor de desarrollo:

```bash
npx expo start
```

Para limpiar la cache:

```bash
npx expo start -c
```

Opciones de prueba:

- Presiona `a` para abrir en un emulador Android configurado.
- Escanea el QR desde Expo Go en un dispositivo movil.
- Usa `npx expo start --tunnel` si la red local no permite conexiones LAN.

Despues de cambiar `.env.local`, reinicia Expo para que las variables se
carguen nuevamente.

## Backend HTTP

El movil ya no llama directamente a Supabase para autenticarse ni para los
CRUD. El backend valida el token Bearer y usa Supabase como proveedor de Auth,
PostgreSQL y Storage.

```powershell
cd backend
Copy-Item .env.example .env
# Completa todas las variables requeridas en backend/.env
npm install
npm run dev
```

Completa `backend/.env` de esta forma:

```env
PORT=3000
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-clave-publica
SUPABASE_SERVICE_ROLE_KEY=tu-clave-service-role-secreta
CORS_ORIGIN=*
```

| Variable | Uso |
| --- | --- |
| `PORT` | Puerto del servidor Express; por defecto `3000`. |
| `SUPABASE_URL` | URL del proyecto de Supabase. |
| `SUPABASE_ANON_KEY` | Clave pública usada para validar sesiones y aplicar RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave secreta usada solo por el backend para invitar y desactivar técnicos. |
| `CORS_ORIGIN` | Origen permitido para CORS; `*` sirve para desarrollo. |

Obtén `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` en
**Supabase > Project Settings > API**. La clave `SUPABASE_SERVICE_ROLE_KEY`
no debe copiarse a `.env.local`, al código móvil ni a Git. El backend puede usar
las variables públicas del `.env.local` raíz como respaldo de desarrollo para
la URL y la anon key, pero siempre requiere su propia
`SUPABASE_SERVICE_ROLE_KEY`.

## API HTTP

`GET /health`, `POST /auth/register` y `POST /auth/login` son públicos. Las
demás rutas requieren `Authorization: Bearer <access_token>`.

| Ruta | Operaciones implementadas |
| --- | --- |
| `/auth/logout` | `POST` para cerrar sesión en el cliente. |
| `/sync` | `POST` para procesar hasta 50 operaciones locales de trabajos o evidencias. |
| `/evidencias/upload` | `POST` multipart para subir una imagen al bucket privado. |
| `/tecnicos` | `GET`, `POST`, `GET /:id`, `PATCH /:id`, `DELETE /:id` (baja lógica del perfil permitido por RLS). |
| `/clientes` | `GET`, `POST`, `GET /:id`, `PATCH /:id`, `DELETE /:id`. |
| `/ordenes` | `GET`, `POST`, `GET /:id`, `PATCH /:id`, `DELETE /:id`. |

La API valida la sesión con Supabase, crea un cliente por solicitud con el
token Bearer y deja que las políticas RLS apliquen sobre PostgreSQL y Storage.

## Flujo de prueba

```text
Registro -> Confirmacion de correo -> Inicio de sesion
    -> Trabajo asignado -> Marcar llegada
    -> Foto antes -> Foto despues
```

El registro de llegada y las fotografias se guardan primero en SQLite. El
tecnico no debe quedar bloqueado por una perdida de conectividad.

## Sincronización

SQLite es la fuente de lectura inmediata del técnico. Al marcar llegada,
guardar una nota, evidencia, firma o finalización, la app actualiza primero la
base local y encola una operación. Al enfocar las pantallas de trabajos y al
usar el botón de sincronización, intenta enviar la cola a la API; las fotos
locales se suben antes al bucket privado y luego se registra su ruta.

Un fallo de red no bloquea esas acciones locales. La cola aún no tiene un
planificador en segundo plano ni pruebas automáticas de reintentos/conflictos.

## Validación y pruebas

```bash
# App movil (la raiz excluye backend/)
npx tsc --noEmit
npm run lint
npx expo export --platform android

# Backend (tiene su propia configuracion de TypeScript)
cd backend && npm run typecheck
```

Cada proyecto revisa lo suyo: `backend/tsconfig.json` es autonomo y el
`tsconfig.json` de la raiz excluye `backend/`. El detalle y la razon estan en
`backend/README.md`.

Tambien se recomienda probar el flujo principal con el dispositivo en modo
avion despues de haber cargado los datos locales.

No hay suite de pruebas automatizadas configurada actualmente. La validación
manual con Supabase y en un dispositivo físico sigue siendo necesaria para los
flujos de cámara, sincronización y autenticación.

## Estructura

```text
app/
  (auth)/             Pantallas de registro e inicio de sesion
  (tecnico)/          Hoy, historial y cuenta
  trabajo/[id]/       Flujo de un trabajo
components/           Componentes visuales reutilizables
constants/            Estados y etiquetas del dominio
hooks/                Hooks globales activos
src/
  api/                Cliente Supabase y servicio de autenticacion
  data/               SQLite, repositorios y datos locales
  session/            Sesion y proteccion de rutas
docs/
  adr/                Decisiones arquitectonicas
  supabase/           Esquema SQL y guia de base de datos
assets/               Iconos y recursos de la aplicacion
```

## Arquitectura

```text
Expo Mobile
  |-- HTTP API -----------> Backend Express
  |                            |
  |                            `--> Supabase Auth, PostgreSQL, Storage
  |-- SQLite local ------> Cola de sincronizacion -> Backend
  `-- RouteGuard --------> Rutas protegidas del tecnico
```

La app solo usa Supabase directamente para conservar/restaurar la sesión local
con el token recibido por el backend. Las operaciones de negocio pasan por la
API HTTP.

## Estado del proyecto

Implementado y validado por compilación/arranque:

- Autenticacion mediante backend HTTP y Supabase Auth.
- Proteccion y restauracion de sesion.
- Esquema PostgreSQL con RLS.
- Persistencia local con SQLite.
- Lectura de trabajos desde SQLite y backend.
- Registro local de llegada.
- Captura local de fotos.
- CRUD de clientes, órdenes y técnicos desde la app, con formularios
  consistentes (`react-hook-form` + `Field`/`Select`) y `PATCH` que solo
  envía los campos que el usuario cambió (`formState.dirtyFields`).
- CRUD administrativo de técnicos: crear un técnico invita un usuario real de
  Supabase Auth (`auth.admin.inviteUserByEmail`); solo un perfil con
  `role = 'admin'` puede crear, modificar o desactivar técnicos, reforzado en
  backend (`requireAdmin`) y en RLS (`private.is_admin()`).
- Subida diferida de evidencias mediante Storage.

Pendiente de validación manual con Supabase y dispositivo:

- Grabación de audio y transcripción.
- Validación manual de la captura de firma SVG en dispositivo y de su envío al
  backend.
- Pruebas automatizadas de transiciones y RLS.
