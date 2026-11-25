# Avance y próximos pasos del MVP

**Equipo:** Santiago Acosta Carvajal, Emmanuel Peñuela Chica, Jerónimo López Ospina
**Fecha de este documento:** 24 de noviembre de 2026 (actualizado; la primera versión es del 22)
**Entrega:** 5 de diciembre de 2026 (el 5 cae sábado, así que el cierre real es el viernes 4)
**Tiempo que queda:** 11 días

Este documento tiene dos partes. La primera cuenta, con detalle, lo que se ha hecho (push, ícono, consentimiento de ubicación, eje del reporte, sincronización automática y reglas del servidor por rol). La segunda es lo que falta para el MVP, ordenado por qué tan necesario es. **Es la fuente de verdad del estado del proyecto: si algo cambia, se actualiza aquí.**

---

## 1. Dónde estamos

La definición de terminado del MVP es: un técnico, sin señal, marca «voy en camino», llega, toma una foto, graba una nota de voz, el cliente firma y el trabajo queda `COMPLETADO`. Al volver la red se sincroniza sin duplicados, y el admin, desde la misma app, lo aprueba y lo cierra.

Con lo hecho esta semana, **por primera vez el cierre por parte del admin es posible**: antes ningún trabajo podía llegar a `CERRADO`. Sin embargo, todavía hay piezas que bloquean la demo completa, en especial la nota de voz, la idempotencia por `event_id` y, sobre todo, **probar todo en un celular real**, que sigue siendo la deuda más grande.

| Parte de la definición de terminado | Estado |
|---|---|
| Abrir la app sin señal | Implementado, sin probar en modo avión |
| «Voy en camino», llegada, foto | Implementado, sin probar en dispositivo |
| Nota de voz | **No iniciado** (hoy es una nota escrita) |
| Firma del cliente con el dedo | Implementado, sin probar en dispositivo |
| Trabajo `COMPLETADO` | Implementado |
| Sincronización automática al volver la red | **Implementada** (sin probar en dispositivo) |
| Sincronización sin duplicados | Parcial (hay candado único; falta `event_id` con `UNIQUE`) |
| Reglas del servidor por rol (técnico no cancela ni cierra) y foto «después» | **Implementadas** en app, backend y Postgres |
| El admin aprueba y cierra desde la app | **Implementado esta semana** (sin probar en dispositivo) |
| Estilo visual elegido | Implementado, falta revisar en Android e iOS |

---

## 2. Lo que se hizo (detallado)

### 2.1 Notificaciones push (ADR 0009) · PR #14, commit `ab205ce`

**Qué hace.** Cuando el admin crea una orden o cambia el estado de la de un técnico, el técnico recibe un aviso en el teléfono (con el motivo si es una cancelación). Cuando el técnico completa un trabajo, los administradores reciben un aviso. Al tocar el aviso se abre el trabajo.

**Cómo está hecho**
- **Backend:** `PUT /auth/token-push` guarda o borra el token del teléfono; el id sale de la sesión, nunca del cuerpo. `backend/src/notificaciones.ts` decide a quién avisar (función pura, probada) y envía a Expo; si Expo falla, el cambio de estado igual se guarda.
- **Base de datos:** tabla `push_tokens` (migración `009_tokens_push.sql`) con RLS activo y **sin políticas**, así que solo el backend con `service_role` la lee.
- **App:** `usePushNotifications` registra el token al iniciar sesión y lo borra antes de cerrarla. `expo-notifications ~0.32.17` se carga con `import()` dinámico y **no se carga en Expo Go de Android**.
- **Configuración:** `google-services.json` versionado y declarado en `app.config.js`.

**Estado real.** El código está hecho y probado con pruebas automáticas. **Falta la infraestructura**, que está en manos de tu compañero (ver `SOLICITUD-ACCESO-EXPO.md`): redesplegar Render, subir la clave FCM a EAS y compilar el APK. Hasta entonces, **nunca se ha recibido un aviso en un teléfono real**.

### 2.2 Ícono de la app · PR #15, commit `d7b07b7`

