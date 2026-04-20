CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.complete_past_gigs()
RETURNS VOID
LANGUAGE sql
AS $$
  UPDATE public.gigs
  SET status = 'completed'
  WHERE status NOT IN ('completed', 'cancelled')
    AND end_date < timezone('Europe/Oslo', now())::date;
$$;

SELECT public.complete_past_gigs();

DO $$
DECLARE
  existing_job_id BIGINT;
BEGIN
  SELECT jobid
  INTO existing_job_id
  FROM cron.job
  WHERE jobname = 'complete-past-gigs';

  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;

  PERFORM cron.schedule(
    'complete-past-gigs',
    '5 1 * * *',
    $cron$SELECT public.complete_past_gigs();$cron$
  );
END;
$$;
