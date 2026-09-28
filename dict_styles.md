# Diccionario de estilos

Sistema visual de la app móvil para técnicos de servicio en campo. Este
documento traduce las decisiones actuales del proyecto en reglas reutilizables
para nuevas pantallas y componentes.

## Dirección visual

- **Carácter:** claro, directo, operativo y confiable.
- **Prioridad:** lectura rápida con el teléfono en la mano y bajo condiciones
  de luz variables.
- **Superficies:** fondo neutro claro y bloques blancos para separar tareas,
  datos y acciones.
- **Acciones:** azul petróleo como color principal; el verde y el ámbar solo
  comunican estados.
- **Densidad:** contenido compacto, con una acción primaria visible por vista.
- **Forma:** esquinas suaves, pero no decorativas. El radio estándar actual es
  `rounded-lg` para controles y `rounded-xl` para tarjetas o bloques.

## Paleta de colores

### Colores base

| Token | Hex | Uso | Referencia actual |
|---|---|---|---|
| `brand-primary` | `#0A7EA4` | Acción primaria, foco, carga y tinte de navegación | `tintColorLight`, botones y `ActivityIndicator` |
| `brand-deep` | `#1B4965` | Iconos destacados de pasos de trabajo | Llegada y evidencia |
| `text-strong` | `#11181C` | Títulos y texto principal | `Colors.light.text` |
| `text-heading` | `#171717` | Títulos de tarjetas y datos importantes | `text-neutral-900` |
| `text-body` | `#404040` | Texto secundario legible | `text-neutral-700` |
| `text-muted` | `#737373` | Metadatos, horas y direcciones | `text-neutral-500` |
| `text-subtle` | `#A3A3A3` | Iconos o ayudas de baja prioridad | `text-neutral-400` |
| `surface-page` | `#FAFAFA` | Fondo general de pantallas | `bg-neutral-50` |
| `surface-card` | `#FFFFFF` | Tarjetas, formularios y bloques de acción | `bg-white` |
| `border-default` | `#E5E5E5` | Bordes de tarjetas y separadores | `border-neutral-200` |
| `border-input` | `#D4D4D4` | Campos sin error | `border-neutral-300` |

### Colores semánticos

| Token | Hex | Significado | Uso |
|---|---|---|---|
| `state-success` | `#15703D` | Guardado, completado o sincronizado | Check, "Todo subido", pasos hechos |
| `state-success-text` | `#166534` | Texto de éxito sobre fondo claro | Etiquetas de sincronización |
| `state-warning` | `#90520A` | Pendiente de subida o acción que requiere atención | Icono de nube sin conexión |
| `state-warning-text` | `#B45309` | Texto de advertencia | "Sin subir" |
| `state-error` | `#DC2626` | Error, permiso denegado o validación fallida | Mensajes de error y campos inválidos |
| `state-error-dark` | `#991B1B` | Error con mayor énfasis | Mensajes críticos sobre fondos claros |

Los colores semánticos no deben usarse como decoración. Cada estado debe tener
también texto o un icono; el color por sí solo no comunica suficientemente.

### Modo oscuro

El contrato existente contempla estos valores mínimos para modo oscuro:

| Token | Hex |
|---|---|
| `dark-text` | `#ECEDEE` |
| `dark-background` | `#151718` |
| `dark-icon` | `#9BA1A6` |
| `dark-primary` | `#FFFFFF` |

Las nuevas pantallas deben conservar la jerarquía de contraste y no asumir que
una superficie blanca funciona en ambos modos.

## Tipografía

La fuente base del proyecto es la del sistema (`system-ui` en web y fuente
nativa en móvil). No introducir fuentes externas sin una decisión de producto.

| Nivel | Clases sugeridas | Uso |
|---|---|---|
| Título de pantalla | `text-xl font-semibold` | Nombre del cliente o encabezado principal |
| Título de bloque | `text-lg font-semibold` | Título de una tarjeta o paso |
| Texto de acción | `text-base font-semibold` | Botones y acciones principales |
| Texto de cuerpo | `text-sm` | Descripción, instrucciones y contenido auxiliar |
| Metadato | `text-xs text-neutral-500` | Hora, dirección, estado secundario |
| Ayuda o nota | `text-xs text-neutral-400` | Información no crítica, como el comportamiento offline |

Reglas:

- Usar `font-semibold` para títulos y acciones, no texto completamente en
  mayúsculas.
- Mantener frases cortas y verbos concretos: "Ya llegué", "Tomar foto",
  "Continuar".
- Toda etiqueta visible debe venir de constantes o del contrato de dominio;
  evitar texto de oficio escrito directamente en componentes.
- Los textos largos deben poder crecer sin cortar el contenido en pantallas
  pequeñas.

## Espaciado y forma

La escala se basa en las utilidades de Tailwind actuales:

