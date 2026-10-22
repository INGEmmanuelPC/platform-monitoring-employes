# Estilos estándar · Platform Monitoring Employees

La aplicación usa un skeuomorfismo ligero: bordes inferiores y elevación
refuerzan la sensación de controles físicos sin competir con el contenido.
La decisión está registrada en `docs/adr/0008-sistema-visual-skeuomorfico.md`.
NativeWind v5/Tailwind v4 sigue usándose para composición y tipografía; los
tokens compartidos viven en `src/constants/design.ts`.

Regla base: antes de repetir una combinación visual, busca un componente ya
existente en `src/components/`, especialmente `Button`, `Field`, `Select`,
`IconSymbol`, `ErrorBanner` y `EmptyState`. Las pantallas del CRUD viven en
`src/screens/crud/`.

---

## Tokens

Usar `DESIGN` y `RAISED_SURFACE` desde `src/constants/design.ts`; no definir
colores, radios o sombras de marca directamente en las pantallas.

| Papel | Token |
| --- | --- |
| Fondo de pantalla | `DESIGN.colors.canvas` |
| Superficie de tarjeta | `DESIGN.colors.surface` |
| Campo o superficie secundaria | `DESIGN.colors.inset` |
| Acción principal | `DESIGN.colors.brand` |
| Texto principal / secundario | `DESIGN.colors.text` / `DESIGN.colors.textSecondary` |
| Borde / error | `DESIGN.colors.border` / `DESIGN.colors.error` |
| Radios de controles / tarjetas | `DESIGN.radius.control` / `DESIGN.radius.card` |
| Elevación | `RAISED_SURFACE` |

Los tonos de los tres ejes están centralizados en `DESIGN.status`. Los estados
usan texto oscuro sobre fondos claros para mantener su legibilidad.

## Contenedores y espaciado

```tsx
// Pantalla desplazable
<ScrollView className="flex-1 bg-neutral-50">
  <View className="gap-4 p-4" />
</ScrollView>

// Trabajo: usar TrabajoCard para mantener contenido y estados consistentes.
<TrabajoCard trabajo={trabajo} onPress={abrirTrabajo} />

// Pantalla centrada de una acción puntual
<View className="flex-1 items-center justify-center gap-6 bg-neutral-50 p-6" />
```

Se usa `gap-*` para separar elementos relacionados: `gap-1` dentro de grupos
cortos, `gap-3` en tarjetas y `gap-4` entre bloques de una pantalla.

## Marca

Nombre: **Cuadrilla**. Eslogan: *"El trabajo lo haces tú. El reporte, solo."*
Logo: marca de pin de ubicación + check (`src/components/ui/icon-symbol.tsx`
reutiliza el mismo concepto en `mappin.and.ellipse` +
`checkmark.circle.fill`), en dos archivos con transparencia real:

- `assets/images/logotype-navy.png` — marca principal, navy `#1B4965`. Se usa
  en `src/components/BrandHeader.tsx` (login y registro) y como imagen de splash
  screen (`app.json` → `expo.plugins` → `expo-splash-screen.image`).
- `assets/images/logotype-black.png` — capa monocromática del ícono adaptativo
  de Android (`app.json` → `expo.android.adaptiveIcon.monochromeImage`).

El logo **no va en las pestañas del técnico**: ver el comentario en
`app/(tecnico)/_layout.tsx` sobre el objetivo grande para alguien cansado y de
pie. Vive solo en los puntos de entrada (`BrandHeader`, splash, ícono).

## Tipografía

Dos familias, tres pesos, cargados con `useFonts` en `app/_layout.tsx` y
expuestos como utilidades de Tailwind en `tailwind.config.js`
(`theme.extend.fontFamily`). Los nombres literales de cada peso viven en
`src/constants/fonts.ts` — hacen falta tal cual porque React Native no sintetiza
pesos de una fuente custom.

