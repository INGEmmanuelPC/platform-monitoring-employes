# Auditoría y continuidad de entrega · Técnicos de campo

**Fecha de auditoría:** 28 de octubre de 2026
**Repositorio:** `platform-monitoring-employes`
**Rama final:** `develop`, basada en `691ea9f`
**Resultado:** parcialmente listo. Las correcciones locales y los artefactos de entrega están preparados; falta instalar la migración en el Supabase autorizado y ejecutar comprobaciones con el backend de demo, Postman y un teléfono.

## Estado de Git y continuidad

La auditoría anterior ya había traído `develop` hasta `691ea9f`. Al retomar, se actualizó la referencia del remoto `origin` (`https://github.com/INGEmmanuelPC/platform-monitoring-employes.git`) mediante `git fetch origin develop`. En ese momento, `HEAD` y `origin/develop` apuntaban a `691ea9f388d435800a14229ed05e7bfee78ff8f7`, sin commits entrantes. Los cambios revisados en esta entrega se confirmaron en un commit de `develop` y se publicaron en `origin/develop`; el estado final se registró tras comprobar el push.

El checkout real está en `platform-monitoring-employes/`. La carpeta contenedora `App-Empleados` también tiene un repositorio vacío en `main`; no se usó para cambiar el proyecto.

## Hallazgos iniciales

- La máquina móvil, la transacción local de estado y la llegada ya existían. El backend comprobaba saltos de estado en PATCH, pero completar no verificaba firma/foto y `/sync` aplicaba cada operación por separado.
- La carga de trabajos leía SQLite primero, pero un error posterior de red terminaba mostrando error de carga y ocultaba el resultado local.
- La firma táctil SVG y la captura de fotos ya estaban integradas con SQLite, pero el cliente aceptaba cualquier SVG no vacío y no había guarda equivalente de firma en servidor.
- La cola ya retenía registros frente a errores HTTP, pero el borrado local de la cola no se confirmaba en una sola transacción, la carga de foto cambiaba de ruta en cada reintento y no se destacaban conflictos `409`.
- No había colección de Postman ni entorno importable.
- El estilo, los tokens y el documento de visión ya existen. `01-tecnicos-de-campo.md` contiene la justificación y una sección explícita «Fuera del alcance».
- Está versionada `004_estado_cancelado.sql`, y `001_schema_inicial.sql` también permite `CANCELADO`; no había evidencia de que `004` esté aplicada en el Supabase remoto.
- No se encontró ningún `.apk` bajo el repositorio ni en su carpeta contenedora. El `EXPO_PUBLIC_API_URL` local apunta a una IP LAN de desarrollo; no se encontró una URL pública de Render versionada. No se puede confirmar a qué backend apunta la APK ausente.
- El historial sí contiene commits pertinentes de la semana; no hay commits nuevos de esta auditoría.

## Prioridades aplicadas

- **P0:** validar en el servidor la transición, la firma, la foto y la cancelación; evitar cambios parciales de sincronización; crear Postman.
- **P1:** preservar la lectura SQLite sin red, conservar cola/conflictos, hacer idempotentes los reintentos y documentar la migración necesaria.
- **P2:** confirmar el skeuomorfismo, los tokens y «Fuera del alcance» en los documentos existentes. No se rediseñaron pantallas porque esos requisitos ya están cubiertos en el código.

## Matriz de trazabilidad

