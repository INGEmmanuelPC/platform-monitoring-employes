# Activar las notificaciones push: lo que falta, paso a paso

**Para:** la persona que configuró Expo (`icxrvajals-team`), Supabase y Render. ES DECIR MI COLABORADOR AMIGO CARVAJAL
**De:** Emmanuel Peñuela Chica
**Fecha:** 17 de noviembre de 2026

> Este documento no contiene claves. Lo que es secreto te lo paso por un medio privado (ver la sección 2). **No lo subas al repo con claves pegadas dentro.**

---

## 1. Qué es esto y en qué punto estamos

Estamos agregando notificaciones push a la app (ADR 0009, `mobile/docs/adr/0009-notificaciones-push.md`):

- Cuando el **administrador** crea o cambia una orden de un técnico, el técnico recibe un aviso en el teléfono, y al tocarlo se abre el trabajo.
- Cuando el **técnico** completa un trabajo, los administradores reciben un aviso.

Para que un APK reciba avisos hacen falta tres cosas en la nube: una tabla en Supabase, el backend actualizado en Render y una credencial de Firebase guardada en EAS (Expo).

**Lo que yo ya dejé hecho**
- Código del backend y de la app, con pruebas.
- Proyecto de Firebase creado, con la app Android registrada (paquete `com.icxrvajals.platformmonitoringemployes`).
- `mobile/google-services.json` agregado y declarado en `mobile/app.config.js` (`googleServicesFile`). **No hay que tocar ese archivo ni ese cambio.**
- Clave privada de la cuenta de servicio de Firebase generada (la tengo yo; te la paso por privado).

**Lo que falta, y por qué lo haces tú:** yo no tengo acceso a la organización `icxrvajals-team` en Expo (EAS responde `Entity Not Authorized` con mi cuenta `expoemman`), y no sé si tengo acceso al Supabase y al Render del despliegue. Lo que sigue necesita esos accesos.

---

## 2. Lo que Emmanuel te pasa por privado

Envíalo por un medio personal (mensaje directo o un gestor de contraseñas). Nunca por el repo ni por un chat de grupo.

| Dato | Para qué sirve | ¿Es secreto? |
|---|---|---|
| Archivo JSON de la cuenta de servicio de Firebase (se llama parecido a `...-firebase-adminsdk-....json`) | Subirlo a EAS en el paso 6 | **Sí.** Con él se pueden enviar push a nuestra app |
| Correo de Expo de Emmanuel: `epenuelachica@gmail.com` (usuario `expoemman`) | Invitarlo a la organización (paso 3, opción A) | No |

**Cuidados con el JSON**
1. Guárdalo **fuera del repositorio**, por ejemplo en `~/secrets/firebase-adminsdk.json` (`mkdir -p ~/secrets`).
2. Cuando termines el paso 6, bórralo de tu disco o guárdalo en un gestor de contraseñas.
3. Si sospechas que se filtró, avísame y lo regenero en Firebase (Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada, y se revoca la anterior).

---

## 3. Dar acceso a Emmanuel (recomendado) o hacerlo todo tú

**Opción A (la mejor): invitar a Emmanuel a la organización de Expo.** Así él puede hacer las pruebas después sin molestarte.

