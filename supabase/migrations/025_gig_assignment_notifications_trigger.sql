-- Migration 025: DB trigger that creates gig assignment notifications
-- Runs SECURITY DEFINER (as migration owner) to bypass RLS on the notifications table.

ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'gig_assignment_request';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'gig_assignment_response';

CREATE OR REPLACE FUNCTION public.notify_gig_assignment_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify assignee about pending assignment request.
  IF NEW.assignment_status = 'pending'
    AND NEW.assigned_by IS NOT NULL
    AND NEW.profile_id <> NEW.assigned_by
    AND NOT EXISTS (
      SELECT 1
      FROM public.notifications n
      WHERE n.user_id = NEW.profile_id
        AND n.actor_id = NEW.assigned_by
        AND n.type = 'gig_assignment_request'
        AND n.gig_id = NEW.gig_id
    )
  THEN
    INSERT INTO public.notifications (user_id, actor_id, type, gig_id)
    VALUES (NEW.profile_id, NEW.assigned_by, 'gig_assignment_request', NEW.gig_id);
  END IF;

  -- Notify assigner when assignee responds (accepted/declined).
  IF TG_OP = 'UPDATE'
    AND OLD.assignment_status IS DISTINCT FROM NEW.assignment_status
    AND NEW.assignment_status IN ('accepted', 'declined')
    AND NEW.assigned_by IS NOT NULL
    AND NEW.profile_id <> NEW.assigned_by
    AND NOT EXISTS (
      SELECT 1
      FROM public.notifications n
      WHERE n.user_id = NEW.assigned_by
        AND n.actor_id = NEW.profile_id
        AND n.type = 'gig_assignment_response'
        AND n.gig_id = NEW.gig_id
    )
  THEN
    INSERT INTO public.notifications (user_id, actor_id, type, gig_id)
    VALUES (NEW.assigned_by, NEW.profile_id, 'gig_assignment_response', NEW.gig_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_gig_personnel_notify_assignment_events ON public.gig_personnel;

CREATE TRIGGER on_gig_personnel_notify_assignment_events
  AFTER INSERT OR UPDATE ON public.gig_personnel
  FOR EACH ROW EXECUTE FUNCTION public.notify_gig_assignment_events();
