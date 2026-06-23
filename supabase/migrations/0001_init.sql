-- ============================================================
-- ZURI — Migration initiale (Bloc 1 : fondation + auth)
-- À coller dans Supabase Studio → SQL Editor → Run
-- ============================================================

-- ---------- EXTENSIONS ----------
create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ---------- ENUMS ----------
create type user_role       as enum ('cliente', 'prestataire', 'admin');
create type provider_status as enum ('pending', 'approved', 'rejected');
create type dispo_status    as enum ('disponible', 'occupee', 'sur_rdv');
create type contact_channel as enum ('whatsapp', 'appel');
create type review_status   as enum ('visible', 'masque');
create type booking_status  as enum ('en_attente', 'confirme', 'refuse', 'annule', 'termine');

-- ============================================================
-- TABLES
-- ============================================================

-- profiles : 1 ligne par utilisateur (lié à auth.users)
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role   not null default 'cliente',
  full_name   text        not null,
  phone       text,
  avatar_url  text,
  created_at  timestamptz default now()
);

-- providers : le profil "pro" d'une coiffeuse
create table providers (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references profiles(id) on delete cascade,  -- nullable : profils seedés par l'admin (supply-first)
  business_name   text            not null,
  bio             text,
  profile_photo   text,
  ville           text            not null,
  quartier        text            not null,
  whatsapp_number text            not null,      -- format intl ex: 24107xxxxxxx (jamais exposé publiquement)
  phone_number    text,                          -- idem
  dispo           dispo_status    default 'sur_rdv',
  status          provider_status default 'pending',
  verified        boolean         default false,
  rating_avg      numeric(2,1)    default 0,
  rating_count    int             default 0,
  contact_count   int             default 0,
  created_at      timestamptz     default now()
);
create index providers_ville_quartier_idx on providers (ville, quartier, status);

-- services proposés par une coiffeuse
create table services (
  id           uuid primary key default gen_random_uuid(),
  provider_id  uuid references providers(id) on delete cascade,
  name         text not null,
  category     text not null default 'tresses',  -- tresses | coiffure
  price_min    int  not null,                    -- FCFA
  price_max    int,
  duree_estim  text,
  description  text
);
create index services_provider_idx on services (provider_id);

-- portfolio photos (avant/après)
create table portfolio_photos (
  id           uuid primary key default gen_random_uuid(),
  provider_id  uuid references providers(id) on delete cascade,
  image_url    text not null,
  type         text default 'general',   -- avant | apres | general
  caption      text,
  position     int  default 0,
  created_at   timestamptz default now()
);
create index portfolio_provider_idx on portfolio_photos (provider_id);

-- disponibilités détaillées (phase 2 ; le champ providers.dispo suffit au lancement)
create table availability (
  id           uuid primary key default gen_random_uuid(),
  provider_id  uuid references providers(id) on delete cascade,
  day_of_week  int  not null,    -- 0 = dimanche ... 6 = samedi
  start_time   time,
  end_time     time
);

-- avis clientes
create table reviews (
  id           uuid primary key default gen_random_uuid(),
  provider_id  uuid references providers(id) on delete cascade,
  cliente_id   uuid references profiles(id) on delete cascade,
  rating       int  not null check (rating between 1 and 5),
  comment      text,
  status       review_status default 'visible',
  created_at   timestamptz default now(),
  unique (provider_id, cliente_id)   -- 1 avis par cliente par coiffeuse
);
create index reviews_provider_idx on reviews (provider_id);

-- favoris
create table favorites (
  cliente_id   uuid references profiles(id) on delete cascade,
  provider_id  uuid references providers(id) on delete cascade,
  created_at   timestamptz default now(),
  primary key (cliente_id, provider_id)
);

-- demandes de RDV (modèle Uber : demande -> réponse, pas de chat)
create table bookings (
  id              uuid primary key default gen_random_uuid(),
  provider_id     uuid references providers(id) on delete cascade,
  cliente_id      uuid references profiles(id) on delete cascade,
  service_id      uuid references services(id) on delete set null,
  date_souhaitee  date not null,
  heure_souhaitee time,
  note            text,                 -- 1 message court de la cliente (one-shot)
  status          booking_status default 'en_attente',
  created_at      timestamptz default now(),
  expires_at      timestamptz default now() + interval '24 hours'
);
create index bookings_provider_idx on bookings (provider_id, status);
create index bookings_cliente_idx  on bookings (cliente_id);

-- événements de contact (la métrique clé : clic WhatsApp après RDV confirmé)
create table contact_events (
  id           uuid primary key default gen_random_uuid(),
  provider_id  uuid references providers(id) on delete cascade,
  cliente_id   uuid references profiles(id) on delete set null,
  channel      contact_channel not null,
  created_at   timestamptz default now()
);
create index contact_events_provider_idx on contact_events (provider_id, created_at);

-- ============================================================
-- HELPERS
-- ============================================================

-- L'utilisateur courant est-il admin ?
create or replace function is_admin()
returns boolean
language sql security definer stable set search_path = public
as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- ============================================================
-- TRIGGER : créer le profil à l'inscription
-- (les métadonnées full_name / phone / role viennent du signup)
-- ============================================================
create or replace function handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into profiles (id, role, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'cliente')::user_role,
    coalesce(new.raw_user_meta_data->>'full_name', 'Utilisatrice'),
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- VUE PUBLIQUE : annuaire SANS les contacts
-- L'app liste/affiche les coiffeuses via cette vue uniquement.
-- ============================================================
create view providers_public as
  select id, user_id, business_name, bio, profile_photo, ville, quartier,
         dispo, status, verified, rating_avg, rating_count, created_at
  from providers
  where status = 'approved';

