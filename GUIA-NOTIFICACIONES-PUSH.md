# Guía: notificaciones push de punta a punta

**Objetivo:** que el solicitante reciba un aviso en el teléfono cada vez que su
solicitud cambia de estado y que, al tocarlo, la app abra ese caso. Es la
característica **F09** del documento de visión: «creación, asignación,
escalamiento, solicitud de información y cierre generan notificación a los
implicados».

Versiones: Expo SDK 57 (`expo-notifications ~57.0.25`) y el backend
`helpdesk-uam` (Express 5 + Prisma 7). Todo el código de esta guía ya está en
los dos proyectos. Úsenlo como referencia mientras lo escriben ustedes.

---

## 0. Cómo funciona antes de escribir código

```
 ┌──────────── App (Expo) ────────────┐            ┌───────── Backend ─────────┐
 │ 1. pide permiso al usuario          │            │                           │
 │ 2. obtiene su ExpoPushToken  ───────┼── PUT ────▶│ 3. lo guarda en Usuario   │
 │                                     │ /auth/     │    .tokenPush             │
 │                                     │ token-push │                           │
 │                                     │            │ 4. alguien cambia el      │
 │                                     │            │    estado de un ticket    │
 │                                     │            │ 5. POST a Expo Push ──┐   │
 └─────────────────────────────────────┘            └───────────────────────┼───┘
            ▲                                                               │
            │ 7. el usuario toca el aviso → router.push('/tickets/[id]')    ▼
            │                                                 ┌─────────────────────┐
            └──────────── 6. FCM (Android) / APNs (iOS) ◀─────│ exp.host (Expo)     │
                                                              └─────────────────────┘
```

Tres ideas clave:

1. **El token identifica al teléfono, no a la persona.** El servidor guarda qué
   teléfono pertenece a qué usuario. Por eso se registra al **iniciar sesión** y
   se borra al **cerrarla**.
2. **El servidor decide a quién avisar.** La app no «manda» notificaciones. Solo
   dice «este teléfono es mío» y reacciona cuando el usuario toca un aviso. Es
   la regla 2 del proyecto: las reglas del negocio son del servidor.
3. **Expo hace de intermediario.** Sin Expo, el backend tendría que hablar con
   Firebase (Android) y con Apple (iOS), cada uno con sus credenciales. Con
   Expo, el backend hace un solo `fetch` y las credenciales viven en EAS.

---

## 1. Requisitos (léanlos antes de empezar)

