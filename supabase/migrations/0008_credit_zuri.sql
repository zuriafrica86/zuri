-- ============================================================
-- ZURI — Migration 0008 : Crédit Zuri (portefeuille prépayé)
-- À coller dans Supabase → SQL Editor → Run
-- ============================================================

-- Solde + pause auto sur la Zuriste
alter table providers add column if not exists credit_balance integer not null default 0;
alter table providers add column if not exists credit_paused  boolean not null default false;

-- Grand livre des mouvements de crédit
create table if not exists wallet_transactions (
  id          uuid primary key default gen_random_uuid(),
  provider_id uuid references providers(id) on delete cascade,
  amount      integer not null,            -- signé : + crédit, - débit
  type        text    not null,            -- bonus | recharge | commission | refund | adjust
  reason      text,
  booking_id  uuid references bookings(id) on delete set null,
  created_at  timestamptz default now()
);
create index if not exists wallet_tx_provider_idx
  on wallet_transactions (provider_id, created_at desc);

-- RLS : lecture seule (écritures uniquement via service_role côté serveur)
alter table wallet_transactions enable row level security;

drop policy if exists wallet_owner_read on wallet_transactions;
create policy wallet_owner_read on wallet_transactions
  for select
  using (
    provider_id in (select id from providers where user_id = auth.uid())
  );

drop policy if exists wallet_admin_read on wallet_transactions;
create policy wallet_admin_read on wallet_transactions
  for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
