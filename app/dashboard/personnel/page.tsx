import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatPhone } from '@/lib/utils'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import PersonHoverCard from '@/components/PersonHoverCard'
import type { Profile } from '@/types/database'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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
  const rolesMap = new Map<string, string[]>()

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

  // Fetch all roles (not date-filtered)
  const { data: allGigRoles } = await supabase
    .from('gig_personnel')
    .select('profile_id, role_on_gig') as {
      data: { profile_id: string; role_on_gig: string | null }[] | null
      error: unknown
    }

  for (const row of allGigRoles ?? []) {
    if (!row.role_on_gig) continue
    const list = rolesMap.get(row.profile_id) ?? []
    if (!list.includes(row.role_on_gig)) list.push(row.role_on_gig)
    rolesMap.set(row.profile_id, list)
  }

  for (const row of itemAssignments ?? []) {
    if (!row.role_on_item) continue
    const list = rolesMap.get(row.profile_id) ?? []
    if (!list.includes(row.role_on_item)) list.push(row.role_on_item)
    rolesMap.set(row.profile_id, list)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold">Personell</h1>
        <p className="text-sm text-muted-foreground">
          Oversikt over crew-medlemar, roller og tilgjengelegheit.
        </p>
      </div>

      {!profiles?.length ? (
        <p className="text-muted-foreground text-sm">Ingen teknikarar registrert.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Namn</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Hovudrolle</TableHead>
              <TableHead>Roller på oppdrag</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((p) => {
              const gigRoleList = rolesMap.get(p.id) ?? []
              const { busyToday, slots } = calcBusySlots(
                gigDatesMap.get(p.id) ?? [],
                blocksMap.get(p.id) ?? [],
                today,
              )

              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <PersonHoverCard profileId={p.id} name={p.full_name}>
                      <Link
                        href={`/dashboard/personnel/${p.id}`}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                      >
                        <Avatar src={p.avatar_url} name={p.full_name} size="sm" />
                        <span className="font-medium">{p.full_name ?? '—'}</span>
                      </Link>
                    </PersonHoverCard>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.phone ? formatPhone(p.phone) : '—'}</TableCell>
                  <TableCell>
                    {p.primary_role
                      ? <Badge variant="default">{p.primary_role}</Badge>
                      : <span className="text-xs text-muted-foreground">—</span>
                    }
                  </TableCell>
                  <TableCell>
                    {gigRoleList.length > 0
                      ? (
                        <div className="flex flex-wrap gap-1.5">
                          {gigRoleList.map((r) => (
                            <Badge key={r} variant="outline">{r}</Badge>
                          ))}
                        </div>
                      )
                      : <span className="text-xs text-muted-foreground">Ingen oppdrag enno</span>
                    }
                  </TableCell>
                  <TableCell>
                    <AvailabilityCell busyToday={busyToday} slots={slots} todayMs={todayMs} />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

const DAY_LETTERS = ['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø']

function getDayLetter(todayMs: number, offset: number): string {
  const d = new Date(todayMs + offset * DAY)
  return DAY_LETTERS[d.getDay() === 0 ? 6 : d.getDay() - 1]
}

function AvailabilityCell({ busyToday, slots, todayMs }: { busyToday: SlotStatus; slots: SlotStatus[]; todayMs: number }) {
  const gigCount = slots.filter((s) => s === 'gig').length

  const todayDot =
    busyToday === 'gig' ? 'bg-destructive' :
    busyToday === 'blocked' ? 'bg-spotlight-gold' :
    'bg-emerald-500'

  const todayLabel =
    busyToday === 'gig' ? 'Opptatt i dag' :
    busyToday === 'blocked' ? 'Utilgjengeleg i dag' :
    'Ledig i dag'

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <span className={`size-1.5 rounded-full shrink-0 ${todayDot}`} />
        <span className="text-xs text-muted-foreground">{todayLabel}</span>
      </div>

      <div className="flex gap-0.5">
        {slots.map((status, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <div
              className={`h-1.5 w-4 rounded-sm ${
                status === 'gig'
                  ? gigCount >= 5
                    ? 'bg-destructive/80'
                    : gigCount >= 3
                    ? 'bg-spotlight-gold/80'
                    : 'bg-emerald-500/80'
                  : status === 'blocked'
                  ? 'bg-spotlight-gold/80'
                  : i === 0
                  ? 'bg-white/20'
                  : 'bg-white/10'
              }`}
            />
            <span className={`text-[0.55rem] tabular-nums leading-none ${i === 0 ? 'text-foreground/60' : 'text-muted-foreground/50'}`}>
              {getDayLetter(todayMs, i)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
