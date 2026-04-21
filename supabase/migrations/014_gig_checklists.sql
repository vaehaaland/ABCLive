-- Migration 014: global checklist template + per-gig instances

-- Global template items (admin-managed)
CREATE TABLE public.checklist_template_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 300),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 500),
  order_index INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Per-gig instances (copied from template at gig creation)
CREATE TABLE public.gig_checklist_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id           UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  template_item_id UUID REFERENCES public.checklist_template_items(id) ON DELETE SET NULL,
  title            TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 300),
  is_checked       BOOLEAN NOT NULL DEFAULT FALSE,
  checked_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  checked_at       TIMESTAMPTZ,
  comment          TEXT CHECK (comment IS NULL OR char_length(comment) <= 1000),
  order_index      INT NOT NULL DEFAULT 0,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX gig_checklist_items_gig_id_idx
  ON public.gig_checklist_items(gig_id, order_index);
-- RLS: template items — all authenticated users can read, only admins can write
ALTER TABLE public.checklist_template_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_checklist_template" ON public.checklist_template_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_checklist_template" ON public.checklist_template_items
  FOR ALL USING (public.is_admin());
-- RLS: gig instances — participants can read/update, admin client handles insert
ALTER TABLE public.gig_checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_gig_checklist_items" ON public.gig_checklist_items
  FOR SELECT USING (public.can_access_gig(gig_id));
CREATE POLICY "update_gig_checklist_items" ON public.gig_checklist_items
  FOR UPDATE USING (public.can_access_gig(gig_id));
CREATE POLICY "insert_gig_checklist_items" ON public.gig_checklist_items
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "delete_gig_checklist_items" ON public.gig_checklist_items
  FOR DELETE USING (public.is_admin());