| ID | Requisito | Archivo/componente responsable | Estado inicial | Evidencia inicial | Acción | Estado final | Prueba/evidencia final |
|---|---|---|---|---|---|---|---|
| A | Máquina de estados, guardas, cancelación y rechazo de estados/acciones desconocidos | `mobile/src/domain/estadoTrabajo.ts`, `backend/src/trabajo-state.ts` | Parcial | Transiciones puras existentes; tipos cerrados, pero entradas no validadas en runtime; faltaban pruebas de desconocidos | Endurecer lectura de mapas; validar firma SVG con trazo | Implementado, sin verificación completa | `npm test` móvil y backend: pruebas de estados desconocidos y SVG pasan |
| B | SQLite y cola local consistentes y transaccionales | `mobile/src/data/trabajos.ts`, `mobile/src/data/database.ts` | Parcial | Cambios locales de estado y cola ya compartían transacción; confirmación de cola tras respuesta era operación por operación | Guardar cancelación, ordenar por ID, confirmar borrados/estado en una transacción | Implementado, sin verificación completa | TypeScript y export Android pasan; falta simular fallo de SQLite/dispositivo |
| C | Offline, reintentos, recuperación y rechazos | `mobile/src/data/use-trabajos.ts`, `mobile/src/data/trabajos.ts`, `backend/src/server.ts` | Parcial | Lectura local existente, pero la red podía ocultarla; cola retenida sin estado de conflicto visible | Mantener SQLite si falla red, `CONFLICTO` en 409, reintentar de forma idempotente, RPC atómico | Implementado, sin verificación completa | Inspección de flujo y export Android; modo avión/dispositivo pendiente |
| D | «Voy en camino» y llegada con error comprensible y guardas | `mobile/src/screens/trabajo/hooks/useWorkDeparture.ts`, `useWorkArrival.ts`, `mobile/src/data/trabajos.ts`, backend | Parcial | Botón y transacción local ya existían; llegada dependía del dominio | Preservado y contrastado con dominio/API | Implementado, sin verificación completa | Suite de dominio confirma `ASIGNADO→EN_CAMINO`, `EN_CAMINO→EN_SITIO` y rechaza llegada directa |
| E | Foto y firma real, persistencia y bloqueo de finalización | `mobile/src/screens/trabajo/components/FirmaPad.tsx`, `useWorkSignature.ts`, `mobile/src/data/trabajos.ts`, backend | Parcial | Captura táctil/cámara y almacenamiento local existentes; servidor no exigía firma | Requerir trayectoria SVG con inicio y movimiento localmente y en servidor; bloquear finalización sin firma/foto remotas | Implementado, sin verificación completa | Pruebas puras del SVG pasan; Postman preparado; no ejecutado contra Supabase |
| F | Backend como autoridad para `/sync` y `PATCH /ordenes/:id` | `backend/src/server.ts`, `backend/src/trabajo-state.ts`, migración 006 | Parcial | PATCH comprobaba transición; sincronización mutaba cada operación y permitía campos de payload sin lista permitida | Validación de evidencia en PATCH; payload restringido; RPC transaccional y guardas de negocio en PostgreSQL | Implementado, sin verificación completa | Typecheck y pruebas puras pasan; endpoint real no se ejecutó |
| G | Colección, entorno y README Postman con pruebas positivas/negativas | `postman/` | Incumplido | No existía colección | Crear requests de salud/login/lectura/PATCH/sync, pruebas de rechazo, estado persistido, lote atómico e idempotencia | Implementado, sin verificación completa | Ambos JSON parsean; Newman no está instalado; faltan credenciales/fixtures |
| H | Compatibilidad Supabase y estado de migraciones 004/006/007 | `mobile/docs/supabase/*.sql`, `backend/src/server.ts` | Parcial, según consultas compartidas por el usuario | RPC `sync_trabajos(jsonb)` existe y `authenticated` tiene EXECUTE; falta política UPDATE de `storage.objects` para reintentos `upsert` | Añadir migración 007 acotada al bucket y carpeta del usuario; comprobar columna y trigger de 006 en remoto | Implementado localmente, remoto pendiente | Usuario confirmó RPC/EXECUTE y compartió políticas; no se ejecutaron cambios remotos |
| I | Pruebas unitarias, integración y persistencia | `mobile/tests/`, `backend/tests/` | Parcial | Nueve pruebas móviles y tres del servidor pasaban antes; sin integración | Añadir estados desconocidos y firma SVG en ambos módulos | Implementado, sin verificación completa | 11 pruebas móviles y 5 backend pasan; integración con SQLite/Supabase pendiente |
| J | Skeuomorfismo, tokens, contraste y controles táctiles | `mobile/src/constants/design.ts`, `Button.tsx`, `TrabajoCard.tsx`, `EstadoTrabajoIndicator.tsx` | Cumplido en código | Tokens compartidos, elevación/bordes, texto de estado y área táctil de 48 pt ya estaban presentes | Revisar sin ampliar el rediseño | Implementado, sin verificación completa | Contrastes calculados: mínimo 5.26:1; controles inspeccionados en código y ADR 0008; sin captura en dispositivo |
| K | Visión con decisión de estilo y «Fuera del alcance» | `01-tecnicos-de-campo.md`, `mobile/docs/adr/0008-sistema-visual-skeuomorfico.md` | Cumplido | Justificación del uso en campo y alcance de MVP explícitos | Conservar como documento fuente; no duplicar | Verificado | Encabezados y texto inspeccionados |
| L | Preservar y comprobar APK y backend de demo | Artefacto APK, `mobile/app.config.js`, configuración local | No verificable | No había APK bajo repo; la URL pública de demo no está en archivos versionados | Buscar también en carpeta contenedora, no reconstruir | Pendiente | No se encontró APK; `adb` no está disponible; falta ruta/URL proporcionada por el equipo |
| M | Variables de entorno y secretos | `backend/.env.example`, `mobile/.env.example`, código | Parcial | Ejemplos sin valores reales; configuración real local fuera de Git | No imprimir ni versionar secretos; usar baseUrl local como plantilla Postman | Implementado, sin verificación completa | Archivos nuevos contienen credenciales vacías; variables locales no se imprimieron |
| N | Evidencia de commits de la semana | Historial Git en `develop` | Cumplido | Historial con commits pertinentes del 26–28 oct | Registrar hashes/mensajes reales | Verificado | `git log` comprobado; no se inventaron commits ni fechas |

