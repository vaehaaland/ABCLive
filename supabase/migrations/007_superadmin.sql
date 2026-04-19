-- Superadmin capability — a flag that grants access to Supabase user management
-- inside the app. Orthogonal to the existing `role` column: an account can be both
-- admin and superadmin, or superadmin without being admin, or (typically) just admin.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_superadmin BOOLEAN NOT NULL DEFAULT FALSE;

-- Helper: is the current user a superadmin?
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_superadmin = TRUE
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Superadmins can see and modify every profile (mirrors the admin policies)
CREATE POLICY "Superadmins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_superadmin());

CREATE POLICY "Superadmins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.is_superadmin());

-- One-off bootstrap: grant yourself superadmin. Run this manually in the SQL editor
-- after the migration is applied.
--
--   UPDATE public.profiles SET is_superadmin = TRUE WHERE email = 'alexvae@gmail.com';