| Requisito | Por qué |
|---|---|
| Cuenta en [expo.dev](https://expo.dev) y `npx eas-cli login` | El token pertenece a un proyecto de EAS |
| `extra.eas.projectId` en `app.json` (lo escribe `eas init`) | `getExpoPushTokenAsync` lo exige. Sin él falla con `ERR_NOTIFICATIONS_NO_EXPERIENCE_ID` |
| **Development build**, no Expo Go | La documentación del SDK 57 dice: *«Push notifications … unavailable in Expo Go on Android from SDK 53. A development build is required»*. Las notificaciones **locales** sí funcionan en Expo Go |
| Teléfono físico, o emulador Android **con Google Play** | Un emulador sin Play Services no tiene FCM |
| Android: proyecto de Firebase (gratis) | Expo entrega los avisos de Android a través de FCM |
| iOS: cuenta de Apple Developer **paga** | Sin ella no hay certificado de APNs |

> Si en clase no hay cuenta de Apple, trabajen con Android. El código es el mismo.

---

## 2. Backend (`sw_II/helpdesk-uam`)

Se escribe **de adentro hacia afuera**, como en cualquier entidad del backend:
esquema → dominio → aplicación → infraestructura → `main.ts` → pruebas.

### 2.1 Esquema y migración

`prisma/schema.prisma`, en el modelo `Usuario`:

```prisma
/// Token de Expo del dispositivo donde inició sesión (F09). null = no recibe avisos push.
tokenPush String?
```

```bash
npm run db:up
npx prisma migrate dev --name token_push   # crea la columna y regenera el cliente
```

La columna es opcional porque un usuario que nunca abrió la app, o que negó el
permiso, simplemente no recibe avisos.

### 2.2 Los puertos (`src/dominio/puertos/index.ts`)

Hay dos piezas nuevas. Primero, el DAO de usuarios aprende a guardar y leer el
token:

```ts
export interface UsuarioDAO {
  // …lo que ya había…
  guardarTokenPush(id: string, token: string | null): Promise<void>
  tokenPush(id: string): Promise<string | null>
}
```

Segundo, un puerto **de comportamiento** para avisar:

```ts
export interface AvisoDTO {
  titulo: string
  cuerpo: string
  datos: Record<string, string>   // viaja oculto: la app lo usa para navegar
}

export interface Notificador {
  avisar(usuarioId: string, aviso: AvisoDTO): Promise<void>
}
```

**¿Por qué una interfaz?** El dominio dice *«avisa al usuario X»* y no sabe
*cómo*. Hoy es push de Expo. Mañana puede ser el correo institucional (R02
exige SMTP para el correo). Ese cambio sería un adaptador nuevo y una línea en
`main.ts`, sin tocar el caso de uso.

### 2.3 El caso de uso dispara el aviso (`GestionarTickets.ts`)

`GestionarTickets` recibe el `Notificador` por constructor y, después de
actualizar, avisa **solo si el estado cambió**:

```ts
constructor(
  private readonly tickets: TicketDAO,
  private readonly categorias: CategoriaDAO,
  private readonly notificador: Notificador,
) {}

async modificar(id: string, cambios: TicketCambios) {
  const actual = await this.tickets.porId(id)
  // …validaciones de siempre…
  const estadoAnterior = actual.estado   // se copia ANTES de actualizar
  const actualizado = await this.tickets.actualizar(id, { ...cambios, ...asignacion })

  if (actualizado && actualizado.estado !== estadoAnterior) {
    await this.notificador.avisar(actualizado.solicitanteId, {
      titulo: 'Tu solicitud cambió de estado',
      cuerpo: `«${actualizado.asunto}» ahora está ${actualizado.estado.replaceAll('_', ' ').toLowerCase()}`,
      datos: { ticketId: actualizado.id },
    })
  }
  return actualizado
}
```

> **Trampa real que salió al escribir esto:** si se compara contra
> `actual.estado` *después* de actualizar, el doble de pruebas en memoria
> devuelve **el mismo objeto** ya modificado y la comparación siempre da igual.
> Por eso se copia el valor antes.

¿Por qué en el caso de uso y no en la ruta HTTP? Porque así el aviso sale igual
si mañana el cambio lo hace el escalamiento automático (F08) y no una persona.

### 2.4 El adaptador (`src/infraestructura/notificaciones/NotificadorExpoPush.ts`)

Es un `fetch`. No hace falta ninguna librería:

```ts
export class NotificadorExpoPush implements Notificador {
  constructor(private readonly usuarios: UsuarioDAO, private readonly tokenAccesoExpo?: string) {}

  async avisar(usuarioId: string, aviso: AvisoDTO): Promise<void> {
    const destino = await this.usuarios.tokenPush(usuarioId)
    if (!destino) return

    try {
      const respuesta = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.tokenAccesoExpo ? { Authorization: `Bearer ${this.tokenAccesoExpo}` } : {}),
        },
        body: JSON.stringify({ to: destino, title: aviso.titulo, body: aviso.cuerpo, data: aviso.datos, sound: 'default' }),
      })
      const { data } = await respuesta.json()
      if (data?.details?.error === 'DeviceNotRegistered') await this.usuarios.guardarTokenPush(usuarioId, null)
    } catch (error) {
      console.error('No se pudo contactar a Expo Push:', error)
    }
  }
}
```

Las decisiones que hay detrás:

- **Los errores no se relanzan.** El ticket *ya* cambió de estado. Que el aviso
  no salga no puede convertir el PATCH en un 500.
- **`DeviceNotRegistered`** significa que desinstalaron la app o quitaron el
  permiso. Se borra el token para no seguir insistiendo.
- **`status: "ok"` no significa «entregado»**, solo que Expo recibió el aviso.
  Para saber si llegó al teléfono hay que consultar los *receipts*
  (`POST https://exp.host/--/api/v2/push/getReceipts`) unos 15 minutos después.
  Queda como ejercicio.
- `EXPO_ACCESS_TOKEN` es opcional. Solo hace falta si en expo.dev se activa
  *Enhanced push security*.

### 2.5 El DAO Prisma (`UsuarioDAOPrisma.ts`)

```ts
async guardarTokenPush(id: string, token: string | null): Promise<void> {
  await this.prisma.$transaction([
    // Un teléfono es de UNA persona: si otra cuenta lo tenía, se le quita.
    ...(token ? [this.prisma.usuario.updateMany({ where: { tokenPush: token }, data: { tokenPush: null } })] : []),
    this.prisma.usuario.updateMany({ where: { id }, data: { tokenPush: token } }),
  ])
}
```

Sin esa primera línea, si Ana y Bruno usan el mismo teléfono de laboratorio,
Bruno recibiría los avisos de los casos de Ana. Eso es una fuga de datos
personales.

### 2.6 La ruta (`rutas/autenticacion.ts`)

```ts
rutas.put('/token-push', exigirSesion(deps.tokens), async (req, res, next) => {
  const datos = validarTokenPush(req.body)            // ExpoPushToken[...] o null
  if (typeof datos === 'string') return void res.status(400).json({ error: datos })
  const { id } = res.locals['credencial'] as CredencialDTO   // de la SESIÓN, nunca del cuerpo
  await deps.usuarios.guardarTokenPush(id, datos.token)
  res.status(204).end()
})
```

Si el `id` viniera del cuerpo, cualquiera podría registrar su teléfono a nombre
de otra persona y leer sus avisos.

### 2.7 `main.ts`

Es el único lugar donde se hace `new`:

```ts
const notificador = new NotificadorExpoPush(usuarios, process.env['EXPO_ACCESS_TOKEN'])
// …
gestionarTickets: new GestionarTickets(tickets, categorias, notificador),
```

### 2.8 Pruebas

En las pruebas no se envía nada de verdad. Se usa un doble que guarda lo que
habría mandado (`tests/dobles/UsuarioDAOEnMemoria.ts → NotificadorEnMemoria`):

```ts
it('avisa al solicitante cuando su ticket cambia de estado, y solo entonces (F09)', async () => {
  const ticket = await nuevoTicket()
  await tickets.modificar(ticket.id, { prioridad: 'BAJA' })
  expect(notificador.enviados).toHaveLength(0)            // sin cambio de estado, sin aviso

  await tickets.modificar(ticket.id, { estado: 'EN_PROCESO' })
  expect(notificador.enviados[0]?.usuarioId).toBe(SOLICITANTE)
})
```

```bash
npm run arquitectura && npx tsc --noEmit && npm test
```

### 2.9 Probarlo sin teléfono

Con `npm run dev` arriba:

```bash
A=http://localhost:3001/api
T=$(curl -s -X POST $A/auth/login -H 'Content-Type: application/json' \
  -d '{"correo":"<su correo>","clave":"<su clave>"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])')

# 400: formato inválido
curl -s -X PUT $A/auth/token-push -H "Authorization: Bearer $T" -H 'Content-Type: application/json' -d '{"token":"abc"}'

# 204: se guarda
curl -s -o /dev/null -w '%{http_code}\n' -X PUT $A/auth/token-push \
  -H "Authorization: Bearer $T" -H 'Content-Type: application/json' -d '{"token":"ExponentPushToken[falso]"}'
```

Si ahora cambian el estado de un ticket de ese usuario, Expo responde
`DeviceNotRegistered` (el token es falso) y el servidor deja `tokenPush` en
`null`. Eso prueba que el aviso **sí salió hacia Expo**.

---

## 3. App móvil (`moviles/from-zero-app`)

### 3.1 Instalar

```bash
npx expo install expo-notifications expo-dev-client
```

Y en `app.json`, agreguen el plugin:

```json
"plugins": ["expo-router", "expo-status-bar", "expo-notifications"]
```

`expo-dev-client` es lo que convierte el build en un *development build*: una
«Expo Go propia» que sí trae el código nativo de las notificaciones.

### 3.2 El transporte sabe hacer PUT (`src/api/client.ts`)

```ts
type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
```

### 3.3 El módulo (`src/modules/notifications/`)

**`api.ts`**: la traducción, como en todo módulo:

```ts
export async function savePushToken(pushToken: string | null): Promise<void> {
  await request('/auth/token-push', { token: pushToken }, 'PUT');
}
```

**`push.ts`**: lo que es del dispositivo. Tiene cuatro partes.

**a) Mostrar avisos con la app abierta.** Sin esto, un aviso que llega con la
app en primer plano no se ve:

