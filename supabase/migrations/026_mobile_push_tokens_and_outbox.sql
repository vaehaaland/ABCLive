-- Migration 026: mobile push tokens and push outbox delivery pipeline

CREATE TABLE public.mobile_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX mobile_push_tokens_expo_push_token_uidx
  ON public.mobile_push_tokens(expo_push_token);

CREATE INDEX mobile_push_tokens_profile_idx
  ON public.mobile_push_tokens(profile_id, is_active);

ALTER TABLE public.mobile_push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_mobile_push_tokens"
  ON public.mobile_push_tokens
  FOR ALL
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "admins_read_mobile_push_tokens"
  ON public.mobile_push_tokens
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (p.role = 'admin' OR p.is_superadmin = TRUE)
    )
  );

-- Delivery outbox consumed by server-side push workers.
CREATE TABLE public.notification_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES public.notifications(id) ON DELETE SET NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'retry', 'sent', 'failed')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX notification_outbox_status_retry_idx
  ON public.notification_outbox(status, next_retry_at, created_at);

CREATE INDEX notification_outbox_profile_idx
  ON public.notification_outbox(profile_id, created_at DESC);

-- No RLS policies on outbox tables: writes/reads are server-role only.
ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.notification_push_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outbox_id UUID NOT NULL REFERENCES public.notification_outbox(id) ON DELETE CASCADE,
  token_id UUID REFERENCES public.mobile_push_tokens(id) ON DELETE SET NULL,
  expo_ticket_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('ok', 'error')),
  error_code TEXT,
  error_message TEXT,
  response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX notification_push_attempts_outbox_idx
  ON public.notification_push_attempts(outbox_id, created_at DESC);

ALTER TABLE public.notification_push_attempts ENABLE ROW LEVEL SECURITY;