## Cambios implementados

- `backend/src/server.ts`: `/sync` delega la tanda completa al RPC `sync_trabajos`; el backend valida el identificador de orden, firma SVG y foto, exige motivo de cancelación y evita cambiar el estado si la transición no corresponde. `/evidencias/upload` recibe un ID estable y sobrescribe el mismo objeto en reintentos.
- `backend/src/trabajo-state.ts`, `backend/src/validation.ts`, `backend/tests/trabajo-state.test.mjs`: rechazo de estados desconocidos y validación reutilizable de firma con trazo; se añade el campo validado `motivo_cancelacion`.
- `mobile/docs/supabase/006_sync_atomico_y_cancelacion.sql`: agrega motivo de cancelación, una función `SECURITY INVOKER` que valida/aplica hasta 50 operaciones dentro de una transacción bajo RLS, un trigger de transición para bloquear escrituras directas que omitan el backend y un UUID de evidencia determinista para reintentos. El backend nuevo requiere que esta migración esté instalada.
- `mobile/src/data/trabajos.ts`, `database.ts`, `types.ts`: guarda motivo local, valida la firma por trayectoria, ordena operaciones empatadas por su ID de cola y confirma el borrado de cola/estado sincronizado en una transacción. Los rechazos 409 guardan error/intentos y marcan el trabajo `CONFLICTO` sin perder la cola.
- `mobile/src/data/use-trabajos.ts`: mantiene visible la lectura SQLite ante desconexión.
- `mobile/src/api/entities.ts`, `http.ts`, `mobile/src/screens/trabajo/hooks/useWorkSignature.ts`: ruta estable de evidencia, error HTTP con status y validación de firma en el flujo táctil.
- `postman/TecnicosCampo.postman_collection.json`, `TecnicosCampo.local.postman_environment.json`, `README.md`: colección importable sin credenciales, entorno de ejemplo y procedimiento de preparación de fixtures.
- `mobile/README.md`, `mobile/docs/supabase/README.md`: describen la atomicidad requerida, orden de migraciones y SQL para comprobar el esquema remoto.

No se modificó el documento de visión porque ya contiene el estilo elegido, su justificación y una sección «Fuera del alcance» suficiente. No se generó APK ni se modificó `.env`.

## Postman

Rutas reales incluidas: `GET /health`, `POST /auth/login`, `GET /ordenes`, `GET /ordenes/:id`, `PATCH /ordenes/:id` y `POST /sync`. Hay comprobaciones para salto `ASIGNADO→EN_SITIO`, completar sin firma, transición válida, estado desconocido, payload vacío, cancelación terminal, atomicidad del lote y reintento idempotente. Los scripts leen el trabajo después de las mutaciones/rechazos.

La colección y el entorno se pueden importar y sus JSON son válidos. **No se ejecutó en Postman/Newman ni contra la demo**: Newman no está instalado, los UUID son fixtures que debe preparar el responsable en un Supabase de pruebas, y la URL pública de Render no está versionada. El README de Postman especifica el procedimiento.

## Pruebas ejecutadas

| Comando | Resultado |
|---|---|
| `cd mobile; npm test` | 11/11 pruebas pasan |
| `cd backend; npm test` | 5/5 pruebas pasan |
| `cd mobile; npx tsc --noEmit` | Pasa |
| `cd backend; npm run typecheck` | Pasa |
| `cd mobile; npm run lint` | Pasa |
| `cd mobile; npx expo export --platform android --output-dir .audit-export-android` | Bundle Hermes Android de 5.48 MB exportado. La primera ejecución encontró una restricción de escritura en la carpeta temporal aislada; al dirigir `TEMP`/`TMP` a una carpeta temporal del workspace, terminó correctamente. Los artefactos temporales se retiraron. No es una APK. |
| Parseo Node de colección y entorno | JSON válido |
| `git diff --check` | Pasa; Git mostró advertencias de conversión LF/CRLF de Windows |

No se ejecutaron pruebas de integración SQLite, llamadas a Supabase, Newman ni pruebas de dispositivo. `psql`, `supabase`, `newman` y `adb` no están disponibles en este entorno.

