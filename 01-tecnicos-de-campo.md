# App para técnicos de campo · Checklist MVP

**Equipo:** Santiago Acosta Carvajal, Emmanuel Peñuela Chica, Jerónimo López Ospina
**Fuente:** `DocVisionSantiEmmanJero.docx` · **Fecha límite:** viernes 5 de diciembre de 2026 (7 semanas)

## Diagnóstico

Es el proyecto con la arquitectura más madura del curso: offline-first con SQLite como fuente de verdad, cola de sincronización transaccional, ADRs, 23 rutas tipadas y 11 hooks. El corte V0 funciona de punta a punta.

El riesgo **no** es técnico, es de alcance: el documento plantea GPS, máquina de estados formal, consentimiento, eventos idempotentes, audio, firma, IA y panel Next.js. No cabe todo en 7 semanas. Lo que vuelve esto un MVP demostrable es **cerrar el ciclo de un trabajo de verdad** (firma real + "voy en camino" + cancelación + que el admin pueda cerrar), no la transcripción con IA.

Observaciones:
- La firma y el dictado son *placeholders*: hoy el requisito "mínimo 1 foto + firma" de `EN_SITIO → COMPLETADO` no se puede cumplir de verdad.
- `COMPLETADO → CERRADO` exige un reporte `APROBADO`, pero sin IA ni panel admin nadie puede aprobar. Hay que darle al admin una acción mínima dentro de la app.
- Sin pruebas automatizadas, la máquina de estados pura de `src/domain/` es el lugar ideal para empezar (funciones puras = fáciles de probar).
- Usan Expo SDK 54 + NativeWind v5 (preview). La guía de diseño del curso usa NativeWind v4: las clases son casi idénticas, pero `boxShadow` y gradientes nativos requieren React Native 0.76+ con la nueva arquitectura (SDK 54 la trae).

## Fuera del alcance (dejarlo explícito en el documento)

- Panel de administrador en Next.js (lo que necesite el admin va dentro de la app, en el área `cuenta`).
- Transcripción automática y redacción con IA (APIs de pago). El reporte se redacta a mano a partir de la nota.
- Rastreo en segundo plano (requiere development build y permisos extra): queda el stub documentado.
- Publicación en App Store / Play Store.

## Checklist

### Obligatorio · Diseño de la interfaz

Estilo elegido: **Skeuomorfismo**. La elevación y los bordes táctiles hacen que las acciones importantes se distingan al usar el celular de pie, con guantes o bajo el sol.

- [x] Elegir el estilo y justificarlo en el documento de visión (una línea: por qué encaja con un técnico en campo). Justificación registrada en `mobile/docs/adr/0008-sistema-visual-skeuomorfico.md`.
- [x] Definir tokens (colores, radios, sombras) en `mobile/src/constants/design.ts`, no sueltos en cada pantalla.
- [x] Construir los componentes base en ese estilo: botón primario/secundario, tarjeta de trabajo, campo de texto, indicador de estado (los tres ejes).
- [x] Aplicarlo a las pantallas principales: Hoy, detalle del trabajo y los pasos del flujo (llegada → evidencia → nota → firma).
- [x] Estados visuales de presionado y deshabilitado en todos los botones.
- [x] Contraste legible a pleno sol (texto mínimo 4.5:1) y áreas de toque de al menos 48 × 48. Pares verificados en `mobile/src/constants/design.ts`; `MIN_TOUCH_TARGET` y `MIN_HIT_SLOP` son los tokens que todos los `Pressable` referencian.
- [x] Probado en Android **y** iOS (las sombras se ven distinto en cada uno). `RAISED_SURFACE` ahora resuelve con `Platform.select` (sombras nativas en iOS, `elevation` + `shadowColor` en Android), reforzado con el borde inferior ya presente en cada superficie.

### Fase 1 · Cerrar el flujo del trabajo (20 oct – 2 nov)

