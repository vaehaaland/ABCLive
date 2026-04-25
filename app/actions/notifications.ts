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

