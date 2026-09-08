# Platform Monitoring Employees

Aplicacion movil para tecnicos de servicio en campo. Permite autenticarse,
consultar trabajos asignados y registrar avances desde el dispositivo, incluso
cuando la conectividad es intermitente.

## Caracteristicas

- Registro, inicio y cierre de sesion con Supabase Auth.
- Persistencia segura de la sesion con `expo-secure-store`.
- Rutas protegidas para el tecnico mediante Expo Router.
- SQLite local como fuente de lectura para el trabajo de campo.
- Refresco de trabajos desde Supabase cuando hay conectividad.
- Registro local de llegada con hora y cola de sincronizacion.
- Captura local de evidencias fotograficas antes y despues.
- Politicas RLS para proteger trabajos, perfiles y evidencias.

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

## Requisitos

- Node.js LTS
- npm
- Expo Go compatible con Expo SDK 54, o un development build compatible
- Proyecto de Supabase

## Instalacion

```bash
npm install
```

## Configuracion de Supabase

1. Crea un proyecto en Supabase.
2. En **Authentication > Providers > Email**, habilita el proveedor Email.
3. Abre **SQL Editor** y ejecuta todo el archivo
   `docs/supabase/001_schema_inicial.sql`.
4. Configura la confirmacion de correo segun el entorno.
5. Crea un usuario desde la aplicacion o desde **Authentication > Users**.

El esquema crea las tablas `profiles`, `trabajos` y `evidencias`, relacionadas
con `auth.users`. Tambien crea triggers, indices y politicas RLS. Cada tecnico
solo puede consultar y modificar sus propios trabajos y evidencias.

## Variables de entorno

Copia el archivo de ejemplo:

```powershell
Copy-Item .env.example .env.local
```

Completa `.env.local` con los valores publicos de Supabase:

```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-clave-publica
```

Puedes obtenerlos en **Project Settings > API**:

- **Project URL** -> `EXPO_PUBLIC_SUPABASE_URL`
- **Publishable key** o antigua **anon key** -> `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Nunca uses `service_role`, `secret keys`, contrasenas ni tokens privados en la
aplicacion movil. `.env.local` esta excluido de Git.

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

## Flujo de prueba

```text
Registro -> Confirmacion de correo -> Inicio de sesion
    -> Trabajo asignado -> Marcar llegada
    -> Foto antes -> Foto despues
```

El registro de llegada y las fotografias se guardan primero en SQLite. El
tecnico no debe quedar bloqueado por una perdida de conectividad.

## Validacion

```bash
npx tsc --noEmit
npm run lint
npx expo export --platform android
```

Tambien se recomienda probar el flujo principal con el dispositivo en modo
avion despues de haber cargado los datos locales.

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
  |-- Auth Service ------> Supabase Auth
  |-- SQLite local ------> Cola local de sincronizacion
  |                              |
  |                              `--> Supabase PostgreSQL
  `-- RouteGuard --------> Rutas protegidas del tecnico
```

Supabase se utiliza directamente desde la aplicacion movil para autenticacion
y lectura remota. No existe un backend Express intermedio en este repositorio.

## Estado del proyecto

Implementado:

- Autenticacion con Supabase.
- Proteccion y restauracion de sesion.
- Esquema PostgreSQL con RLS.
- Persistencia local con SQLite.
- Lectura de trabajos desde SQLite y Supabase.
- Registro local de llegada.
- Captura local de fotos.

Pendiente para los siguientes cortes de V0:

- Procesador de la cola y sincronizacion remota de evidencias.
- Subida de archivos a Supabase Storage.
- Grabacion de audio.
- Firma digital del cliente.
- Pruebas automatizadas de transiciones y RLS.