La API comprueba que la evidencia exista y contenga una trayectoria SVG con inicio y movimiento; el móvil obtiene esos puntos de eventos táctiles. El protocolo actual no incluye atestación criptográfica del dispositivo, así que un cliente HTTP manipulado podría fabricar una trayectoria con ese formato. La captura táctil real queda pendiente de comprobar manualmente en teléfono.

## APK y conexión de demo

La búsqueda recursiva bajo el repositorio y su carpeta contenedora no encontró ningún `.apk`; por eso no hay ruta, tamaño ni SHA-256 que registrar. No se reconstruyó. La configuración de Expo toma la URL desde `EXPO_PUBLIC_API_URL`; en el entorno local actual es una dirección LAN temporal, no comprobada desde Android. No hay una URL pública Render en los archivos versionados. El equipo debe proporcionar la APK existente y confirmar la URL del servicio antes de la demo.

## Supabase

- `004_estado_cancelado.sql` está en el repo y vuelve a crear la restricción `trabajos_estado_check` incluyendo `CANCELADO`. Su estado en el proyecto Supabase de demo **no se pudo comprobar**.
- El usuario confirmó que `to_regprocedure('public.sync_trabajos(jsonb)')` devuelve la función y que `authenticated` tiene permiso EXECUTE. La columna y el trigger de 006 aún no se verificaron.
- La salida de `pg_policies` compartida muestra políticas de Storage SELECT e INSERT, pero no UPDATE. El backend sube fotos con `upsert: true`, que requiere SELECT, INSERT y UPDATE. Se añadió localmente `007_storage_upsert_reintentos.sql`; falta aplicarla al proyecto Supabase correcto y comprobar el reintento.
- No se ejecutaron migraciones ni cambios remotos.

No se ejecutaron migraciones ni cambios de datos remotos.

## Evidencia de commits de la semana

| Hash | Fecha | Mensaje |
|---|---|---|
| `691ea9f` | 2026-10-28 | `Configura APK Cuadrilla con backend Render` |
| `71bda8d` | 2026-10-27 | `Merge pull request #11 from INGEmmanuelPC/feat/crud-admin-rol-tecnico-y-soft-delete-clientes` |
| `fa29cc7` | 2026-10-27 | `feat(mobile,backend): fix role label, add tecnico_id to orders, soft-delete clients` |
| `00d27da` | 2026-10-26 | `Corrige botones, conexión local y firma` |
| `f0bebb0` | 2026-10-26 | `fix: validate UI, functionality and October delivery requirements` |

Son commits observados en el historial real de `develop`; los cambios de esta auditoría se registran en el commit de entrega indicado en el historial Git.

## Pendientes externos

1. Confirmar la URL pública correcta de Render y la APK final existente.
2. Confirmar el proyecto Supabase de prueba; verificar CHECK/columna/trigger de 004/006 y aplicar `004` o `006` solo si las consultas indican que falta; aplicar `007_storage_upsert_reintentos.sql`.
3. Desplegar el backend que contiene la llamada RPC y comprobar la revisión en `GET /health`.
4. Crear fixtures identificables y ejecutar la colección en Postman con un técnico de prueba.
5. Ejecutar el flujo en un teléfono Android: modo avión con trabajos ya cargados, «Voy en camino», llegada, foto, trazo de firma, cierre de app/reapertura y sincronización posterior.
6. Volver a compilar/verificar la APK solo si el equipo determina que su revisión no corresponde al código/backend de demo actual. La APK original debe conservarse.

## Guion de demo (7 minutos)

1. (30 s) Abrir la APK acordada e iniciar sesión con el técnico de prueba contra el backend de demo.
2. (45 s) Abrir el trabajo `ASIGNADO`, pulsar **Voy en camino** y mostrar `EN_CAMINO`.
3. (45 s) Pulsar **Ya llegué** y mostrar `EN_SITIO`.
4. (60 s) Tomar foto antes/después requeridas, según las instrucciones del flujo; guardar una nota si está dentro del tiempo.
5. (60 s) Abrir firma, trazarla con el dedo y confirmar; mostrar `COMPLETADO`.
6. (30 s) En un fixture `EN_SITIO` separado sin firma, intentar completar y mostrar el bloqueo móvil.
7. (90 s) En Postman, con token y `ordenIdInvalid` en `ASIGNADO`, ejecutar **Rechazar ASIGNADO → EN_SITIO**; mostrar `409` del backend y luego ejecutar la lectura que confirma que sigue `ASIGNADO`.
8. (resto) Mostrar el estado de sync/cola y dejar explícito si la red o Supabase impidieron una comprobación.

Este guion está preparado, pero no se declara probado en APK, Postman ni teléfono hasta completar los pendientes externos.
