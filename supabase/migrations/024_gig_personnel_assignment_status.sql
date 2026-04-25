ALTER TABLE public.gig_personnel
ADD COLUMN assignment_status TEXT NOT NULL DEFAULT 'pending'
CHECK (assignment_status IN ('pending', 'accepted', 'declined')),
ADD COLUMN responded_at TIMESTAMPTZ;
