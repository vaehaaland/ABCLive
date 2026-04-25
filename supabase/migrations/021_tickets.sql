-- Migration 021: ticket system for feature requests and bug reports

CREATE TYPE public.ticket_status AS ENUM (
  'open',
  'in_progress',
  'closed'
);

CREATE TABLE public.tickets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  status      public.ticket_status NOT NULL DEFAULT 'open',
  created_by  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX tickets_assigned_to_idx ON public.tickets(assigned_to);
CREATE INDEX tickets_created_by_idx ON public.tickets(created_by);
CREATE INDEX tickets_status_idx ON public.tickets(status);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own tickets
CREATE POLICY "users_insert_own_tickets"
  ON public.tickets FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Superadmin can select all tickets
CREATE POLICY "superadmin_select_all_tickets"
  ON public.tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_superadmin = true
    )
  );

-- Superadmin can update all tickets
CREATE POLICY "superadmin_update_all_tickets"
  ON public.tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_superadmin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_superadmin = true
    )
  );

-- No DELETE policy - tickets should be preserved for audit/history