El ícono era el de Expo por defecto. Ahora `icon.png`, el ícono adaptable de Android, la silueta temática, el favicon y el ícono de notificación (`notification-icon.png`, 96 px, blanco) se generan desde `logotype-navy.png`, el mismo logo del login. El ícono adaptable usa fondo blanco y se eliminó `android-icon-background.png`.

**Importante:** el ícono es parte del código nativo, así que solo se ve en un **APK compilado**. En Expo Go siempre se ve el de Expo.

### 2.3 Consentimiento de ubicación (Ley 1581 de 2012) · PR #16, commit `ab71bdc`

**Qué es y qué no es.** Es la autorización del técnico para que la app use su ubicación mientras va «en camino». **No es un checkbox que bloquea el login o el registro**, y tampoco es un acuerdo de confidencialidad: la Ley 1581 es de protección de datos personales.

**Dónde aparece y por qué.** Una sola vez por cuenta, **justo después del primer inicio de sesión del técnico**, antes de entrar a la app. No va antes del login ni en el registro porque el consentimiento es *por cuenta* (antes de iniciar sesión no se sabe de quién es), solo aplica al técnico (el admin nunca lo ve) y debe poder rechazarse sin perder el servicio.

**Cómo se comporta**
1. El técnico inicia sesión por primera vez. El `RouteGuard` ve que la respuesta está pendiente y lo lleva a `/ubicacion/consentimiento`.
2. La pantalla explica qué se recoge (la ubicación), cuándo (solo mientras un trabajo está «en camino», nunca en segundo plano), para qué (que la oficina sepa por dónde va) y por cuánto tiempo (90 días), más sus derechos como titular.
3. Tiene dos botones: **Acepto** y **Ahora no**. Con cualquiera de los dos entra a la app. **Responder que no nunca bloquea el trabajo**, solo no se registrará su recorrido.
4. La respuesta se guarda en `expo-secure-store`, con una clave por cuenta (`consentimiento_ubicacion_<id>`) y un valor con la respuesta, la fecha y la versión del texto.
5. En la pestaña **Cuenta** (solo técnicos) hay una tarjeta «Ubicación» que muestra el estado y permite **revocar** o **volver a autorizar**.

**Decisiones de diseño**
- Si el texto cambia, se sube `VERSION_CONSENTIMIENTO` y se vuelve a preguntar a todos.
- Un valor ausente, dañado o de una versión vieja cuenta como «pendiente»: ante la duda se pregunta, **nunca se asume un sí**.
- Si el almacén seguro falla al guardar, el técnico no queda atrapado: sigue y se le volverá a preguntar.
- El rastreo futuro debe llamar a `puedeRastrearUbicacion(estado)` antes de pedir el permiso del sistema.

**Archivos principales:** `src/domain/consentimiento.ts` (reglas puras), `src/constants/consentimiento.ts` (textos), `src/session/consentimientoStorage.ts`, `src/session/ConsentimientoProvider.tsx`, `src/session/RouteGuard.tsx`, `src/screens/ubicacion/ConsentimientoScreen.tsx`, `src/screens/cuenta/components/UbicacionConsentCard.tsx`. Documentado en el ADR 0010.

**Límites conocidos**
- Hoy **solo registra la decisión**: todavía no existe el rastreo GPS.
- Si el técnico entra por primera vez **sin conexión**, no se le pide el consentimiento (el rol se carga desde el servidor). El rastreo quedaría apagado, que es lo seguro.
- La prueba de la autorización queda **solo en el teléfono**. Si hay que demostrarla ante terceros, habría que guardarla también en el servidor.
- El texto legal conviene que lo revise alguien con criterio legal.
- En el primer login puede verse un instante la pantalla Hoy antes de la redirección, porque el perfil carga en segundo plano.

### 2.4 Eje del reporte sin IA (ADR 0011) · PR #17, commit `f098bd0`

