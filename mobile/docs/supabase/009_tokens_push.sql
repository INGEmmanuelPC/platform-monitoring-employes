-- Notificaciones push (F09): un token de Expo por cuenta.
-- El backend es el único que lee y escribe esta tabla (service_role). Se activa
-- RLS y no se crea ninguna política a propósito: ni el técnico ni el admin
-- pueden consultar tokens desde la app.

create table if not exists public.push_tokens (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  token text not null unique,
  updated_at timestamptz not null default now()
);

alter table public.push_tokens enable row level security;
revoke all on public.push_tokens from anon, authenticated;
