# Notas de clase — enrutamiento en Expo Router

> Notas tomadas durante el curso. Se conservan aquí porque los archivos donde
> estaban originalmente (`app/(tabs)/index.tsx`, `app/_layout.tsx`) fueron
> reemplazados por la estructura real del proyecto.

## Archivos

- `_layout.tsx` — archivo especial para crear diferentes segmentos. Técnicamente
  se usa para rutas, pero también sirve para envolver todo con proveedores
  (tema, estilos, sesión).
- `.ts` — retorna solo una variable / lógica, sin JSX.
- `.tsx` — retorna JSX (lo que en web sería HTML).

## Los modos de navegación

| Modo | Qué hace | Cuándo usarlo |
|---|---|---|
| **Stack** | Apila rutas (componentes). Registra la vuelta atrás, muestra botón de regreso. | Un proceso con principio y fin del que sales al terminar. |
| **Tabs** | Navegación inferior, siempre visible. | Lugares a los que se vuelve una y otra vez. |
| **Drawer** | Igual que Tabs pero lateral. | Menús largos que no caben abajo. |
| **Slot** | Renderiza el hijo sin navegador propio. El comportamiento no es tan fluido: no registra la vuelta atrás. | Cuando no necesitas historial ni barra. |

Diferencia clave (para el quiz): **Stack apila, Tab es barra inferior, Drawer es
lateral.** Con `Slot` no tienes acceso directo a los componentes hermanos, por eso
en el template original había que poner un botón extra para llegar al segundo tab.

## Otros apuntes

- Para botones en React Native se usa `Pressable`, no `Button`.
- Los paréntesis en un nombre de carpeta —`(tecnico)`— crean un **grupo de rutas**:
  agrupan archivos sin aparecer en la URL. `app/(tecnico)/index.tsx` es la ruta `/`,
  no `/(tecnico)/index`.
- Los corchetes —`[id]`— crean una **ruta dinámica**. `app/trabajo/[id].tsx`
  responde a `/trabajo/1`, `/trabajo/2`, etc. El valor se lee con `useLocalSearchParams()`.

## Aclaración: `rnfe` no tiene que ver con deep linking

Son dos cosas sin relación entre sí, y conviene no mezclarlas:

- **`rnfe`** es un *atajo de VS Code* (de la extensión de snippets de React
  Native). Al escribirlo y presionar Tab, el editor escribe la plantilla de un
  componente funcional con `export default`. Es comodidad para teclear: no
  agrega ninguna capacidad a la app, y el código funciona igual si se escribe a
  mano. En este proyecto todos los `_layout.tsx` y las pantallas ya son
  componentes funcionales exportados por defecto, que es lo que ese atajo
  produce.

- **Deep linking** es que un enlace externo abra la app en una pantalla
  concreta. En Expo se configura con `"scheme"` en `app.json`. Este proyecto ya
  lo tiene:

  ```json
  "scheme": "introductionmovilsubject"
  ```

  Con eso, `introductionmovilsubject://trabajo/2` abre directamente ese trabajo.
  **No hay que escribir código de enlaces**: expo-router deriva las rutas del
  sistema de archivos, así que cada archivo dentro de `app/` ya es un destino
  alcanzable. Para leer un enlace entrante manualmente existe `expo-linking`.