**El problema.** El eje 3 estaba pensado para que un servidor transcribiera el audio y una IA redactara el reporte. Sin IA, **nada lo movía**: se quedaba en `SIN_AUDIO`, el reporte nunca llegaba a `APROBADO` y, como `COMPLETADO → CERRADO` exige `APROBADO`, **ningún trabajo podía cerrarse**.

**La solución.** El administrador redacta el reporte a mano a partir de la nota del técnico:

| Paso | Quién | Cuándo |
|---|---|---|
| `SIN_AUDIO → AUDIO_LISTO` | Técnico (automático) | Guarda su nota. Funciona sin red |
| `AUDIO_LISTO → BORRADOR` | Administrador | Redacta el texto con el trabajo `COMPLETADO` |
| `BORRADOR → BORRADOR` | Administrador | Edita el borrador |
| `BORRADOR → APROBADO` | Administrador | Aprueba; queda quién y cuándo |
| `APROBADO → ENTREGADO` | Automático | Al cerrar el trabajo, en la misma operación |

`TRANSCRIBIENDO` no se usa mientras no haya transcripción automática. Cuando exista IA se enchufa sin cambiar el resto.

**Qué se construyó, capa por capa**

*Base de datos (`010_eje_reporte.sql`)*
- Columnas nuevas en `trabajos`: `reporte_texto`, `reporte_aprobado_por`, `reporte_aprobado_at`.
- Trigger `validar_transicion_reporte`: solo permite las transiciones de la tabla, exige que el trabajo esté `COMPLETADO` y que haya texto, registra quién aprobó, y **impide que el técnico escriba el texto o la aprobación**. Un reporte aprobado ya no se edita.
- Trigger `entregar_reporte_al_cerrar`: al pasar el trabajo a `CERRADO`, el reporte queda `ENTREGADO`.
- Trigger `marcar_audio_listo`: la primera nota (o audio) del técnico pasa el reporte a `AUDIO_LISTO`.
- Relleno para trabajos que ya tenían nota. La migración se puede ejecutar dos veces.
- **Por qué en la base de datos:** la política RLS de `trabajos` deja al técnico actualizar cualquier columna de sus órdenes desde PostgREST con su JWT. Sin un guardián ahí, un técnico podía escribir `reporte = 'APROBADO'` directamente.

*Backend*
- `backend/src/reporte-state.ts`: `transicionarReporte`, función pura sobre una tabla declarativa que devuelve `{ ok, estado }` o `{ ok: false, motivo }` y nunca lanza.
- `GET /ordenes/:id/revision`: notas del técnico, si hay firma, y conteo de fotos. Solo admin.
- `PATCH /ordenes/:id/reporte` con `redactar` o `aprobar`. Solo admin, con control de concurrencia (falla si el reporte cambió entre la lectura y la escritura).
- Cerrar sigue siendo `PATCH /ordenes/:id` con `estado: CERRADO`.

*App móvil*
- `src/domain/estadoReporte.ts`: la misma regla (duplicada a propósito, ADR 0006) más `vistaRevision`, que decide qué ve el admin según los dos ejes.
- `guardarNota` avanza el eje sin red. No retrocede si el reporte ya iba más adelante, y el refresco desde el servidor ya no pisa el valor local mientras haya cambios pendientes.
- Pantalla `trabajo/[id]/revision`: muestra notas, firma y conteo de fotos; el admin edita el texto, guarda el borrador, aprueba y cierra con confirmación. Se abre con el botón «Revisar reporte» del detalle de un trabajo terminado.
- Las acciones del admin sobre el reporte **requieren conexión** (regla del eje 3).

**Límites conocidos**
- «Entregado» significa aprobado y cerrado. **El envío real al cliente (PDF o correo) no existe todavía.**
- El admin **no ve las fotos**, solo cuántas hay: falta una política de lectura en Storage para su rol.
- ~~Un técnico dueño de una orden aún puede cerrarla una vez aprobada~~: resuelto en la sección 2.6.

### 2.5 Sincronización automática (ADR 0012) · PR #19, commit `ec06843`

