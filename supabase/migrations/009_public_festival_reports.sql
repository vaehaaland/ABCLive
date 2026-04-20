ALTER TABLE public.gigs
  ADD COLUMN IF NOT EXISTS public_report_enabled BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.gigs
  ADD COLUMN IF NOT EXISTS public_report_slug TEXT;

ALTER TABLE public.gigs
  ADD COLUMN IF NOT EXISTS public_report_password_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS gigs_public_report_slug_idx
  ON public.gigs(public_report_slug)
  WHERE public_report_slug IS NOT NULL;
