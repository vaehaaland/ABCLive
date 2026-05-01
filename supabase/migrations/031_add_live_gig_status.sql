-- Migration 031: add persisted live status for gigs.

ALTER TABLE public.gigs
  DROP CONSTRAINT IF EXISTS gigs_status_check;

ALTER TABLE public.gigs
  ADD CONSTRAINT gigs_status_check
  CHECK (status IN ('draft', 'confirmed', 'live', 'completed', 'cancelled'));