**El problema.** El documento de visión promete que «cuando vuelve la red, todo se sincroniza solo». Hasta entonces la cola solo se enviaba al enfocar una lista o al pulsar «Sincronizar ahora»: en una demo en modo avión el técnico tenía que acordarse de refrescar.

**Qué hace.** La cola se envía sola:

| Cuándo | Qué lo dispara |
|---|---|
| Vuelve la red | `expo-network` |
| La app vuelve a abrirse | `AppState` pasa a «active» |
| Inicio de sesión | Cuando ya se conoce la cuenta y su rol |
| Cada 30 s con la app abierta | Solo si hay algo pendiente |

- **Backoff exponencial** si falla (15 s, 30 s, 1, 2, 4 min y tope de 5). Solo frena el intento periódico: volver la red o abrir la app siempre cuentan como una oportunidad nueva. Nunca bloquea al técnico (regla 1).
- **Candado único** (`src/domain/sincronizadorUnico.ts`, expuesto en `src/data/sync-runner.ts`): es el único camino para sincronizar (listas, botón manual, automática y segundo plano). Evita que dos ejecuciones simultáneas manden la misma cola dos veces.
- **Las listas se actualizan solas**, sin esqueleto de carga, cuando la automática subió algo.
- **El perfil se reintenta al volver la red.** Antes se pedía una sola vez: si la app se abría sin señal, el rol quedaba desconocido y no se podía sincronizar ni al reconectar.
- **Tarea de segundo plano** (`expo-background-task`) como **respaldo**, no como base: el intervalo mínimo es de 15 min y el sistema decide cuándo corre (iOS suele ignorar intervalos cortos). **Solo funciona en un APK**; en Expo Go se desactiva.

**Límites conocidos:** no hay indicador visual de que se está sincronizando (banner e indicador por tarjeta siguen pendientes); el candado no cubre procesos distintos (tarea de fondo y app abierta a la vez), así que lo definitivo sigue siendo `event_id` con `UNIQUE`; `CONFLICTO` sigue sin salida; si el perfil nunca carga, no se sincroniza; requiere un **APK nuevo** (módulos nativos y un plugin).

### 2.6 Reglas del servidor por rol y foto «después» (ADR 0013) · este PR

**El problema.** El documento de visión dice que el técnico no puede enviar `CERRADO`, `CANCELADO` ni `APROBADO`, y que completar exige una foto «después». El servidor no lo cumplía: un técnico dueño de una orden podía cancelarla (por `/sync` o `PATCH /ordenes/:id`) y cerrarla una vez aprobado el reporte, y bastaba una foto «antes» para completar.

**Reglas**

| Rol | Puede |
|---|---|
| Técnico | Solo avanzar el flujo de campo: `ASIGNADO → EN_CAMINO → EN_SITIO → COMPLETADO` |
| Administrador | Todo lo válido: también cancelar, cerrar y ejecutar el flujo de campo (migración 008) |

Completar un trabajo exige **firma y al menos una foto «después»**; una foto «antes» sola no basta. La pantalla de evidencia ya exigía la foto «después» para continuar: lo que faltaba era el dominio, el backend y el SQL.

**Qué se construyó (la misma regla en tres capas)**
- *App móvil:* `transicionarTrabajo` recibe `rol` y `tieneFotoDespues`; `finalizarTrabajo` consulta solo `FOTO_DESPUES`.
- *Backend:* `puedeTransicionarPorRol` (función pura). `/sync` simula el avance de cada trabajo dentro del lote, porque varias operaciones pueden encadenarse, y si alguna transición válida no le corresponde al rol rechaza **todo el lote con 403**. `PATCH /ordenes/:id` aplica la misma regla. Completar exige `FOTO_DESPUES`.
- *Postgres (`011_reglas_servidor.sql`):* triggers `validar_rol_transicion_trabajo` y `exigir_foto_despues_al_completar`. Valen también para quien use PostgREST con su JWT sin pasar por Express. Sin JWT (SQL Editor o `service_role`) no se aplica la regla de rol, pero la foto «después» se exige siempre.

