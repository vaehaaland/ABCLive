import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatPhone } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { PhoneIcon } from 'lucide-react'
import type { Profile } from '@/types/database'

const DAY = 86_400_000

export type SlotStatus = 'free' | 'gig' | 'blocked'

function calcBusySlots(
  gigs: { start_date: string; end_date: string }[],
  blocks: { blocked_from: string; blocked_until: string }[],
  today: string,
): { busyToday: SlotStatus; slots: SlotStatus[] } {
  const todayMs = new Date(today).getTime()
  const gigSet = new Set<number>()
  const blockSet = new Set<number>()

  for (const g of gigs) {
    const gigStart = new Date(g.start_date).getTime()
    const gigEnd = new Date(g.end_date).getTime()
    for (let i = 0; i < 7; i++) {
      const dayMs = todayMs + i * DAY
      if (dayMs >= gigStart && dayMs <= gigEnd) gigSet.add(i)
    }
  }

  for (const b of blocks) {
    const blockStart = new Date(b.blocked_from).getTime()
    const blockEnd = new Date(b.blocked_until).getTime()
    for (let i = 0; i < 7; i++) {
      const dayMs = todayMs + i * DAY
      if (dayMs >= blockStart && dayMs <= blockEnd) blockSet.add(i)
    }
  }

  const slots: SlotStatus[] = Array.from({ length: 7 }, (_, i) => {
    if (gigSet.has(i)) return 'gig'
    if (blockSet.has(i)) return 'blocked'
    return 'free'
  })

  const todayStatus: SlotStatus = gigSet.has(0) ? 'gig' : blockSet.has(0) ? 'blocked' : 'free'

  return { busyToday: todayStatus, slots }
}

function getInitials(fullName: string | null): string {
  if (!fullName) return '?'
  const words = fullName.trim().split(/\s+/)
  if (words.length === 1) return words[0][0]?.toUpperCase() ?? '?'
  return ((words[0][0] ?? '') + (words[words.length - 1][0] ?? '')).toUpperCase()
}

