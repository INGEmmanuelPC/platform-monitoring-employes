# 0001 — Estructura de navegación de la app del técnico

- **Estado:** aceptada
- **Fecha:** 2026-09-06
- **Decide:** Product Owner / Tech Lead
- **Afecta a:** Dev B (captura en campo), y a cualquiera que agregue pantallas

## Contexto

La app móvil la usa un solo rol: el técnico de campo. La usa cansado, de pie, a
veces con guantes y casi siempre sin señal. El documento de producto fija dos
restricciones que mandan sobre cualquier preferencia estética:

1. **Máximo cinco toques** en el camino feliz de un trabajo. Si sube, el equipo
   vuelve a WhatsApp en una semana.
2. **Ninguna pantalla del flujo de campo puede depender de la red.**

Expo Router ofrece tres modos de navegación —Stack, Tabs y Drawer— y hay que
decidir qué va en cada uno antes de que tres personas empiecen a crear pantallas
en paralelo.

## Decisión

**Dos niveles: Tabs para los lugares, Stack para el proceso.**

```
app/
├── _layout.tsx                 Stack raíz — tema, estilos globales, deep linking
│
├── (tecnico)/                  Grupo de rutas → las pestañas
│   ├── _layout.tsx             Tabs (3 pestañas)
│   ├── index.tsx               Hoy        — lista de trabajos del día
│   ├── historial.tsx           Historial  — evidencia de trabajos pasados
│   └── cuenta.tsx              Cuenta     — perfil y cola de sincronización
│
└── trabajo/[id]/               Stack apilado SOBRE las pestañas
    ├── _layout.tsx             Stack
    ├── index.tsx               Detalle del trabajo con los pasos
    ├── llegada.tsx             Marcar llegada
    ├── evidencia.tsx           Fotos antes y después
    ├── dictado.tsx             Dictar qué se hizo
    └── firma.tsx               Firma del cliente (modal)
```

El criterio que separa un modo del otro:

> **Tabs = lugares a los que se vuelve. Stack = un proceso del que se sale.**

Un trabajo tiene principio y fin: el técnico entra, hace sus pasos y sale. Eso es
un Stack, y así el botón de volver aparece gratis. Las tres pestañas, en cambio,
son sitios permanentes a los que regresa todo el día.

**Tres pestañas, no más.** Cada pestaña adicional es una decisión que el técnico
tiene que tomar antes de trabajar.

**El estado de sincronización va en el encabezado, no en una pestaña.** Es
información que el técnico necesita ver siempre pero sobre la que no actúa —
sube solo. Ocuparía una pestaña sin merecerla.

## Alternativas consideradas

| Alternativa | Por qué se descartó |
|---|---|
| **Los pasos del trabajo como pestañas** | Convierte un proceso lineal en un menú. El técnico tendría que decidir el orden en vez de seguirlo, y la barra inferior se llenaría de pantallas de un solo uso. |
| **Drawer (menú lateral)** | Esconde la navegación detrás de un gesto. Para alguien cansado, lo que no se ve no existe. |
| **Una pestaña "Sincronización"** | El técnico no acciona sobre la cola: sube sola. Como indicador en el encabezado se ve desde todas partes y no cuesta una pestaña. |
| **Slot en vez de Tabs** | No registra el historial de navegación: no hay vuelta atrás, y hay que inventar botones para moverse entre secciones. |
| **Todo en un solo Stack, sin pestañas** | El técnico perdería el acceso de un toque al historial, que es justo lo que necesita cuando un cliente reclama en pleno sitio. |

## Consecuencias

**A favor**

- El camino feliz queda en cinco toques, medible desde el primer día.
- El flujo de un trabajo se puede cambiar entero sin tocar las pestañas.
- Las rutas profundas (`/trabajo/2/firma`) existen solas: expo-router las deriva
  del sistema de archivos, así que el deep linking no cuesta trabajo adicional.
- Dev B puede crear pantallas de pasos sin coordinar con nadie: solo agrega
  archivos dentro de `trabajo/[id]/`.

**En contra / a vigilar**

- Dos niveles de navegador anidados. La documentación de Expo advierte de no
  anidar sin necesidad; aquí se justifica porque son dos ciclos de vida
  distintos, pero **no se debe anidar un tercero**.
- El encabezado con el indicador de sincronización obliga a mantener
  `headerShown` activo en las pestañas. Si en el futuro se quiere pantalla
  completa, hay que reubicar el indicador antes.
- `typedRoutes` está activo: al agregar o mover una ruta hay que regenerar los
  tipos arrancando el servidor una vez, o el chequeo de tipos falla con rutas
  fantasma de la estructura anterior.

## Notas de implementación

- Los íconos usan `IconSymbol`, que da SF Symbols nativos en iOS y Material Icons
  en Android y web. Todo ícono nuevo debe agregarse al mapa de
  `components/ui/icon-symbol.tsx` o no se dibuja nada.
- Los estados que se muestran salen de `constants/trabajos.ts`, que ya separa los
  **tres ejes** (trabajo, sincronización, reporte). Ese archivo es el germen del
  contrato compartido; cuando exista el paquete común, se muda allá.
- Los datos son de ejemplo y están marcados como tales. Se reemplazan por SQLite
  en V0.
