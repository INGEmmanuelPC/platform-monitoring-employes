# App de tecnicos de campo

Aplicacion movil Expo para que tecnicos registren trabajos en campo, incluso cuando la conectividad sea intermitente.

## Stack

- Expo SDK 54, React Native y TypeScript estricto.
- Expo Router para navegacion por archivos.
- NativeWind v5 y Tailwind CSS v4.
- Supabase Auth, PostgreSQL, RLS y Storage.
- `expo-secure-store` para persistir la sesion.
- `expo-sqlite` como almacenamiento local.
- Zustand se reserva para el estado de sincronizacion compartido.

## Instalacion

```bash
npm install
```

## Variables de entorno

Copia `.env.example` a `.env.local` y completa los valores publicos de tu proyecto Supabase:

```text
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-clave-publica
```

No incluyas `service_role`, claves secretas ni contrasenas en la aplicacion movil. `.env.local` esta excluido por Git.

Durante la migracion se aceptan temporalmente los nombres `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, pero los nuevos entornos deben usar `EXPO_PUBLIC_*`.

## Supabase

1. Crea o abre un proyecto Supabase.
2. Habilita Email en Authentication > Providers.
3. Ejecuta `docs/supabase/001_schema_inicial.sql` desde el SQL Editor.
4. Configura confirmacion de correo y SMTP segun el entorno.
5. Crea datos de prueba asignando `trabajos.tecnico_id` al UUID de un usuario real.

El esquema crea `profiles`, `trabajos` y `evidencias`, ligadas a `auth.users`. RLS limita los trabajos y evidencias al tecnico autenticado. Los perfiles no pueden actualizarse directamente desde el cliente para evitar cambios de rol no autorizados.

## Arquitectura

```text
Expo Mobile
  -> Auth Service -> Supabase Auth
  -> SQLite local -> cola de sincronizacion -> Supabase PostgreSQL
```

Login y registro usan `src/api/auth.ts`. `AuthProvider` restaura la sesion y `RouteGuard` protege las rutas del tecnico. Las pantallas de trabajos leen primero SQLite y luego intentan refrescar desde Supabase.

El backend propio no participa en la autenticacion: `backend/src` esta reservado para logica de negocio futura que no deba vivir en el cliente.

## Ejecutar

```bash
npx expo start
```

Para limpiar la cache:

```bash
npx expo start -c
```

## Validar

```bash
npx tsc --noEmit
npm run lint
```

La validacion nativa debe incluir tambien una exportacion Android o una prueba en Expo Go. La aplicacion no debe depender de una respuesta de red para avanzar en el trabajo de campo.

## Estructura principal

- `app/`: rutas, autenticacion y flujo del tecnico.
- `components/`: componentes visuales reutilizables.
- `constants/`: estados y etiquetas del dominio.
- `src/api/`: clientes y servicios remotos.
- `src/data/`: SQLite, repositorios y lectura local/remota.
- `src/session/`: sesion y proteccion de rutas.
- `docs/`: ADR, esquema SQL y decisiones de arquitectura.

## Estado actual

La autenticacion, la persistencia de sesion, el esquema Supabase, la base SQLite, la llegada local y la captura local de fotos ya estan conectados. El audio, la firma, la subida remota y el procesador de la cola son los siguientes cortes de V0.
