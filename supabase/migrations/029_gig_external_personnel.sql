-- Migration 029: gig_external_personnel for freelancers/external crew with no user accounts

CREATE TABLE public.gig_external_personnel (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id       UUID        NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  company      TEXT,
  role_on_gig  TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by   UUID        REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Index for fast lookup by gig
CREATE INDEX gig_external_personnel_gig_id_idx ON public.gig_external_personnel(gig_id);

-- Enable RLS
ALTER TABLE public.gig_external_personnel ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage external personnel"
  ON public.gig_external_personnel
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Any authenticated user can read
CREATE POLICY "Authenticated users can read external personnel"
  ON public.gig_external_personnel
  FOR SELECT
  TO authenticated
  USING (true);
