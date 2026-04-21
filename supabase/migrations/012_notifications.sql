-- Migration 012: in-app notification system

CREATE TYPE public.notification_type AS ENUM (
  'gig_added',
  'comment_mention'
);

CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id    UUID          REFERENCES public.profiles(id) ON DELETE SET NULL,
  type        public.notification_type NOT NULL,
  gig_id      UUID          REFERENCES public.gigs(id)         ON DELETE CASCADE,
  comment_id  UUID          REFERENCES public.gig_comments(id) ON DELETE CASCADE,
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Fast lookup for unread count poll (partial index — only unread rows)
CREATE INDEX notifications_user_unread_idx
  ON public.notifications(user_id, read, created_at DESC)
  WHERE read = FALSE;

-- Full list ordered by newest first
CREATE INDEX notifications_user_all_idx
  ON public.notifications(user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users may only read their own notifications
CREATE POLICY "users_select_own_notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users may mark their own notifications as read
CREATE POLICY "users_update_own_notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- No INSERT or DELETE policy for the authenticated role.
-- Server actions use the service-role key (createAdminClient) to insert
-- notifications on behalf of users, keeping the write path server-only.