| Uso | Clase / fuente | Por qué |
| --- | --- | --- |
| Nombre de marca, eslogan de pantalla, títulos de menú/pantalla (tabs, headers de Stack, listas y formularios del CRUD) | `font-display` → Archivo Bold | Geométrica y reconocible de un vistazo; es lo que representa a Cuadrilla como marca. |
| Eslogan bajo el nombre de marca (`BrandHeader`) | `font-slogan` → IBM Plex Sans Regular | Pensada para documentación técnica: legible y sin ambigüedad, coherente con "ayudar a comunicar mejor sin importar la conectividad". |
| Texto de botones (`src/components/Button.tsx`) | `font-button` → IBM Plex Sans SemiBold | Misma familia que el eslogan, un peso más alto para acción. |
| Título de pantalla (genérico, sin marca) | `text-2xl font-bold text-neutral-900` | Texto de sistema; no todo título necesita `font-display`. |
| Título de tarjeta | `text-lg font-semibold text-neutral-900` | |
| Texto de lista | `text-base font-semibold text-neutral-900` | |
| Descripción | `text-sm text-neutral-600` | |
| Metadato | `text-xs text-neutral-500` / `text-xs text-neutral-400` | |
| Error | `text-sm text-red-600` | |

**Trampa de bundle:** importar de `@expo-google-fonts/archivo` o
`@expo-google-fonts/ibm-plex-sans` a secas empaqueta las variantes completas
de la familia (18 y 14 pesos respectivamente), aunque solo se use una. Hay que
importar por subruta de peso (`@expo-google-fonts/archivo/700Bold`). Detalle
completo en `AGENTS.md` → "Trampas ya conocidas".

## Componentes reutilizables

### Botón

Usar `src/components/Button.tsx` para acciones. Recibe `text`, `onPress`,
`disabled`, `loading`, `className` y `variant` (`primary`, `secondary` o
`danger`). Las variantes aplican los tokens y el tratamiento elevado; el estado
presionado y el deshabilitado tienen feedback visible.

### Campo controlado

Usar `src/components/Field.tsx` únicamente con `react-hook-form`. Incluye etiqueta,
`TextInput`, borde de error y mensaje de validación. Los campos libres, como el
buscador del CRUD, usan `rounded-lg border border-neutral-300 bg-white p-3`.

Todos los formularios del CRUD (`src/screens/crud/EntityFormScreen.tsx`) usan `Field` con
`react-hook-form`, igual que login y registro. Al editar, `reset()` fija el
valor original y `formState.dirtyFields` decide qué campos viajan en el
`PATCH` — nunca se reenvía el objeto completo.

### Selección de una opción

Usar `src/components/Select.tsx` con `react-hook-form` cuando hay que elegir un
valor de una lista corta (por ejemplo, el cliente de una orden). Mismo
contrato que `Field`: `control`, `name`, `label`, `rules`. Cada opción es un
botón; la seleccionada usa `DESIGN.colors.brand` sobre una superficie clara.

### Tarjetas y listas

`src/components/TrabajoCard.tsx` presenta el trabajo y su indicador de los tres
ejes. Las tarjetas interactivas reciben `onPress`; las informativas se renderizan
sin esa prop. Otras tarjetas usan una superficie blanca elevada y los tokens de
borde y radio.

Cuando una combinación repetida necesite comportamiento propio, debe extraerse
a un componente pequeño: en `src/components/` si lo usan varias áreas, o en el
`components/` de la pantalla (`src/screens/<área>/components/`) si solo lo usa
ella. No se duplican botones o campos manualmente.

## Estados visibles

- Cargando: `ActivityIndicator` con color `#0a7ea4`.
- Error de formulario o servicio: `Text` con `text-red-600`.
- Error destacado: superficie clara y texto `DESIGN.colors.error`.
- Confirmación de guardado: diálogo nativo de React Native con el mensaje
  “Los cambios se guardaron correctamente”.

## Configuración

`global.css` importa Tailwind v4 y el tema de NativeWind. Se carga una vez en
`app/_layout.tsx`. `metro.config.js` aplica `withNativewind`. No se debe añadir
una configuración clásica de Babel o Tailwind v3 sin migrar deliberadamente la
versión actual.