**Límites conocidos:** el técnico aún puede editar desde PostgREST columnas como cliente, dirección o descripción de sus órdenes (ver sección 3.D); no hay pantalla de admin para cancelar con motivo.

### 2.7 Pruebas y orden del repositorio

- El script `test` ahora usa `tests/*.test.mjs` (móvil y backend), para que dos ramas no editen la misma línea y no choquen al fusionarse.
- **Pruebas automáticas hoy:** móvil 56 y backend 30, todas en verde, más `tsc`, lint y `expo export --platform android` sin errores.
- **Migraciones 010 y 011:** se probaron con 21 y 13 comprobaciones en PGlite (un Postgres real en WebAssembly), usando el trigger real de la migración 008. Esas pruebas **no están en el repositorio** y usan un usuario y un RLS simulados, así que no sustituyen probarlas en Supabase real.
- **Ninguna de estas pruebas corrió en un celular ni contra un Supabase real.**

### 2.8 Documentación

- ADR 0009 (push), 0010 (consentimiento), 0011 (eje del reporte), 0012 (sincronización automática) y 0013 (reglas por rol), y nota en el 0005 (ícono).
- Pasos 12 a 14 en `mobile/docs/supabase/README.md` (migraciones 009, 010 y 011).
- `01-tecnicos-de-campo.md`: consentimiento y validación de rol marcados; en acciones de admin ya están aprobar y cerrar, falta cancelar.
- `mobile/AGENTS.md`: estado del código y reglas por rol actualizados para quien trabaje con agentes.
- `SOLICITUD-ACCESO-EXPO.md` y `GUIA-NOTIFICACIONES-PUSH.md`: guías para el push.
- Corrección: los ADR 0010 y 0011 decían `2026-11-23`; la fecha correcta es `2026-11-22`.

---

## 3. Lo que falta

Está ordenado por prioridad. **A** es lo que bloquea la definición de terminado; **B** es lo que le da valor al producto; **C** es la entrega; **D** es deuda y documentación; **E** son hallazgos de la auditoría que no estaban en ningún checklist.

### A. Imprescindible para la demo

- [ ] **Probar todo en un celular real** (la deuda más grande). Como mínimo:
  - El flujo completo del técnico: voy en camino, llegada, foto, nota, firma.
  - El consentimiento: sale una vez, «Ahora no» no bloquea, se puede revocar.
  - La revisión del admin: borrador, aprobar y cerrar.
  - Los pasos están en la sección 5 de este documento.
- [ ] **Aplicar y verificar las migraciones en el Supabase real** (004, 006, 007, 008, 009, **010** y **011**). La 010 y la 011 son nuevas: la 010 la necesita el cierre y la 011 las reglas por rol.
- [ ] **Redesplegar Render** con el código nuevo (lo hace tu compañero).
- [ ] **Nota de voz real** con `expo-audio`. Es el ítem más grande. Además de grabar, hay que:
  - Subir el audio a Storage: hoy `uploadEvidence` solo acepta fotos.
  - Aceptar el tipo `AUDIO` en la validación de `/sync` y en el RPC `sync_trabajos`: hoy solo acepta foto, firma y nota.
  - El trigger de la 010 ya trata `AUDIO` como insumo, así que el eje 3 avanza solo.
- [ ] **`event_id` (UUID con `expo-crypto`)** en `sync_queue` y restricción `UNIQUE` en Postgres, para que reenviar un lote no duplique. Es lo que garantiza «sin duplicados».
- [x] **Validación de rol en `/sync`** (técnico no cancela ni cierra). Hecho en app, backend y Postgres (sección 2.6). Falta aplicar la migración `011` en el Supabase real.
- [x] **Foto «después» obligatoria.** Hecho en las tres capas (sección 2.6).
- [x] **Sincronización automática al volver la red** (sección 2.5). Falta probarla en un celular.
- [ ] **Cancelar con motivo desde la app (admin).** La función `cancelarTrabajo` existe en la capa de datos (y ahora rechaza al técnico), pero ninguna pantalla la usa. Es lo siguiente a hacer.

