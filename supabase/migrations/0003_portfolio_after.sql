-- ============================================================
-- ZURI — Migration 0003 : photo "après" pour le portfolio
-- À coller dans Supabase → SQL Editor → Run
-- ============================================================

-- Un item de portfolio est soit une photo simple (image_url seule),
-- soit une paire avant/après (image_url = avant, image_url_after = après).
alter table portfolio_photos
  add column if not exists image_url_after text;
