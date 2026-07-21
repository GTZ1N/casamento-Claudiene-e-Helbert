-- Rode este SQL uma vez no SQL Editor do seu projeto Supabase
-- (https://app.supabase.com -> seu projeto -> SQL Editor -> New query).

create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  full_name_normalized text not null unique,
  created_at timestamptz not null default now()
);

alter table guests enable row level security;

-- A lista de confirmados é pública (qualquer visitante do site pode vê-la).
create policy "Guests are publicly readable"
  on guests for select
  using (true);

-- Qualquer visitante pode confirmar presença (sem login).
-- O unique constraint acima em full_name_normalized impede duplicados
-- mesmo em caso de dois envios simultâneos com o mesmo nome.
create policy "Anyone can confirm attendance"
  on guests for insert
  with check (true);
