-- Permite cancelar trabajos ya almacenados sin reconstruir la tabla.
alter table public.trabajos
  drop constraint if exists trabajos_estado_check;

alter table public.trabajos
  add constraint trabajos_estado_check
  check (estado in ('ASIGNADO', 'EN_CAMINO', 'EN_SITIO', 'COMPLETADO', 'CERRADO', 'CANCELADO'));
