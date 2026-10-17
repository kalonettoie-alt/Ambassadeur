-- =====================================================================
-- Programme ambassadeurs — schéma de la base de données
-- À coller tel quel dans Supabase > SQL Editor > "New query" > Run.
-- Le script peut être relancé sans danger (il ne supprime aucune donnée).
-- Tous les montants sont en francs CFA, nombres entiers.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Membres de l'équipe (les 3 personnes autorisées)
-- ---------------------------------------------------------------------
create table if not exists public.team_members (
  email      text primary key check (email = lower(email)),
  name       text,
  created_at timestamptz not null default now()
);

-- Vrai si l'utilisateur connecté fait partie de l'équipe.
-- "security definer" : la fonction lit team_members même si la RLS l'en empêcherait.
create or replace function public.is_team_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.team_members
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ---------------------------------------------------------------------
-- 2. Réglages (une seule ligne, id = 1)
-- ---------------------------------------------------------------------
create table if not exists public.settings (
  id               int primary key default 1 check (id = 1),
  product_name     text not null default 'Brume parfumée',
  unit_price       int  not null default 13000 check (unit_price >= 0),
  unit_cost        int  not null default 4000  check (unit_cost >= 0),
  pot_percent      numeric(5,2) not null default 30 check (pot_percent between 0 and 100),
  partners_count   int  not null default 2 check (partners_count >= 1),
  -- Paliers : à partir de la "from"-ième unité de la semaine, "amount" F par unité.
  commission_tiers jsonb not null default
    '[{"from":1,"amount":2500},{"from":6,"amount":3000},{"from":11,"amount":3500}]'::jsonb,
  whatsapp_number  text not null default '',
  updated_at       timestamptz not null default now()
);

insert into public.settings (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 3. Affiliés
-- ---------------------------------------------------------------------
create table if not exists public.affiliates (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique check (code = upper(code) and code ~ '^[A-Z0-9_-]{2,20}$' and code <> 'DIRECT'),
  name           text not null,
  phone          text,
  commune        text,
  joined_on      date not null default (now() at time zone 'Africa/Abidjan')::date,
  active         boolean not null default true,
  adult_verified boolean not null default false,
  is_demo        boolean not null default false,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4. Clients (identifiés par leur téléphone)
-- ---------------------------------------------------------------------
create table if not exists public.clients (
  id                 uuid primary key default gen_random_uuid(),
  phone              text not null unique,
  first_affiliate_id uuid references public.affiliates(id) on delete set null,
  first_purchase_at  timestamptz not null default now(),
  is_demo            boolean not null default false,
  created_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 5. Ventes
-- Le prix et le coût sont recopiés au moment de la vente :
-- changer les réglages ne modifie jamais les ventes passées.
-- ---------------------------------------------------------------------
create table if not exists public.sales (
  id           uuid primary key default gen_random_uuid(),
  sold_at      timestamptz not null default now(),
  affiliate_id uuid references public.affiliates(id) on delete restrict, -- vide = DIRECT
  client_phone text,
  quantity     int not null check (quantity > 0),
  unit_price   int not null check (unit_price >= 0),
  unit_cost    int not null check (unit_cost >= 0),
  paid         boolean not null default true,
  delivered    boolean not null default true,
  payment_ref  text,
  entered_by   uuid default auth.uid() references auth.users(id) on delete set null,
  is_demo      boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists sales_sold_at_idx on public.sales (sold_at);
create index if not exists sales_affiliate_idx on public.sales (affiliate_id);
create index if not exists sales_client_phone_idx on public.sales (client_phone);

-- Si l'app n'envoie pas le prix ou le coût, on prend ceux des réglages actuels.
create or replace function public.sales_fill_snapshot()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.unit_price is null or new.unit_cost is null then
    select coalesce(new.unit_price, s.unit_price), coalesce(new.unit_cost, s.unit_cost)
      into new.unit_price, new.unit_cost
      from public.settings s where s.id = 1;
  end if;
  return new;
end;
$$;

drop trigger if exists sales_fill_snapshot on public.sales;
create trigger sales_fill_snapshot
  before insert on public.sales
  for each row execute function public.sales_fill_snapshot();

-- ---------------------------------------------------------------------
-- 6. Versements aux affiliés (un par affilié et par semaine)
-- ---------------------------------------------------------------------
create table if not exists public.payouts (
  id           uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete restrict,
  week_start   date not null check (extract(isodow from week_start) = 1), -- toujours un lundi
  amount       int  not null check (amount >= 0),
  paid_on      date not null default (now() at time zone 'Africa/Abidjan')::date,
  reference    text,
  is_demo      boolean not null default false,
  created_at   timestamptz not null default now(),
  unique (affiliate_id, week_start)
);

-- ---------------------------------------------------------------------
-- 7. Sécurité : Row Level Security sur TOUTES les tables.
-- Sans connexion : rien n'est visible. Connecté mais hors équipe : rien non plus.
-- ---------------------------------------------------------------------
alter table public.team_members enable row level security;
alter table public.settings     enable row level security;
alter table public.affiliates   enable row level security;
alter table public.clients      enable row level security;
alter table public.sales        enable row level security;
alter table public.payouts      enable row level security;

-- Les visiteurs non connectés n'ont aucun droit, même en lecture.
revoke all on public.team_members, public.settings, public.affiliates,
              public.clients, public.sales, public.payouts from anon;
revoke execute on function public.is_team_member() from anon, public;
grant  execute on function public.is_team_member() to authenticated;

-- L'équipe peut voir la liste de l'équipe (pas la modifier depuis l'app).
drop policy if exists team_read on public.team_members;
create policy team_read on public.team_members
  for select to authenticated using (public.is_team_member());

-- Réglages : lecture et modification, pas de création ni suppression.
drop policy if exists team_read on public.settings;
create policy team_read on public.settings
  for select to authenticated using (public.is_team_member());
drop policy if exists team_update on public.settings;
create policy team_update on public.settings
  for update to authenticated using (public.is_team_member()) with check (public.is_team_member());

-- Autres tables : accès complet pour l'équipe uniquement.
do $$
declare t text;
begin
  foreach t in array array['affiliates', 'clients', 'sales', 'payouts'] loop
    execute format('drop policy if exists team_all on public.%I', t);
    execute format(
      'create policy team_all on public.%I for all to authenticated
         using (public.is_team_member()) with check (public.is_team_member())', t);
  end loop;
end $$;

-- =====================================================================
-- 8. VOTRE ÉQUIPE — remplacez les 3 adresses ci-dessous par les vraies,
--    puis relancez uniquement ces lignes (ou tout le script).
-- =====================================================================
insert into public.team_members (email, name) values
  ('moi@exemple.com',      'Moi'),
  ('associe1@exemple.com', 'Associé 1'),
  ('associe2@exemple.com', 'Associé 2')
on conflict (email) do nothing;
