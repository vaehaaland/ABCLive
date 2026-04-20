'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  generatePublicReportSlug,
  hashPublicReportPassword,
} from '@/app/dashboard/gigs/_lib/festival-report'

export type FestivalReportSharingState = {
  ok: boolean
  error?: string
  message?: string
  enabled?: boolean
  publicPath?: string | null
}

async function requireAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null, error: unknown }

  if (profile?.role !== 'admin') return null

  return user
}

export async function updateFestivalReportSharing(
  gigId: string,
  _prevState: FestivalReportSharingState,
  formData: FormData,
): Promise<FestivalReportSharingState> {
  const user = await requireAdminUser()
  if (!user) return { ok: false, error: 'Du må vere admin for å endre rapportdeling.' }

  const enabled = formData.get('public_report_enabled') === 'on'
  const password = String(formData.get('public_report_password') ?? '').trim()

  const admin = createAdminClient()
  const { data: gig } = await admin
    .from('gigs')
    .select('id, gig_type, public_report_slug, public_report_password_hash')
    .eq('id', gigId)
    .single() as {
      data: {
        id: string
        gig_type: string
        public_report_slug: string | null
        public_report_password_hash: string | null
      } | null
      error: unknown
    }

  if (!gig || gig.gig_type !== 'festival') {
    return { ok: false, error: 'Rapportdeling er berre tilgjengeleg for festivalar.' }
  }

  if (enabled && !gig.public_report_password_hash && password.length < 4) {
    return { ok: false, error: 'Set eit passord på minst 4 teikn når du aktiverer deling.' }
  }

  if (password && password.length < 4) {
    return { ok: false, error: 'Passord må vere minst 4 teikn.' }
  }

  const nextSlug = gig.public_report_slug ?? (enabled ? generatePublicReportSlug() : null)
  const nextHash = password ? hashPublicReportPassword(password) : gig.public_report_password_hash

  if (enabled && !nextHash) {
    return { ok: false, error: 'Set eit passord før du aktiverer offentleg rapport.' }
  }

  const updatePayload = {
    public_report_enabled: enabled,
    public_report_slug: nextSlug,
    public_report_password_hash: nextHash,
  }

  const { error } = await admin
    .from('gigs')
    .update(updatePayload)
    .eq('id', gigId)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath(`/dashboard/gigs/${gigId}`)
  revalidatePath(`/dashboard/gigs/${gigId}/report`)
  revalidatePath(`/api/festival-report/${gigId}`)
  if (nextSlug) {
    revalidatePath(`/festival-report/${nextSlug}`)
    revalidatePath(`/festival-report/${nextSlug}/pdf`)
  }

  return {
    ok: true,
    enabled,
    publicPath: nextSlug ? `/festival-report/${nextSlug}/pdf` : null,
    message: enabled
      ? password
        ? 'Offentleg rapport er oppdatert og passordet er lagra.'
        : 'Offentleg rapport er aktivert.'
      : 'Offentleg rapport er slått av.',
  }
}
