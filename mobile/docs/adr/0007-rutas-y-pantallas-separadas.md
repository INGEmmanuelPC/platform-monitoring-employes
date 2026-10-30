# 0007 - `app/` solo enruta; pantallas y piezas viven en `src/`

- **Estado:** aceptada
- **Fecha:** 2026-10-07

## Contexto

El ADR 0006 dejó `app/` para Expo Router y el resto del cliente bajo `src/`.
Las rutas ya eran delgadas (2 a 18 líneas), pero `src/components/` mezclaba
tres cosas distintas: piezas reutilizables (`Button`, `Field`), pantallas
completas (`LoginScreen`, `EntityScreens`, `AccountContent`) y configuración de
navegación o proveedores (`TecnicoTabs`, `AppProviders`). Además había pantallas
grandes con varias responsabilidades:

- `EntityScreens.tsx` (326 líneas): definiciones de entidades, reglas de
  validación, listado, formulario, detalle y confirmación de borrado.
- `AccountContent.tsx`: perfil, cola de sincronización y menú animado.
- Pantallas con bloques de interfaz repetidos (tarjetas de foto, avisos de
  error, vacío de listas, layout de login y registro).
- `TecnicoTabs`, `TrabajoStack`, `FirmaScreen` y `LlegadaScreen` con todo el
  JSX en una sola línea.

## Decisión

- **`app/` solo define rutas.** Cada archivo importa y renderiza una pantalla de
  `src/screens/` o un navegador de `src/navigation/`. Sin estado ni interfaz
  propia.
- **`src/screens/<área>/`** contiene la pantalla completa, con una carpeta por
  área: `auth`, `tecnico`, `trabajo`, `cuenta`, `crud`. Las piezas que solo
  usa esa pantalla viven en `src/screens/<área>/components/`.
- **`src/components/`** queda solo para piezas reutilizables entre áreas
  (`Button`, `Field`, `Select`, `BrandHeader`, `ErrorBanner`, `EmptyState`,
  `IconSymbol`, `IndicadorSync`).
- **`src/navigation/`** recibe `TecnicoTabs` y `TrabajoStack`;
  **`src/providers/`** recibe `AppProviders`.
- Las pantallas grandes se parten en piezas de una sola responsabilidad:
  - CRUD: `entityDefinitions.ts` (datos y reglas), `EntityListScreen`,
    `EntityFormScreen`, `EntityDetailScreen`, `EntityFormFields`,
    `EntityListItem`, `DeleteEntityPanel`.
  - Cuenta: `AccountProfileCard`, `PendingSyncCard`, `ManagementMenu`,
    `ManagementLinks`. Los enlaces de gestión estaban escritos dos veces
    (menú visible y copia invisible para medir la altura); ahora es un solo
    componente usado en ambos sitios.
  - Auth: `AuthFormLayout` y `AuthSwitchLink`, compartidos por login y registro.
  - Trabajo: `TrabajoResumenCard`, `PasoLink`, `FotoEvidenciaCard`, `FirmaPad`.
  - Técnico: `TrabajoHoyCard`, `TrabajoHistorialCard`.
- El estado y los efectos **se quedan en cada pantalla**. Extraerlos a hooks
  personalizados es una etapa posterior y separada.
- Los alias de `tsconfig.json` no cambian.

## Alternativas consideradas

- **`src/features/<área>/` con pantalla, hooks y datos juntos.** Descartada por
  ahora: `src/data/`, `src/api/` y `src/session/` ya son límites funcionales
  del ADR 0003, y moverlos ampliaría el cambio. Puede reevaluarse junto con los
  hooks.
- **Dejar las pantallas en `src/components/`.** Descartada: obliga a adivinar si
  un archivo es reutilizable o es una pantalla.
- **Mover `AnimatedAccountButton` o borrarlo.** No se tocó: nadie lo importa,
  pero eliminar código no usado queda fuera de esta reorganización.

## Consecuencias

- Comportamiento sin cambios: mismas rutas, mismos estilos y mismos textos.
  Verificado con `npx tsc --noEmit`, `npx expo lint` y
  `npx expo export --platform android`. **No se probó en dispositivo ni en modo
  avión** (pendiente).
- Los imports `@/src/components/<área>/...`, `@/components/EntityScreens` y
  `@/components/AccountContent` dejaron de existir; las rutas de `app/` se
  actualizaron.
- `EntityDetailScreen` sigue montando `EntityFormScreen` dentro de su propio
  contenedor, como antes; ese anidamiento no se modificó.
- Los ADR anteriores conservan las rutas de su fecha.
