CREATE TABLE public.availability_blocks (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_from  DATE        NOT NULL,
  blocked_until DATE        NOT NULL,
  reason        TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_range CHECK (blocked_until >= blocked_from)
);

CREATE INDEX ON public.availability_blocks (profile_id, blocked_from, blocked_until);

ALTER TABLE public.availability_blocks ENABLE ROW LEVEL SECURITY;

-- Technicians manage their own blocks; admins can also insert/update/delete
CREATE POLICY "Users manage own blocks"
  ON public.availability_blocks FOR ALL
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Admins read all blocks (for conflict detection and personnel overview)
CREATE POLICY "Admins read all blocks"
  ON public.availability_blocks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
