# 0012 - Sincronización automática: red, primer plano y tarea de segundo plano

- **Estado:** aceptada
- **Fecha:** 2026-11-23

## Contexto

El documento de visión promete que «cuando vuelve la red, todo se sincroniza
solo». Hasta ahora la cola solo se enviaba al enfocar una lista o al pulsar
«Sincronizar ahora»: en una demo en modo avión el técnico tenía que acordarse
de refrescar. Además:

- `processSyncQueue` no tenía candado: con más disparadores, dos ejecuciones
  simultáneas podían mandar la misma cola dos veces (todavía no hay `event_id`).
- El perfil (y con él el rol) se pedía **una sola vez** al iniciar sesión. Si la
  app se abría sin señal, el rol quedaba desconocido y no se podía sincronizar
  ni siquiera al volver la red.

## Decisión

**1. La base es la sincronización en primer plano** (`src/hooks/useAutoSync.ts`),
con reglas puras en `src/domain/autoSync.ts`. Se intenta:

| Motivo | Cuándo |
|---|---|
| `reconexion` | La red pasa de caída a disponible (`expo-network`) |
| `primer_plano` | La app vuelve a estar activa (`AppState`) |
| `inicio` | Hay cuenta y rol conocidos (inicio de sesión o perfil recién cargado) |
| `periodico` | Cada 30 s con la app abierta, solo si hay algo pendiente |

- Solo se sincroniza con sesión, con red real (`isConnected` y
  `isInternetReachable !== false`; un estado desconocido no cuenta) y con algo
  pendiente.
- **Backoff exponencial** si falla: 15 s, 30 s, 1, 2, 4 min y tope de 5 min. Solo
  frena el intento *periódico*: volver la red o abrir la app siempre cuentan como
  una oportunidad nueva.
- Nunca bloquea al técnico ni muestra errores: se calla y reintenta (regla 1).

**2. Candado único** (`src/domain/sincronizadorUnico.ts`, expuesto en
`src/data/sync-runner.ts`). Es el único camino para sincronizar: lo usan la carga
de listas, el botón manual, la automática y la de segundo plano. Si ya hay una
ejecución de la misma cuenta, el segundo llamador espera esa misma y recibe su
resultado; si es otra cuenta, espera su turno. Si falla, libera el candado.

**3. La pantalla se actualiza sola.** Cuando la sincronización automática
procesó algo, las listas visibles se refrescan en silencio (sin esqueleto).

**4. El perfil se reintenta al volver la red** (`AuthProvider`) si había fallado.

**5. Tarea de segundo plano como respaldo** (`expo-background-task` +
`expo-task-manager`, `src/data/background-sync.ts`). Corre sin React: abre la
base por su cuenta, toma la sesión guardada, consulta el rol y sincroniza solo lo
de esa cuenta. Se registra al iniciar sesión y se quita al cerrarla.

- `defineTask` está en el ámbito global del bundle, como exige la librería.
- **Es un respaldo, no la base:** el intervalo mínimo es de 15 minutos y el
  sistema decide cuándo corre; en iOS suele ignorar intervalos cortos.
- **Se desactiva en Expo Go** y en web (los módulos se cargan con `require`
  dentro de `try`, igual que el push). Solo funciona en un APK o development
  build, así que no se puede probar con Expo Go.
- El plugin `expo-background-task` agrega a iOS el modo `processing`; en Android
  no hace falta configuración.

## Alternativas descartadas

- **Depender solo de la tarea de segundo plano:** no es fiable ni inmediata.
- **`@react-native-community/netinfo`:** `expo-network` ya cubre el estado y los
  eventos, y es del propio SDK.
- **Un candado dentro de `processSyncQueue`:** mezcla concurrencia con la lógica
  de cola; se prefirió una pieza pura y probada por separado.

## Consecuencias

- La demo en modo avión funciona sin intervención: al volver la red, sube sola.
- El candado **no cubre** el caso de que la tarea de fondo y la app abierta
  corran a la vez en procesos distintos. Es raro; lo definitivo es `event_id`
  con `UNIQUE` en Postgres (pendiente).
- El intento automático necesita conocer el rol. Si el perfil nunca carga, no
  se sincroniza.
- La sincronización automática no resuelve `CONFLICTO`: un trabajo en conflicto
  sigue atascado (pendiente).
