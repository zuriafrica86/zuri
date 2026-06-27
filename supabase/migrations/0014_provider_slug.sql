-- 0014_provider_slug.sql
-- URLs lisibles / SEO pour les profils Zuristes : /zuriste/awa-tresses
-- Ajoute un "slug" unique, généré automatiquement à partir du nom commercial.

-- 1) Colonne slug
alter table public.providers add column if not exists slug text;

-- 2) Fonction de slugification (accents FR -> ascii, minuscules, tirets)
create or replace function public.zuri_slugify(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from
    regexp_replace(
      regexp_replace(
        translate(
          lower(coalesce(input, '')),
          'àâäáãåéèêëíìîïóòôöõúùûüÿçñ',
          'aaaaaaeeeeiiiiooooouuuuycn'
        ),
        '[^a-z0-9]+', '-', 'g'   -- tout ce qui n'est pas alphanumérique -> tiret
      ),
      '-{2,}', '-', 'g'          -- tirets multiples -> un seul
    )
  );
$$;

-- 3) Backfill : un slug unique pour chaque Zuriste existante
do $$
declare
  r record;
  base text;
  candidate text;
  n int;
begin
  for r in
    select id, business_name, nom, prenom
    from public.providers
    where slug is null or slug = ''
  loop
    base := public.zuri_slugify(
      coalesce(
        nullif(r.business_name, ''),
        trim(coalesce(r.prenom, '') || '-' || coalesce(r.nom, ''))
      )
    );
    if base is null or base = '' then
      base := 'zuriste';
    end if;
    candidate := base;
    n := 1;
    while exists (select 1 from public.providers where slug = candidate) loop
      n := n + 1;
      candidate := base || '-' || n;
    end loop;
    update public.providers set slug = candidate where id = r.id;
  end loop;
end $$;

-- 4) Unicité du slug
create unique index if not exists providers_slug_key
  on public.providers (slug)
  where slug is not null;

-- 5) Fonction : (re)génère le slug d'une Zuriste depuis son nom commercial.
--    Ne change RIEN si le profil est déjà public (status approved) afin de
--    ne jamais casser un lien déjà partagé.
create or replace function public.zuri_refresh_slug(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  prov record;
  base text;
  candidate text;
  n int;
begin
  select id, business_name, nom, prenom, status
    into prov
    from public.providers
   where id = p_id;
  if not found then return; end if;
  if prov.status = 'approved' then return; end if; -- figé une fois public

  base := public.zuri_slugify(
    coalesce(
      nullif(prov.business_name, ''),
      trim(coalesce(prov.prenom, '') || '-' || coalesce(prov.nom, ''))
    )
  );
  if base is null or base = '' then base := 'zuriste'; end if;

  candidate := base;
  n := 1;
  while exists (
    select 1 from public.providers where slug = candidate and id <> p_id
  ) loop
    n := n + 1;
    candidate := base || '-' || n;
  end loop;

  update public.providers set slug = candidate where id = p_id;
end $$;

-- 6) Déclencheur : à la création d'une Zuriste, lui attribuer un slug
--    provisoire si aucun n'est fourni (pour les fiches "stub" d'inscription).
create or replace function public.providers_set_slug()
returns trigger
language plpgsql
as $$
declare
  base text;
  candidate text;
  n int;
begin
  if new.slug is null or new.slug = '' then
    base := public.zuri_slugify(
      coalesce(
        nullif(new.business_name, ''),
        trim(coalesce(new.prenom, '') || '-' || coalesce(new.nom, ''))
      )
    );
    if base is null or base = '' then base := 'zuriste'; end if;
    candidate := base;
    n := 1;
    while exists (
      select 1 from public.providers where slug = candidate
    ) loop
      n := n + 1;
      candidate := base || '-' || n;
    end loop;
    new.slug := candidate;
  end if;
  return new;
end $$;

drop trigger if exists trg_providers_set_slug on public.providers;
create trigger trg_providers_set_slug
  before insert on public.providers
  for each row execute function public.providers_set_slug();