### B. Lo que da valor al producto

- [ ] **Rastreo GPS en primer plano** con `expo-location` mientras el trabajo está `EN_CAMINO`, con la tabla `posiciones_pendientes` y su carril de envío aparte (tope de 500 filas, submuestreo a 30). El consentimiento ya está listo para respaldarlo.
- [ ] **Mostrar el recorrido** al admin: una lista de coordenadas con un botón «abrir en Google Maps» es lo más barato; el mapa propio exigiría API key con tarjeta.
- [ ] **El admin ve las fotos** en la pantalla de revisión (política de lectura en Storage para su rol y la UI).
- [ ] **Reporte a PDF** con `expo-print` y `expo-sharing`: fotos, nota, firma, horas y el texto aprobado. Ahora que existe `reporte_texto`, también serviría como la **entrega real al cliente**.
- [ ] **Indicador del eje de sincronización** en cada tarjeta (`SOLO_LOCAL`, `EN_COLA`, `SINCRONIZADO`, `CONFLICTO`).
- [ ] **Banner «sin conexión»** y contador de pendientes en Cuenta. Ya hay detector de red (`expo-network`, sección 2.5); falta mostrarlo.
- [ ] **Hoy e Historial** con `FlatList` o `SectionList`, con estado vacío, de carga y pull-to-refresh. Hoy usan `ScrollView` con `map`.
- [ ] **Márgenes seguros** en los botones inferiores de los pasos del flujo. Ya los usan el consentimiento y la revisión; faltan los pasos de llegada, evidencia, nota y firma.
- [ ] **Revisión visual del skeuomorfismo** en Android **e iOS**.

### C. Cierre y entrega

- [ ] **Push de punta a punta:** subir la clave FCM a EAS, compilar el APK e instalarlo, y recibir un aviso real (pasos en `SOLICITUD-ACCESO-EXPO.md`).
- [ ] **APK** instalado y probado en dos teléfonos, apuntando a la URL pública de Render.
- [ ] **Backend estable en Render** (despertar el servidor antes de la demo; túnel gratuito como plan B).
- [ ] **Ejecutar Postman** contra el backend real y capturar el rechazo de una transición inválida. Nunca se ha ejecutado.
- [ ] **Datos semilla:** 1 admin, 2 técnicos, 3 clientes y 5 órdenes en distintos estados.
- [ ] **README con el diagrama de los tres ejes.**
- [ ] **Video de 2 a 3 minutos** del recorrido completo, con un tramo en modo avión, y ensayo de la demo (máximo 7 minutos).
- [ ] **Prueba real sin señal:** modo avión, completar un trabajo, volver la red y comprobar que sincroniza sin duplicados.

### D. Deuda y documentación

- [ ] **Casilla de aceptación en el registro** (política de tratamiento de datos personales). El registro ya recoge nombre y correo y hoy no hay ninguna autorización. Es distinta del consentimiento de ubicación: sin ella no hay cuenta, y la casilla debe empezar desmarcada. Requiere un texto de política.
- [ ] **Seguridad de `trabajos`:** la política RLS deja al técnico editar desde PostgREST columnas como cliente, dirección y descripción de sus órdenes. Conviene restringir qué columnas puede tocar.
- [ ] **Guardar el consentimiento también en el servidor**, si hay que poder demostrarlo ante terceros.
- [ ] **Revisión legal** del texto del consentimiento (y de la política, cuando exista).
- [ ] **Actualizar el documento de visión (`.docx`)**: la sección 11 todavía dice que el push está fuera del alcance.
- [ ] **Actualizar el `README.md` raíz:** migraciones 009 y 010, nuevos ADR y el script de pruebas por patrón.
- [ ] **Marcar el checklist** `01-tecnicos-de-campo.md` a medida que se avance.
- [ ] **`npm audit`** reporta vulnerabilidades en el móvil: revisarlas antes de entregar.
- [ ] **Una prueba de integración mínima** (SQLite o Postman automatizado). Opcional: llevar al repositorio la prueba PGlite de la migración 010.
- [ ] **Funciones puras `estadoSync.ts`** con pruebas: el documento de visión las promete y solo existe `estadoTrabajo.ts`.

