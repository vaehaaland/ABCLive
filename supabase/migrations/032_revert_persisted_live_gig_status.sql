-- Migration 032: Live is computed from confirmed gigs whose date range includes today.
-- Convert any manually persisted live rows back to confirmed and tighten the status check.

UPDATE public.gigs
SET status = 'confirmed'
WHERE status = 'live';

ALTER TABLE public.gigs
  DROP CONSTRAINT IF EXISTS gigs_status_check;

ALTER TABLE public.gigs
  ADD CONSTRAINT gigs_status_check
  CHECK (status IN ('draft', 'confirmed', 'completed', 'cancelled'));
