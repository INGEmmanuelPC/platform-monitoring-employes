# 0005 - Identidad de marca y sistema tipográfico

- **Estado:** aceptada
- **Fecha:** 2026-09-24

## Contexto

El producto tenía slogan ("El trabajo lo haces tú. El reporte, solo.") y dos
archivos de logo (`logotype-black.png`, `logotype-navy.png`, navy `#1B4965`)
generados por el equipo, pero ningún nombre de marca ni sistema tipográfico
aplicado en código. El pedido explícito fue que la IA definiera el nombre de
marca y eligiera la tipografía de: nombre de marca, eslogan, títulos de
menú/pantalla y botones, atada al valor central del producto — que el técnico
se comunique de forma confiable con su jefe sin importar la conectividad.

También estaba pendiente conectar el logo navy a los puntos de entrada de la
app (login, registro, splash), acordado en una conversación previa.

## Decisión

- **Nombre de marca: "Cuadrilla".**
- **Dos familias tipográficas, tres pesos**, cargados con `expo-font` +
  `expo-splash-screen` (`preventAutoHideAsync`/`hideAsync`) en
  `app/_layout.tsx`:
  - **Archivo Bold** (`font-display`) — nombre de marca y todo título de
    pantalla/menú (tabs, headers de Stack, listas y formularios del CRUD).
    Geométrica, reconocible de un vistazo para alguien cansado y de pie.
  - **IBM Plex Sans Regular** (`font-slogan`) — eslogan bajo el nombre de
    marca. IBM Plex se diseñó para documentación técnica; refuerza
    "comunicar con claridad" en vez de solo decorar.
  - **IBM Plex Sans SemiBold** (`font-button`) — texto de botones
    (`components/Button.tsx`).
- Los nombres literales de cada peso viven en `constants/fonts.ts` (React
  Native no sintetiza pesos de una fuente custom) y se exponen como
  utilidades Tailwind vía `theme.extend.fontFamily` en `tailwind.config.js`.
- Nuevo `components/BrandHeader.tsx` (logo + nombre + eslogan), usado en
  `app/(auth)/login.tsx` y `register.tsx`. **No** se agregó a
  `app/(tecnico)/_layout.tsx`: el logo vive solo en puntos de entrada, no en
  las pestañas del técnico (ver comentario existente sobre el objetivo grande
  para alguien cansado y de pie).
- `app.json`: `expo-splash-screen.image` → `logotype-navy.png`;
  `android.adaptiveIcon.monochromeImage` → `logotype-black.png`.
- Los paquetes `@expo-google-fonts/{archivo,ibm-plex-sans}` se importan por
  **subruta de peso** (`@expo-google-fonts/archivo/700Bold`, no el paquete
  raíz): importar del índice del paquete empaqueta las 18 (Archivo) o 14 (IBM
  Plex Sans) variantes de la familia aunque solo se use una. Verificado con
  `npx expo export --platform android`: por el índice, ~5.3 MB de fuentes sin
  usar en `dist/`; por subruta, ~560 KB. Documentado también en `AGENTS.md`.

## Alternativas consideradas

- **IBM Plex Mono** para timestamps/estado de sincronización: se instaló el
  paquete (encaja con el ángulo de "evidencia" del producto) pero no se
  conectó todavía — no estaba dentro de lo pedido explícitamente (nombre,
  eslogan, títulos, botones) y añadirlo sin un uso concreto era alcance no
  solicitado. Queda disponible para cuando se toquen timestamps/`IndicadorSync`.
- Reemplazar `expo.icon` y las capas `foreground`/`background` del ícono
  adaptativo de Android con los nuevos logos: no se hizo. Esas capas tienen
  zonas de seguridad estrictas y el archivo actual es un placeholder del
  template de Expo sin diseñar para ese propósito; cambiarlas requiere un
  export específico, no solo apuntar la ruta.

## Consecuencias

- Nuevas dependencias: `@expo-google-fonts/archivo`,
  `@expo-google-fonts/ibm-plex-sans`, `@expo-google-fonts/ibm-plex-mono`
  (esta última instalada, no conectada aún).
- `app/_layout.tsx` ahora bloquea el primer render hasta que las tres
  variantes de fuente cargan (`if (!fontsLoaded && !fontsError) return null`),
  coordinado con la splash screen para que no haya salto de tipografía visible.
- Bundle nativo: +557 KB por las tres fuentes usadas +325 KB por
  `logotype-navy.png` embebido en el JS bundle vía `require()` en
  `BrandHeader`. Verificado con `npx expo export --platform android`.
- Verificado con `npx tsc --noEmit`, `npx expo lint` y
  `npx expo export --platform android`; no probado aún en modo avión en
  dispositivo físico (pendiente, como toda esta serie de cambios visuales).