```ts
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false,
  }),
});
```

(`shouldShowAlert` está deprecado en el SDK 57. Usen `shouldShowBanner` y
`shouldShowList`.)

**b) Obtener el token:**

```ts
async function getPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  // Android 13+: el canal debe existir ANTES de pedir permiso, o el diálogo no aparece.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Avisos de solicitudes',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
  if (status !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
}
```

**c) Registrarlo al iniciar sesión:**

```ts
export function usePushNotifications(signedIn: boolean): void {
  useEffect(() => {
    if (!signedIn) return;
    getPushToken()
      .then((pushToken) => (pushToken ? savePushToken(pushToken) : undefined))
      .catch((failure: Error) => console.warn('Notificaciones push no disponibles:', failure.message));
  }, [signedIn]);
  // …
```

Fíjense en dos cosas. Si algo falla, la app **sigue funcionando**, solo que sin
avisos. Y nunca se imprime el token: identifica el teléfono (regla 3).

**d) Abrir el caso al tocar el aviso:**

```ts
  const response = Notifications.useLastNotificationResponse();
  useEffect(() => {
    const ticketId = response?.notification.request.content.data?.ticketId;
    if (!signedIn || typeof ticketId !== 'string') return;
    Notifications.clearLastNotificationResponse();   // si no, lo reabre en el próximo login
    router.push({ pathname: '/tickets/[id]', params: { id: ticketId } });
  }, [response, signedIn]);
}
```