1. Entra a [expo.dev](https://expo.dev) con la cuenta dueña de `icxrvajals-team`.
2. Ve a la organización `icxrvajals-team` → **Members** → **Invite**.
3. Invita a `epenuelachica@gmail.com` con rol **Admin** (con **Developer** también alcanza para compilar).

**Opción B:** haz tú todos los pasos de abajo. Es más lento para ambos, pero no das acceso a nadie.

**Prohibido:** no cambies `owner` ni `projectId` en `mobile/app.json`. Si se cambian, el APK queda asociado a otro proyecto y se pierden las variables de entorno y las credenciales ya configuradas.

---

## 4. Paso a paso

Haz los pasos **en este orden**. Todo se ejecuta desde la carpeta `mobile/` salvo que se diga otra cosa, y funciona igual en WSL2 que en PowerShell.

### Paso 4.1 · Traer el código

Emmanuel te avisa cuando la rama `feat/notificaciones-push` esté subida a GitHub y fusionada. Cuando te avise:

```bash
git fetch origin
git switch develop        # o la rama que te indique Emmanuel
git pull
```

Comprueba que existen estos archivos: `backend/src/notificaciones.ts`, `backend/src/push-tokens.ts`, `mobile/docs/supabase/009_tokens_push.sql` y `mobile/google-services.json`.

### Paso 4.2 · Crear la tabla en Supabase (migración 009)

**Debes hacerlo en el mismo proyecto de Supabase al que apunta el backend desplegado en Render.** Si lo haces en otro, el backend no encontrará la tabla.

1. Abre ese proyecto en Supabase → **SQL Editor** → **New query**.
2. Pega y ejecuta (**Run**) este SQL. Es el mismo contenido de `mobile/docs/supabase/009_tokens_push.sql`:

```sql
create table if not exists public.push_tokens (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  token text not null unique,
  updated_at timestamptz not null default now()
);

alter table public.push_tokens enable row level security;
revoke all on public.push_tokens from anon, authenticated;
```

Es seguro: solo crea una tabla nueva (con `if not exists`), no toca ningún dato existente y se puede ejecutar dos veces sin problema. No crea políticas a propósito, porque solo el backend (con `service_role`) debe leer los tokens.

3. Comprueba que quedó bien:

```sql
select
  to_regclass('public.push_tokens') is not null as tabla_existe,
  (select relrowsecurity from pg_class where oid = 'public.push_tokens'::regclass) as rls_activo;
```

Las dos columnas deben devolver `true`.

> Si todavía no aplicaron las migraciones anteriores (004 a 008) en ese proyecto, revisa `mobile/docs/supabase/README.md`. La 009 solo depende de que exista la tabla `profiles`.

### Paso 4.3 · Redesplegar el backend en Render

1. En Render, abre el servicio del backend y despliega la versión con el código nuevo (**Manual Deploy → Deploy latest commit**, o el despliegue automático si está activado).
2. Espera a que termine y comprueba que responde: abre `https://<url-de-render>/health`. Debe devolver `{"status":"ok", ...}`.
3. No hace falta ninguna variable de entorno nueva. `EXPO_ACCESS_TOKEN` es opcional y no se usa.

> Render gratuito se duerme. La primera petición después de un rato puede tardar casi un minuto en responder. Es normal.

### Paso 4.4 · Revisar las variables de entorno del APK en EAS

El archivo `.env.local` no se sube a la nube, así que el APK compilado necesita las variables en EAS. Revísalas:

```bash
cd mobile
npx eas-cli login
npx eas-cli whoami
npx eas-cli env:list preview
```

Debe haber, en el entorno `preview`:

| Variable | Debe valer |
|---|---|
| `EXPO_PUBLIC_API_URL` | La URL **pública** de Render (`https://...onrender.com`), **no** una IP local tipo `192.168.x.x` |
| `EXPO_PUBLIC_SUPABASE_URL` | La URL del proyecto de Supabase |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | La clave anon/publishable de Supabase |

Si falta alguna, créala con `npx eas-cli env:create` (elige el entorno `preview`). Si `EXPO_PUBLIC_API_URL` apunta a una IP local, corrígela: el APK no podrá hablar con el backend.

### Paso 4.5 · Subir la clave de Firebase a EAS (FCM V1)

1. Ten a mano el JSON que Emmanuel te pasó (sección 2), guardado **fuera del repo**.
2. Desde `mobile/`:

```bash
npx eas-cli credentials
```

3. En el menú elige, en este orden:
   1. **Android**
   2. El perfil **preview**
   3. **Google Service Account**
   4. **Manage your Google Service Account Key for Push Notifications (FCM V1)**
   5. **Set up a new Google Service Account Key** (o "Upload a new service account key")
   6. Cuando pida la ruta, escribe la del JSON, por ejemplo `/home/<tu-usuario>/secrets/firebase-adminsdk.json`.

Los textos del menú pueden variar un poco según la versión de `eas-cli`. Si alguno no coincide, elige el que mencione **Push Notifications (FCM V1)**. Al terminar debe confirmar que la clave quedó asignada.

4. **Borra el JSON de tu disco** (o guárdalo en un gestor de contraseñas).

### Paso 4.6 · Compilar el APK

```bash
cd mobile
npx eas-cli build --profile preview --platform android
```

- El build corre en la nube; no necesitas Android SDK. Tarda entre 10 y 20 minutos.
- Si EAS pregunta algo sobre el `google-services.json` o el paquete, el paquete correcto es `com.icxrvajals.platformmonitoringemployes`.
- Al terminar te da un enlace o QR para descargar el `.apk`. Instálalo en un teléfono Android real (permite instalar apps de origen desconocido si lo pide).

> El APK debe compilarse **después** de tener el `google-services.json` en `mobile/` y declarado en `app.config.js`, y después de subir la clave FCM. Si compilas antes, no recibirá avisos.

---

## 5. Probar que funciona

Necesitas dos cuentas: un **técnico** (con el APK en el teléfono) y un **administrador** (en otro dispositivo, en Postman o con `curl`).

1. Inicia sesión como técnico en el APK y **acepta el permiso** de notificaciones cuando Android lo pida.
2. En Supabase, abre la tabla `push_tokens` (Table Editor) y comprueba que apareció una fila con el `user_id` del técnico. Si no aparece, el registro del token falló (ver sección 6).
3. **Cierra la app o mándala al fondo.**
4. Como administrador, cambia una orden **asignada a ese técnico**. Cualquiera de estas dos sirve:

   **a) Crear una orden nueva asignada a él.** Le llega *"Nuevo trabajo asignado"* con el texto *"Tienes un trabajo para {cliente}."* Al tocarlo, abre **Hoy**.

   **b) Cancelar una orden suya** que esté en `ASIGNADO`, `EN_CAMINO` o `EN_SITIO`. Con `curl` (primero obtén el token del admin iniciando sesión en `POST /auth/login`, que devuelve `session.access_token`):

   ```bash
   API=https://<url-de-render>
   curl -X PATCH $API/ordenes/<id-de-la-orden> \
     -H "Authorization: Bearer $TADMIN" \
     -H 'Content-Type: application/json' \
     -d '{"estado":"CANCELADO","motivo_cancelacion":"prueba"}'
   ```

   Le llega *"Tu trabajo cambió de estado"* con el texto *"El trabajo de {cliente} ahora está cancelado. Motivo: prueba."* Al tocarlo, abre el **detalle de ese trabajo**.

