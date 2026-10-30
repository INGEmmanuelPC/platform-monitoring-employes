# Supabase SQL

## Crear las tablas

1. Abre el proyecto en Supabase.
2. Entra en **SQL Editor**.
3. Selecciona **New query**.
4. Copia todo el contenido de `001_schema_inicial.sql` y pulsa **Run**.
5. Copia todo el contenido de `002_crud_backend.sql` y pulsa **Run**.
6. Copia todo el contenido de `003_tecnicos_admin_rls.sql` y pulsa **Run**.
7. Copia todo el contenido de `004_estado_cancelado.sql` y pulsa **Run** para aceptar `CANCELADO` en bases creadas antes de ese estado.
8. Ejecuta `005_admin_gestiona_trabajos.sql` si tu instalación aún no la tiene.
9. Antes de la demo, ejecuta `006_sync_atomico_y_cancelacion.sql` para instalar la cancelación con motivo y el RPC transaccional `sync_trabajos`.
10. Ejecuta `007_storage_upsert_reintentos.sql` para permitir reintentos idempotentes de fotografías en la carpeta privada de cada técnico.
11. Ejecuta `008_admin_ejecuta_trabajos.sql` si la cuenta administradora debe ejecutar trabajos desde Hoy. Esta migración conserva `tecnico_id`, permite al administrador leer y guardar evidencias bajo su sesión, y actualiza el RPC para aceptar las acciones de admin sin abrir el acceso del técnico a trabajos ajenos.

Las migraciones crean:

- `profiles`: perfil ligado a `auth.users`.
- `trabajos`: trabajos asignados a un tecnico.
- `evidencias`: fotos, notas, audio y firma asociados a un trabajo.
- `clientes`: registros de clientes asociados a su propietario.

También crean el trigger que genera el perfil al registrar un usuario, índices,
políticas RLS y el bucket privado `evidencias`. El acceso se restringe al usuario
autenticado según las relaciones de propiedad de perfiles, trabajos y clientes.
La migración 006 hace que cada lote de sincronización se aplique dentro de una
transacción PostgreSQL y agrega un trigger que también valida cambios directos
de estado en la base; el backend nuevo requiere estas protecciones para `/sync`.
La migración 008 es necesaria para que la nueva vista operativa de Hoy permita a
un administrador ejecutar una orden y sincronizar sus evidencias sin cambiar el
técnico históricamente asignado.

Para confirmar que 008 quedó instalada en el proyecto conectado, ejecuta:

```sql
select
  position('private.is_admin()' in pg_get_functiondef('public.sync_trabajos(jsonb)'::regprocedure)) > 0 as rpc_admite_admin,
  exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'evidencias'
      and policyname = 'evidencias_select_admin' and cmd = 'SELECT'
  ) as admin_puede_leer_evidencias,
  exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'evidencias'
      and policyname = 'evidencias_insert_admin' and cmd = 'INSERT'
  ) as admin_puede_guardar_evidencias;
```

Las tres columnas deben devolver `true`. Ejecuta la consulta en el mismo
proyecto Supabase al que apunta el backend desplegado.

## Administrador inicial y técnicos

Después de ejecutar la migración 003, asigna el primer administrador de forma
manual en **Supabase Dashboard > SQL Editor**, reemplazando el correo:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'admin@tu-dominio.com');
```

La app no contiene una pantalla ni un endpoint para cambiar roles. El backend
invita técnicos por correo y el trigger `handle_new_user` les crea un perfil con
el rol predeterminado `tecnico`.

## Verificar el CRUD de técnicos

Inicia sesión con un perfil `admin` activo y crea un técnico usando un correo
nuevo (el correo del administrador no puede reutilizarse). Comprueba que el
perfil invitado tiene `role = 'tecnico'` y que los cambios de nombre, teléfono,
especialidad y estado se reflejan en `profiles`:

```sql
select
  u.email,
  p.full_name,
  p.role,
  p.telefono,
  p.especialidad,
  p.estado
