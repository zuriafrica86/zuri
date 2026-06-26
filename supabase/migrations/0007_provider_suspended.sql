-- ============================================================
-- ZURI — Migration 0007 : statut "suspended"
-- À coller dans Supabase → SQL Editor → Run
-- ============================================================

-- Ajoute la valeur "suspended" au statut des prestataires.
ALTER TYPE provider_status ADD VALUE IF NOT EXISTS 'suspended';
