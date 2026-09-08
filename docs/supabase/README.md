# Supabase SQL

## Crear las tablas

1. Abre el proyecto en Supabase.
2. Entra en **SQL Editor**.
3. Selecciona **New query**.
4. Copia todo el contenido de `001_schema_inicial.sql`.
5. Pulsa **Run**.

La migracion crea:

- `profiles`: perfil ligado a `auth.users`.
- `trabajos`: trabajos asignados a un tecnico.
- `evidencias`: fotos, notas, audio y firma asociados a un trabajo.

Tambien crea el trigger que genera el perfil al registrar un usuario, indices y
politicas RLS. Cada tecnico solo puede leer y modificar sus propios trabajos y
evidencias.

## Verificar el resultado

En SQL Editor puedes ejecutar:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('profiles', 'trabajos', 'evidencias')
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
refresca esa copia desde `public.trabajos` cuando hay conexión. Las acciones de
campo y la subida de evidencias se incorporarán sobre esa misma cola local.

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
