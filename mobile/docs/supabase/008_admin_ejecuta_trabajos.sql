-- Habilita que el administrador ejecute órdenes desde Hoy sin reasignarlas.
-- Reaplica la función atómica con autorización admin y políticas de evidencias.
-- Cada llamada RPC es una sola transacción.
alter table public.trabajos
  add column if not exists motivo_cancelacion text;

-- RLS permite a un administrador leer y registrar evidencias de órdenes que
-- ejecuta desde el flujo Hoy. El técnico conserva acceso solo a sus órdenes.
drop policy if exists evidencias_select_admin on public.evidencias;
create policy evidencias_select_admin
on public.evidencias for select to authenticated
using (private.is_admin());

drop policy if exists evidencias_insert_admin on public.evidencias;
create policy evidencias_insert_admin
on public.evidencias for insert to authenticated
with check (private.is_admin());

create or replace function public.sync_trabajos(p_operations jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_operation jsonb;
  v_payload jsonb;
  v_results jsonb := '[]'::jsonb;
  v_id integer;
  v_entity text;
  v_entity_id text;
  v_kind text;
  v_trabajo_id uuid;
  v_current text;
  v_next text;
  v_reporte text;
  v_signature text;
  v_client_evidence_id uuid;
  v_key text;
begin
  if auth.uid() is null then
    raise exception using errcode = 'P0001', message = 'Debes iniciar sesión.';
  end if;
  if p_operations is null or jsonb_typeof(p_operations) is distinct from 'array' then
    raise exception using errcode = 'P0001', message = 'La cola debe ser una lista de máximo 50 operaciones.';
  end if;
  if jsonb_array_length(p_operations) > 50 then
    raise exception using errcode = 'P0001', message = 'La cola debe ser una lista de máximo 50 operaciones.';
  end if;

  for v_operation in select value from jsonb_array_elements(p_operations)
  loop
    if jsonb_typeof(v_operation) is distinct from 'object' then
      raise exception using errcode = 'P0001', message = 'La operación de sincronización está mal formada.';
    end if;
    v_id := (v_operation->>'id')::integer;
    v_entity := v_operation->>'entity';
    v_entity_id := v_operation->>'entity_id';
    v_payload := v_operation->'payload';

    if v_id is null or v_id < 1 or v_entity_id is null or jsonb_typeof(v_payload) is distinct from 'object' then
      raise exception using errcode = 'P0001', message = 'La operación de sincronización está mal formada.';
    end if;

    if v_entity = 'trabajos' and v_operation->>'operation' = 'UPDATE' then
      for v_key in select jsonb_object_keys(v_payload)
      loop
        if v_key not in ('estado', 'llegada_at', 'hora_salida', 'observaciones', 'motivo_cancelacion') then
          raise exception using errcode = 'P0001', message = 'La sincronización contiene campos de trabajo no permitidos.';
        end if;
      end loop;

      v_next := v_payload->>'estado';
      if v_next is null or v_next not in ('ASIGNADO', 'EN_CAMINO', 'EN_SITIO', 'COMPLETADO', 'CERRADO', 'CANCELADO') then
        raise exception using errcode = 'P0001', message = 'El estado solicitado no es válido.';
      end if;
      v_trabajo_id := v_entity_id::uuid;
      select estado, reporte into v_current, v_reporte
      from public.trabajos
      where id = v_trabajo_id and (tecnico_id = auth.uid() or private.is_admin())
      for update;
      if not found then
        raise exception using errcode = 'P0001', message = 'La orden no existe o no tienes permiso para ejecutarla.';
      end if;

      if v_current <> v_next and not (
        (v_current = 'ASIGNADO' and v_next in ('EN_CAMINO', 'CANCELADO')) or
        (v_current = 'EN_CAMINO' and v_next in ('EN_SITIO', 'CANCELADO')) or
        (v_current = 'EN_SITIO' and v_next in ('COMPLETADO', 'CANCELADO')) or
        (v_current = 'COMPLETADO' and v_next = 'CERRADO')
      ) then
        raise exception using errcode = 'P0001', message = format('El servidor rechazó la transición de %s a %s.', v_current, v_next);
      end if;

      if v_next = 'COMPLETADO' and v_current <> 'COMPLETADO' then
        select contenido into v_signature from public.evidencias
        where trabajo_id = v_trabajo_id and tipo = 'FIRMA'
          and contenido is not null
          and length(contenido) <= 100000
          and contenido ~* '<svg[^>]*>.*<path[^>]*d="[[:space:]]*M[[:space:]]*-?[0-9]+([.][0-9]+)?[[:space:]]+-?[0-9]+([.][0-9]+)?.*L[[:space:]]+-?[0-9]+([.][0-9]+)?[[:space:]]+-?[0-9]+'
        limit 1;
        if v_signature is null then
          raise exception using errcode = 'P0001', message = 'No se puede completar el trabajo sin una firma capturada y sincronizada.';
        end if;
        if not exists (
          select 1 from public.evidencias
          where trabajo_id = v_trabajo_id and tipo in ('FOTO_ANTES', 'FOTO_DESPUES')
            and nullif(trim(storage_path), '') is not null
        ) then
          raise exception using errcode = 'P0001', message = 'No se puede completar el trabajo sin una fotografía sincronizada.';
        end if;
      end if;
      if v_next = 'CERRADO' and v_reporte <> 'APROBADO' then
        raise exception using errcode = 'P0001', message = 'Solo se puede cerrar un trabajo con el reporte aprobado.';
      end if;
      if v_next = 'CANCELADO' and nullif(trim(v_payload->>'motivo_cancelacion'), '') is null then
        raise exception using errcode = 'P0001', message = 'Indica el motivo de cancelación del trabajo.';
      end if;

      if v_current <> v_next then
        update public.trabajos set
          estado = v_next,
          llegada_at = coalesce((v_payload->>'llegada_at')::timestamptz, llegada_at),
          hora_salida = coalesce((v_payload->>'hora_salida')::timestamptz, hora_salida),
          observaciones = coalesce(v_payload->>'observaciones', observaciones),
          motivo_cancelacion = case when v_next = 'CANCELADO' then trim(v_payload->>'motivo_cancelacion') else motivo_cancelacion end,
          updated_at = now()
        where id = v_trabajo_id and (tecnico_id = auth.uid() or private.is_admin());
      end if;
    elsif v_entity = 'evidencias' and v_operation->>'operation' = 'INSERT' then
      for v_key in select jsonb_object_keys(v_payload)
      loop
        if v_key not in ('trabajo_id', 'tipo', 'storage_path', 'contenido') then
          raise exception using errcode = 'P0001', message = 'La evidencia contiene campos no permitidos.';
        end if;
      end loop;

      v_trabajo_id := (v_payload->>'trabajo_id')::uuid;
      v_kind := v_payload->>'tipo';
      if v_kind is null or v_kind not in ('FOTO_ANTES', 'FOTO_DESPUES', 'NOTA', 'FIRMA') then
        raise exception using errcode = 'P0001', message = 'El tipo de evidencia no es válido.';
      end if;
      if not exists (
        select 1 from public.trabajos
        where id = v_trabajo_id and (tecnico_id = auth.uid() or private.is_admin())
      ) then
        raise exception using errcode = 'P0001', message = 'La orden de esta evidencia no existe o no tienes permiso para modificarla.';
      end if;
      if v_kind in ('FOTO_ANTES', 'FOTO_DESPUES') and nullif(trim(v_payload->>'storage_path'), '') is null then
        raise exception using errcode = 'P0001', message = 'La fotografía no tiene una ruta remota válida.';
      end if;
      if v_kind in ('FOTO_ANTES', 'FOTO_DESPUES') and (
        split_part(v_payload->>'storage_path', '/', 1) <> auth.uid()::text or
        not exists (
          select 1 from storage.objects
          where bucket_id = 'evidencias' and name = v_payload->>'storage_path'
        )
      ) then
        raise exception using errcode = 'P0001', message = 'La fotografía no existe en el bucket privado del técnico.';
      end if;
      if v_kind = 'FIRMA' and (
        length(coalesce(v_payload->>'contenido', '')) > 100000 or
        (v_payload->>'contenido') !~* '<svg[^>]*>.*<path[^>]*d="[[:space:]]*M[[:space:]]*-?[0-9]+([.][0-9]+)?[[:space:]]+-?[0-9]+([.][0-9]+)?.*L[[:space:]]+-?[0-9]+([.][0-9]+)?[[:space:]]+-?[0-9]+'
      ) then
        raise exception using errcode = 'P0001', message = 'La firma debe contener un trazo SVG capturado.';
      end if;
      v_client_evidence_id := md5(auth.uid()::text || ':' || v_entity_id)::uuid;
      insert into public.evidencias (id, trabajo_id, tipo, storage_path, contenido)
      values (
        v_client_evidence_id,
        v_trabajo_id,
        v_kind,
        v_payload->>'storage_path',
        v_payload->>'contenido'
      ) on conflict (id) do nothing;
    else
      raise exception using errcode = 'P0001', message = 'La operación o entidad de sincronización no está permitida.';
    end if;

    v_results := v_results || jsonb_build_array(jsonb_build_object('id', v_id, 'synced', true));
  end loop;

  return jsonb_build_object('results', v_results);
end;
$$;

revoke all on function public.sync_trabajos(jsonb) from public;
grant execute on function public.sync_trabajos(jsonb) to authenticated;

-- La API móvil no debe poder saltarse las reglas escribiendo directamente a
-- PostgREST con el JWT público: Postgres vuelve a validar cada cambio de estado.
create or replace function public.validar_transicion_trabajo()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if new.estado is not distinct from old.estado then
    return new;
  end if;

  if not (
    (old.estado = 'ASIGNADO' and new.estado in ('EN_CAMINO', 'CANCELADO')) or
    (old.estado = 'EN_CAMINO' and new.estado in ('EN_SITIO', 'CANCELADO')) or
    (old.estado = 'EN_SITIO' and new.estado in ('COMPLETADO', 'CANCELADO')) or
    (old.estado = 'COMPLETADO' and new.estado = 'CERRADO')
  ) then
    raise exception using errcode = '23514', message = format('El servidor rechazó la transición de %s a %s.', old.estado, new.estado);
  end if;

  if new.estado = 'COMPLETADO' then
    if not exists (
      select 1 from public.evidencias
      where trabajo_id = old.id and tipo = 'FIRMA'
        and contenido is not null
        and length(contenido) <= 100000
        and contenido ~* '<svg[^>]*>.*<path[^>]*d="[[:space:]]*M[[:space:]]*-?[0-9]+([.][0-9]+)?[[:space:]]+-?[0-9]+([.][0-9]+)?.*L[[:space:]]+-?[0-9]+([.][0-9]+)?[[:space:]]+-?[0-9]+'
    ) then
      raise exception using errcode = '23514', message = 'No se puede completar el trabajo sin una firma capturada y sincronizada.';
    end if;
    if not exists (
      select 1 from public.evidencias e
      where e.trabajo_id = old.id and e.tipo in ('FOTO_ANTES', 'FOTO_DESPUES')
        and nullif(trim(e.storage_path), '') is not null
        and split_part(e.storage_path, '/', 1) = auth.uid()::text
        and exists (
          select 1 from storage.objects o
          where o.bucket_id = 'evidencias' and o.name = e.storage_path
        )
    ) then
      raise exception using errcode = '23514', message = 'No se puede completar el trabajo sin una fotografía sincronizada.';
    end if;
  end if;

  if new.estado = 'CERRADO' and old.reporte <> 'APROBADO' then
    raise exception using errcode = '23514', message = 'Solo se puede cerrar un trabajo con el reporte aprobado.';
  end if;
  if new.estado = 'CANCELADO' and nullif(trim(new.motivo_cancelacion), '') is null then
    raise exception using errcode = '23514', message = 'Indica el motivo de cancelación del trabajo.';
  end if;

  return new;
end;
$$;

drop trigger if exists validar_transicion_trabajo on public.trabajos;
create trigger validar_transicion_trabajo
before update of estado on public.trabajos
for each row execute function public.validar_transicion_trabajo();

revoke all on function public.validar_transicion_trabajo() from public;
