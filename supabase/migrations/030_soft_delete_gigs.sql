-- Migration 030: soft delete for gigs
-- Adds deleted_at column. NULL = live, non-null = soft-deleted.
-- Child rows (gig_personnel, gig_equipment, etc.) survive so a restore is complete.

ALTER TABLE public.gigs
  ADD COLUMN deleted_at TIMESTAMPTZ NULL;

CREATE INDEX gigs_deleted_at_idx ON public.gigs (deleted_at)
  WHERE deleted_at IS NULL;
