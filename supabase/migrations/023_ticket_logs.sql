-- Migration 023: ticket workflow history and log items

-- Add workflow statuses for reported and final closure states
ALTER TYPE public.ticket_status ADD VALUE 'reported';
ALTER TYPE public.ticket_status ADD VALUE 'implemented';
ALTER TYPE public.ticket_status ADD VALUE 'not_implemented';

-- Create log items for tickets so developers can save multiple progress notes
CREATE TABLE public.ticket_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ticket_logs_ticket_id_idx ON public.ticket_logs(ticket_id);
CREATE INDEX ticket_logs_author_id_idx ON public.ticket_logs(author_id);
CREATE INDEX ticket_logs_created_at_idx ON public.ticket_logs(created_at DESC);
