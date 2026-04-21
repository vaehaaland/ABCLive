'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function createGigAddedNotification(
  gigId: string,
  profileId: string,
  actorId: string,
): Promise<void> {
  if (profileId === actorId) return
  const db = createAdminClient()
  await db.from('notifications').insert({
    user_id: profileId,
    actor_id: actorId,
    type: 'gig_added',
    gig_id: gigId,
  })
}

export async function createMentionNotifications(
  commentId: string,
  gigId: string,
  mentionedUserIds: string[],
  actorId: string,
): Promise<void> {
  const targets = mentionedUserIds.filter(id => id !== actorId)
  if (targets.length === 0) return
  const db = createAdminClient()
  await db.from('notifications').insert(
    targets.map(userId => ({
      user_id: userId,
      actor_id: actorId,
      type: 'comment_mention' as const,
      gig_id: gigId,
      comment_id: commentId,
    }))
  )
}

