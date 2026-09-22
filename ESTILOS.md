# Estilos estándar · Platform Monitoring Employees

Clases de NativeWind que ya utiliza la aplicación móvil. Esta guía documenta
el código existente; no reemplaza la configuración de NativeWind v5/Tailwind v4.

Regla base: antes de repetir una combinación visual, busca un componente ya
existente en `components/`, especialmente `Button`, `Field`, `Select`,
`IconSymbol` y `EntityScreens`.

---

## Paleta

| Papel | Clases utilizadas |
| --- | --- |
| Fondo de pantalla | `bg-neutral-50` |
| Tarjetas y formularios | `bg-white` |
| Acción principal | `bg-blue-600`, `text-white` |
| Acción de éxito | `bg-green-700` |
| Acción destructiva | `bg-red-600` |
| Bordes de campos | `border-neutral-300` |
| Bordes de tarjetas | `border-neutral-200` |
| Texto principal | `text-neutral-900` |
| Texto secundario | `text-neutral-600` / `text-neutral-500` |
| Metadatos | `text-neutral-400` |
| Error | `text-red-600`, `bg-red-50`, `text-red-700` |

## Contenedores y espaciado

```tsx
// Pantalla desplazable
<ScrollView className="flex-1 bg-neutral-50">
  <View className="gap-4 p-4" />
</ScrollView>

// Tarjeta
<View className="gap-3 rounded-xl border border-neutral-200 bg-white p-4" />

// Pantalla centrada de una acción puntual
<View className="flex-1 items-center justify-center gap-6 bg-neutral-50 p-6" />
```

Se usa `gap-*` para separar elementos relacionados: `gap-1` dentro de grupos
cortos, `gap-3` en tarjetas y `gap-4` entre bloques de una pantalla.

## Tipografía

| Uso | Clases utilizadas |
| --- | --- |
| Título de pantalla | `text-2xl font-bold text-neutral-900` |
| Título de tarjeta | `text-lg font-semibold text-neutral-900` |
| Texto de lista | `text-base font-semibold text-neutral-900` |
| Descripción | `text-sm text-neutral-600` |
| Metadato | `text-xs text-neutral-500` / `text-xs text-neutral-400` |
| Error | `text-sm text-red-600` |

## Componentes reutilizables

### Botón

Usar `components/Button.tsx` para acciones. Recibe `text`, `onPress`,
`disabled` y `className`. La base aplica `rounded-lg`, `bg-blue-600`, `p-3`,
texto blanco y opacidad al estar deshabilitado. Las variantes puntuales se
añaden con `className`, por ejemplo `bg-red-600` para eliminar.

### Campo controlado

Usar `components/Field.tsx` únicamente con `react-hook-form`. Incluye etiqueta,
`TextInput`, borde de error y mensaje de validación. Los campos libres, como el
buscador del CRUD, usan `rounded-lg border border-neutral-300 bg-white p-3`.

Todos los formularios del CRUD (`components/EntityScreens.tsx`) usan `Field` con
`react-hook-form`, igual que login y registro. Al editar, `reset()` fija el
valor original y `formState.dirtyFields` decide qué campos viajan en el
`PATCH` — nunca se reenvía el objeto completo.

### Selección de una opción

Usar `components/Select.tsx` con `react-hook-form` cuando hay que elegir un
valor de una lista corta (por ejemplo, el cliente de una orden). Mismo
contrato que `Field`: `control`, `name`, `label`, `rules`. Cada opción es un
botón; la seleccionada usa `border-blue-600 bg-blue-50 text-blue-700`.

### Tarjetas y listas

Las listas de trabajos y entidades usan filas blancas con borde neutral:

```tsx
<Pressable className="gap-1 rounded-xl border border-neutral-200 bg-white p-4" />
```

Cuando una combinación repetida necesite comportamiento propio, debe extraerse
a un componente pequeño dentro de `components/`; no se duplican botones o
campos manualmente.

## Estados visibles

- Cargando: `ActivityIndicator` con color `#0a7ea4`.
- Error de formulario o servicio: `Text` con `text-red-600`.
- Error destacado: `rounded-xl bg-red-50 p-4 text-sm text-red-700`.
- Confirmación de guardado: diálogo nativo de React Native con el mensaje
  “Los cambios se guardaron correctamente”.

## Configuración

`global.css` importa Tailwind v4 y el tema de NativeWind. Se carga una vez en
`app/_layout.tsx`. `metro.config.js` aplica `withNativewind`. No se debe añadir
una configuración clásica de Babel o Tailwind v3 sin migrar deliberadamente la
versión actual.