-- ============================================================
-- FONCTION : révéler le contact UNIQUEMENT si RDV confirmé
-- (Option A confirmée : après confirmation de la coiffeuse)
-- ============================================================
create or replace function reveal_contact(p_provider uuid)
returns table (whatsapp_number text, phone_number text)
language sql security definer set search_path = public
as $$
  select p.whatsapp_number, p.phone_number
  from providers p
  where p.id = p_provider
    and exists (
      select 1 from bookings b
      where b.provider_id = p_provider
        and b.cliente_id  = auth.uid()
        and b.status      = 'confirme'
    );
$$;
-- Renvoie 0 ligne si pas de RDV confirmé → le contact reste invisible.
-- Pour passer en Option B (révélation dès l'envoi) : remplacer
--   b.status = 'confirme'  par  b.status in ('en_attente','confirme')

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles         enable row level security;
alter table providers        enable row level security;
alter table services         enable row level security;
alter table portfolio_photos enable row level security;
alter table availability     enable row level security;
alter table reviews          enable row level security;
alter table favorites        enable row level security;
alter table bookings         enable row level security;
alter table contact_events   enable row level security;

-- ---------- profiles ----------
-- Chacun lit / modifie SON profil. Personne ne lit le profil d'autrui.
create policy profiles_self_read   on profiles for select using (auth.uid() = id or is_admin());
create policy profiles_self_update on profiles for update using (auth.uid() = id);
-- (l'insertion se fait via le trigger en security definer)

-- ---------- providers ----------
-- Lecture publique des profils approuvés (la vue masque déjà les contacts).
create policy providers_public_read on providers for select using (status = 'approved' or auth.uid() = user_id or is_admin());
create policy providers_owner_write on providers for update using (auth.uid() = user_id or is_admin());
create policy providers_owner_insert on providers for insert with check (auth.uid() = user_id or is_admin());

-- ---------- services ----------
create policy services_public_read on services for select
  using (exists (select 1 from providers p where p.id = provider_id and (p.status = 'approved' or p.user_id = auth.uid() or is_admin())));
create policy services_owner_all on services for all
  using (exists (select 1 from providers p where p.id = provider_id and (p.user_id = auth.uid() or is_admin())))
  with check (exists (select 1 from providers p where p.id = provider_id and (p.user_id = auth.uid() or is_admin())));

-- ---------- portfolio ----------
create policy portfolio_public_read on portfolio_photos for select
  using (exists (select 1 from providers p where p.id = provider_id and (p.status = 'approved' or p.user_id = auth.uid() or is_admin())));
create policy portfolio_owner_all on portfolio_photos for all
  using (exists (select 1 from providers p where p.id = provider_id and (p.user_id = auth.uid() or is_admin())))
  with check (exists (select 1 from providers p where p.id = provider_id and (p.user_id = auth.uid() or is_admin())));

-- ---------- availability ----------
create policy availability_public_read on availability for select
  using (exists (select 1 from providers p where p.id = provider_id and (p.status = 'approved' or p.user_id = auth.uid() or is_admin())));
create policy availability_owner_all on availability for all
  using (exists (select 1 from providers p where p.id = provider_id and (p.user_id = auth.uid() or is_admin())))
  with check (exists (select 1 from providers p where p.id = provider_id and (p.user_id = auth.uid() or is_admin())));

-- ---------- reviews ----------
create policy reviews_public_read on reviews for select using (status = 'visible' or is_admin());
create policy reviews_cliente_write on reviews for insert with check (auth.uid() = cliente_id);
create policy reviews_cliente_update on reviews for update using (auth.uid() = cliente_id);
create policy reviews_cliente_delete on reviews for delete using (auth.uid() = cliente_id or is_admin());

-- ---------- favorites ----------
create policy favorites_self_all on favorites for all
  using (auth.uid() = cliente_id) with check (auth.uid() = cliente_id);

-- ---------- bookings ----------
-- La cliente voit ses demandes. La coiffeuse voit les demandes qui la concernent.
create policy bookings_cliente_read on bookings for select using (auth.uid() = cliente_id);
create policy bookings_provider_read on bookings for select
  using (exists (select 1 from providers p where p.id = provider_id and p.user_id = auth.uid()) or is_admin());
-- La cliente crée une demande.
create policy bookings_cliente_insert on bookings for insert with check (auth.uid() = cliente_id);
-- La coiffeuse met à jour le statut de SES demandes (confirmer/refuser).
create policy bookings_provider_update on bookings for update
  using (exists (select 1 from providers p where p.id = provider_id and p.user_id = auth.uid()));

-- ---------- contact_events ----------
create policy contact_insert on contact_events for insert with check (auth.uid() = cliente_id);
create policy contact_provider_read on contact_events for select
  using (exists (select 1 from providers p where p.id = provider_id and p.user_id = auth.uid()) or is_admin());

-- ============================================================
-- NOTE : la fonction reveal_contact() est en SECURITY DEFINER,
-- elle contourne donc la RLS de providers mais applique sa propre
-- vérification (RDV confirmé). C'est le SEUL chemin vers un numéro.
-- ============================================================