from auth.users u
join public.profiles p on p.id = u.id
where u.email = 'tecnico@tu-dominio.com';
```

Al desactivar, el perfil debe conservarse con `estado = 'INACTIVO'`; no se
elimina el usuario ni sus datos históricos. Un perfil `tecnico` no puede usar
las rutas `/tecnicos` y debe recibir `403`.

## Verificar el resultado

En SQL Editor puedes ejecutar:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('profiles', 'trabajos', 'evidencias', 'clientes')
order by table_name;
```

Comprueba si `004_estado_cancelado.sql` quedó aplicada en este proyecto. La
consulta revisa la definición real de la restricción, no la presencia del archivo
local:

```sql
select conname, pg_get_constraintdef(oid) as definicion
from pg_constraint
where conrelid = 'public.trabajos'::regclass
  and conname = 'trabajos_estado_check';
```

La definición debe incluir `CANCELADO`. Para verificar 006, comprueba la
columna, la función y el permiso para el rol autenticado:

```sql
select column_name
from information_schema.columns
where table_schema = 'public' and table_name = 'trabajos'
  and column_name = 'motivo_cancelacion';

select to_regprocedure('public.sync_trabajos(jsonb)') as funcion;

select to_regprocedure('public.validar_transicion_trabajo()') as trigger_funcion;

select tgname
from pg_trigger
where tgrelid = 'public.trabajos'::regclass
  and tgname = 'validar_transicion_trabajo'
  and not tgisinternal;

select has_function_privilege('authenticated', 'public.sync_trabajos(jsonb)', 'EXECUTE') as ejecutable;

select policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname = 'evidencias_storage_update';
```

La política `evidencias_storage_update` debe existir para que las cargas con
`upsert: true` puedan reintentar sobre la misma ruta. Debe restringir tanto
`USING` como `WITH CHECK` al bucket `evidencias` y a la carpeta cuyo primer
segmento coincide con `auth.uid()`.

No se debe llamar `sync_trabajos` a mano con datos reales para probar el
permiso: usa los fixtures controlados de `postman/README.md`. Esta auditoría no
tuvo credenciales verificables del proyecto remoto y, por tanto, no confirma el
resultado de estas consultas ni aplica migraciones remotas.

Para revisar usuarios y perfiles:

```sql
select
  u.id,
  u.email,
  u.email_confirmed_at,
  p.full_name,
  p.role
from auth.users u
left join public.profiles p on p.id = u.id
order by u.created_at desc;
```

Para crear un trabajo de prueba para el usuario autenticado no se debe pegar
un UUID inventado. Ejecuta el siguiente bloque reemplazando el correo por el
usuario existente:

```sql
insert into public.trabajos (tecnico_id, cliente, direccion, descripcion, estado)
select id, 'Cliente de prueba', 'Direccion de prueba', 'Revision de prueba', 'ASIGNADO'
from auth.users
where email = 'tu-correo-real@dominio.com';
```

Luego inicia sesión en la app. La app lee primero los trabajos de SQLite y
refresca esa copia desde la API HTTP cuando hay conexión. Las acciones de campo
se encolan localmente; la API sincroniza cambios y sube fotografías al bucket
privado cuando hay conectividad.

## Limite de correos durante desarrollo

El proveedor de correo integrado de Supabase tiene un limite temporal. Si la
app muestra que se alcanzo el limite de registros, no es un error de la app.

Para probar rapidamente el flujo sin esperar correos:

1. Abre **Authentication > Providers > Email** en Supabase.
2. Desactiva temporalmente **Confirm email**.
3. En **Authentication > Users**, crea un usuario de prueba o vuelve a usar
  un correo que no exista.
4. Registra el usuario desde la app e inicia sesion.

Para produccion, configura un proveedor SMTP propio en la configuracion de
Authentication. No pongas una `service_role key` en la app movil.
