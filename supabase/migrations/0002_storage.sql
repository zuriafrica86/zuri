-- ============================================================
-- ZURI — Migration 0002 : sécurité du stockage des photos
-- À coller dans Supabase → SQL Editor → Run
-- (le bucket "photos" doit déjà exister, en Public)
-- ============================================================

-- Lecture publique des photos (portfolios + avatars sont faits pour être vus)
create policy "photos_public_read"
on storage.objects for select
using ( bucket_id = 'photos' );

-- Une utilisatrice connectée peut envoyer des photos UNIQUEMENT dans son
-- propre dossier : photos/<son-id>/...
create policy "photos_owner_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Elle peut remplacer ses propres photos
create policy "photos_owner_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Elle peut supprimer ses propres photos
create policy "photos_owner_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
