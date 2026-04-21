import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchICloudEvents } from '@/lib/icloud/caldav'
import type { ICloudEvent } from '@/lib/icloud/caldav'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export interface ICloudEventWithStatus extends ICloudEvent {
  existingGigId: string | null
  existingGigName: string | null
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ikkje innlogga' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_superadmin')
    .eq('id', user.id)
    .single() as unknown as { data: { is_superadmin: boolean } | null }
  if (!profile?.is_superadmin) return NextResponse.json({ error: 'Ikkje tilgang' }, { status: 403 })

  const url = new URL(request.url)
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  if (!from || !to) {
    return NextResponse.json({ error: 'Manglar from eller to parameter' }, { status: 400 })
  }

  const { data: settings } = await supabase
    .from('icloud_settings')
    .select('apple_id, app_password')
    .limit(1)
    .single() as unknown as { data: { apple_id: string; app_password: string } | null }
  if (!settings) {
    return NextResponse.json({ error: 'iCloud ikkje konfigurert' }, { status: 400 })
  }

  let events: ICloudEvent[]
  try {
    events = await fetchICloudEvents(settings.apple_id, settings.app_password, from, to)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Ukjend feil'
    return NextResponse.json({ error: `Henting feila: ${msg}` }, { status: 500 })
  }

  // Check which iCloud UIDs already have a matching gig
  const uids = events.map((e) => e.uid).filter(Boolean)
  const gigsByUid = new Map<string, { id: string; name: string }>()

  if (uids.length > 0) {
    const { data: matchedGigs } = await supabase
      .from('gigs')
      .select('id, name, icloud_uid')
      .in('icloud_uid', uids) as unknown as {
        data: { id: string; name: string; icloud_uid: string }[] | null
      }
    for (const gig of matchedGigs ?? []) {
      if (gig.icloud_uid) gigsByUid.set(gig.icloud_uid, { id: gig.id, name: gig.name })
    }
  }

  const result: ICloudEventWithStatus[] = events.map((e) => {
    const match = gigsByUid.get(e.uid)
    return {
      ...e,
      existingGigId: match?.id ?? null,
      existingGigName: match?.name ?? null,
    }
  })

  // Sort by start date
  result.sort((a, b) => a.startDate.localeCompare(b.startDate))

  return NextResponse.json(result)
}
