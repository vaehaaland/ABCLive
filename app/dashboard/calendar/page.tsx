import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { format, addMonths, subMonths, parseISO } from 'date-fns'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from 'lucide-react'
import { CalendarSearch } from '@/components/calendar/CalendarSearch'
import { CalendarGrid, type CalendarGig } from '@/components/calendar/CalendarGrid'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Kalender',
}

const MONTHS_NO = [
  'Januar', 'Februar', 'Mars', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Desember',
]

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; q?: string }>
}) {
  const sp = await searchParams
  const now = new Date()

  // Month in URL is 1-indexed (January = 1)
  const year = sp.year ? parseInt(sp.year) : now.getFullYear()
  const month = sp.month ? parseInt(sp.month) : now.getMonth() + 1
  const query = sp.q?.trim() ?? ''

  // Build date range for this month
  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0)

  const supabase = await createClient()

  let gigsQuery = supabase
    .from('gigs')
    .select('id, name, start_date, end_date, status, gig_type, venue, client')
    .lte('start_date', format(monthEnd, 'yyyy-MM-dd'))
    .gte('end_date', format(monthStart, 'yyyy-MM-dd'))
    .neq('status', 'cancelled')

  if (query) {
    gigsQuery = gigsQuery.ilike('name', `%${query}%`)
  }

  const { data: gigs } = (await gigsQuery) as {
    data: CalendarGig[] | null
    error: unknown
  }

  // If searching and no results this month, jump to the nearest upcoming match
  if (query && (!gigs || gigs.length === 0)) {
    const { data: next } = await supabase
      .from('gigs')
      .select('start_date')
      .ilike('name', `%${query}%`)
      .neq('status', 'cancelled')
      .gte('start_date', format(monthEnd, 'yyyy-MM-dd'))
      .order('start_date', { ascending: true })
      .limit(1)
      .single()

    if (next) {
      const d = parseISO((next as unknown as { start_date: string }).start_date)
      redirect(
        `/dashboard/calendar?month=${d.getMonth() + 1}&year=${d.getFullYear()}&q=${encodeURIComponent(query)}`,
      )
    }
  }

  // Build prev/next hrefs using date-fns
  const base = new Date(year, month - 1, 1)
  const prevDate = subMonths(base, 1)
  const nextDate = addMonths(base, 1)
  const qParam = query ? `&q=${encodeURIComponent(query)}` : ''
  const prevHref = `/dashboard/calendar?month=${prevDate.getMonth() + 1}&year=${prevDate.getFullYear()}${qParam}`
  const nextHref = `/dashboard/calendar?month=${nextDate.getMonth() + 1}&year=${nextDate.getFullYear()}${qParam}`
  const todayHref = `/dashboard/calendar${qParam ? `?${qParam.slice(1)}` : ''}`

  const safeGigs: CalendarGig[] = gigs ?? []

  return (
    <div className="-mx-4 -mt-8 flex flex-col">
      {/* Sticky page header */}
      <div className="sticky top-14 z-30 bg-surface/85 backdrop-blur-xl border-b border-border">
        <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center gap-3 flex-wrap">
          <h1 className="type-h2 text-xl leading-none">
            {MONTHS_NO[month - 1]} {year}
          </h1>

          <Link
            href={prevHref}
            className="flex items-center gap-1 type-label px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-high transition-colors"
          >
            <ChevronLeftIcon className="size-3.5" />
            Førre
          </Link>

          <Link
            href={todayHref}
            className="type-label px-2.5 py-1.5 rounded-lg border border-white/10 text-muted-foreground hover:text-foreground hover:bg-surface-high transition-colors"
          >
            I dag
          </Link>

          <Link
            href={nextHref}
            className="flex items-center gap-1 type-label px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-high transition-colors"
          >
            Neste
            <ChevronRightIcon className="size-3.5" />
          </Link>

          {/* Status legend */}
          <div className="flex items-center gap-4 ml-2">
            {[
              { color: 'bg-primary', label: 'Bekrefta' },
              { color: 'bg-live', label: 'Live' },
              { color: 'bg-spotlight-gold', label: 'Festival' },
              { color: 'bg-emerald-500', label: 'Fullført' },
              { color: 'bg-surface-highest', label: 'Utkast' },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={cn('size-2 rounded-full', l.color)} />
                <span className="type-micro normal-case tracking-normal text-muted-foreground">
                  {l.label}
                </span>
              </div>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="type-micro normal-case tracking-normal font-mono text-muted-foreground/60">
              {safeGigs.length} oppdrag
            </span>
            <CalendarSearch />
            <Button asChild size="sm">
              <Link href="/dashboard/gigs/new">
                <PlusIcon className="size-3.5" />
                Nytt
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar grid (client component) */}
      <CalendarGrid
        gigs={safeGigs}
        year={year}
        month={month}
        searchQuery={query}
      />
    </div>
  )
}

