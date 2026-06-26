-- ============================================================
-- ZURI — Migration 0011 : cycle de prestation + recalcul des notes
-- À lancer APRÈS la 0010. À coller dans Supabase → SQL Editor → Run
-- ============================================================

-- Suivi du cycle de prestation
alter table bookings add column if not exists started_at        timestamptz;
alter table bookings add column if not exists finished_at       timestamptz;
alter table bookings add column if not exists cliente_confirmed boolean not null default false;

-- Recalcul automatique de la note moyenne d'une Zuriste à chaque
-- changement d'avis (rien ne la mettait à jour jusqu'ici).
create or replace function recompute_provider_rating()
returns trigger
language plpgsql
security definer
as $$
declare
  pid uuid := coalesce(new.provider_id, old.provider_id);
begin
  update providers p set
    rating_avg = coalesce(
      (select round(avg(rating)::numeric, 1)
         from reviews r where r.provider_id = pid and r.status = 'visible'),
      0
    ),
    rating_count = (
      select count(*) from reviews r
       where r.provider_id = pid and r.status = 'visible'
    )
  where p.id = pid;
  return null;
end$$;

drop trigger if exists trg_recompute_rating on reviews;
create trigger trg_recompute_rating
  after insert or update or delete on reviews
  for each row execute function recompute_provider_rating();
