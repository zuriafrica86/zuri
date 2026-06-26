-- ============================================================
-- ZURI — Migration 0010 : état "en cours" pour les prestations
-- ⚠️ À LANCER SEULE (un ajout de valeur d'enum ne se combine pas
--    avec d'autres requêtes dans la même exécution).
-- À coller dans Supabase → SQL Editor → Run
-- ============================================================

alter type booking_status add value if not exists 'en_cours';
