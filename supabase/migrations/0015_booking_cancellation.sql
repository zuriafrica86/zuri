-- 0015_booking_cancellation.sql
-- Annulation d'un RDV par la cliente ou la Zuriste, avec motif.

alter table public.bookings
  add column if not exists cancel_reason text,           -- motif lisible (ou texte "Autre")
  add column if not exists cancelled_by  text;           -- 'cliente' | 'prestataire'
