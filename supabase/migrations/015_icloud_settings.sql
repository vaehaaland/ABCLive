-- Add icloud_uid to gigs for linking gigs to iCloud Calendar events
ALTER TABLE gigs ADD COLUMN IF NOT EXISTS icloud_uid text;
CREATE INDEX IF NOT EXISTS gigs_icloud_uid_idx ON gigs(icloud_uid);

-- Table to store iCloud CalDAV credentials (one row, superadmin-only)
CREATE TABLE IF NOT EXISTS icloud_settings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apple_id     text NOT NULL,
  app_password text NOT NULL,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE icloud_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_only" ON icloud_settings
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_superadmin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_superadmin = true
    )
  );
