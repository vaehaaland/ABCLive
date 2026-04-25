-- Migration 022: add ticket support to notifications

-- Add ticket_created to notification_type enum
ALTER TYPE public.notification_type ADD VALUE 'ticket_created';

-- Add ticket_id column to notifications table
ALTER TABLE public.notifications ADD COLUMN ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE;

-- Add index for ticket notifications
CREATE INDEX notifications_ticket_id_idx ON public.notifications(ticket_id);