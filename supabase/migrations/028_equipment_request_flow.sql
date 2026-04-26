-- Migration 028: Cross-company equipment request flow
-- Adds request fields to gig_equipment so equipment belonging to another company
-- requires approval from an admin of that company before it is confirmed on a gig.

-- ─── 1. New ENUM for request status ──────────────────────────────────────────

CREATE TYPE public.equipment_request_status AS ENUM ('pending', 'approved', 'denied');

-- ─── 2. Add request fields to gig_equipment ──────────────────────────────────
-- request_status NULL means same-company assignment (no approval needed).
-- Only cross-company rows get a non-null request_status.

ALTER TABLE public.gig_equipment
  ADD COLUMN request_status public.equipment_request_status,
  ADD COLUMN requested_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN responded_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN responded_at   TIMESTAMPTZ,
  ADD COLUMN response_note  TEXT;

-- Partial index for fast pending-request lookups (equipment page approval panel)
CREATE INDEX gig_equipment_pending_idx
  ON public.gig_equipment(request_status)
  WHERE request_status = 'pending';

-- ─── 3. Extend notification_type ENUM ────────────────────────────────────────

ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'equipment_request';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'equipment_request_response';

-- ─── 4. Trigger: notify on equipment request create / approve / deny ──────────

CREATE OR REPLACE FUNCTION public.notify_equipment_request_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owning_company_id UUID;
  v_admin_id          UUID;
BEGIN
  -- New cross-company request created (request_status just became 'pending')
  IF NEW.request_status = 'pending'
    AND (TG_OP = 'INSERT' OR OLD.request_status IS DISTINCT FROM 'pending')
  THEN
    SELECT company_id INTO v_owning_company_id
    FROM public.equipment
    WHERE id = NEW.equipment_id;

    FOR v_admin_id IN
      SELECT profile_id
      FROM public.company_memberships
      WHERE company_id = v_owning_company_id AND role = 'admin'
    LOOP
      CONTINUE WHEN v_admin_id = NEW.requested_by;

      INSERT INTO public.notifications (user_id, actor_id, type, gig_id)
      VALUES (v_admin_id, NEW.requested_by, 'equipment_request', NEW.gig_id);
    END LOOP;
  END IF;

  -- Request approved or denied: notify the requester
  IF TG_OP = 'UPDATE'
    AND OLD.request_status = 'pending'
    AND NEW.request_status IN ('approved', 'denied')
    AND NEW.requested_by IS NOT NULL
  THEN
    INSERT INTO public.notifications (user_id, actor_id, type, gig_id)
    VALUES (NEW.requested_by, NEW.responded_by, 'equipment_request_response', NEW.gig_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_gig_equipment_request_notify ON public.gig_equipment;

CREATE TRIGGER on_gig_equipment_request_notify
  AFTER INSERT OR UPDATE ON public.gig_equipment
  FOR EACH ROW EXECUTE FUNCTION public.notify_equipment_request_events();
