-- Evolucion incremental para el backend HTTP y los tres CRUD.
-- Ejecutar despues de 001_schema_inicial.sql.

alter table public.profiles
  add column if not exists telefono text not null default '',
  add column if not exists especialidad text not null default '',
  add column if not exists estado text not null default 'ACTIVO'
    check (estado in ('ACTIVO', 'INACTIVO'));

  -- Repara perfiles de usuarios creados antes de aplicar el esquema completo.
  insert into public.profiles (id, full_name)
  select id, coalesce(raw_user_meta_data ->> 'full_name', '')
  from auth.users
  on conflict (id) do nothing;

  drop policy if exists profiles_insert_own on public.profiles;
  create policy profiles_insert_own
  on public.profiles for insert to authenticated
  with check (id = auth.uid());

  drop policy if exists profiles_update_own on public.profiles;
  create policy profiles_update_own
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  propietario_id uuid not null references public.profiles (id) on delete cascade,
  nombre text not null,
  email text not null default '',
  telefono text not null default '',
  direccion text not null default '',
  estado text not null default 'ACTIVO'
    check (estado in ('ACTIVO', 'INACTIVO')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.trabajos
  add column if not exists cliente_id uuid references public.clientes (id),
  add column if not exists llegada_at timestamptz,
  add column if not exists hora_salida timestamptz,
  add column if not exists observaciones text not null default '';

create index if not exists clientes_propietario_idx on public.clientes (propietario_id);
create index if not exists trabajos_cliente_idx on public.trabajos (cliente_id);

alter table public.clientes enable row level security;

drop policy if exists clientes_select_own on public.clientes;
create policy clientes_select_own
on public.clientes for select to authenticated
using (propietario_id = auth.uid());

drop policy if exists clientes_insert_own on public.clientes;
create policy clientes_insert_own
on public.clientes for insert to authenticated
with check (propietario_id = auth.uid());

drop policy if exists clientes_update_own on public.clientes;
create policy clientes_update_own
on public.clientes for update to authenticated
using (propietario_id = auth.uid())
with check (propietario_id = auth.uid());

drop policy if exists clientes_delete_own on public.clientes;
create policy clientes_delete_own
on public.clientes for delete to authenticated
using (propietario_id = auth.uid());

-- Las nuevas ordenes se asocian al usuario autenticado y no pueden cambiar
-- de propietario mediante una actualizacion desde el cliente.
drop policy if exists trabajos_insert_own on public.trabajos;
create policy trabajos_insert_own
on public.trabajos for insert to authenticated
with check (tecnico_id = auth.uid());

-- Reaplica las politicas de evidencias para instalaciones que ejecutaron
-- parcialmente el esquema inicial.
drop policy if exists evidencias_select_own on public.evidencias;
create policy evidencias_select_own
on public.evidencias for select to authenticated
using (exists (
  select 1 from public.trabajos
  where trabajos.id = evidencias.trabajo_id
    and trabajos.tecnico_id = auth.uid()
));

drop policy if exists evidencias_insert_own on public.evidencias;
create policy evidencias_insert_own
on public.evidencias for insert to authenticated
with check (exists (
  select 1 from public.trabajos
  where trabajos.id = evidencias.trabajo_id
    and trabajos.tecnico_id = auth.uid()
));

-- Storage privado para evidencias. La aplicacion solo guardara el path en SQL.
insert into storage.buckets (id, name, public)
values ('evidencias', 'evidencias', false)
on conflict (id) do nothing;

drop policy if exists evidencias_storage_select on storage.objects;
create policy evidencias_storage_select
on storage.objects for select to authenticated
using (bucket_id = 'evidencias' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists evidencias_storage_insert on storage.objects;
create policy evidencias_storage_insert
on storage.objects for insert to authenticated
with check (bucket_id = 'evidencias' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists evidencias_storage_delete on storage.objects;
create policy evidencias_storage_delete
on storage.objects for delete to authenticated
using (bucket_id = 'evidencias' and (storage.foldername(name))[1] = auth.uid()::text);
