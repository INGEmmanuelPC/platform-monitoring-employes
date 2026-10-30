# Tarea: máquina de estados de tres ejes + ubicación en vivo por trabajo

## 0. Antes de escribir código

1. Explora el repositorio y confirma la estructura real. La esperada es: workspaces de npm con `apps/movil` (Expo SDK 54 + expo-router + NativeWind v5), `apps/panel` (Next.js + Tailwind) y `packages/contrato` (Zod + TypeScript compartido). Si difiere, adáptate a lo que existe y dímelo.
2. Verifica contra la documentación oficial de Expo SDK 54 cada API de `expo-location`, `expo-task-manager`, `expo-sqlite` y `expo-constants` antes de usarla. No escribas APIs de memoria.
3. Antes de implementar, devuélveme un **plan corto**: archivos que vas a crear o tocar, en qué orden, y cualquier ambigüedad que encuentres en esta especificación. Espera mi confirmación.

Todo en TypeScript estricto. Sin ORM en el móvil: SQL explícito con `expo-sqlite`. Estado de UI en Zustand; la fuente de verdad en el celular es SQLite. Ningún texto visible al usuario queda escrito en un componente: todo va al archivo de textos.

---

## 1. Contexto del producto (léelo, define las decisiones)

App offline-first para técnicos de campo en PyMEs colombianas. El técnico registra su trabajo en zonas sin señal (fincas, veredas); al volver la red todo sube solo. Un administrador ve y aprueba desde el panel web. Después, un servidor transcribe el audio del técnico y Claude redacta un reporte que el administrador aprueba antes de enviarlo al cliente.

**Regla de oro:** ninguna transición del eje 1 que dispare el técnico puede requerir red. Si una implementación necesita red para que el técnico avance, está mal.

---

## 2. La máquina de estados: tres ejes independientes

Un trabajo NO tiene un estado; tiene tres, que avanzan a ritmos distintos. Nunca los combines en un único enum. Un trabajo puede estar a la vez `COMPLETADO` (eje 1), `SOLO_LOCAL` (eje 2) y `AUDIO_LISTO` (eje 3): es exactamente su estado al bajar de la finca.

### Eje 1 — El trabajo (`EstadoTrabajo`)

`ASIGNADO → EN_CAMINO → EN_SITIO → COMPLETADO → CERRADO`, más `CANCELADO`.

| Transición | Quién | Guarda (qué se exige) | Red |
|---|---|---|---|
| `ASIGNADO → EN_CAMINO` | Técnico | Nada. Un toque. **Inicia el rastreo de ubicación** (sección 4). | No |
| `EN_CAMINO → EN_SITIO` | Técnico | Marca de tiempo + coordenadas al mejor esfuerzo. Si el GPS no responde en 3 s, se registra igual con `ubicacion_no_disponible: true`. **Nunca bloquea.** Detiene el rastreo. | No |
| `EN_SITIO → COMPLETADO` | Técnico | Guarda dura: ≥1 foto de tipo `despues` **y** firma del cliente (acta de conformidad). | No |
| `COMPLETADO → CERRADO` | Administrador | El eje 3 debe estar en `APROBADO`. Ocurre junto con el paso a `ENTREGADO`. | Sí (servidor) |
| `{ASIGNADO, EN_CAMINO, EN_SITIO} → CANCELADO` | Administrador | Motivo obligatorio (texto no vacío). No se puede cancelar desde `COMPLETADO` en adelante. | Sí (servidor) |

`CERRADO` y `CANCELADO` son terminales. No hay transiciones hacia atrás en el eje 1.

### Eje 2 — La sincronización (`EstadoSync`)

Describe si lo que el técnico hizo ya existe en el servidor. Se **deriva** de la cola de salida; no se edita a mano.

| Estado | Significado |
|---|---|
| `SOLO_LOCAL` | Hay eventos en la cola que nunca se han intentado enviar. |
| `EN_COLA` | Hay un envío en curso o eventos pendientes de reintento tras un fallo de red. |
| `SINCRONIZADO` | No quedan eventos pendientes para este trabajo y el servidor confirmó todos. |
| `CONFLICTO` | El servidor aceptó y guardó los eventos, pero chocan con un cambio del servidor (ver regla 4 del protocolo). Requiere acción del administrador. |

