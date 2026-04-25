-- Migration 018: add is_na status to gig_checklist_items
-- is_checked and is_na are mutually exclusive

ALTER TABLE public.gig_checklist_items
  ADD COLUMN is_na BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.gig_checklist_items
  ADD CONSTRAINT checklist_item_state_exclusive
  CHECK (NOT (is_checked AND is_na));
