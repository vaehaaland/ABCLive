import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getInternalFestivalReportData,
} from '@/app/dashboard/gigs/_lib/festival-report'
import {
  createFestivalReportFilename,
  generateFestivalReportPdf,
} from '@/app/dashboard/gigs/_lib/festival-report-pdf'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new NextResponse('Ikkje innlogga.', { status: 401 })
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') {
    return new NextResponse('Berre administratorar kan laste ned festivalrapportar.', { status: 403 })
  }

  const report = await getInternalFestivalReportData(id)

  if (!report) {
    return new NextResponse('Festival ikkje funnen.', { status: 404 })
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
    console.error('Failed to generate internal festival report PDF', error)
    return new NextResponse('Klarte ikkje å generere PDF.', { status: 500 })
  }
}
