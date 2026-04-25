-- Migration 024: add assignment workflow state to gig_personnel

CREATE TYPE public.gig_assignment_status AS ENUM ('pending', 'accepted', 'declined');

ALTER TABLE public.gig_personnel
  ADD COLUMN assignment_status public.gig_assignment_status NOT NULL DEFAULT 'pending',
  ADD COLUMN assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN responded_at TIMESTAMPTZ,
  ADD COLUMN response_note TEXT;

-- Preserve historical assignments as already accepted.
UPDATE public.gig_personnel
SET assignment_status = 'accepted';
