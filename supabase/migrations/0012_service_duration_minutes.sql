-- Durée des prestations en minutes (source fiable pour le calcul des créneaux).
-- L'affichage "2h30" reste géré par duree_estim ; cette colonne sert au planning.

alter table services add column if not exists duree_minutes int;

-- Backfill best-effort depuis le texte existant ("2h30", "2h", "45 min").
update services set duree_minutes =
  (substring(duree_estim from '^(\d+)h'))::int * 60
  + coalesce((substring(duree_estim from '^\d+h(\d+)'))::int, 0)
where duree_minutes is null and duree_estim ~ '^\d+h';

update services set duree_minutes =
  (substring(duree_estim from '^(\d+)\s*min'))::int
where duree_minutes is null and duree_estim ~ '^\d+\s*min';
