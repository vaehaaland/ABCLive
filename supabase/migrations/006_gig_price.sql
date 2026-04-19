-- Migration 006: price and price_notes on gigs

ALTER TABLE public.gigs
  ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) NULL,
  ADD COLUMN IF NOT EXISTS price_notes TEXT NULL;
