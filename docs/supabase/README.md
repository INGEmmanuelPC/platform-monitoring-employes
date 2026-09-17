# Supabase SQL

## Crear las tablas

1. Abre el proyecto en Supabase.
2. Entra en **SQL Editor**.
3. Selecciona **New query**.
4. Copia todo el contenido de `001_schema_inicial.sql` y pulsa **Run**.
5. Copia todo el contenido de `002_crud_backend.sql` y pulsa **Run**.
6. Copia todo el contenido de `003_tecnicos_admin_rls.sql` y pulsa **Run**.

Las migraciones crean:

- `profiles`: perfil ligado a `auth.users`.
- `trabajos`: trabajos asignados a un tecnico.
- `evidencias`: fotos, notas, audio y firma asociados a un trabajo.
- `clientes`: registros de clientes asociados a su propietario.

También crean el trigger que genera el perfil al registrar un usuario, índices,
políticas RLS y el bucket privado `evidencias`. El acceso se restringe al usuario
autenticado según las relaciones de propiedad de perfiles, trabajos y clientes.

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