Transiciones: cualquier evento nuevo local → `SOLO_LOCAL`; el enviador toma el lote → `EN_COLA`; confirmación total → `SINCRONIZADO`; fallo de red → se queda en `EN_COLA` con backoff exponencial; respuesta de conflicto del servidor → `CONFLICTO`. Implementa `derivarEstadoSync(eventosDelTrabajo)` como función pura.

### Eje 3 — El reporte (`EstadoReporte`)

`SIN_AUDIO → AUDIO_LISTO → TRANSCRIBIENDO → BORRADOR → APROBADO → ENTREGADO`

| Transición | Quién | Detalle |
|---|---|---|
| `SIN_AUDIO → AUDIO_LISTO` | Técnico | Guardó un dictado, **o** escribió la nota a mano. Registra `insumo: 'audio' \| 'texto'`. Sin red. |
| `AUDIO_LISTO → TRANSCRIBIENDO` | Servidor | Solo si `insumo === 'audio'`. |
| `AUDIO_LISTO → BORRADOR` | Servidor | Solo si `insumo === 'texto'` (salta la transcripción). |
| `TRANSCRIBIENDO → BORRADOR` | Servidor | Transcripción exitosa + redacción generada. |
| `TRANSCRIBIENDO → AUDIO_LISTO` | Servidor | Fallo de transcripción; incrementa `intentos`. Tras 3 intentos, deja de reintentar y marca para revisión manual. |
| `BORRADOR → APROBADO` | Administrador | Puede editar el texto antes. **Única vía hacia el cliente.** |
| `APROBADO → ENTREGADO` | Servidor | Envío al cliente. En la misma operación el eje 1 pasa a `CERRADO`. |

Nada generado automáticamente llega al cliente sin pasar por `APROBADO`. Esa regla vive en la máquina, no en la UI.

### Implementación en `packages/contrato`

- Enums como `z.enum([...])` y tipos inferidos.
- Una función pura por eje: `transicionarTrabajo(estado, accion, contexto)`, `transicionarReporte(...)`, `derivarEstadoSync(...)`. Retornan `{ ok: true, estado, evento }` o `{ ok: false, motivo }`. Nunca lanzan excepciones por reglas de negocio.
- `contexto` trae lo que las guardas necesitan (fotos, firma, estado del eje 3, rol de quien actúa). Las funciones no tocan SQLite, red ni reloj: el reloj entra como parámetro.
- Valida el rol: el técnico no puede disparar transiciones de administrador ni de servidor, y viceversa.
- Exporta una tabla de transiciones declarativa (datos, no `if` anidados) para poder generar el diagrama y testearla.

### Eventos (contrato de sincronización)

Unión discriminada con `z.discriminatedUnion('tipo', [...])`. Todo evento lleva:

```ts
{
  event_id: string;        // UUID generado en el dispositivo (expo-crypto)
  trabajo_id: string;
  tecnico_id: string;
  tipo: TipoEvento;         // 'EN_CAMINO_MARCADO' | 'LLEGADA_MARCADA' | 'FOTO_AGREGADA' | 'NOTA_AGREGADA' | 'AUDIO_GUARDADO' | 'FIRMA_CAPTURADA' | 'TRABAJO_COMPLETADO' | ...
  payload: ...;             // específico por tipo
  ocurrido_en: string;      // ISO, reloj del celular
  recibido_en: string | null; // ISO, reloj del servidor; null en el dispositivo
  version_esquema: 1;
}
```

Las cuatro reglas del protocolo, que el código debe respetar:

