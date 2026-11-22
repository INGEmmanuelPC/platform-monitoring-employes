# Avance y próximos pasos del MVP

**Equipo:** Santiago Acosta Carvajal, Emmanuel Peñuela Chica, Jerónimo López Ospina
**Fecha de este documento:** 22 de noviembre de 2026
**Entrega:** 5 de diciembre de 2026 (el 5 cae sábado, así que el cierre real es el viernes 4)
**Tiempo que queda:** 13 días

Este documento tiene dos partes. La primera cuenta, con detalle, lo que se hizo desde el último balance (push, ícono, consentimiento de ubicación y eje del reporte). La segunda es lo que falta para el MVP, ordenado por qué tan necesario es.

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
| Sincronización sin duplicados | Parcial (falta `event_id`) |
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
- Un técnico dueño de una orden aún puede cerrarla una vez aprobada (validación de rol pendiente, ver 3.1).

### 2.5 Pruebas y orden del repositorio

- El script `test` ahora usa `tests/*.test.mjs` (móvil y backend), para que dos ramas no editen la misma línea y no choquen al fusionarse.
- **Pruebas automáticas hoy:** móvil 41 y backend 24, todas en verde, más `tsc`, lint y `expo export --platform android` sin errores.
- **Migración 010:** se probó con 21 comprobaciones en PGlite (un Postgres real en WebAssembly), usando el trigger real de la migración 008. Esa prueba **no está en el repositorio** y usa un usuario y un RLS simulados, así que no sustituye probarla en Supabase real.
- **Ninguna de estas pruebas corrió en un celular ni contra un Supabase real.**

### 2.6 Documentación

- ADR 0009 (push), 0010 (consentimiento) y 0011 (eje del reporte), y nota en el 0005 (ícono).
- Pasos 12 y 13 en `mobile/docs/supabase/README.md` (migraciones 009 y 010).
- `01-tecnicos-de-campo.md`: consentimiento marcado; en acciones de admin ya están aprobar y cerrar, falta cancelar.
- `SOLICITUD-ACCESO-EXPO.md` y `GUIA-NOTIFICACIONES-PUSH.md`: guías para el push.
- Corrección: los ADR 0010 y 0011 decían `2026-11-23`; la fecha correcta es `2026-11-22`.

---

## 3. Lo que falta

Está ordenado por prioridad. **A** es lo que bloquea la definición de terminado; **B** es lo que le da valor al producto; **C** es la entrega; **D** es deuda y documentación.

### A. Imprescindible para la demo

- [ ] **Probar todo en un celular real** (la deuda más grande). Como mínimo:
  - El flujo completo del técnico: voy en camino, llegada, foto, nota, firma.
  - El consentimiento: sale una vez, «Ahora no» no bloquea, se puede revocar.
  - La revisión del admin: borrador, aprobar y cerrar.
  - Los pasos están en la sección 5 de este documento.
- [ ] **Aplicar y verificar las migraciones en el Supabase real** (004, 006, 007, 008, 009 y **010**). La 010 es nueva y la necesita el cierre.
- [ ] **Redesplegar Render** con el código nuevo (lo hace tu compañero).
- [ ] **Nota de voz real** con `expo-audio`. Es el ítem más grande. Además de grabar, hay que:
  - Subir el audio a Storage: hoy `uploadEvidence` solo acepta fotos.
  - Aceptar el tipo `AUDIO` en la validación de `/sync` y en el RPC `sync_trabajos`: hoy solo acepta foto, firma y nota.
  - El trigger de la 010 ya trata `AUDIO` como insumo, así que el eje 3 avanza solo.
- [ ] **`event_id` (UUID con `expo-crypto`)** en `sync_queue` y restricción `UNIQUE` en Postgres, para que reenviar un lote no duplique. Es lo que garantiza «sin duplicados».
- [ ] **Validación de rol en `/sync`.** Hoy el servidor no distingue roles: un técnico dueño de una orden puede enviar `CANCELADO` y, una vez aprobado el reporte, `CERRADO`. El documento de visión dice que solo el admin cancela y cierra.
- [ ] **Foto «después» obligatoria.** El documento exige al menos una foto «después», pero la app, el backend y el SQL aceptan cualquiera de las dos. Hay que igualarlo en las tres capas.
- [ ] **Cancelar con motivo desde la app (admin).** La función `cancelarTrabajo` existe en la capa de datos pero ninguna pantalla la usa.

### B. Lo que da valor al producto

- [ ] **Rastreo GPS en primer plano** con `expo-location` mientras el trabajo está `EN_CAMINO`, con la tabla `posiciones_pendientes` y su carril de envío aparte (tope de 500 filas, submuestreo a 30). El consentimiento ya está listo para respaldarlo.
- [ ] **Mostrar el recorrido** al admin: una lista de coordenadas con un botón «abrir en Google Maps» es lo más barato; el mapa propio exigiría API key con tarjeta.
- [ ] **El admin ve las fotos** en la pantalla de revisión (política de lectura en Storage para su rol y la UI).
- [ ] **Reporte a PDF** con `expo-print` y `expo-sharing`: fotos, nota, firma, horas y el texto aprobado. Ahora que existe `reporte_texto`, también serviría como la **entrega real al cliente**.
- [ ] **Indicador del eje de sincronización** en cada tarjeta (`SOLO_LOCAL`, `EN_COLA`, `SINCRONIZADO`, `CONFLICTO`).
- [ ] **Banner «sin conexión»** y contador de pendientes en Cuenta (hoy no hay detector de red).
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

---

## 4. Plan sugerido para los 13 días

La idea es probar pronto, porque lo que nunca se ha corrido en un celular es lo que más riesgo tiene. Además, se pone un congelamiento de funcionalidades para que la última semana sea solo de prueba y entrega.

| Cuándo | Foco | Qué entra |
|---|---|---|
| **Lun 23 – Mar 24 nov** | Probar y desbloquear | Aplicar migraciones (en especial la 010), redesplegar Render, probar en celular el flujo, el consentimiento y la revisión. Corregir lo que salga |
| **Mié 25 – Vie 27 nov** | Reglas del servidor | Validación de rol en `/sync`, foto «después» obligatoria, cancelar con motivo, `event_id` con su `UNIQUE` |
| **Sáb 28 nov – Mar 1 dic** | Lo que falta de la definición | Nota de voz real, indicador de sincronización y banner sin conexión, PDF. **Congelamiento el domingo 29** |
| **Mié 2 – Vie 4 dic** | Cierre | Prueba en modo avión, APK en dos teléfonos, datos semilla, README, video y ensayo |

**Si no alcanza el tiempo, se recorta en este orden:**
1. El rastreo GPS y el mapa. **No está en la definición de terminado.** Si se hace, que sea solo la lista de coordenadas.
2. La revisión visual en iOS, limitándola a Android si no hay dispositivo, y dejándolo escrito.
3. Las fotos en la pantalla del admin (basta con el conteo).
4. `FlatList` y márgenes seguros en los pasos secundarios.

**Lo que no se recorta**, porque es la definición de terminado: el flujo del técnico sin red, la firma, la nota de voz, la sincronización sin duplicados, las reglas en el servidor y el cierre del admin.

---

## 5. Cómo probar lo hecho esta semana

**Preparación**
1. Ejecutar `010_eje_reporte.sql` en Supabase **antes** de desplegar o probar el backend nuevo.
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

**Qué no se puede probar en Expo Go:** las notificaciones push y el ícono nuevo. Ambos necesitan un APK compilado.