### E. Otros hallazgos de la auditoría (23 de noviembre)

Cosas que no estaban en ningún checklist y conviene tener presentes:

- [ ] **`CONFLICTO` no tiene salida.** Se marca al recibir un 409 del servidor y nada lo limpia: el trabajo queda atascado y la cola reintenta sin éxito. Tampoco se cumple la regla «la evidencia del técnico se guarda igual y el admin decide».
- [ ] **Falta el segundo reloj** (`recibido_en` del servidor junto a `ocurrido_en`). El documento de visión lo pide para marcar cuando difieren más de 5 minutos.
- [ ] **Los derechos del titular no tienen mecanismo.** La pantalla de consentimiento dice que se puede pedir suprimir o rectificar los datos, pero no hay ningún canal ni función. Hay que agregar al menos un contacto, o una acción real.
- [ ] **La retención de 90 días no está implementada.** Cuando exista el GPS hará falta un job (`pg_cron`) que borre las posiciones antiguas.
- [ ] **Backend sin endurecer:** sin límite de intentos en `/auth/login` y `/auth/register`, sin `helmet`, sin registro de peticiones y con CORS en `*` por defecto.
- [ ] **Registro abierto:** cualquiera puede crearse una cuenta de técnico desde `/auth/register`. Decidir si es intencional o si solo el admin invita.
- [ ] **Borrado duro de órdenes** (`DELETE /ordenes/:id`): se pierde el historial y las fotos quedan huérfanas en Storage. Lo coherente sería cancelar o desactivar, como con los clientes.
- [ ] **Permiso de cámara sin declarar** en `app.json`: `expo-image-picker` no está como plugin con su texto en español. Es probable que falle o lo rechacen en iOS.
- [ ] **`eas.json` solo tiene el perfil `preview`**; no hay `production` ni manejo de `versionCode`.
- [ ] **No hay CI.** Con PR fusionados a diario, un workflow que corra `tsc`, lint y las pruebas evitaría romper `develop`.
- [ ] **No hay `render.yaml`** versionado: cómo se despliega el backend solo está en la cabeza de quien lo configuró. Además `tsx` y `typescript` están en `devDependencies` y el backend arranca con `tsx`: verificar que Render los instale.
- [ ] **Qué rama despliega Render.** Es solo una pregunta para quien lo configuró: `main` va atrás de `develop` y, si Render mira `main`, un redespliegue serviría el código viejo. No se toca `main` hasta el final.
- [ ] **Web:** hay commits para la versión web, pero `expo-secure-store` no existe en web, así que ahí el consentimiento se pediría siempre. Decidir si la web se soporta.
- [ ] **Demo:** los planes gratuitos se duermen. Supabase pausa un proyecto tras unos días sin uso y Render lo duerme en minutos: despertar ambos antes de la demo.
- [ ] **Menores:** no hay «recuperar contraseña» ni registro de errores (por ejemplo, Sentry).

---

## 4. Plan sugerido hasta la entrega

La idea es probar pronto, porque lo que nunca se ha corrido en un celular es lo que más riesgo tiene. Además, se pone un congelamiento de funcionalidades para que la última semana sea solo de prueba y entrega.

| Cuándo | Foco | Qué entra |
|---|---|---|
| **Lun 23 – Mar 24 nov** | Probar y desbloquear | Aplicar migraciones (en especial la 010), redesplegar Render, probar en celular el flujo, el consentimiento y la revisión. Corregir lo que salga |
| **Mié 25 – Vie 27 nov** | Reglas del servidor | ~~Validación de rol en `/sync`~~ y ~~foto «después» obligatoria~~ (hechas el 24 nov), cancelar con motivo, `event_id` con su `UNIQUE` |
| **Sáb 28 nov – Mar 1 dic** | Lo que falta de la definición | Nota de voz real, indicador de sincronización y banner sin conexión, PDF. **Congelamiento el domingo 29** |
| **Mié 2 – Vie 4 dic** | Cierre | Prueba en modo avión, APK en dos teléfonos, datos semilla, README, video y ensayo |

