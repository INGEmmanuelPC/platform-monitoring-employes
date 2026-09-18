-- Seguridad incremental para el CRUD administrativo de técnicos.
-- Ejecutar después de 001_schema_inicial.sql y 002_crud_backend.sql.
-- No desactiva RLS ni modifica clientes, trabajos o evidencias.

-- La función evita consultar profiles desde una política de profiles, lo cual
-- provocaría recursión. No se expone por PostgREST porque private no es un
-- esquema API; sólo se concede lo mínimo para que RLS pueda evaluarla.
create schema if not exists private;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and estado = 'ACTIVO'
  );
$$;

revoke all on function private.is_admin() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

-- Sólo una sesión que no proviene de un JWT (SQL Editor/Dashboard) puede
-- cambiar role. Así la asignación inicial de admin sigue siendo manual y un
-- usuario de Expo, incluso un admin, no puede elevar privilegios por la API.
create or replace function public.prevent_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role and auth.uid() is not null then
    raise exception 'El rol sólo puede cambiarse mediante una operación administrativa de base de datos.';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_role_change on public.profiles;
create trigger profiles_prevent_role_change
before update on public.profiles
for each row execute procedure public.prevent_profile_role_change();

-- El trigger handle_new_user es el único creador de perfiles. Ningún JWT
-- puede insertar perfiles ni editar el suyo; esto impide escalar role.
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_select_own_or_admin on public.profiles;
drop policy if exists profiles_update_admin on public.profiles;

create policy profiles_select_own_or_admin
on public.profiles for select to authenticated
using (id = auth.uid() or private.is_admin());

-- La API usa el JWT del administrador, por lo que RLS sigue aplicando en las
-- operaciones administrativas. El backend restringe los campos y destinos.
create policy profiles_update_admin
on public.profiles for update to authenticated
using (private.is_admin())
with check (private.is_admin());

-- Configura el primer administrador únicamente desde Supabase Dashboard > SQL
-- Editor, sustituyendo el correo. No se ejecute desde Expo ni desde la API:
-- update public.profiles set role = 'admin' where id = (
--   select id from auth.users where email = 'admin@tu-dominio.com'
-- );
