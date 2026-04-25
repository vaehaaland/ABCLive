'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function registerMobilePushToken(input: {
  expoPushToken: string
  platform: 'ios' | 'android'
  lastSeenAt?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const expoPushToken = input.expoPushToken.trim()
  if (!expoPushToken) throw new Error('expoPushToken is required')
  if (input.platform !== 'ios' && input.platform !== 'android') {
    throw new Error("platform must be 'ios' or 'android'")
  }

  let lastSeenAt = new Date().toISOString()
  if (input.lastSeenAt) {
    const parsed = new Date(input.lastSeenAt)
    if (Number.isNaN(parsed.getTime())) throw new Error('lastSeenAt must be a valid ISO date')
    lastSeenAt = parsed.toISOString()
  }

  const admin = createAdminClient()
  const now = new Date().toISOString()

  const { data, error } = await admin
    .from('mobile_push_tokens')
    .upsert(
      {
        profile_id: user.id,
        expo_push_token: expoPushToken,
        platform: input.platform,
        is_active: true,
        last_seen_at: lastSeenAt,
        updated_at: now,
      },
      { onConflict: 'expo_push_token' },
    )
    .select('id, profile_id, expo_push_token, platform, is_active, last_seen_at, created_at, updated_at')
    .single()

  if (error) throw new Error(error.message)

  return data
}

export async function deactivateMobilePushToken(expoPushToken?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const admin = createAdminClient()

  let query = admin
    .from('mobile_push_tokens')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('profile_id', user.id)

  if (expoPushToken?.trim()) {
    query = query.eq('expo_push_token', expoPushToken.trim())
  }

  const { error } = await query
  if (error) throw new Error(error.message)

  return { ok: true }
}
