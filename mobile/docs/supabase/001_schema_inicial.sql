-- Esquema inicial para Supabase.
-- Ejecutar completo en Supabase Dashboard > SQL Editor > New query.
-- No contiene contrasenas ni claves secretas.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role text not null default 'tecnico' check (role in ('tecnico', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do update
    set full_name = excluded.full_name,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Crea perfiles para usuarios que ya existian antes de ejecutar esta migracion.
insert into public.profiles (id, full_name)
select id, coalesce(raw_user_meta_data ->> 'full_name', '')
from auth.users
on conflict (id) do nothing;

create table if not exists public.trabajos (
  id uuid primary key default gen_random_uuid(),
  tecnico_id uuid not null references public.profiles (id) on delete cascade,
  cliente text not null,
  direccion text not null default '',
  descripcion text not null default '',
  hora_programada timestamptz,
  estado text not null default 'ASIGNADO'
    check (estado in ('ASIGNADO', 'EN_CAMINO', 'EN_SITIO', 'COMPLETADO', 'CERRADO')),
  sync text not null default 'SINCRONIZADO'
    check (sync in ('SOLO_LOCAL', 'EN_COLA', 'SINCRONIZADO', 'CONFLICTO')),
  reporte text not null default 'SIN_AUDIO'
    check (reporte in ('SIN_AUDIO', 'AUDIO_LISTO', 'TRANSCRIBIENDO', 'BORRADOR', 'APROBADO', 'ENTREGADO')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.evidencias (
  id uuid primary key default gen_random_uuid(),
  trabajo_id uuid not null references public.trabajos (id) on delete cascade,
  tipo text not null check (tipo in ('FOTO_ANTES', 'FOTO_DESPUES', 'NOTA', 'AUDIO', 'FIRMA')),
  storage_path text,
  contenido text,
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists trabajos_set_updated_at on public.trabajos;
create trigger trabajos_set_updated_at
before update on public.trabajos
for each row execute procedure public.set_updated_at();

create index if not exists trabajos_tecnico_id_idx on public.trabajos (tecnico_id);
create index if not exists trabajos_estado_idx on public.trabajos (estado);
create index if not exists evidencias_trabajo_id_idx on public.evidencias (trabajo_id);

alter table public.profiles enable row level security;
alter table public.trabajos enable row level security;
alter table public.evidencias enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles for select
to authenticated
using (id = auth.uid());

-- El cliente no puede actualizar perfiles directamente. En particular, esto
-- evita que un usuario cambie su propio role a admin.
drop policy if exists profiles_update_own on public.profiles;

drop policy if exists trabajos_select_own on public.trabajos;
create policy trabajos_select_own
on public.trabajos for select
to authenticated
using (tecnico_id = auth.uid());

drop policy if exists trabajos_insert_own on public.trabajos;
create policy trabajos_insert_own
on public.trabajos for insert
to authenticated
with check (tecnico_id = auth.uid());

drop policy if exists trabajos_update_own on public.trabajos;
create policy trabajos_update_own
on public.trabajos for update
to authenticated
using (tecnico_id = auth.uid())
with check (tecnico_id = auth.uid());

drop policy if exists trabajos_delete_own on public.trabajos;
create policy trabajos_delete_own
on public.trabajos for delete
to authenticated
using (tecnico_id = auth.uid());

drop policy if exists evidencias_select_own on public.evidencias;
create policy evidencias_select_own
on public.evidencias for select
to authenticated
using (exists (
  select 1 from public.trabajos
  where trabajos.id = evidencias.trabajo_id
    and trabajos.tecnico_id = auth.uid()
));

drop policy if exists evidencias_insert_own on public.evidencias;
create policy evidencias_insert_own
on public.evidencias for insert
to authenticated
with check (exists (
  select 1 from public.trabajos
  where trabajos.id = evidencias.trabajo_id
    and trabajos.tecnico_id = auth.uid()
));

drop policy if exists evidencias_update_own on public.evidencias;
create policy evidencias_update_own
on public.evidencias for update
to authenticated
using (exists (
  select 1 from public.trabajos
  where trabajos.id = evidencias.trabajo_id
    and trabajos.tecnico_id = auth.uid()
))
with check (exists (
  select 1 from public.trabajos
  where trabajos.id = evidencias.trabajo_id
    and trabajos.tecnico_id = auth.uid()
));

drop policy if exists evidencias_delete_own on public.evidencias;
create policy evidencias_delete_own
on public.evidencias for delete
to authenticated
using (exists (
  select 1 from public.trabajos
  where trabajos.id = evidencias.trabajo_id
    and trabajos.tecnico_id = auth.uid()
));