1. **Eventos, no entidades.** Se envía "llegó a las 9:14", no "así quedó el trabajo". El registro de eventos solo se agrega; nunca se edita.
2. **Idempotencia.** El servidor descarta `event_id` repetidos (restricción única). Reenviar un lote es inofensivo.
3. **Dos relojes siempre.** `ocurrido_en` y `recibido_en`. El panel marca visualmente cuando difieren más de 5 minutos.
4. **Quién gana.** En hechos de campo gana el dispositivo; en asignación y datos del cliente gana el servidor. Caso concreto: si el admin canceló mientras el técnico completaba sin señal, los eventos del técnico **se guardan igual** (nunca se descarta evidencia de campo) y el trabajo queda en `CONFLICTO` para que el administrador decida.

En el móvil, cambiar el estado del trabajo y escribir el evento en la cola de salida ocurre en **una sola transacción SQLite** (`withTransactionAsync` o la API equivalente que verifiques). O se escriben los dos o ninguno.

---

## 3. Pruebas de la máquina (obligatorias)

En `packages/contrato`, con el runner que ya use el repo (si no hay, propón Vitest):

- Toda transición válida de la tabla produce el estado y el evento esperados.
- Toda transición no listada es rechazada con un motivo legible.
- `EN_SITIO → COMPLETADO` falla sin foto `despues`, falla sin firma y pasa con ambas.
- `EN_CAMINO → EN_SITIO` pasa con GPS nulo y deja `ubicacion_no_disponible: true`.
- `COMPLETADO → CERRADO` falla si el reporte no está en `APROBADO`.
- `CANCELADO` falla desde `COMPLETADO` y falla sin motivo.
- Un técnico no puede disparar `APROBADO`, `CERRADO` ni `CANCELADO`.
- Reporte con `insumo: 'texto'` nunca pasa por `TRANSCRIBIENDO`.
- `derivarEstadoSync` para cola vacía, todo pendiente, envío en curso, todo confirmado y conflicto.

---

## 4. Ubicación en vivo por trabajo

**Principio de diseño: se rastrea el trabajo, no a la persona.** La ubicación en vivo solo existe mientras el trabajo está en `EN_CAMINO`. Empieza con el toque "Voy en camino" y se detiene sola al pasar a `EN_SITIO`, `CANCELADO` o al cerrar sesión. Define los estados que rastrean en una constante del contrato (`ESTADOS_CON_RASTREO = ['EN_CAMINO']`) para poder ampliarla a `EN_SITIO` sin tocar lógica.

La llegada y la salida siguen siendo eventos del eje 1 con sus coordenadas (son evidencia). Las posiciones del recorrido son otra cosa: descartables, de alto volumen, y van por **un carril aparte**, nunca por la cola de eventos.

### 4.1 Abstracción en el móvil

```ts
interface RastreadorUbicacion {
  iniciar(trabajoId: string): Promise<ResultadoInicio>; // puede fallar por permisos: nunca bloquea el eje 1
  detener(): Promise<void>;
  disponibleEnSegundoPlano(): boolean;
}
```

Dos implementaciones, elegidas en tiempo de ejecución según el entorno (`Constants.executionEnvironment`; verifica el valor exacto para Expo Go en SDK 54):

**Fase 1 — `RastreadorPrimerPlano` (implementar ahora, funciona en Expo Go)**

- `Location.watchPositionAsync` con `accuracy: Balanced`, `timeInterval: 30000`, `distanceInterval: 50`.
- Solo pide permiso de primer plano.
- Si la app pasa a segundo plano, las actualizaciones se pausan; al volver, se reanudan si el trabajo sigue `EN_CAMINO`.
- Cada posición se escribe en la tabla SQLite `posiciones_pendientes`. Nunca hace `fetch` directo desde el callback.

**Fase 2 — `RastreadorSegundoPlano` (dejar escrito, detrás de bandera, NO activar en Expo Go)**

- `TaskManager.defineTask` a nivel de módulo, y `Location.startLocationUpdatesAsync` con `accuracy: Balanced`, `timeInterval: 60000`, `distanceInterval: 100`, `foregroundService` con título y cuerpo en el archivo de textos, y `pausesUpdatesAutomatically: true`.
- La tarea solo escribe en SQLite; el envío lo hace el carril de posiciones.
- Requiere en `app.json` el plugin de `expo-location` con `isAndroidBackgroundLocationEnabled` e `isIosBackgroundLocationEnabled`, y development build. Deja la configuración documentada en un comentario, sin activarla mientras usemos Expo Go.
- Permiso en dos pasos: primero primer plano, luego segundo plano.

