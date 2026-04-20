import { NextResponse, type NextRequest } from 'next/server'
import {
  getPublicFestivalReportData,
  getPublicFestivalReportMeta,
  getPublicReportAccessToken,
  getPublicReportCookieName,
} from '@/app/dashboard/gigs/_lib/festival-report'
import {
  createFestivalReportFilename,
  generateFestivalReportPdf,
} from '@/app/dashboard/gigs/_lib/festival-report-pdf'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const meta = await getPublicFestivalReportMeta(slug)

  if (!meta?.public_report_enabled || !meta.public_report_password_hash) {
    return new NextResponse('Rapporten er ikkje tilgjengeleg.', { status: 404 })
  }

  const accessCookie = request.cookies.get(getPublicReportCookieName(slug))
  const expectedToken = getPublicReportAccessToken(slug, meta.public_report_password_hash)

  if (accessCookie?.value !== expectedToken) {
    return NextResponse.redirect(new URL(`/festival-report/${slug}`, request.url))
  }

  const report = await getPublicFestivalReportData(slug)
  if (!report) {
    return new NextResponse('Rapporten er ikkje tilgjengeleg.', { status: 404 })
  }

  try {
    const pdf = await generateFestivalReportPdf(report)

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${createFestivalReportFilename(report)}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    console.error('Failed to generate public festival report PDF', error)
    return new NextResponse('Klarte ikkje å generere PDF.', { status: 500 })
  }
}
