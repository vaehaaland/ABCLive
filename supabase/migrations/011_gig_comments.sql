-- Migration 011: gig_comments with Facebook-style flat threading

CREATE TABLE public.gig_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id     UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id  UUID REFERENCES public.gig_comments(id) ON DELETE CASCADE,
  root_id    UUID REFERENCES public.gig_comments(id) ON DELETE CASCADE,
  body       TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT root_requires_parent CHECK (
    (parent_id IS NULL AND root_id IS NULL) OR
    (parent_id IS NOT NULL AND root_id IS NOT NULL)
  )
);

CREATE INDEX gig_comments_gig_id_idx ON public.gig_comments(gig_id, created_at);
CREATE INDEX gig_comments_root_id_idx ON public.gig_comments(root_id, created_at)
  WHERE root_id IS NOT NULL;

-- Trigger: auto-computes root_id from parent chain; clients only send parent_id
CREATE OR REPLACE FUNCTION public.normalize_comment_root()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    SELECT COALESCE(root_id, id) INTO NEW.root_id
    FROM public.gig_comments WHERE id = NEW.parent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_comment_root_id
  BEFORE INSERT ON public.gig_comments
  FOR EACH ROW EXECUTE FUNCTION public.normalize_comment_root();

ALTER TABLE public.gig_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_gig_comments" ON public.gig_comments
  FOR SELECT USING (public.can_access_gig(gig_id));

CREATE POLICY "insert_gig_comments" ON public.gig_comments
  FOR INSERT WITH CHECK (public.can_access_gig(gig_id) AND author_id = auth.uid());

CREATE POLICY "delete_gig_comments" ON public.gig_comments
  FOR DELETE USING (author_id = auth.uid() OR public.is_admin());
