-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name   TEXT,
  role        TEXT NOT NULL DEFAULT 'technician' CHECK (role IN ('admin', 'technician')),
  phone       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Gigs (assignments/oppdrag)
CREATE TABLE public.gigs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  venue       TEXT,
  client      TEXT,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'completed', 'cancelled')),
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Equipment inventory
CREATE TABLE public.equipment (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  category    TEXT,
  description TEXT,
  quantity    INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Gig <-> Personnel (many-to-many)
CREATE TABLE public.gig_personnel (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gig_id      UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  profile_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_on_gig TEXT,
  notes       TEXT,
  UNIQUE(gig_id, profile_id)
);

-- Gig <-> Equipment (many-to-many)
CREATE TABLE public.gig_equipment (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gig_id           UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  equipment_id     UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  quantity_needed  INT NOT NULL DEFAULT 1 CHECK (quantity_needed > 0),
  notes            TEXT
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'technician')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gig_personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gig_equipment ENABLE ROW LEVEL SECURITY;

-- Helper: is current user an admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin());

-- Gigs policies
CREATE POLICY "Admins have full access to gigs" ON public.gigs
  FOR ALL USING (public.is_admin());

CREATE POLICY "Technicians can view their gigs" ON public.gigs
  FOR SELECT USING (
    id IN (
      SELECT gig_id FROM public.gig_personnel WHERE profile_id = auth.uid()
    )
  );

-- Equipment policies
CREATE POLICY "Admins have full access to equipment" ON public.equipment
  FOR ALL USING (public.is_admin());

CREATE POLICY "Technicians can view equipment" ON public.equipment
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Gig personnel policies
CREATE POLICY "Admins have full access to gig_personnel" ON public.gig_personnel
  FOR ALL USING (public.is_admin());

CREATE POLICY "Technicians can view own assignments" ON public.gig_personnel
  FOR SELECT USING (profile_id = auth.uid());

-- Gig equipment policies
CREATE POLICY "Admins have full access to gig_equipment" ON public.gig_equipment
  FOR ALL USING (public.is_admin());

CREATE POLICY "Technicians can view gig equipment for their gigs" ON public.gig_equipment
  FOR SELECT USING (
    gig_id IN (
      SELECT gig_id FROM public.gig_personnel WHERE profile_id = auth.uid()
    )
  );
