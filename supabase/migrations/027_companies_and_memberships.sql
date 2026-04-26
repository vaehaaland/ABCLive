-- Migration 027: Dual-company support
-- Adds companies table, company_memberships, company_id on gigs/equipment,
-- and updates all RLS policies to be company-scoped.
-- All steps run in one script so the is_admin() swap and backfill are atomic.

-- ─── 1. companies ────────────────────────────────────────────────────────────

CREATE TABLE public.companies (
  id         UUID PRIMARY KEY,
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Fixed UUIDs so downstream migrations can reference them without sub-SELECTs.
INSERT INTO public.companies (id, name, slug) VALUES
  ('00000000-0000-0000-0000-000000000001', 'ABC Studio', 'abc-studio'),
  ('00000000-0000-0000-0000-000000000002', 'Alvsvåg AS', 'alvsvag-as');

-- ─── 2. company_memberships ───────────────────────────────────────────────────

CREATE TABLE public.company_memberships (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'technician' CHECK (role IN ('admin', 'technician')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (profile_id, company_id)
);

CREATE INDEX company_memberships_profile_idx ON public.company_memberships(profile_id);
CREATE INDEX company_memberships_company_idx ON public.company_memberships(company_id);

ALTER TABLE public.company_memberships ENABLE ROW LEVEL SECURITY;

-- ─── 3. Add company_id to gigs and equipment (nullable for safe backfill) ────

ALTER TABLE public.gigs      ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.equipment ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- primary_company_id on profiles tracks a person's employer (nullable: set after signup)
ALTER TABLE public.profiles ADD COLUMN primary_company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- ─── 4. Backfill all existing data to ABC Studio ─────────────────────────────

UPDATE public.gigs      SET company_id         = '00000000-0000-0000-0000-000000000001';
UPDATE public.equipment SET company_id         = '00000000-0000-0000-0000-000000000001';
UPDATE public.profiles  SET primary_company_id = '00000000-0000-0000-0000-000000000001';

-- ─── 5. Enforce NOT NULL now that all rows have a value ──────────────────────

ALTER TABLE public.gigs      ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.equipment ALTER COLUMN company_id SET NOT NULL;

-- ─── 6. Backfill company_memberships from profiles.role ──────────────────────
-- Every existing user gets a membership in ABC Studio matching their current role.

INSERT INTO public.company_memberships (profile_id, company_id, role)
SELECT id, '00000000-0000-0000-0000-000000000001', role
FROM public.profiles;

-- ─── 7. Add indexes on new FK columns ────────────────────────────────────────

CREATE INDEX gigs_company_id_idx      ON public.gigs(company_id);
CREATE INDEX equipment_company_id_idx ON public.equipment(company_id);

-- ─── 8. Replace / add auth helper functions ──────────────────────────────────
-- All are SECURITY DEFINER so they can read company_memberships bypassing RLS.

-- is_admin(): TRUE if user is admin in ANY company.
-- Backward-compatible: anywhere that just needs "is this person a staff admin"
-- (profiles page, notification triggers, etc.) keeps working unchanged.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_memberships
    WHERE profile_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- is_admin_of_company(): TRUE only if user is admin of the given company.
CREATE OR REPLACE FUNCTION public.is_admin_of_company(target_company_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_memberships
    WHERE profile_id   = auth.uid()
      AND company_id   = target_company_id
      AND role         = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- has_company_access(): TRUE if user has any membership in the given company.
CREATE OR REPLACE FUNCTION public.has_company_access(target_company_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_memberships
    WHERE profile_id = auth.uid()
      AND company_id = target_company_id
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- is_admin_for_gig(): TRUE if user is superadmin or admin of the gig's company.
-- Used in RLS policies on gig-related tables to avoid repeating the JOIN everywhere.
CREATE OR REPLACE FUNCTION public.is_admin_for_gig(target_gig_id UUID)
RETURNS BOOLEAN AS $$
  SELECT
    public.is_superadmin()
    OR EXISTS (
      SELECT 1 FROM public.gigs g
      WHERE g.id = target_gig_id
        AND public.is_admin_of_company(g.company_id)
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- is_admin_for_program_item(): TRUE if user is admin of the gig that owns the item.
CREATE OR REPLACE FUNCTION public.is_admin_for_program_item(target_item_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.gig_program_items gpi
    WHERE gpi.id = target_item_id
      AND public.is_admin_for_gig(gpi.gig_id)
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ─── 9. Update can_access_gig to use company-scoped admin check ───────────────
-- Technician access is unchanged (must be in gig_personnel or program_item_personnel).

CREATE OR REPLACE FUNCTION public.can_access_gig(target_gig_id UUID)
RETURNS BOOLEAN AS $$
  SELECT
    public.is_admin_for_gig(target_gig_id)
    OR EXISTS (
      SELECT 1 FROM public.gig_personnel gp
      WHERE gp.gig_id = target_gig_id AND gp.profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.gig_program_items gpi
      JOIN public.gig_program_item_personnel gpip ON gpip.program_item_id = gpi.id
      WHERE gpi.gig_id = target_gig_id AND gpip.profile_id = auth.uid()
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- ─── 10. Update handle_new_user trigger ──────────────────────────────────────
-- Now also inserts a default company_memberships row (ABC Studio).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'technician');

  INSERT INTO public.profiles (id, full_name, role, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    v_role,
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  -- Auto-enroll in ABC Studio; superadmin can add Alvsvåg membership separately.
  INSERT INTO public.company_memberships (profile_id, company_id, role)
  VALUES (NEW.id, '00000000-0000-0000-0000-000000000001', v_role)
  ON CONFLICT (profile_id, company_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 11. Update gigs RLS ──────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins have full access to gigs" ON public.gigs;
CREATE POLICY "Admins have full access to own company gigs" ON public.gigs
  FOR ALL USING (public.is_admin_for_gig(id));

-- ─── 12. Update equipment RLS ────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins have full access to equipment" ON public.equipment;
CREATE POLICY "Admins have full access to own company equipment" ON public.equipment
  FOR ALL USING (
    public.is_superadmin()
    OR public.is_admin_of_company(company_id)
  );

-- ─── 13. Update gig_personnel RLS ────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins have full access to gig_personnel" ON public.gig_personnel;
CREATE POLICY "Admins have full access to own company gig_personnel" ON public.gig_personnel
  FOR ALL USING (public.is_admin_for_gig(gig_id));

-- ─── 14. Update gig_equipment RLS ────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins have full access to gig_equipment" ON public.gig_equipment;
CREATE POLICY "Admins have full access to own company gig_equipment" ON public.gig_equipment
  FOR ALL USING (public.is_admin_for_gig(gig_id));

-- ─── 15. Update gig_files RLS ────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins have full access to gig_files" ON public.gig_files;
CREATE POLICY "Admins have full access to own company gig_files" ON public.gig_files
  FOR ALL USING (public.is_admin_for_gig(gig_id));

-- ─── 16. Update gig_program_items RLS ────────────────────────────────────────

DROP POLICY IF EXISTS "Admins have full access to gig_program_items" ON public.gig_program_items;
CREATE POLICY "Admins have full access to own company gig_program_items" ON public.gig_program_items
  FOR ALL USING (public.is_admin_for_gig(gig_id));

-- ─── 17. Update gig_program_item_personnel RLS ───────────────────────────────

DROP POLICY IF EXISTS "Admins have full access to gig_program_item_personnel" ON public.gig_program_item_personnel;
CREATE POLICY "Admins have full access to own company gig_program_item_personnel" ON public.gig_program_item_personnel
  FOR ALL USING (public.is_admin_for_program_item(program_item_id));

-- ─── 18. Update gig_program_item_equipment RLS ───────────────────────────────

DROP POLICY IF EXISTS "Admins have full access to gig_program_item_equipment" ON public.gig_program_item_equipment;
CREATE POLICY "Admins have full access to own company gig_program_item_equipment" ON public.gig_program_item_equipment
  FOR ALL USING (public.is_admin_for_program_item(program_item_id));

-- ─── 19. Update gig_comments delete policy ───────────────────────────────────

DROP POLICY IF EXISTS "delete_gig_comments" ON public.gig_comments;
CREATE POLICY "delete_gig_comments" ON public.gig_comments
  FOR DELETE USING (author_id = auth.uid() OR public.is_admin_for_gig(gig_id));

-- ─── 20. Update gig_checklist_items admin policies ───────────────────────────

DROP POLICY IF EXISTS "insert_gig_checklist_items" ON public.gig_checklist_items;
DROP POLICY IF EXISTS "delete_gig_checklist_items"  ON public.gig_checklist_items;
CREATE POLICY "insert_gig_checklist_items" ON public.gig_checklist_items
  FOR INSERT WITH CHECK (public.is_admin_for_gig(gig_id));
CREATE POLICY "delete_gig_checklist_items" ON public.gig_checklist_items
  FOR DELETE USING (public.is_admin_for_gig(gig_id));

-- ─── 21. RLS for companies ────────────────────────────────────────────────────

CREATE POLICY "Users can view companies they are members of" ON public.companies
  FOR SELECT USING (
    public.is_superadmin()
    OR public.has_company_access(id)
  );

CREATE POLICY "Superadmin can manage companies" ON public.companies
  FOR ALL USING (public.is_superadmin());

-- ─── 22. RLS for company_memberships ─────────────────────────────────────────

CREATE POLICY "Users can view own memberships" ON public.company_memberships
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Admins can view memberships for their companies" ON public.company_memberships
  FOR SELECT USING (public.is_admin_of_company(company_id));

CREATE POLICY "Superadmin can manage all memberships" ON public.company_memberships
  FOR ALL USING (public.is_superadmin());
