'use server'

import { createClient } from '@/lib/supabase/server'

export async function createAvailabilityBlock(
  blockedFrom: string,
  blockedUntil: string,
  reason: string | null,
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Ikkje innlogga' }

  const { error } = await supabase.from('availability_blocks').insert({
    profile_id: user.id,
    blocked_from: blockedFrom,
    blocked_until: blockedUntil,
    reason: reason || null,
  })

  return { error: error?.message ?? null }
}

export async function deleteAvailabilityBlock(
  blockId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Ikkje innlogga' }

  const { error } = await supabase
    .from('availability_blocks')
    .delete()
    .eq('id', blockId)

  return { error: error?.message ?? null }
}
