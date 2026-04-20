ALTER TABLE public.gigs
  ADD COLUMN IF NOT EXISTS gig_type TEXT NOT NULL DEFAULT 'single'
  CHECK (gig_type IN ('single', 'festival'));

CREATE TABLE public.gig_program_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gig_id      UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  venue       TEXT,
  start_at    TIMESTAMP NOT NULL,
  end_at      TIMESTAMP NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_at >= start_at)
);

CREATE TABLE public.gig_program_item_personnel (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_item_id UUID NOT NULL REFERENCES public.gig_program_items(id) ON DELETE CASCADE,
  profile_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_on_item    TEXT,
  notes           TEXT,
  UNIQUE(program_item_id, profile_id)
);

CREATE TABLE public.gig_program_item_equipment (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_item_id UUID NOT NULL REFERENCES public.gig_program_items(id) ON DELETE CASCADE,
  equipment_id    UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  quantity_needed INT NOT NULL DEFAULT 1 CHECK (quantity_needed > 0),
  notes           TEXT,
  UNIQUE(program_item_id, equipment_id)
);

CREATE INDEX gig_program_items_gig_id_idx
  ON public.gig_program_items(gig_id);

CREATE INDEX gig_program_item_personnel_profile_id_idx
  ON public.gig_program_item_personnel(profile_id);

CREATE INDEX gig_program_item_equipment_equipment_id_idx
  ON public.gig_program_item_equipment(equipment_id);

ALTER TABLE public.gig_program_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gig_program_item_personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gig_program_item_equipment ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_access_gig(target_gig_id UUID)
RETURNS BOOLEAN AS $$
  SELECT
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.gig_personnel gp
      WHERE gp.gig_id = target_gig_id
        AND gp.profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.gig_program_items gpi
      JOIN public.gig_program_item_personnel gpip
        ON gpip.program_item_id = gpi.id
      WHERE gpi.gig_id = target_gig_id
        AND gpip.profile_id = auth.uid()
    );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_access_program_item(target_program_item_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.gig_program_items gpi
    WHERE gpi.id = target_program_item_id
      AND public.can_access_gig(gpi.gig_id)
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "Technicians can view gigs through program items" ON public.gigs
  FOR SELECT USING (public.can_access_gig(id));

CREATE POLICY "Technicians can view crew for accessible gigs" ON public.gig_personnel
  FOR SELECT USING (public.can_access_gig(gig_id));

CREATE POLICY "Technicians can view equipment for accessible gigs" ON public.gig_equipment
  FOR SELECT USING (public.can_access_gig(gig_id));

CREATE POLICY "Admins have full access to gig_program_items" ON public.gig_program_items
  FOR ALL USING (public.is_admin());

CREATE POLICY "Technicians can view program items for accessible gigs" ON public.gig_program_items
  FOR SELECT USING (public.can_access_program_item(id));

CREATE POLICY "Admins have full access to gig_program_item_personnel" ON public.gig_program_item_personnel
  FOR ALL USING (public.is_admin());

CREATE POLICY "Technicians can view item crew for accessible gigs" ON public.gig_program_item_personnel
  FOR SELECT USING (public.can_access_program_item(program_item_id));

CREATE POLICY "Admins have full access to gig_program_item_equipment" ON public.gig_program_item_equipment
  FOR ALL USING (public.is_admin());

CREATE POLICY "Technicians can view item equipment for accessible gigs" ON public.gig_program_item_equipment
  FOR SELECT USING (public.can_access_program_item(program_item_id));

CREATE OR REPLACE FUNCTION public.can_access_gig_file(object_name TEXT)
RETURNS BOOLEAN
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.gigs g
    WHERE g.id = split_part(object_name, '/', 1)::UUID
      AND public.can_access_gig(g.id)
  );
$$ LANGUAGE sql SECURITY DEFINER;