**Si no alcanza el tiempo, se recorta en este orden:**
1. El rastreo GPS y el mapa. **No está en la definición de terminado.** Si se hace, que sea solo la lista de coordenadas.
2. La revisión visual en iOS, limitándola a Android si no hay dispositivo, y dejándolo escrito.
3. Las fotos en la pantalla del admin (basta con el conteo).
4. `FlatList` y márgenes seguros en los pasos secundarios.

**Lo que no se recorta**, porque es la definición de terminado: el flujo del técnico sin red, la firma, la nota de voz, la sincronización sin duplicados, las reglas en el servidor y el cierre del admin.

---

## 5. Cómo probar lo hecho

**Preparación**
1. Ejecutar `010_eje_reporte.sql` y `011_reglas_servidor.sql` en Supabase **antes** de desplegar o probar el backend nuevo.
2. Backend: `cd backend && npm run dev` (puerto 3000, comprobar con `/health`).
3. App: `cd mobile && npm start` y escanear el QR con Expo Go.
4. Celular y computador en la misma red; si falla, revisar IP de `.env.local` y firewall (ver `mobile/AGENTS.md`).

**Consentimiento** (sirve Expo Go)
1. Iniciar sesión con un técnico que no haya respondido: debe salir la pantalla una sola vez.
2. Pulsar «Acepto», cerrar y abrir la app, y cerrar y abrir sesión: no debe volver a salir.
3. Iniciar con otro técnico en el mismo teléfono: debe volver a salir.
4. Pulsar «Ahora no»: la app funciona y Cuenta dice «No autorizada».
5. Cuenta → «Revocar autorización»: el estado cambia.
6. Con un administrador no debe aparecer nada.

**Eje del reporte** (sirve Expo Go; necesita un técnico y un admin)
1. Con el técnico, completar un trabajo con foto, nota y firma. En Supabase, `reporte` debe quedar `AUDIO_LISTO`.
2. Con el admin, abrir ese trabajo en Historial y pulsar «Revisar reporte»: debe mostrar la nota, la firma y el conteo de fotos.
3. «Guardar borrador» (`BORRADOR`), editar, «Aprobar reporte» (`APROBADO`) y «Cerrar trabajo» con confirmación (`CERRADO` y reporte `ENTREGADO`).
4. Prueba negativa: con un token de técnico, `PATCH /ordenes/<id>/reporte` debe responder `403`.

**Sincronización automática** (sirve Expo Go)
1. Con red, iniciar sesión como técnico.
2. Activar modo avión y avanzar un trabajo (por ejemplo, guardar una nota): Cuenta muestra «Pendientes por subir».
3. Quitar el modo avión **sin tocar nada**: en unos segundos debe subir solo y la lista debe actualizarse.
4. Repetir mandando la app al fondo y volviendo a abrirla con red.
5. Caso difícil: cerrar la app, modo avión, abrirla (la sesión se restaura sin red) y luego volver la red: debe cargar el rol y sincronizar.

**Reglas por rol y foto «después»** (sirve Expo Go; con `curl` o Postman)
1. Con un token de **técnico**, `PATCH /ordenes/<id>` con `{"estado":"CANCELADO","motivo_cancelacion":"x"}` debe responder `403` con «Solo un administrador puede cancelar o cerrar un trabajo.»
2. Lo mismo por `POST /sync` con una operación de `CANCELADO`: debe responder `403` y no cambiar nada.
3. Con un token de **admin**, la misma cancelación debe funcionar.
4. Un trabajo con firma y solo foto «antes»: completarlo debe responder `409` pidiendo la foto «después».
5. En la app, la pantalla de evidencia no deja continuar sin la foto «después».

**Qué no se puede probar en Expo Go:** las notificaciones push, el ícono nuevo y la tarea de segundo plano. Todo eso necesita un APK compilado.
