# Contexto del proyecto para asistentes de IA

Lee este archivo completo antes de proponer o escribir código. Contiene
decisiones ya tomadas: no las re-litigues, no las "mejores" por tu cuenta.

## Qué es esto

App móvil para técnicos de servicio en campo (plomería, mantenimiento,
jardinería, inspecciones) en Colombia. El técnico registra su trabajo en el
celular **aunque no tenga señal**, y ese registro se convierte en un reporte
profesional para el cliente sin que nadie lo escriba a mano.

Tres roles: **técnico** (app móvil, este repo), **administrador** (panel web,
aún no existe) y **cliente final** (recibe el reporte por correo, no instala
nada).

## Antes de escribir código

Expo cambia rápido y tu conocimiento previo puede estar desactualizado.
**Consulta la documentación exacta de la versión en
https://docs.expo.dev/versions/v54.0.0/ antes de escribir código que use
cualquier módulo de Expo.** No respondas de memoria sobre APIs de Expo.

## Reglas que no se negocian

Salen del diseño de producto. Romper cualquiera de estas rompe el producto,
no solo el código.

1. **Ninguna acción del técnico puede requerir red.** Si una pantalla espera
   una respuesta del servidor para dejar avanzar al técnico, está mal diseñada.
   El trabajo de campo ocurre justo donde no hay internet.

2. **Un trabajo tiene tres estados, no uno.** Son ejes independientes que
   avanzan por separado (ver `constants/trabajos.ts`):
   - `EstadoTrabajo` — lo mueve el técnico, sin conexión
   - `EstadoSync` — lo mueve el sistema, según haya red
   - `EstadoReporte` — lo mueven el servidor y el administrador, solo en línea

   En una finca sin señal un trabajo está `COMPLETADO` + `SOLO_LOCAL` +
   `AUDIO_LISTO` **al mismo tiempo**. No los colapses en un solo campo.

3. **La firma del cliente no es el reporte.** El cliente firma un acta de
   conformidad sobre la evidencia que existe sin señal (horas, fotos, notas).
   El reporte redactado se genera después, en el servidor, y **solo se envía
   tras la aprobación de un administrador**. Nunca se manda texto generado
   automáticamente sin revisión humana.

4. **Máximo cinco toques por trabajo** en el camino feliz. El técnico usa la
   app cansado y de pie. Cada pantalla o confirmación extra es una razón para
   volver a WhatsApp.

5. **Nada de texto escrito directo en los componentes.** Los oficios cambian
   los nombres de las cosas ("visita" vs "servicio" vs "orden").

## Stack — fijo, no proponer alternativas

| Capa | Elección | Nota |
|---|---|---|
| App móvil | Expo SDK 54 + expo-router | TypeScript estricto, rutas por archivos |
| Estilos | NativeWind v5 + Tailwind v4 | Ya instalado y funcionando |
| BD local | `expo-sqlite` con SQL explícito | **Sin ORM a propósito**: el núcleo de sincronización necesita control directo de las transacciones |
| Backend | Supabase | Postgres + auth con RLS + storage |
| Panel admin | Next.js + Tailwind | Aún no empieza |
| Estado en móvil | Zustand | **No React Query**: la fuente de verdad es SQLite, no un caché de red |
| Transcripción | Servicio de STT aparte | La API de Claude **no recibe audio**: primero se transcribe, después se redacta |

Descartados con razón: Firebase (sync offline es caja negra), WatermelonDB /
PowerSync (se llevan el aprendizaje y complican Expo Go), ORM en el celular.

## Límites de Expo Go — verificados, no asumidos

El equipo desarrolla en **Expo Go**, y eso bloquea cosas:

| Capacidad | Expo Go | Consecuencia |
|---|---|---|
| `expo-sqlite`, cámara, ubicación en primer plano | Sí | Todo el núcleo funciona |
| **Notificaciones push remotas** | **No** (Android, desde SDK 53) | El técnico **no recibe push**: abre la app y ella sincroniza. Modelo de jalar, no de empujar. |
| **Ubicación en segundo plano** | **No** | No hay rastreo continuo. Se capturan coordenadas **por evento**: llegada y salida. |
| Tareas en segundo plano | Parcial | La sincronización automática no puede depender de esto todavía |

No propongas notificaciones push ni rastreo en vivo: no funcionan en el entorno
actual y ya fue una decisión documentada, no un olvido.

## Estado actual del código

Ya existe:

- Navegación completa del técnico (esqueleto, sin lógica):
  - `app/(tecnico)/` — pestañas: Hoy, Historial, Cuenta
  - `app/trabajo/[id]/` — Stack del flujo: llegada, evidencia, dictado, firma
- `constants/trabajos.ts` — los tres ejes de estado + datos de ejemplo
- `components/` — `Button`, `Field`, `IndicadorSync`, `IconSymbol`
- NativeWind v5 configurado y verificado en dispositivo

Todavía **no** existe: SQLite, cola de sincronización, backend, autenticación,
cámara real, audio real, lienzo de firma, panel de administrador.

Los datos de `constants/trabajos.ts` son de ejemplo y se reemplazan por SQLite.

## Trampas ya conocidas — no las "arregles"

- **`overrides.react-native-css.lightningcss` está fijado en `1.30.1` a
  propósito.** Subirlo rompe el bundle nativo con
  `failed to deserialize; expected an object-like struct named Specifier`.
  `@tailwindcss/node` necesita su propio `1.32.0`, por eso el override está
  acotado a `react-native-css` y no es global. Ya pasó una vez; no lo repitas.

- **Verificar en web no basta.** NativeWind usa PostCSS en web y un compilador
  distinto en nativo. Un cambio de estilos o de dependencias hay que probarlo
  con `npx expo export --platform android` o en un dispositivo real.

- **`typedRoutes` está activo.** Al agregar o mover rutas hay que arrancar el
  servidor una vez para regenerar los tipos, o el chequeo de tipos falla con
  rutas fantasma.

## Cómo trabajamos

- Toda decisión de arquitectura se escribe como ADR en `docs/adr/`
  (contexto, decisión, alternativas, consecuencias). Si vas a tomar una
  decisión que afecte a otros, escribe el ADR.
- Una tarea está terminada cuando: pasa `npx tsc --noEmit` y `npx expo lint`,
  tiene prueba automática si tocó sincronización o transiciones de estado,
  **se probó en modo avión** si toca el flujo del técnico, y otra persona
  revisó el PR.
- La lógica de sincronización y de transiciones debe ser código puro,
  testeable sin levantar la app.

## Prioridad actual

**V0 — un corte vertical, de punta a punta.** Un trabajo: verlo, marcar
llegada, una foto, una nota, firma, y que sobreviva a cerrar la app y volver a
abrirla. Sin voz, sin PDF, sin mapa, sin roles. Desplegado y demostrable.

Si algo no es necesario para que el técnico termine **un** trabajo, no es V0.
