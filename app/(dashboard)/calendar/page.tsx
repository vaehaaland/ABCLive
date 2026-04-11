import { createClient } from '@/lib/supabase/server'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns'
import { nb } from 'date-fns/locale'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { GigStatus } from '@/types/database'

const statusColors: Record<GigStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  confirmed: 'bg-primary text-primary-foreground',
  completed: 'bg-secondary text-secondary-foreground',
  cancelled: 'bg-destructive/10 text-destructive line-through',
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const sp = await searchParams
  const now = new Date()
  const year = sp.year ? parseInt(sp.year) : now.getFullYear()
  const month = sp.month ? parseInt(sp.month) : now.getMonth()

  const start = startOfMonth(new Date(year, month))
  const end = endOfMonth(new Date(year, month))
  const days = eachDayOfInterval({ start, end })

  const supabase = await createClient()
  const { data: gigs } = await supabase
    .from('gigs')
    .select('id, name, start_date, end_date, status')
    .lte('start_date', format(end, 'yyyy-MM-dd'))
    .gte('end_date', format(start, 'yyyy-MM-dd'))
    .neq('status', 'cancelled')

  const prevMonth = month === 0 ? 11 : month - 1
  const prevYear = month === 0 ? year - 1 : year
  const nextMonth = month === 11 ? 0 : month + 1
  const nextYear = month === 11 ? year + 1 : year

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold capitalize">
          {format(start, 'MMMM yyyy', { locale: nb })}
        </h1>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/calendar?month=${prevMonth}&year=${prevYear}`}
            className="px-3 py-1 border rounded text-sm hover:bg-muted"
          >
            ← Førre
          </Link>
          <Link
            href={`/dashboard/calendar?month=${nextMonth}&year=${nextYear}`}
            className="px-3 py-1 border rounded text-sm hover:bg-muted"
          >
            Neste →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border rounded overflow-hidden text-sm">
        {['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'].map((d) => (
          <div key={d} className="bg-muted px-2 py-1 font-medium text-center text-muted-foreground">
            {d}
          </div>
        ))}

        {/* Empty cells before first day */}
        {Array.from({ length: (start.getDay() + 6) % 7 }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-background min-h-20" />
        ))}

        {days.map((day) => {
          const dayGigs = gigs?.filter((g) => {
            const s = parseISO(g.start_date)
            const e = parseISO(g.end_date)
            return day >= s && day <= e
          }) ?? []

          return (
            <div
              key={day.toISOString()}
              className={`bg-background min-h-20 p-1 flex flex-col gap-1 ${
                isSameDay(day, now) ? 'ring-2 ring-primary ring-inset' : ''
              }`}
            >
              <span className="text-xs font-medium text-muted-foreground px-1">
                {format(day, 'd')}
              </span>
              {dayGigs.map((g) => (
                <Link key={g.id} href={`/dashboard/gigs/${g.id}`}>
                  <span
                    className={`block truncate text-xs px-1 py-0.5 rounded cursor-pointer hover:opacity-80 ${statusColors[g.status as GigStatus]}`}
                  >
                    {g.name}
                  </span>
                </Link>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
