-- Migration 025: add gig_assignment_request notification type

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'notification_type'
      AND e.enumlabel = 'gig_assignment_request'
  ) THEN
    ALTER TYPE public.notification_type ADD VALUE 'gig_assignment_request';
  END IF;
END
$$;
