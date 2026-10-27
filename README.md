# App Empleados

Aplicación para técnicos de servicio en campo. El monorepo contiene una app móvil Expo y una API Express; Supabase proporciona autenticación, PostgreSQL, RLS y almacenamiento de evidencias.

## Estructura

- `mobile/`: aplicación Expo Router / React Native.
- `backend/`: API HTTP Express y conexión con Supabase.
- `mobile/docs/supabase/`: esquema y migraciones SQL.
- `01-tecnicos-de-campo.md`: checklist MVP del equipo.
- `entrega-29-octubre.md`: criterios y estado de la entrega práctica.

Para instrucciones detalladas de cada módulo, consulta [`mobile/README.md`](mobile/README.md) y [`backend/README.md`](backend/README.md).

## Requisitos

- Node.js LTS y npm.
- Expo Go compatible con Expo SDK 54, o un development build compatible.
- Proyecto de Supabase configurado para la app y el backend.

## Configuración y ejecución

Instala las dependencias por separado en cada módulo:

```powershell
cd backend
Copy-Item .env.example .env
npm install
```

Completa `backend/.env` con las credenciales de Supabase y vuelve a la raíz del repo para iniciar la API:

```powershell
cd backend
npm run dev
```

En otra terminal, configura `mobile/.env.local` según `mobile/.env.example`, instala e inicia Expo:

```powershell
cd mobile
npm install
npm start
```

Expo mostrará un QR para abrir la app con Expo Go. El script de inicio móvil actualiza `EXPO_PUBLIC_API_URL` para la red local; revisa el archivo local si el dispositivo no logra conectarse a la API.

Nunca incluyas archivos `.env`, claves de servicio ni credenciales reales en Git. La clave `SUPABASE_SERVICE_ROLE_KEY` es exclusiva del backend.

## Base de datos

Ejecuta las migraciones en el orden indicado en [`mobile/docs/supabase/README.md`](mobile/docs/supabase/README.md). Para una base existente que aún no admite el estado `CANCELADO`, aplica también `004_estado_cancelado.sql`. No es necesario aplicar esa migración adicional a una base nueva creada con el esquema inicial actualizado.

## Validación

Ejecuta cada comando desde su módulo:

```powershell
# mobile/
npm test
npm run lint
npx tsc --noEmit
npx expo install --check
npx expo export --platform android

# backend/
npm test
npm run typecheck
```

## Resumen de los últimos cambios

### Interfaz y navegación

- Se restauró la visibilidad de las acciones del menú de Gestión; las opciones se renderizan al abrir el menú y usan botones con área de toque adecuada.
- Se revisaron los botones de inicio y cierre de sesión, formularios, CRUD y navegación.
- Se centralizaron colores y estilos en los tokens visuales y se ajustaron alertas, encabezados, selectores, indicadores de sincronización y pantallas administrativas para mantener contraste y estados claros.
- El checklist registra áreas táctiles mínimas de 48 pt y contraste de texto mínimo de 4.5:1. La revisión visual en dispositivos Android e iOS todavía está pendiente.

### Flujo del trabajo

- Se incorporó una máquina de estados con transiciones y guardas para llegada, finalización, cierre y cancelación.
- Se añadió el paso «Voy en camino»; la llegada ahora exige que la orden esté `EN_CAMINO`.
- Los cambios de estado locales se validan y encolan en una transacción SQLite.
- La firma manuscrita se captura como SVG y se conserva como evidencia local.
- `CANCELADO` está contemplado en el esquema inicial, la migración incremental, el tipo móvil y la validación del backend.
- Las transiciones inválidas se rechazan en el backend tanto al sincronizar (`POST /sync`) como al actualizar una orden (`PATCH /ordenes/:id`). Las escrituras comparan el estado leído para evitar aplicar un cambio sobre una orden que cambió concurrentemente. Las órdenes nuevas comienzan en `ASIGNADO`.

### Pruebas y estado de entrega

- `mobile/tests/estadoTrabajo.test.mjs`: 6 pruebas de transiciones y guardas del flujo móvil.
- `backend/tests/trabajo-state.test.mjs`: 3 pruebas de transiciones válidas, inválidas e idempotencia.
- Validaciones ejecutadas en la última revisión: ambas suites, ESLint, TypeScript móvil y backend, verificación de dependencias Expo y exportación Android.
- Expo Go se inició en el puerto 8081 para comprobar el arranque de Metro.
- Falta validar en un teléfono o emulador el flujo visual y offline, ejecutar la transición inválida contra el backend conectado a Supabase y aplicar la migración `004` en la base de demostración existente.

El commit de auditoría que contiene esos cambios es `f0bebb0` (`fix: validate UI, functionality and October delivery requirements`). El estado del equipo y las tareas pendientes se mantienen en los checklists vinculados arriba.
