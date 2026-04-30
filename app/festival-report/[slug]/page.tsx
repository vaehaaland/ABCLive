import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import PublicFestivalReportUnlockForm from '@/components/gigs/PublicFestivalReportUnlockForm'
import {
  getPublicFestivalReportMeta,
  getPublicReportAccessToken,
  getPublicReportCookieName,
} from '@/app/dashboard/gigs/_lib/festival-report'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const meta = await getPublicFestivalReportMeta(slug)

  return {
    title: meta?.name ?? 'Festivalsrapport',
  }
}

export default async function PublicFestivalReportPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const meta = await getPublicFestivalReportMeta(slug)

  if (!meta?.public_report_enabled || !meta.public_report_password_hash) {
    notFound()
  }

  const cookieStore = await cookies()
  const accessCookie = cookieStore.get(getPublicReportCookieName(slug))
  const expectedToken = getPublicReportAccessToken(slug, meta.public_report_password_hash)
  const hasAccess = accessCookie?.value === expectedToken

  if (hasAccess) {
    redirect(`/festival-report/${slug}/pdf`)
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-12">
      <div className="flex w-full flex-col gap-6">
        <div className="space-y-2 text-center">
          <p className="type-micro tracking-[0.18em] text-muted-foreground">Delt festivalsrapport</p>
          <h1 className="type-h1 text-3xl">{meta.name}</h1>
        </div>
        <PublicFestivalReportUnlockForm slug={slug} />
      </div>
    </div>
  )
}
