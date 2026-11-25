-- Reglas del servidor que el documento de visión exige y faltaban:
--   1. El técnico no cancela ni cierra: solo avanza el flujo de campo.
--   2. Para completar un trabajo hace falta una foto «después» (no vale solo «antes»).
--
-- Ejecutar después de 001 a 010. No toca datos existentes y es re-ejecutable.
--
-- Por qué en la base de datos y no solo en el backend: la política RLS de
-- trabajos deja al técnico actualizar sus órdenes directamente desde PostgREST
-- con su JWT, sin pasar por Express. Estos triggers aplican igual por /sync, por
-- /ordenes o por cualquier otra vía.

-- 1. Rol: quién puede mover el estado.
--    Técnico: ASIGNADO -> EN_CAMINO -> EN_SITIO -> COMPLETADO.
--    Administrador: todo lo válido (también ejecuta trabajos, migración 008).
create or replace function public.validar_rol_transicion_trabajo()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if new.estado is not distinct from old.estado then
    return new;
  end if;

  -- Sin JWT (SQL Editor o service_role del backend) no hay un usuario al que
  -- aplicarle reglas de rol; el backend ya valida por su cuenta.
  if auth.uid() is null or private.is_admin() then
    return new;
  end if;

  if not (
    (old.estado = 'ASIGNADO' and new.estado = 'EN_CAMINO') or
    (old.estado = 'EN_CAMINO' and new.estado = 'EN_SITIO') or
    (old.estado = 'EN_SITIO' and new.estado = 'COMPLETADO')
  ) then
    raise exception using errcode = '42501',
      message = 'Solo un administrador puede cancelar o cerrar un trabajo.';
  end if;

  return new;
end;
$$;

drop trigger if exists validar_rol_transicion_trabajo on public.trabajos;
create trigger validar_rol_transicion_trabajo
before update of estado on public.trabajos
for each row execute function public.validar_rol_transicion_trabajo();

revoke all on function public.validar_rol_transicion_trabajo() from public;

-- 2. Foto «después» obligatoria para completar.
--    Se suma a las guardas de validar_transicion_trabajo (firma y «alguna foto»).
create or replace function public.exigir_foto_despues_al_completar()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if new.estado = 'COMPLETADO' and old.estado is distinct from 'COMPLETADO' then
    if not exists (
      select 1 from public.evidencias e
      where e.trabajo_id = old.id
        and e.tipo = 'FOTO_DESPUES'
        and nullif(trim(e.storage_path), '') is not null
    ) then
      raise exception using errcode = '23514',
        message = 'No se puede completar el trabajo sin una foto «después» sincronizada.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists exigir_foto_despues_al_completar on public.trabajos;
create trigger exigir_foto_despues_al_completar
before update of estado on public.trabajos
for each row execute function public.exigir_foto_despues_al_completar();

revoke all on function public.exigir_foto_despues_al_completar() from public;
