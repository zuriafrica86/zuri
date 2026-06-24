-- ============================================================
-- ZURI — Migration 0005 : email dans profiles (notifications)
-- À coller dans Supabase → SQL Editor → Run
-- ============================================================

-- On stocke l'email dans profiles pour pouvoir notifier (lu côté serveur
-- via la clé service_role uniquement).
alter table profiles add column if not exists email text;

-- Le trigger d'inscription enregistre désormais aussi l'email.
create or replace function handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into profiles (id, role, full_name, phone, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'cliente')::user_role,
    coalesce(new.raw_user_meta_data->>'full_name', 'Utilisatrice'),
    new.raw_user_meta_data->>'phone',
    new.email
  );
  return new;
end;
$$;

-- Remplir l'email des comptes déjà existants.
update profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;
