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

-- Editar/excluir convidados é uma ação da página admin (login em
-- /lista-ch-confirmados), mas — mesmo modelo de confiança do resto deste
-- arquivo — a policy do banco não distingue admin de visitante; a proteção
-- real é o login da página, não isto.
create policy "Guests can be updated from the invite site"
  on guests for update
  using (true)
  with check (true);

create policy "Guests can be deleted from the invite site"
  on guests for delete
  using (true);

-- Liga/desliga a confirmação de presença. Única linha (id = 1), controlada
-- pela noiva na página privada /lista-ch-confirmados. Sem sistema de login
-- nesse site (mesmo modelo de confiança das policies acima), então a
-- proteção real é o link da página ser secreto, não a policy do banco.
create table if not exists rsvp_settings (
  id int primary key default 1,
  is_open boolean not null default true,
  constraint rsvp_settings_single_row check (id = 1)
);

insert into rsvp_settings (id, is_open) values (1, true)
  on conflict (id) do nothing;

alter table rsvp_settings enable row level security;

create policy "Rsvp status is publicly readable"
  on rsvp_settings for select
  using (true);

create policy "Rsvp status can be toggled from the invite site"
  on rsvp_settings for update
  using (true)
  with check (true);