### 4.2 Consentimiento (obligatorio antes de pedir cualquier permiso)

Pantalla propia, mostrada una vez, que explique en lenguaje simple: qué se recoge (ubicación), cuándo (solo mientras un trabajo está "en camino"), para qué (que la oficina sepa por dónde va) y cuánto tiempo se guarda. Esto cubre el aviso de la Ley 1581 de 2012 y el aviso destacado que exige Google Play para la ubicación en segundo plano. Si el técnico niega el permiso, el trabajo avanza igual: solo no hay mapa en vivo para ese trabajo.

### 4.3 Carril de posiciones en el móvil

- Tabla SQLite `posiciones_pendientes(id TEXT PK, trabajo_id, lat, lng, precision_m, ocurrido_en)`. El `id` es un UUID para idempotencia.
- Enviador propio, disparado en los mismos momentos que la cola de eventos (al abrir la app, al volver la red, al deslizar) más cada 60 s mientras haya rastreo activo y red.
- **Submuestreo al reconectar:** si hay más de 30 posiciones pendientes de un trabajo, envía la más reciente más una muestra uniforme de 30. Las demás se borran. Las posiciones no son evidencia.
- Borra lo confirmado por el servidor. Tope duro de 500 filas: si se supera, descarta las más viejas.

### 4.4 Servidor (Supabase, como migraciones SQL versionadas)

- `posiciones`: historial de solo agregar, con `id uuid pk`, `trabajo_id`, `tecnico_id`, `empresa_id`, `lat`, `lng`, `precision_m`, `ocurrido_en`, `recibido_en default now()`. `insert ... on conflict (id) do nothing`.
- `ultima_posicion`: una fila por técnico (`tecnico_id pk`), con *upsert* que **solo** reemplaza si el `ocurrido_en` entrante es más reciente que el guardado, para que un lote viejo que llega tarde no retroceda el punto.
- RLS: el técnico solo inserta sus propias filas; el administrador solo lee las de su `empresa_id`.
- Habilita Realtime (publicación) solo sobre `ultima_posicion`.
- Retención: deja documentada una función programada que borre `posiciones` con más de 90 días, para cumplir lo prometido en el consentimiento.

### 4.5 Panel (Next.js)

- Mapa con Leaflet (react-leaflet) o MapLibre y teselas libres. Sin Google Maps.
- Carga inicial de `ultima_posicion` y luego suscripción Realtime filtrada por empresa.
- Muestra solo técnicos con un trabajo `EN_CAMINO`.
- **Frescura visible siempre:** cada marcador muestra "hace N min". Verde si tiene menos de 3 min, ámbar entre 3 y 15, gris con la etiqueta "sin señal" a partir de 15. Nunca se muestra un punto viejo como si fuera actual.
- Al hacer clic en un trabajo, dibuja el recorrido desde `posiciones`.

---

## 5. Orden de trabajo y criterio de terminado

1. Contrato: enums, eventos, tablas de transición y funciones puras, con todas las pruebas de la sección 3 en verde.
2. Móvil: transacción estado + evento en SQLite, y uso de la máquina en las pantallas existentes.
3. Ubicación fase 1 + pantalla de consentimiento + carril de posiciones.
4. Migraciones de Supabase + RLS + Realtime.
5. Mapa en el panel.
6. `RastreadorSegundoPlano` escrito y detrás de bandera.

Una tarea está terminada cuando pasa el chequeo de tipos y el lint; tiene pruebas si tocó transiciones o sincronización; se probó en modo avión si toca el flujo del técnico (marcar "voy en camino" sin red, recorrer, volver la red y verificar que las posiciones y los eventos suben sin duplicados); y no deja textos escritos en los componentes.

Al terminar cada paso, resume qué hiciste, qué decisiones tomaste que no estaban en esta especificación y qué quedó pendiente.