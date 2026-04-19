-- Migration 005: gig_files table and gig-files storage bucket

-- 1. Table for file metadata
CREATE TABLE public.gig_files (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gig_id       UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  uploaded_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  file_name    TEXT NOT NULL,
  file_size    BIGINT NOT NULL,
  mime_type    TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.gig_files ENABLE ROW LEVEL SECURITY;

-- Admins have full access
CREATE POLICY "Admins have full access to gig_files" ON public.gig_files
  FOR ALL USING (public.is_admin());

-- Technicians can view files for their assigned gigs
CREATE POLICY "Technicians can view gig files for their gigs" ON public.gig_files
  FOR SELECT USING (
    gig_id IN (
      SELECT gig_id FROM public.gig_personnel WHERE profile_id = auth.uid()
    )
  );

-- 2. Private storage bucket (10 MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gig-files',
  'gig-files',
  false,
  10485760,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 3. Helper: can current user access a file at this storage path?
--    Path format: "{gigId}/{uuid}"
--    Extracts gigId from the first folder segment and checks gig_personnel.
CREATE OR REPLACE FUNCTION public.can_access_gig_file(object_name TEXT)
RETURNS BOOLEAN AS $$
  SELECT
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.gigs g
      JOIN public.gig_personnel gp ON gp.gig_id = g.id
      WHERE g.id::text = (storage.foldername(object_name))[1]
        AND gp.profile_id = auth.uid()
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- 4. Storage RLS policies for gig-files bucket
CREATE POLICY "Admins can upload gig files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'gig-files'
    AND public.is_admin()
  );

CREATE POLICY "Admins can delete gig files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'gig-files'
    AND public.is_admin()
  );

CREATE POLICY "Authorized users can read gig files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'gig-files'
    AND public.can_access_gig_file(name)
  );
