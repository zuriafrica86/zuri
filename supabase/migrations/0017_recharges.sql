-- ============================================================
-- ZURI — Migration 0017 : Recharges Crédit Zuri via SingPay
-- À coller dans Supabase → SQL Editor → Run
-- ============================================================

-- Une ligne = une tentative de recharge. La référence (unique) garantit
-- l'idempotence : un même paiement ne crédite jamais deux fois le portefeuille.
create table if not exists recharges (
  id          uuid primary key default gen_random_uuid(),
  provider_id uuid not null references providers(id) on delete cascade,
  reference   text not null unique,            -- notre référence interne
  amount      integer not null,                -- FCFA payé = Zuri crédité (1:1)
  status      text not null default 'pending', -- pending | paid | failed
  singpay_id  text,                            -- id transaction côté SingPay
  created_at  timestamptz default now(),
  paid_at     timestamptz
);

create index if not exists recharges_provider_idx on recharges (provider_id, created_at desc);
create index if not exists recharges_reference_idx on recharges (reference);

-- RLS : la Zuriste lit ses recharges, l'admin lit tout.
-- Les écritures (création + passage à "paid") se font via service_role.
alter table recharges enable row level security;

drop policy if exists recharges_owner_read on recharges;
create policy recharges_owner_read on recharges
  for select
  using (provider_id in (select id from providers where user_id = auth.uid()));

drop policy if exists recharges_admin_read on recharges;
create policy recharges_admin_read on recharges
  for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
