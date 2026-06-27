-- Date d'anniversaire (jour + mois uniquement, sans année) pour clientes et Zuristes.
alter table profiles add column if not exists birth_day int;
alter table profiles add column if not exists birth_month int;
