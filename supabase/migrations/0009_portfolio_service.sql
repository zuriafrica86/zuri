-- ============================================================
-- ZURI — Migration 0009 : relier une photo de portfolio à un service
-- À coller dans Supabase → SQL Editor → Run
-- ============================================================

-- Chaque réalisation peut illustrer une prestation précise.
-- Sert à la Bibliothèque de modèles (tarif + bouton "Choisir ce modèle").
alter table portfolio_photos
  add column if not exists service_id uuid
    references services(id) on delete set null;

create index if not exists portfolio_service_idx
  on portfolio_photos (service_id);