| Token | Valor | Uso |
|---|---:|---|
| `space-1` | `4px` | Separación entre etiqueta y valor |
| `space-2` | `8px` | Elementos relacionados |
| `space-3` | `12px` | Filas y grupos pequeños |
| `space-4` | `16px` | Padding estándar de pantalla y tarjeta |
| `space-6` | `24px` | Separación entre bloques o pantalla de acción |

- Padding horizontal estándar: `p-4`; usar `p-6` en vistas de confirmación o
  captura de evidencia.
- Separación de contenido: `gap-3` o `gap-4`.
- Botones y campos: `rounded-lg`, padding `p-3`.
- Tarjetas y pasos: `rounded-xl`, borde `border-neutral-200`, fondo blanco y
  padding `p-4`.
- No anidar tarjetas dentro de tarjetas. Un bloque debe tener una sola función.

## Componentes

### Botón primario

El componente `Button` es la referencia para acciones principales:

- Fondo `brand-primary`.
- Texto blanco, `font-semibold`.
- `rounded-lg` y `p-3`.
- Al presionar: opacidad reducida.
- Deshabilitado: opacidad reducida y sin acción repetible.
- El estado de carga debe cambiar el texto y bloquear nuevos toques.

Usar una única acción primaria por vista. Las acciones secundarias deben ser
enlaces, texto o controles visualmente menos prominentes.

### Campo de formulario

El componente `Field` define el patrón de entrada:

- Etiqueta encima del campo, `font-semibold`.
- Campo con borde neutro, `rounded-lg` y `p-3`.
- En error: borde rojo y mensaje debajo en `text-xs`.
- No depender únicamente del color para explicar el error.

### Tarjeta de trabajo

Una tarjeta muestra, en este orden, hora o metadato, estado, cliente,
descripción y dirección. Debe ser tocable como una unidad y conservar un área
de interacción cómoda.

### Indicador de sincronización

Debe estar visible en el encabezado o contexto persistente:

- `SINCRONIZADO`: icono verde y "Todo subido".
- `SOLO_LOCAL` o `EN_COLA`: icono ámbar y cantidad pendiente.
- `CONFLICTO`: estado de atención, con texto "Revisar" y acción clara.

Nunca presentar una acción offline como fallida solo porque no hay red. La
interfaz debe confirmar que el dato quedó guardado en el dispositivo.

## Estados de dominio en la interfaz

Los tres ejes son independientes y no deben combinarse en una sola etiqueta:

| Eje | Estados | Regla visual |
|---|---|---|
| Trabajo | Asignado, En camino, En sitio, Terminado, Cerrado | Estado operativo del técnico |
| Sincronización | Sin subir, Subiendo, Subido, Revisar | Estado de transferencia al servidor |
| Reporte | Sin audio, Audio listo, Transcribiendo, Borrador, Aprobado, Entregado | Proceso posterior y administrativo |

Un trabajo puede estar **Terminado + Sin subir + Audio listo** al mismo tiempo.
La firma del cliente confirma la evidencia disponible; no debe mostrarse como
si fuera la aprobación del reporte final.

## Navegación y flujo

- La pantalla Hoy responde primero a "¿qué me toca ahora?".
- El flujo de un trabajo sigue el orden real: llegada, evidencia, dictado y
  firma.
- Mantener el camino feliz en un máximo de cinco toques.
- No bloquear una pantalla esperando red, GPS o una respuesta remota.
- La carga debe ser breve y contextual; usar `ActivityIndicator` con
  `brand-primary`.
- Los permisos de cámara, ubicación u otros deben explicar el motivo y dejar
  una salida comprensible si se rechazan.

## Accesibilidad y calidad

- Mantener contraste suficiente entre texto y superficie; el gris claro solo
  sirve para información secundaria.
- Todo icono que comunique estado debe acompañarse de texto cuando sea posible.
- Mantener zonas táctiles cómodas y separar acciones para evitar toques
  accidentales.
- No comunicar estados únicamente por color, icono o posición.
- Probar cada cambio visual en Android o dispositivo real; la validación web no
  representa por completo el compilador nativo de NativeWind.

## Implementación actual

- Tokens base: `constants/theme.ts`.
- Estilos globales: `global.css`.
- Componentes reutilizables: `components/Button.tsx`, `components/Field.tsx` y
  `components/indicador-sync.tsx`.
- Contratos y etiquetas de estados: `constants/trabajos.ts`.
- Las clases NativeWind existentes son la referencia inmediata mientras no se
  centralicen todos los tokens en un sistema de diseño de código.

## No hacer

- No usar push remoto ni rastreo continuo: Expo Go no los soporta en este
  entorno.
- No añadir gradientes, colores decorativos o tarjetas que no ayuden a la tarea.
- No sustituir el fondo neutro por una paleta saturada que reduzca la lectura.
- No ocultar el estado de sincronización.
- No enviar ni presentar texto generado automáticamente como reporte aprobado.