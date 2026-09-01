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

-- Mensagem opcional que o convidado deixa pro casal na hora de confirmar
-- presença. Só aparece na página admin (/lista-ch-confirmados) — nunca é
-- exibida publicamente.
alter table guests add column if not exists message text;

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

-- Lista oficial de convidados esperados (fonte da verdade pra quem pode
-- confirmar presença). Duplicatas são esperadas de propósito (mesmo nome
-- pode aparecer 2x, convidado por grupos diferentes) — o app trata nomes
-- duplicados como uma única identidade de confirmação via o unique já
-- existente em guests.full_name_normalized, então esta tabela não precisa
-- (e não deve) ter unique aqui.
create table if not exists guest_list_official (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  full_name_normalized text not null,
  created_at timestamptz not null default now()
);

create index if not exists guest_list_official_normalized_idx
  on guest_list_official (full_name_normalized);

alter table guest_list_official enable row level security;

-- Leitura pública: o form de RSVP precisa checar se o nome digitado está
-- na lista antes de deixar confirmar.
drop policy if exists "Official guest list is publicly readable" on guest_list_official;
create policy "Official guest list is publicly readable"
  on guest_list_official for select
  using (true);

-- Escrita: ação da página admin (login em /lista-ch-confirmados), mesmo
-- modelo de confiança do resto deste arquivo — a proteção real é o login
-- da página, não a policy do banco.
drop policy if exists "Official guest list can be managed from the invite site" on guest_list_official;
create policy "Official guest list can be managed from the invite site"
  on guest_list_official for insert
  with check (true);

drop policy if exists "Official guest list can be updated from the invite site" on guest_list_official;
create policy "Official guest list can be updated from the invite site"
  on guest_list_official for update
  using (true)
  with check (true);

drop policy if exists "Official guest list can be deleted from the invite site" on guest_list_official;
create policy "Official guest list can be deleted from the invite site"
  on guest_list_official for delete
  using (true);

-- Nomes duplicados na lista oficial (ex. duas "Janaina" convidadas por
-- grupos diferentes) precisam de UMA VAGA de confirmação cada — a primeira
-- pessoa a digitar "Janaina" não pode consumir a vaga da segunda Janaina
-- real. Isso não dá mais pra garantir só com um unique constraint (que
-- permitiria só 1 confirmação por nome no total); por isso vira uma
-- função de banco que conta, atomicamente, quantas ocorrências desse nome
-- existem na lista oficial (capacidade) vs. quantas já confirmaram
-- (ocupação), e só insere se ainda houver vaga livre.
alter table guests drop constraint if exists guests_full_name_normalized_key;

-- create or replace com uma lista de parâmetros diferente cria uma função
-- SEPARADA (overload) em vez de substituir — sem isso as duas convivem e o
-- app pode acabar chamando a versão antiga sem mensagem.
drop function if exists confirm_guest_by_name(text);

create or replace function confirm_guest_by_name(p_name text, p_message text default null)
returns guests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_normalized text;
  v_official_count int;
  v_confirmed_count int;
  v_is_open boolean;
  v_result guests;
begin
  v_normalized := lower(regexp_replace(trim(p_name), '\s+', ' ', 'g'));

  select is_open into v_is_open from rsvp_settings where id = 1;
  if v_is_open is null or not v_is_open then
    raise exception 'CLOSED';
  end if;

  -- Serializa confirmações concorrentes do mesmo nome, pra duas pessoas
  -- confirmando "Janaina" ao mesmo tempo não estourarem as vagas.
  perform pg_advisory_xact_lock(hashtext(v_normalized));

  select count(*) into v_official_count
  from guest_list_official
  where full_name_normalized = v_normalized;

  if v_official_count = 0 then
    raise exception 'NOT_FOUND';
  end if;

  select count(*) into v_confirmed_count
  from guests
  where full_name_normalized = v_normalized;

  if v_confirmed_count >= v_official_count then
    raise exception 'ALREADY_CONFIRMED';
  end if;

  insert into guests (full_name, full_name_normalized, message)
  values (trim(p_name), v_normalized, nullif(trim(p_message), ''))
  returning * into v_result;

  return v_result;
end;
$$;

grant execute on function confirm_guest_by_name(text, text) to anon, authenticated;

-- Pedidos de presente da lista (fluxo Mercado Pago em src/pages/gifts-page).
-- Criado pela edge function create-mp-preference (com a service role, não
-- pelo cliente anon) já com status 'pending' e o nome de quem presenteou;
-- a edge function mp-webhook atualiza o status para 'approved'/'rejected'
-- quando o Mercado Pago notifica o pagamento de verdade. O Pix de valor
-- livre (PixModal) não passa por aqui — não há como confirmar via API se
-- uma transferência Pix direta foi feita.
create table if not exists gift_orders (
  id uuid primary key default gen_random_uuid(),
  gift_id text not null,
  gift_name text not null,
  price numeric not null,
  giver_name text not null,
  giver_message text,
  mp_preference_id text,
  mp_payment_id text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- alter/add pois a tabela já pode existir de uma rodada anterior deste
-- arquivo (create table if not exists não adiciona colunas novas sozinho).
alter table gift_orders add column if not exists giver_message text;

create index if not exists gift_orders_status_idx on gift_orders (status);

alter table gift_orders enable row level security;

-- Mesmo modelo de confiança do resto deste arquivo: a leitura fica exposta
-- pela policy do banco, mas a proteção real de "só a noiva vê" é o login da
-- página /lista-ch-confirmados, não RLS. Escrita só acontece via edge
-- function com a service role (que ignora RLS), então não existe policy de
-- insert/update pública aqui de propósito.
drop policy if exists "Gift orders are readable from the invite site" on gift_orders;
create policy "Gift orders are readable from the invite site"
  on gift_orders for select
  using (true);