export default async function PersonnelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single() as { data: { role: string } | null, error: unknown }

  if (profile?.role !== 'admin') redirect('/dashboard/gigs')

  const today = new Date().toISOString().split('T')[0]
  const todayMs = new Date(today).getTime()
  const windowEnd = new Date(todayMs + 6 * 86_400_000).toISOString().split('T')[0]

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name') as { data: Profile[] | null, error: unknown }

  // Fetch gig assignments with dates — active/confirmed gigs overlapping the next 7 days
  const { data: assignments } = await (supabase
    .from('gig_personnel')
    .select('profile_id, role_on_gig, gigs!inner(id, name, start_date, end_date, status, venue)')
    .filter('gigs.status', 'neq', 'cancelled')
    .filter('gigs.end_date', 'gte', today)
    .filter('gigs.start_date', 'lte', windowEnd)) as {
      data: {
        profile_id: string
        role_on_gig: string | null
        gigs: { id: string; name: string; start_date: string; end_date: string; status: string; venue: string | null } | null
      }[] | null
      error: unknown
    }

  const { data: itemAssignments } = await (supabase
    .from('gig_program_item_personnel')
    .select('profile_id, role_on_item, gig_program_items!inner(start_at, end_at)')) as {
      data: {
        profile_id: string
        role_on_item: string | null
        gig_program_items: { start_at: string; end_at: string } | null
      }[] | null
      error: unknown
    }

  // Build per-person maps
  const gigDatesMap = new Map<string, { start_date: string; end_date: string }[]>()

  for (const row of assignments ?? []) {
    if (!row.gigs) continue
    const dates = gigDatesMap.get(row.profile_id) ?? []
    dates.push({ start_date: row.gigs.start_date, end_date: row.gigs.end_date })
    gigDatesMap.set(row.profile_id, dates)
  }

  for (const row of itemAssignments ?? []) {
    if (!row.gig_program_items) continue
    const dates = gigDatesMap.get(row.profile_id) ?? []
    dates.push({
      start_date: row.gig_program_items.start_at.slice(0, 10),
      end_date: row.gig_program_items.end_at.slice(0, 10),
    })
    gigDatesMap.set(row.profile_id, dates)
  }

  // Fetch availability blocks for the 7-day window
  const { data: availabilityBlocks } = await (supabase
    .from('availability_blocks')
    .select('profile_id, blocked_from, blocked_until')
    .filter('blocked_until', 'gte', today)
    .filter('blocked_from', 'lte', windowEnd)) as {
      data: { profile_id: string; blocked_from: string; blocked_until: string }[] | null
      error: unknown
    }

  const blocksMap = new Map<string, { blocked_from: string; blocked_until: string }[]>()
  for (const block of availabilityBlocks ?? []) {
    const list = blocksMap.get(block.profile_id) ?? []
    list.push({ blocked_from: block.blocked_from, blocked_until: block.blocked_until })
    blocksMap.set(block.profile_id, list)
  }

  return (
    <>
      {/* Subnav — break out of layout padding to go full-width */}
      <div className="border-b border-border bg-surface-low -mx-4 -mt-8">
        <div className="max-w-[1200px] mx-auto px-6 flex gap-0">
          <Link href="/dashboard/equipment" className="relative px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent -mb-px">Utstyr</Link>
          <Link href="/dashboard/personnel" className="relative px-4 py-2.5 text-sm font-medium text-primary border-b-2 border-primary -mb-px">Personell</Link>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-8 w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading font-extrabold text-[1.75rem] leading-none tracking-[-0.035em]">Personell</h1>
        </div>

        {!profiles?.length ? (
          <p className="text-muted-foreground text-sm">Ingen teknikarar registrert.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((p) => {
              const { busyToday, slots } = calcBusySlots(
                gigDatesMap.get(p.id) ?? [],
                blocksMap.get(p.id) ?? [],
                today,
              )

              const statusStripeClass =
                busyToday === 'gig' ? 'bg-primary' :
                busyToday === 'blocked' ? 'bg-live' :
                'bg-emerald-500'

              const statusBadgeVariant: 'success' | 'default' | 'live' =
                busyToday === 'gig' ? 'default' :
                busyToday === 'blocked' ? 'live' :
                'success'

              const statusLabel =
                busyToday === 'gig' ? 'Opptatt' :
                busyToday === 'blocked' ? 'Utilgjengeleg' :
                'Ledig'

              const initials = getInitials(p.full_name)

              return (
                <Link key={p.id} href={`/dashboard/personnel/${p.id}`} className="flex flex-col rounded-xl overflow-hidden bg-surface-container hover:bg-surface-high transition-colors">
                  {/* Top color stripe */}
                  <div className={cn('h-[3px]', statusStripeClass)} />

                  <div className="p-4 flex flex-col gap-3">
                    {/* Avatar + name row */}
                    <div className="flex items-center gap-3">
                      <div
                        className="size-10 rounded-full flex items-center justify-center text-sm font-bold text-[oklch(0.08_0_0)] shrink-0"
                        style={{ background: 'linear-gradient(135deg, oklch(0.68 0.26 292), oklch(0.58 0.20 312))' }}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-heading font-semibold text-sm leading-snug truncate">{p.full_name ?? '—'}</p>
                        {p.phone && (
                          <p className="flex items-center gap-1 text-[0.6875rem] text-muted-foreground mt-0.5">
                            <PhoneIcon className="size-3" />{formatPhone(p.phone)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Primary role */}
                    <div>
                      <p className="text-[0.6875rem] font-medium text-muted-foreground uppercase tracking-[0.07em] mb-1">Hovudrolle</p>
                      <p className="text-xs font-medium text-foreground">{p.primary_role ?? p.role}</p>
                    </div>

                    {/* Week bar */}
                    <div>
                      <div className="flex gap-0.5 mb-1">
                        {['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø'].map((d) => (
                          <span key={d} className="flex-1 text-center text-[0.5625rem] text-muted-foreground/50">{d}</span>
                        ))}
                      </div>
                      <div className="flex gap-0.5">
                        {slots.map((slot, i) => (
                          <div key={i} className={cn('flex-1 h-1.5 rounded-sm', {
                            'bg-emerald-500': slot === 'free',
                            'bg-primary': slot === 'gig',
                            'bg-live': slot === 'blocked',
                            'bg-surface-highest': slot !== 'free' && slot !== 'gig' && slot !== 'blocked',
                          })} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-auto px-4 py-2.5 bg-surface-high flex items-center justify-between">
                    <Badge variant={statusBadgeVariant}>{statusLabel}</Badge>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
