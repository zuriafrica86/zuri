-- ============================================================
-- ZURI — Migration 0006 : Vague 1 (champs profil + catalogue)
-- À coller dans Supabase → SQL Editor → Run
-- ============================================================

-- --- Champs profil Zuriste ---
alter table providers add column if not exists nom text;
alter table providers add column if not exists prenom text;
alter table providers add column if not exists lieu text default 'chez_zuriste';
alter table providers add column if not exists ambassadrice boolean default false;

-- Quartier devient optionnel
alter table providers alter column quartier drop not null;

-- --- Disponibilité : disponible / indisponible / masque ---
-- On convertit dispo (enum) en texte libre contrôlé par l'app.
alter table providers alter column dispo drop default;
alter table providers alter column dispo type text using dispo::text;
alter table providers alter column dispo set default 'disponible';
update providers set dispo = 'disponible' where dispo in ('occupee', 'sur_rdv');

-- --- Catalogue sur les services ---
alter table services add column if not exists univers text;
alter table services add column if not exists categorie text;
