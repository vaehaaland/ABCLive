import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { testICloudConnection } from '@/lib/icloud/caldav'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ikkje innlogga' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_superadmin')
    .eq('id', user.id)
    .single() as unknown as { data: { is_superadmin: boolean } | null }
  if (!profile?.is_superadmin) return NextResponse.json({ error: 'Ikkje tilgang' }, { status: 403 })

  const body = await request.json() as { apple_id?: string; app_password?: string }
  const { apple_id, app_password } = body
  if (!apple_id || !app_password) {
    return NextResponse.json({ error: 'Manglar apple_id eller app_password' }, { status: 400 })
  }

  try {
    await testICloudConnection(apple_id, app_password)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Ukjend feil'
    return NextResponse.json({ error: `Tilkopling feila: ${msg}` }, { status: 400 })
  }

  // Upsert credentials — delete existing row first, then insert (keeps exactly one row)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const settingsTable = supabase.from('icloud_settings') as any
  await settingsTable.delete().neq('id', '00000000-0000-0000-0000-000000000000')
  const { error: insertError } = await settingsTable
    .insert({ apple_id, app_password, updated_at: new Date().toISOString() }) as { error: { message: string } | null }

  if (insertError) {
    return NextResponse.json(
      { error: `Lagring feila: ${insertError.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
