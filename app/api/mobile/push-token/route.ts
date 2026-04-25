import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUser } from '@/lib/supabase/authenticated-user'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RegisterTokenBody = {
  expoPushToken?: string
  platform?: 'ios' | 'android'
  lastSeenAt?: string
}

type DeactivateTokenBody = {
  expoPushToken?: string
}

function isValidPlatform(platform: string | undefined): platform is 'ios' | 'android' {
  return platform === 'ios' || platform === 'android'
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request.headers.get('authorization'))
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: RegisterTokenBody
  try {
    body = await request.json() as RegisterTokenBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const expoPushToken = body.expoPushToken?.trim()
  const platform = body.platform

  if (!expoPushToken) {
    return NextResponse.json({ error: 'expoPushToken is required' }, { status: 400 })
  }

  if (!isValidPlatform(platform)) {
    return NextResponse.json({ error: "platform must be 'ios' or 'android'" }, { status: 400 })
  }

  const admin = createAdminClient()
  const now = new Date().toISOString()

  let normalizedLastSeenAt = now
  if (body.lastSeenAt) {
    const parsed = new Date(body.lastSeenAt)
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ error: 'lastSeenAt must be a valid ISO date' }, { status: 400 })
    }
    normalizedLastSeenAt = parsed.toISOString()
  }

  const { data, error } = await admin
    .from('mobile_push_tokens')
    .upsert(
      {
        profile_id: user.id,
        expo_push_token: expoPushToken,
        platform,
        is_active: true,
        last_seen_at: normalizedLastSeenAt,
        updated_at: now,
      },
      { onConflict: 'expo_push_token' },
    )
    .select('id, profile_id, expo_push_token, platform, is_active, last_seen_at, created_at, updated_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, token: data })
}

export async function DELETE(request: Request) {
  const user = await getAuthenticatedUser(request.headers.get('authorization'))
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: DeactivateTokenBody | null = null
  try {
    body = await request.json() as DeactivateTokenBody
  } catch {
    // Empty body is allowed: deactivate all user tokens.
  }

  const admin = createAdminClient()
  let query = admin
    .from('mobile_push_tokens')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('profile_id', user.id)

  if (body?.expoPushToken?.trim()) {
    query = query.eq('expo_push_token', body.expoPushToken.trim())
  }

  const { error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