- [ ] Crear `src/domain/estadoTrabajo.ts` con `transicionarTrabajo(estado, accion, contexto)` y sus guardas.
- [ ] Hacer que `src/data/trabajos.ts` llame a la máquina **antes** de escribir en SQLite (dentro de la misma `withTransactionAsync`).
- [ ] Agregar `CANCELADO` al tipo, al CHECK de Supabase y al enum de Zod del backend.
- [ ] Botón "Voy en camino" (`marcarEnCamino()` + `useWorkDeparture`) como primer paso del flujo; `marcarLlegada()` exige `EN_CAMINO`.
- [ ] Lienzo de firma real (por ejemplo `react-native-signature-canvas`, o `react-native-svg` + gesture-handler) guardando la firma como SVG/PNG en SQLite.
- [ ] Configurar un runner de pruebas (Jest con `jest-expo`, o Vitest solo para `src/domain/`) y probar todas las transiciones válidas e inválidas.

### Fase 2 · Ubicación y administración mínima (3 – 16 nov)

- [ ] Pantalla de consentimiento (Ley 1581/2012), una sola vez por cuenta, guardada en `expo-secure-store`.
- [ ] Rastreo GPS en primer plano con `expo-location` (`watchPositionAsync`) solo mientras el trabajo está `EN_CAMINO`; se detiene al llegar, cancelar o cerrar sesión.
- [ ] Tabla `posiciones_pendientes` y su carril de envío separado de `sync_queue` (tope de 500 filas, submuestreo a 30).
- [ ] Mapa simple en el detalle del trabajo con el recorrido enviado (`react-native-maps`; ver nota de costos abajo).
- [ ] Acciones de admin dentro de la app: aprobar reporte, cerrar trabajo (`COMPLETADO → CERRADO`) y cancelar con motivo obligatorio.
- [ ] Validación mínima de rol en el backend: un técnico no puede enviar `CERRADO`, `CANCELADO` ni `APROBADO` por `/sync`.
- [ ] `event_id` (UUID con `expo-crypto`) en `sync_queue` + restricción `UNIQUE` en Postgres para que reenviar no duplique.

### Fase 3 · Lo que da valor y el pulido (17 – 28 nov)

- [ ] Grabación de audio real con `expo-audio` en el paso de dictado (se guarda el archivo y se sube con la evidencia; sin transcripción).
- [ ] Indicador visible del eje de sincronización en cada tarjeta (`SOLO_LOCAL`, `EN_COLA`, `SINCRONIZADO`, `CONFLICTO`).
- [ ] Banner "sin conexión" y contador de eventos pendientes en la pestaña Cuenta.
- [ ] Reporte del trabajo exportable a PDF con `expo-print` + `expo-sharing` (fotos, nota, firma, horas de llegada/salida): es lo que hoy se hace a mano y retrasa la facturación.
- [ ] Listas de Hoy e Historial con `FlatList` (o `SectionList` agrupada por día en Historial), con estado vacío, de carga y pull-to-refresh.
- [ ] Márgenes seguros con `react-native-safe-area-context` (insets), sobre todo en el botón fijo inferior de cada paso.
- [ ] Prueba real en un lugar sin señal: modo avión → completar un trabajo → volver la red → verificar sincronización.

### Cierre · Entrega (1 – 5 dic)

- [ ] Backend desplegado en un plan gratuito (por ejemplo Render; Supabase ya está en plan gratuito) o, como mínimo, expuesto con un túnel gratuito para la demo.
- [ ] APK de prueba con EAS Build (plan gratuito) o `eas build --local`; si no, demo en Expo Go.
- [ ] Datos semilla: 1 admin, 2 técnicos, 3 clientes, 5 órdenes en distintos estados.
- [ ] README con cómo correr el proyecto y el diagrama de los tres ejes.
- [ ] Video corto (2–3 min) del recorrido completo de un trabajo, con un tramo en modo avión.

## Nota de costos

- **Mapas:** en Expo Go el mapa de Google funciona sin configurar nada. En un APK propio, Google Maps pide API key con cuenta de facturación (tarjeta). Si no quieren registrar tarjeta: `react-native-maps` con `UrlTile` de OpenStreetMap, o mostrar el recorrido solo como lista de coordenadas + botón "abrir en Google Maps" (`Linking`), que es gratis.
- Todo lo demás (expo-location, expo-audio, expo-print, Supabase gratuito, EAS gratuito) no cuesta.

## Definición de terminado

Un técnico abre la app sin señal, marca "voy en camino", llega, toma una foto, graba una nota de voz, el cliente firma con el dedo y el trabajo queda `COMPLETADO`. Al volver la red se sincroniza sin duplicados, y el admin, desde la app, lo aprueba y lo cierra. Todo con el estilo visual elegido.