`useLastNotificationResponse` cubre también el caso de la **app cerrada**:
el usuario toca el aviso, la app arranca sin sesión (el token vive en memoria),
inicia sesión y *entonces* navega al caso. El `ticketId` es el mismo que el
backend puso en `datos`.

### 3.4 Conectarlo

`app/_layout.tsx`, dentro de `Navigator` (que ya tiene la sesión):

```tsx
const { user } = useSession();
usePushNotifications(!!user);
```

`app/index.tsx`: se desasocia el teléfono **antes** de cerrar sesión, porque
después ya no hay token de sesión para hacer el PUT:

```tsx
const logOut = async () => {
  await savePushToken(null).catch(() => {});   // sin red, se cierra igual
  signOut();
};
```

¿Por qué no va dentro de `session.tsx`? Porque un módulo no importa de otro
(`auth` no conoce a `notifications`). La pantalla es la que compone los dos.

```bash
npx expo start      # regenera las rutas tipadas
npx tsc --noEmit
```

---

## 4. Credenciales y el development build

### 4.1 Android (FCM V1)

1. En la [consola de Firebase](https://console.firebase.google.com), creen un
   proyecto y agreguen una **app Android** con el mismo `package` de `app.json`
   (`com.cdgutierrez456.fromzeroapp`, o el suyo).
2. Descarguen **`google-services.json`**, pónganlo en la raíz del proyecto y
   declárenlo en `app.json`:
   ```json
   "android": { "googleServicesFile": "./google-services.json", … }
   ```
   (Este archivo se puede versionar.)
3. En Firebase, vayan a **Configuración del proyecto → Cuentas de servicio →
   Generar nueva clave privada**. Se descarga un JSON. **Ese archivo NO se
   versiona**: agréguenlo al `.gitignore`.
4. Súbanlo a EAS:
   ```bash
   npx eas-cli credentials
   # Android → development (o production) → Google Service Account
   # → Manage your Google Service Account Key for Push Notifications (FCM V1)
   # → Set up → Upload a new service account key
   ```
5. Construyan e instalen:
   ```bash
   npx eas-cli build --profile development --platform android
   ```
   Al terminar, EAS da un QR o un enlace al `.apk`. Instálenlo en el teléfono.

### 4.2 iOS

1. Registren el iPhone: `npx eas-cli device:create`.
2. `npx eas-cli build --profile development --platform ios`. Cuando pregunte
   *«Setup Push Notifications for your project?»* y *«Generate a new Apple Push
   Notifications service key?»*, respondan **sí**.

### 4.3 Correr

```bash
npx expo start      # abre el development build (no Expo Go) y escanea el QR
```

En el teléfono, `EXPO_PUBLIC_API_URL` del `.env` tiene que ser la **IP del
computador**, no `localhost` (ver `.env.example`).

---

## 5. Prueba de punta a punta

1. Backend arriba (`npm run db:up && npm run dev`) y `npm run db:seed` si no lo
   han corrido.
2. En el teléfono, registren un usuario, **acepten el permiso** y creen una
   solicitud.
3. Comprueben que el token llegó:
   ```bash
   docker exec helpdesk-db psql -U helpdesk -d helpdesk -c 'select correo, "tokenPush" from "Usuario";'
   ```
4. **Cierren la app o mándenla al fondo** y cambien el estado del caso como
   coordinación:
   ```bash
   A=http://localhost:3001/api
   T=$(curl -s -X POST $A/auth/login -H 'Content-Type: application/json' \
     -d '{"correo":"coordinacion@autonoma.edu.co","clave":"<SEED_CLAVE del .env del backend>"}' \
     | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])')
   curl -s -X PATCH $A/tickets/<id-del-ticket> -H "Authorization: Bearer $T" \
     -H 'Content-Type: application/json' -d '{"estado":"EN_PROCESO"}'
   ```
5. Debe llegar *«Tu solicitud cambió de estado»*. Tóquenlo: la app abre el caso
   (si estaba cerrada, primero pide iniciar sesión).

**Atajo para aislar problemas:** en <https://expo.dev/notifications> peguen el
`ExpoPushToken` de la base de datos y envíen un aviso a mano. Si ese llega y el
del backend no, el problema está en el backend. Si tampoco llega, el problema
está en las credenciales o en el build.

---

## 6. Problemas comunes

| Síntoma | Causa probable |
|---|---|
| `Notificaciones push no disponibles: …` en Expo Go Android | Esperado: Expo Go no trae push desde el SDK 53. Usen el development build |
| `ERR_NOTIFICATIONS_NO_EXPERIENCE_ID` | Falta `extra.eas.projectId` en `app.json` → `npx eas-cli init` |
| En Android 13+ nunca aparece el diálogo de permiso | Se pidió el token antes de crear el canal |
| `tokenPush` queda en `null` en la base | El usuario negó el permiso, o Expo respondió `DeviceNotRegistered` |
| El aviso llega con la app cerrada pero no con la app abierta | Falta `setNotificationHandler` |
| `InvalidCredentials` / `MismatchSenderId` en los receipts | La clave FCM V1 subida a EAS no es del mismo proyecto de Firebase que `google-services.json` |
| Tras cerrar sesión siguen llegando avisos | `signOut()` se llamó antes que `savePushToken(null)` |
| La app no alcanza al backend desde el teléfono | `EXPO_PUBLIC_API_URL` apunta a `localhost` |

---

## 7. Ejercicios para extenderlo

1. **Avisar al agente cuando le asignan un caso (F05 + F09).** Pista: en
   `modificar`, si `cambios.agenteId` cambió, `avisar(cambios.agenteId, …)`.
2. **Varios dispositivos por usuario.** Hoy gana el último teléfono en iniciar
   sesión. Cámbienlo por una tabla `DispositivoPush (usuarioId, token)` y que
   `avisar` envíe a todos (Expo acepta hasta 100 mensajes por petición).
3. **Receipts.** Guarden el `id` que devuelve Expo y consulten `getReceipts` 15
   minutos después para saber si de verdad se entregó.
4. **Notificador de bitácora.** Escriban un `NotificadorConsola implements
   Notificador` para desarrollo sin teléfono, y escojan uno u otro en `main.ts`
   según una variable de entorno. Es exactamente lo que el documento de visión
   propone como mitigación del supuesto S1.
