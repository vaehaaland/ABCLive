'use client'

import { useState } from 'react'
import { PreviewCard } from '@base-ui/react'
import { Avatar } from '@/components/ui/avatar'
import { PhoneIcon, MailIcon, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { cn, formatPhone } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const DAY = 86_400_000

interface UpcomingGig {
  id: string
  name: string
  start_date: string
  end_date: string
  venue?: string | null
}

interface FetchedData {
  full_name: string | null
  phone: string | null
  email: string | null
  avatar_url: string | null
  primary_role: string | null
  busyToday: boolean
  upcomingGigs: UpcomingGig[]
}

export interface PersonHoverCardProps {
  profileId: string
  name?: string | null
  children: React.ReactNode
}

export default function PersonHoverCard({ profileId, name, children }: PersonHoverCardProps) {
  const [data, setData] = useState<FetchedData | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleOpenChange(open: boolean) {
    if (!open || data !== null) return

    setLoading(true)
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    const windowEnd = new Date(Date.now() + 6 * DAY).toISOString().split('T')[0]

    const [{ data: profile }, { data: assignments }] = await Promise.all([
      supabase
        .from('profiles')
        .select('full_name, phone, email, avatar_url, primary_role')
        .eq('id', profileId)
        .single(),
      supabase
        .from('gig_personnel')
        .select('gigs!inner(id, name, start_date, end_date, venue, status)')
        .eq('profile_id', profileId)
        .filter('gigs.status', 'neq', 'cancelled')
        .filter('gigs.end_date', 'gte', today)
        .filter('gigs.start_date', 'lte', windowEnd),
    ])

    const gigs = ((assignments ?? []) as any[])
      .map((a) => (Array.isArray(a.gigs) ? a.gigs[0] : a.gigs))
      .filter(Boolean) as UpcomingGig[]

    const todayMs = new Date(today).getTime()
    const busyToday = gigs.some((g) => {
      const start = new Date(g.start_date).getTime()
      const end = new Date(g.end_date).getTime()
      return todayMs >= start && todayMs <= end
    })

    setData({
      full_name: profile?.full_name ?? null,
      phone: (profile as any)?.phone ?? null,
      email: (profile as any)?.email ?? null,
      avatar_url: (profile as any)?.avatar_url ?? null,
      primary_role: (profile as any)?.primary_role ?? null,
      busyToday,
      upcomingGigs: gigs,
    })
    setLoading(false)
  }

  const displayName = data?.full_name ?? name

  return (
    <PreviewCard.Root openDelay={250} closeDelay={300} onOpenChange={handleOpenChange}>
      <PreviewCard.Trigger render={<span />} className="cursor-default">
        {children}
      </PreviewCard.Trigger>

      <PreviewCard.Portal>
        <PreviewCard.Positioner side="bottom" sideOffset={4} align="start">
          <PreviewCard.Popup
            className={cn(
              'z-50 w-72 rounded-2xl p-4 shadow-2xl',
              'bg-[oklch(0.16_0_0)] border border-white/[0.10]',
              'origin-[var(--transform-origin)]',
              'transition-[opacity,scale,translate] duration-200 ease-out',
              'data-[starting-style]:opacity-0 data-[starting-style]:scale-95',
              'data-[ending-style]:opacity-0 data-[ending-style]:scale-95',
            )}
          >
            {loading || !data ? (
              /* Loading skeleton */
              <div className="flex flex-col gap-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-white/10 shrink-0" />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="h-3 rounded bg-white/10 w-3/4" />
                    <div className="h-2.5 rounded bg-white/[0.06] w-1/2" />
                  </div>
                </div>
                <div className="h-8 rounded-lg bg-white/[0.06]" />
              </div>
            ) : (
              <>
                {/* Header — avatar + name + role */}
                <div className="flex items-center gap-3 mb-4">
                  <Avatar src={data.avatar_url} name={displayName} size="md" />
                  <div className="min-w-0">
                    <p className="font-heading font-semibold text-sm leading-tight truncate">
                      {displayName ?? '—'}
                    </p>
                    {data.primary_role && (
                      <p className="text-xs text-muted-foreground mt-0.5">{data.primary_role}</p>
                    )}
                  </div>
                </div>

                {/* Availability status */}
                <div
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 mb-4 text-xs font-medium',
                    data.busyToday
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-emerald-500/10 text-emerald-400',
                  )}
                >
                  <span
                    className={cn(
                      'size-1.5 rounded-full shrink-0',
                      data.busyToday ? 'bg-destructive animate-pulse' : 'bg-emerald-500',
                    )}
                  />
                  {data.busyToday ? 'Opptatt i dag' : 'Ledig i dag'}
                </div>

                {/* Upcoming gigs */}
                {data.upcomingGigs.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[0.65rem] uppercase tracking-widest text-muted-foreground mb-2 font-medium">
                      Kommande oppdrag
                    </p>
                    <ul className="flex flex-col gap-1.5">
                      {data.upcomingGigs.map((gig) => (
                        <li
                          key={gig.id}
                          className="flex items-start gap-2 rounded-lg bg-white/[0.04] px-2.5 py-2"
                        >
                          <CalendarIcon className="size-3 mt-0.5 shrink-0 text-primary" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium leading-tight truncate">{gig.name}</p>
                            <p className="text-[0.65rem] text-muted-foreground mt-0.5">
                              {format(new Date(gig.start_date), 'd. MMM', { locale: nb })}
                              {gig.start_date !== gig.end_date && (
                                <> – {format(new Date(gig.end_date), 'd. MMM', { locale: nb })}</>
                              )}
                              {gig.venue && ` · ${gig.venue}`}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Contact actions */}
                {(data.phone || data.email) && (
                  <div className="flex gap-2 pt-3 border-t border-white/[0.08]">
                    {data.phone && (
                      <a
                        href={`tel:${data.phone}`}
                        className={cn(
                          'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2',
                          'bg-white/[0.06] hover:bg-white/[0.12] transition-colors',
                          'text-xs font-medium text-foreground',
                        )}
                      >
                        <PhoneIcon className="size-3" />
                        {formatPhone(data.phone)}
                      </a>
                    )}
                    {data.email && (
                      <a
                        href={`mailto:${data.email}`}
                        className={cn(
                          'flex items-center justify-center gap-1.5 rounded-lg px-3 py-2',
                          'bg-primary/20 hover:bg-primary/30 transition-colors',
                          'text-xs font-medium text-primary',
                        )}
                      >
                        <MailIcon className="size-3" />
                        Send epost
                      </a>
                    )}
                  </div>
                )}
              </>
            )}
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  )
}
