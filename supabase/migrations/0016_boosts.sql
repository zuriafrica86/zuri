-- ============================================================
-- ZURI — Migration 0016 : Boosts (mises en avant payées en Crédit Zuri)
-- À coller dans Supabase → SQL Editor → Run
-- ============================================================

-- Une ligne = une mise en avant. La pub est "active" si
--   status = 'active' ET now() entre starts_at et ends_at.
-- La recherche / la bibliothèque lisent ces lignes : rien à allumer à la main,
-- et à l'échéance la pub cesse d'elle-même (pas de tâche planifiée).
create table if not exists boosts (
  id           uuid primary key default gen_random_uuid(),
  provider_id  uuid not null references providers(id) on delete cascade,
  type         text not null,            -- profil | realisation | service | categorie
  target_id    uuid,                     -- photo / service ciblé (null pour profil)
  target_label text,                     -- libellé affiché (légende, nom service, catégorie)
  starts_at    timestamptz not null default now(),
  ends_at      timestamptz not null,
  status       text not null default 'active',  -- active | paused | cancelled | expired
  cost         integer not null default 0,      -- Zuri débités
  created_at   timestamptz default now()
);

create index if not exists boosts_active_idx   on boosts (status, ends_at);
create index if not exists boosts_provider_idx on boosts (provider_id, created_at desc);
create index if not exists boosts_target_idx   on boosts (type, target_id);

-- RLS : la Zuriste lit ses propres boosts, l'admin lit tout.
-- Les écritures se font uniquement via service_role (actions serveur).
alter table boosts enable row level security;

drop policy if exists boosts_owner_read on boosts;
create policy boosts_owner_read on boosts
  for select
  using (provider_id in (select id from providers where user_id = auth.uid()));

drop policy if exists boosts_admin_read on boosts;
create policy boosts_admin_read on boosts
  for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
