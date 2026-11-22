-- Eje 3 (EstadoReporte) sin IA: cómo avanza el reporte.
--
--   SIN_AUDIO ──(el técnico guarda su nota)──────────▶ AUDIO_LISTO     [técnico, automático]
--   AUDIO_LISTO ──(el admin redacta el reporte)──────▶ BORRADOR        [admin]
--   BORRADOR ──(el admin lo aprueba)─────────────────▶ APROBADO        [admin]
--   APROBADO ──(el admin cierra el trabajo)──────────▶ ENTREGADO       [automático, junto con CERRADO]
--
-- TRANSCRIBIENDO no se usa mientras no haya IA: AUDIO_LISTO pasa directo a
-- BORRADOR, igual que un reporte con insumo de texto en la especificación.
-- Ejecutar después de 001 a 008. No toca datos existentes salvo el relleno de
-- AUDIO_LISTO para trabajos que ya tenían una nota.
--
-- Por qué en la base de datos y no solo en la app o el backend: la política
-- RLS de trabajos deja al técnico actualizar cualquier columna de sus órdenes
-- desde PostgREST con su JWT. Sin un guardián aquí, un técnico podría escribir
-- reporte = 'APROBADO' directamente.

alter table public.trabajos
  add column if not exists reporte_texto text,
  add column if not exists reporte_aprobado_por uuid references public.profiles (id) on delete set null,
  add column if not exists reporte_aprobado_at timestamptz;

-- Guardián del eje 3 y de las columnas del reporte.
create or replace function public.validar_transicion_reporte()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_admin boolean;
begin
  -- Sin JWT (SQL Editor o service_role del backend) no hay un usuario al que
  -- aplicarle reglas de rol; el backend ya valida por su cuenta.
  if auth.uid() is null then
    return new;
  end if;
  v_admin := private.is_admin();

  -- Solo el administrador escribe el texto del reporte y su aprobación.
  if not v_admin and (
    new.reporte_texto is distinct from old.reporte_texto
    or new.reporte_aprobado_por is distinct from old.reporte_aprobado_por
    or new.reporte_aprobado_at is distinct from old.reporte_aprobado_at
  ) then
    raise exception using errcode = '23514', message = 'Solo un administrador puede redactar o aprobar el reporte.';
  end if;

  -- Un reporte aprobado ya no se edita.
  if new.reporte_texto is distinct from old.reporte_texto
     and old.reporte in ('APROBADO', 'ENTREGADO') then
    raise exception using errcode = '23514', message = 'El reporte aprobado no se puede editar.';
  end if;

  if new.reporte is not distinct from old.reporte then
    return new;
  end if;

  if not (
    (old.reporte = 'SIN_AUDIO' and new.reporte = 'AUDIO_LISTO') or
    (old.reporte = 'AUDIO_LISTO' and new.reporte = 'BORRADOR' and v_admin) or
    (old.reporte = 'BORRADOR' and new.reporte = 'APROBADO' and v_admin) or
    (old.reporte = 'APROBADO' and new.reporte = 'ENTREGADO' and v_admin)
  ) then
    raise exception using errcode = '23514',
      message = format('El servidor rechazó la transición del reporte de %s a %s.', old.reporte, new.reporte);
  end if;

  if new.reporte in ('BORRADOR', 'APROBADO') then
    if old.estado <> 'COMPLETADO' then
      raise exception using errcode = '23514', message = 'El reporte se redacta y se aprueba cuando el trabajo está terminado.';
    end if;
    if nullif(trim(new.reporte_texto), '') is null then
      raise exception using errcode = '23514', message = 'El reporte necesita texto antes de continuar.';
    end if;
  end if;

  if new.reporte = 'APROBADO' then
    new.reporte_aprobado_por := auth.uid();
    new.reporte_aprobado_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists validar_transicion_reporte on public.trabajos;
create trigger validar_transicion_reporte
before update of reporte, reporte_texto, reporte_aprobado_por, reporte_aprobado_at on public.trabajos
for each row execute function public.validar_transicion_reporte();

revoke all on function public.validar_transicion_reporte() from public;

-- Cerrar el trabajo entrega el reporte en la misma operación. Se hace en un
-- trigger para que valga igual por /ordenes, por /sync o por cualquier otra
-- vía. La guarda "solo se cierra con el reporte APROBADO" ya la aplica
-- validar_transicion_trabajo con el valor anterior de la fila.
create or replace function public.entregar_reporte_al_cerrar()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if new.estado = 'CERRADO' and old.estado is distinct from 'CERRADO' then
    new.reporte := 'ENTREGADO';
  end if;
  return new;
end;
$$;

drop trigger if exists entregar_reporte_al_cerrar on public.trabajos;
create trigger entregar_reporte_al_cerrar
before update of estado on public.trabajos
for each row execute function public.entregar_reporte_al_cerrar();

revoke all on function public.entregar_reporte_al_cerrar() from public;

-- SIN_AUDIO -> AUDIO_LISTO cuando llega la primera nota (o audio) del técnico.
-- security definer: debe poder marcar el reporte aunque quien sincroniza no
-- tenga permiso de escribir esa columna directamente.
create or replace function public.marcar_audio_listo()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.tipo in ('NOTA', 'AUDIO') then
    update public.trabajos
    set reporte = 'AUDIO_LISTO'
    where id = new.trabajo_id and reporte = 'SIN_AUDIO';
  end if;
  return new;
end;
$$;

drop trigger if exists evidencias_marcan_audio_listo on public.evidencias;
create trigger evidencias_marcan_audio_listo
after insert on public.evidencias
for each row execute function public.marcar_audio_listo();

revoke all on function public.marcar_audio_listo() from public;

-- Trabajos que ya tenían una nota antes de esta migración.
update public.trabajos t
set reporte = 'AUDIO_LISTO'
where t.reporte = 'SIN_AUDIO'
  and exists (
    select 1 from public.evidencias e
    where e.trabajo_id = t.id and e.tipo in ('NOTA', 'AUDIO')
  );
