'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  getPublicFestivalReportMeta,
  getPublicReportAccessToken,
  getPublicReportCookieName,
  verifyPublicReportPassword,
} from '@/app/dashboard/gigs/_lib/festival-report'

export type PublicReportUnlockState = {
  ok: boolean
  error?: string
}

export async function unlockFestivalReport(
  slug: string,
  _prevState: PublicReportUnlockState,
  formData: FormData,
): Promise<PublicReportUnlockState> {
  const password = String(formData.get('password') ?? '')
  const meta = await getPublicFestivalReportMeta(slug)

  if (!meta?.public_report_enabled || !meta.public_report_password_hash) {
    return { ok: false, error: 'Rapporten er ikkje tilgjengeleg.' }
  }

  if (!verifyPublicReportPassword(password, meta.public_report_password_hash)) {
    return { ok: false, error: 'Feil passord.' }
  }

  const cookieStore = await cookies()
  cookieStore.set(
    getPublicReportCookieName(slug),
    getPublicReportAccessToken(slug, meta.public_report_password_hash),
    {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: `/festival-report/${slug}`,
      maxAge: 60 * 60 * 12,
    },
  )

  redirect(`/festival-report/${slug}/pdf`)
}
