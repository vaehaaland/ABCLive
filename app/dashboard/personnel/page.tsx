import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatPhone } from '@/lib/utils'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { UserPlusIcon } from 'lucide-react'
import { PersonnelGrid, type PersonWithSlots, type SlotStatus } from '@/components/personnel/PersonnelGrid'
import type { Profile } from '@/types/database'

const DAY = 86_400_000
const ALL_DAYS_SHORT = ['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø']

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

  const busyToday: SlotStatus = gigSet.has(0) ? 'gig' : blockSet.has(0) ? 'blocked' : 'free'
  return { busyToday, slots }
}

function getInitials(fullName: string | null): string {
  if (!fullName) return '?'
  const words = fullName.trim().split(/\s+/)
  if (words.length === 1) return words[0][0]?.toUpperCase() ?? '?'
  return ((words[0][0] ?? '') + (words[words.length - 1][0] ?? '')).toUpperCase()
}

function getAvatarGradient(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff
  }
  const hue = Math.abs(hash) % 360
  return `linear-gradient(135deg, oklch(0.68 0.22 ${hue}), oklch(0.55 0.18 ${hue + 20}))`
}

export default async function PersonnelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single() as { data: { role: string } | null; error: unknown }

  if (profile?.role !== 'admin') redirect('/dashboard/gigs')

  const today = new Date().toISOString().split('T')[0]
  const todayMs = new Date(today).getTime()
  const windowEnd = new Date(todayMs + 6 * 86_400_000).toISOString().split('T')[0]

  // Day labels starting from today's weekday
  const todayDow = (new Date(today).getDay() + 6) % 7 // Mon=0 … Sun=6
  const dayLabels = Array.from({ length: 7 }, (_, i) => ALL_DAYS_SHORT[(todayDow + i) % 7])

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name') as { data: Profile[] | null; error: unknown }

  // All-time roles per person (no date filter) — for "Roller på oppdrag" display
  const { data: allRoles } = await (supabase
    .from('gig_personnel')
    .select('profile_id, role_on_gig')
    .not('role_on_gig', 'is', null)) as {
      data: { profile_id: string; role_on_gig: string | null }[] | null
      error: unknown
    }

  // Gig assignments overlapping next 7 days (for availability calculation only)
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

  // Availability blocks
  const { data: availabilityBlocks } = await (supabase
    .from('availability_blocks')
    .select('profile_id, blocked_from, blocked_until')
    .filter('blocked_until', 'gte', today)
    .filter('blocked_from', 'lte', windowEnd)) as {
      data: { profile_id: string; blocked_from: string; blocked_until: string }[] | null
      error: unknown
    }

  // Build per-person maps
  const gigDatesMap = new Map<string, { start_date: string; end_date: string }[]>()
  const rolesMap = new Map<string, Set<string>>()

  // All-time roles (for display)
  for (const row of allRoles ?? []) {
    if (!row.role_on_gig) continue
    const roles = rolesMap.get(row.profile_id) ?? new Set<string>()
    roles.add(row.role_on_gig)
    rolesMap.set(row.profile_id, roles)
  }

  // Date-windowed assignments (for availability only)
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

  const blocksMap = new Map<string, { blocked_from: string; blocked_until: string }[]>()
  for (const block of availabilityBlocks ?? []) {
    const list = blocksMap.get(block.profile_id) ?? []
    list.push({ blocked_from: block.blocked_from, blocked_until: block.blocked_until })
    blocksMap.set(block.profile_id, list)
  }

  // Build people array
  const people: PersonWithSlots[] = (profiles ?? []).map((p) => {
    const { busyToday, slots } = calcBusySlots(
      gigDatesMap.get(p.id) ?? [],
      blocksMap.get(p.id) ?? [],
      today,
    )
    return {
      id: p.id,
      full_name: p.full_name,
      phone: p.phone ? formatPhone(p.phone) : null,
      primary_role: p.primary_role,
      role: p.role,
      roles: Array.from(rolesMap.get(p.id) ?? []).slice(0, 5),
      busyToday,
      slots,
      avatar_url: p.avatar_url ?? null,
      avatarGradient: getAvatarGradient(p.id),
      initials: getInitials(p.full_name),
    }
  })

  return (
    <>
      {/* Subnav — full-bleed, matches main navbar width */}
      <div className="border-b border-border bg-surface-low -mx-4 -mt-8">
        <div className="px-6 flex gap-0">
          <Link href="/dashboard/equipment" className="relative px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent -mb-px">Utstyr</Link>
          <Link href="/dashboard/personnel" className="relative px-4 py-2.5 text-sm font-medium text-primary border-b-2 border-primary -mb-px">Personell</Link>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-8 w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading font-extrabold text-[1.75rem] leading-none tracking-[-0.035em]">
              Personell
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Oversikt over crew-medlemar, roller og tilgjengelegheit
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/personnel/new">
              <UserPlusIcon className="size-4" />
              Legg til person
            </Link>
          </Button>
        </div>

        <PersonnelGrid people={people} dayLabels={dayLabels} isAdmin={profile?.role === 'admin'} />
      </div>
    </>
  )
}