5. **Prueba inversa:** completa un trabajo como técnico (con foto y firma). El administrador recibe *"Trabajo completado"*.

**Detalles importantes**
- La persona que hace el cambio **no recibe su propio aviso**. Admin y técnico deben ser cuentas distintas.
- La prueba (b) cancela una orden de verdad. Usa una orden de prueba.
- Una orden en estado `COMPLETADO` o posterior no se puede cancelar.

---

## 6. Si algo no llega

**Primero comprueba el token.** En Supabase mira si la fila existe en `push_tokens`.

- **No hay fila:** el teléfono no pudo registrarse. Revisa que el técnico aceptó el permiso, que el APK apunta a la URL pública de Render (paso 4.4), que la migración 009 está aplicada (paso 4.2) y que el backend está desplegado con el código nuevo (paso 4.3).
- **Hay fila pero no llega el aviso:** aísla el problema así:
  1. Copia el valor de la columna `token`.
  2. Entra a [expo.dev/notifications](https://expo.dev/notifications), pega el token, escribe un título y un texto, y envía.
  3. Interpreta el resultado:
     - **Llega:** las credenciales y el APK están bien. El fallo está en el backend (no se desplegó, el técnico no es el dueño de esa orden, o el actor es la misma cuenta que el destinatario).
     - **No llega:** el fallo está en las credenciales o en el build. Revisa que la clave FCM V1 sea del **mismo proyecto de Firebase** que el `google-services.json`, que el APK se compiló **después** de agregar ese archivo y subir la clave, y que el permiso de notificaciones esté concedido en Ajustes de Android.

**Si el error viene del lado de Google (avísame a mí, Emmanuel).** Si al subir la clave o al enviar avisos aparece un error de permisos o de API, la causa más probable es que **Firebase Cloud Messaging API (V1)** no esté habilitada en el proyecto de Firebase. Normalmente viene activa en los proyectos nuevos, pero no lo pude comprobar. Se revisa en Google Cloud Console → **APIs y servicios** → **Biblioteca** → buscar "Firebase Cloud Messaging API" y verificar que diga **Habilitada**. **Eso lo reviso yo**, porque el proyecto de Firebase y Google Cloud están bajo mi cuenta y tú no tienes acceso. Pásame el mensaje de error completo y yo lo resuelvo.

| Síntoma | Causa probable |
|---|---|
| `Entity Not Authorized` en `eas project:info` | La cuenta con la que iniciaste sesión no es miembro de `icxrvajals-team` |
| Falla el build por el `google-services.json` | El archivo no está en `mobile/` o el paquete no coincide |
| `InvalidCredentials` o `MismatchSenderId` | La clave FCM subida no es del mismo proyecto de Firebase |
| Error de permisos o de API al subir la clave o al enviar avisos | Posiblemente la API "Firebase Cloud Messaging API (V1)" no está habilitada. **Avísale a Emmanuel**, él lo revisa en Google Cloud Console |
| La fila de `push_tokens` desaparece sola | Expo respondió `DeviceNotRegistered`: desinstalaron la app o quitaron el permiso |
| En Expo Go no llegan avisos | Es lo esperado: Expo Go de Android no recibe push. Hay que usar el APK |

---

## 7. Lista de verificación final

- [ ] Tengo acceso a la organización `icxrvajals-team` (`npx eas-cli project:info` muestra el proyecto).
- [ ] Migración 009 aplicada en el Supabase correcto (la consulta del paso 4.2 devuelve `true`, `true`).
- [ ] Backend redesplegado en Render y `/health` responde.
- [ ] Variables `preview` en EAS correctas, con la URL pública de Render.
- [ ] Clave FCM V1 subida a EAS y JSON borrado de mi disco.
- [ ] APK compilado después de todo lo anterior e instalado en un teléfono real.
- [ ] Prueba hecha: llegó el aviso al técnico y, al tocarlo, abrió el trabajo.
- [ ] Prueba inversa hecha: el admin recibió "Trabajo completado".

Cuando termines, cuéntame qué pasó con cada punto (y, si algo falló, pega el mensaje de error completo).
