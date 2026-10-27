-- Permite al administrador crear y modificar trabajos de cualquier técnico.
--
-- Hasta la migración 004 las policies de `trabajos` exigían
-- `tecnico_id = auth.uid()` tanto para INSERT como para UPDATE: cada técnico
-- solo manejaba sus propias filas y era quien creaba la orden. Al introducir
-- el flujo "el admin crea la orden y asigna un técnico" (campo tecnico_id en
-- el formulario de Órdenes), esa misma policy bloquea al admin porque su
-- auth.uid() nunca coincide con el técnico asignado.
--
-- Esta migración amplía las policies para que el admin pueda insertar y
-- modificar cualquier trabajo manteniendo intacta la regla del técnico: cada
-- técnico sigue viendo y tocando únicamente sus propios trabajos. La función
-- `private.is_admin()` ya existe desde la migración 003 y lee el role del
-- JWT (security definer), así que RLS no entra en recursión.

drop policy if exists trabajos_insert_own on public.trabajos;
drop policy if exists trabajos_insert_tecnico_o_admin on public.trabajos;
create policy trabajos_insert_tecnico_o_admin
on public.trabajos for insert to authenticated
with check (tecnico_id = auth.uid() or private.is_admin());

drop policy if exists trabajos_update_own on public.trabajos;
drop policy if exists trabajos_update_tecnico_o_admin on public.trabajos;
create policy trabajos_update_tecnico_o_admin
on public.trabajos for update to authenticated
using (tecnico_id = auth.uid() or private.is_admin())
with check (tecnico_id = auth.uid() or private.is_admin());

-- Lectura: el técnico sigue viendo lo suyo (política previa trabajos_select_own
-- en 001), y el admin ya puede leer todo si en la lista anterior existe una
-- policy equivalente. Si no existe aún una policy que deje al admin leer todo,
-- se agrega aquí sin tocar la del técnico.
drop policy if exists trabajos_select_admin on public.trabajos;
create policy trabajos_select_admin
on public.trabajos for select to authenticated
using (private.is_admin());

-- El admin también puede borrar órdenes mal creadas (ya lo hace el backend
-- con hard delete). Sin esta policy, el DELETE del server fallaría con el
-- mismo error 42501 que estamos arreglando.
drop policy if exists trabajos_delete_admin on public.trabajos;
create policy trabajos_delete_admin
on public.trabajos for delete to authenticated
using (private.is_admin());
