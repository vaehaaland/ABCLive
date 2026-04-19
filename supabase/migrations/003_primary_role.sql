-- Add primary_role field to profiles
-- This stores the technician's typical role (e.g. "Lydtekniker", "Sceneriggar")
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS primary_role text;
