-- ============================================================
-- ZURI — Migration 0004 : isoler les contacts (sécurité)
-- Les numéros quittent la table "providers" (lisible publiquement)
-- pour une table dédiée, verrouillée. À coller dans SQL Editor → Run.
-- ============================================================

-- 1) Table dédiée aux contacts, isolée et protégée
create table if not exists provider_contacts (
  provider_id     uuid primary key references providers(id) on delete cascade,
  whatsapp_number text not null,
  phone_number    text
);
alter table provider_contacts enable row level security;

-- Seuls la coiffeuse propriétaire et l'admin peuvent lire/écrire le contact.
-- (Aucune lecture publique : le numéro ne sort que via reveal_contact.)
create policy contacts_owner_all on provider_contacts for all
  using (
    exists (select 1 from providers p where p.id = provider_id and p.user_id = auth.uid())
    or is_admin()
  )
  with check (
    exists (select 1 from providers p where p.id = provider_id and p.user_id = auth.uid())
    or is_admin()
  );

-- 2) Migrer les contacts déjà saisis
insert into provider_contacts (provider_id, whatsapp_number, phone_number)
  select id, whatsapp_number, phone_number
  from providers
  where whatsapp_number is not null
  on conflict (provider_id) do nothing;

-- 3) reveal_contact lit désormais depuis la table isolée
create or replace function reveal_contact(p_provider uuid)
returns table (whatsapp_number text, phone_number text)
language sql security definer set search_path = public
as $$
  select c.whatsapp_number, c.phone_number
  from provider_contacts c
  where c.provider_id = p_provider
    and exists (
      select 1 from bookings b
      where b.provider_id = p_provider
        and b.cliente_id  = auth.uid()
        and b.status      = 'confirme'
    );
$$;

-- 4) Retirer les colonnes sensibles de la table providers (désormais publique)
alter table providers drop column if exists whatsapp_number;
alter table providers drop column if exists phone_number;
