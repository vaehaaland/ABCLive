-- Migration 018: DB trigger that creates comment_mention notifications
-- Replaces the Next.js server-action approach so mobile clients also trigger notifications.
-- Runs SECURITY DEFINER (as migration owner) to bypass RLS on the notifications table.

CREATE OR REPLACE FUNCTION public.notify_comment_mentions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  match      TEXT[];
  mention_id UUID;
BEGIN
  -- Match every @[any name](uuid) in the body
  FOR match IN
    SELECT m
    FROM regexp_matches(
      NEW.body,
      '@\[([^\]]+)\]\(([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\)',
      'g'
    ) AS m
  LOOP
    BEGIN
      mention_id := match[2]::UUID;

      -- Skip self-mentions; skip if profile doesn't exist (FK safety)
      IF mention_id != NEW.author_id AND EXISTS (
        SELECT 1 FROM public.profiles WHERE id = mention_id
      ) THEN
        INSERT INTO public.notifications (user_id, actor_id, type, gig_id, comment_id)
        VALUES (mention_id, NEW.author_id, 'comment_mention', NEW.gig_id, NEW.id);
      END IF;

    EXCEPTION WHEN invalid_text_representation THEN
      -- Malformed UUID in body — skip silently
      NULL;
    END;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_comment_insert_notify_mentions
  AFTER INSERT ON public.gig_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_comment_mentions();
