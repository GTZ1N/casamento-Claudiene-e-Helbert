-- Rode este SQL no SQL Editor do seu projeto Supabase
-- (https://app.supabase.com -> seu projeto -> SQL Editor -> New query).
-- Idempotente: pode rodar o arquivo inteiro de novo a qualquer momento sem
-- erro, mesmo que parte das tabelas/policies já exista.

create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  full_name_normalized text not null unique,
  created_at timestamptz not null default now()
);

-- Celular obrigatório na confirmação pública (evita "penetra"): impede
-- duplicado comparando só os últimos 8 dígitos (normalizePhone() no app),
-- então "31995448631", "995448631" e "95448631" contam como o mesmo número
-- independente de DDD/nono dígito/como a pessoa digitou.
alter table guests add column if not exists phone text;
alter table guests add column if not exists phone_normalized text;

drop index if exists guests_phone_normalized_key;
create unique index if not exists guests_phone_normalized_key
  on guests (phone_normalized)
  where phone_normalized is not null;

alter table guests enable row level security;

-- A lista de confirmados é pública (qualquer visitante do site pode vê-la).
drop policy if exists "Guests are publicly readable" on guests;
create policy "Guests are publicly readable"
  on guests for select
  using (true);

-- Qualquer visitante pode confirmar presença (sem login).
-- O unique constraint acima em full_name_normalized impede duplicados
-- mesmo em caso de dois envios simultâneos com o mesmo nome.
drop policy if exists "Anyone can confirm attendance" on guests;
create policy "Anyone can confirm attendance"
  on guests for insert
  with check (true);

-- Editar/excluir convidados é uma ação da página admin (login em
-- /lista-ch-confirmados), mas — mesmo modelo de confiança do resto deste
-- arquivo — a policy do banco não distingue admin de visitante; a proteção
-- real é o login da página, não isto.
drop policy if exists "Guests can be updated from the invite site" on guests;
create policy "Guests can be updated from the invite site"
  on guests for update
  using (true)
  with check (true);

drop policy if exists "Guests can be deleted from the invite site" on guests;
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

drop policy if exists "Rsvp status is publicly readable" on rsvp_settings;
create policy "Rsvp status is publicly readable"
  on rsvp_settings for select
  using (true);

drop policy if exists "Rsvp status can be toggled from the invite site" on rsvp_settings;
create policy "Rsvp status can be toggled from the invite site"
  on rsvp_settings for update
  using (true)
  with check (true);

-- Crianças que um convidado leva junto. Até 5 por convidado (checado no
-- app, não no banco); idade de 0 a 12 anos.
create table if not exists guest_children (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references guests(id) on delete cascade,
  name text not null,
  age int not null,
  created_at timestamptz not null default now()
);

alter table guest_children drop constraint if exists guest_children_age_check;
alter table guest_children add constraint guest_children_age_check check (age >= 0 and age <= 12);

alter table guest_children enable row level security;

drop policy if exists "Children are publicly readable" on guest_children;
create policy "Children are publicly readable"
  on guest_children for select
  using (true);

-- Convidado adiciona as crianças dele junto da própria confirmação; a
-- página admin também insere/edita/exclui por aqui — mesmo modelo de
-- confiança do resto deste arquivo (sem login real no banco).
drop policy if exists "Anyone can add children" on guest_children;
create policy "Anyone can add children"
  on guest_children for insert
  with check (true);

drop policy if exists "Children can be updated from the invite site" on guest_children;
create policy "Children can be updated from the invite site"
  on guest_children for update
  using (true)
  with check (true);

drop policy if exists "Children can be deleted from the invite site" on guest_children;
create policy "Children can be deleted from the invite site"
  on guest_children for delete
  using (true);
