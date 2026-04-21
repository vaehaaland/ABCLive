import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatPhone } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import {
  MailIcon,
  PhoneIcon,
  CalendarIcon,
  MapPinIcon,
  ArrowLeftIcon,
} from 'lucide-react'
import type { GigStatus, AvailabilityBlock } from '@/types/database'
import { BanIcon } from 'lucide-react'

const statusLabels: Record<GigStatus, string> = {
  draft: 'Utkast',
  confirmed: 'Bekrefta',
  completed: 'Fullført',
  cancelled: 'Avlyst',
}

const statusVariants: Record<GigStatus, 'default' | 'secondary' | 'outline' | 'status-alert'> = {
  draft: 'outline',
  confirmed: 'default',
  completed: 'secondary',
  cancelled: 'status-alert',
}

function getCardHue(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff
  }
  return Math.abs(hash) % 360
}

const DAY = 86_400_000
const DAY_LETTERS = ['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø']

type SlotStatus = 'free' | 'gig' | 'blocked'

function getDayLetter(todayMs: number, offset: number): string {
  const d = new Date(todayMs + offset * DAY)
  return DAY_LETTERS[d.getDay() === 0 ? 6 : d.getDay() - 1]
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatBlockRange(from: string, until: string): string {
  const f = parseLocalDate(from)
  const u = parseLocalDate(until)
  if (from === until) return format(f, 'd. MMM yyyy', { locale: nb })
  if (f.getFullYear() === u.getFullYear()) {
    return `${format(f, 'd. MMM', { locale: nb })} – ${format(u, 'd. MMM yyyy', { locale: nb })}`
  }
  return `${format(f, 'd. MMM yyyy', { locale: nb })} – ${format(u, 'd. MMM yyyy', { locale: nb })}`
}

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

type AssignmentCard = {
  id: string
  name: string
  venue: string | null
  start_date: string
  end_date: string
  status: string
  role_label: string | null
  item_name: string | null
  sort_key: string
}

export default async function PersonnelProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Only admins can view other profiles
  const { data: viewer } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null, error: unknown }

  if (viewer?.role !== 'admin') redirect('/dashboard/gigs')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, primary_role, phone, email, avatar_url')
    .eq('id', id)
    .single() as {
      data: {
        id: string
        full_name: string | null
        role: string
        primary_role: string | null
        phone: string | null
        email: string | null
        avatar_url: string | null
      } | null
      error: unknown
    }

  if (!profile) notFound()

  const { data: rawAssignments } = await supabase
    .from('gig_personnel')
    .select(`
      role_on_gig,
      gigs (
        id,
        name,
        venue,
        start_date,
        end_date,
        status
      )
    `)
    .eq('profile_id', id) as {
      data: {
        role_on_gig: string | null
        gigs: { id: string; name: string; venue: string | null; start_date: string; end_date: string; status: string } | null
      }[] | null
      error: unknown
    }

  const { data: rawItemAssignments } = await supabase
    .from('gig_program_item_personnel')
    .select(`
      role_on_item,
      gig_program_items!inner (
        id,
        gig_id,
        name,
        venue,
        start_at,
        end_at
      )
    `)
    .eq('profile_id', id) as {
      data: {
        role_on_item: string | null
        gig_program_items: {
          id: string
          gig_id: string
          name: string
          venue: string | null
          start_at: string
          end_at: string
        } | null
      }[] | null
      error: unknown
    }

  const itemGigIds = [...new Set((rawItemAssignments ?? [])
    .map((assignment) => assignment.gig_program_items?.gig_id)
    .filter(Boolean) as string[])]

  const { data: itemParentGigs } = itemGigIds.length > 0
    ? await supabase
        .from('gigs')
        .select('id, name, venue, start_date, end_date, status')
        .in('id', itemGigIds) as {
          data: { id: string; name: string; venue: string | null; start_date: string; end_date: string; status: string }[] | null
          error: unknown
        }
    : { data: [] as { id: string; name: string; venue: string | null; start_date: string; end_date: string; status: string }[], error: null }

  const itemParentGigMap = new Map((itemParentGigs ?? []).map((gig) => [gig.id, gig]))

  const itemLevelAssignments = (rawItemAssignments ?? [])
    .map((assignment): AssignmentCard | null => {
      if (!assignment.gig_program_items) return null
      const parentGig = itemParentGigMap.get(assignment.gig_program_items.gig_id)
      if (!parentGig) return null
      return {
        id: parentGig.id,
        name: parentGig.name,
        venue: assignment.gig_program_items.venue ?? parentGig.venue,
        start_date: assignment.gig_program_items.start_at.slice(0, 10),
        end_date: assignment.gig_program_items.end_at.slice(0, 10),
        status: parentGig.status,
        role_label: assignment.role_on_item,
        item_name: assignment.gig_program_items.name,
        sort_key: assignment.gig_program_items.start_at,
      }
    })
    .filter((assignment): assignment is AssignmentCard => assignment !== null)

  const assignments: AssignmentCard[] = [
    ...(rawAssignments ?? [])
      .filter((assignment) => assignment.gigs !== null)
      .map((assignment) => ({
        id: assignment.gigs!.id,
        name: assignment.gigs!.name,
        venue: assignment.gigs!.venue,
        start_date: assignment.gigs!.start_date,
        end_date: assignment.gigs!.end_date,
        status: assignment.gigs!.status,
        role_label: assignment.role_on_gig,
        item_name: null as string | null,
        sort_key: assignment.gigs!.start_date,
      })),
    ...itemLevelAssignments,
  ]
    .sort((a, b) => b.sort_key.localeCompare(a.sort_key))

  const today = new Date().toISOString().split('T')[0]
  const windowEnd = new Date(new Date(today).getTime() + 6 * DAY).toISOString().split('T')[0]

  // Fetch availability blocks for this person
  const { data: availabilityBlocks } = await supabase
    .from('availability_blocks')
    .select('id, blocked_from, blocked_until, reason')
    .eq('profile_id', id)
    .gte('blocked_until', today)
    .order('blocked_from') as { data: AvailabilityBlock[] | null, error: unknown }

  const upcomingBlocks = availabilityBlocks ?? []

  // Upcoming gigs for availability
  const upcomingForAvailability = assignments
    .filter((assignment) => assignment.end_date >= today && assignment.start_date <= windowEnd && assignment.status !== 'cancelled')
    .map((assignment) => ({ start_date: assignment.start_date, end_date: assignment.end_date }))

  const blocksInWindow = upcomingBlocks.filter((b) => b.blocked_from <= windowEnd)

  const { busyToday, slots } = calcBusySlots(upcomingForAvailability, blocksInWindow, today)
  const gigCount = slots.filter((s) => s === 'gig').length
  const todayMs = new Date(today).getTime()

  const roleLabel = profile.role === 'admin' ? 'Administrator' : 'Lydtekniker'
  const roleTagline = profile.role === 'admin' ? 'ABC Studio — Admin' : 'Profesjonelt crew-medlem'
  const displayName = profile.full_name ?? profile.email ?? 'Ukjent brukar'

  return (
    <div className="-mx-4 -mt-8 flex" style={{ minHeight: 'calc(100vh - 56px)' }}>

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside className="w-72 shrink-0 bg-surface-low border-r border-white/[0.06] flex flex-col gap-8 p-8">

        {/* Back */}
        <Link
          href="/dashboard/personnel"
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors -mb-2"
        >
          <ArrowLeftIcon className="size-3.5" />
          Personell
        </Link>

        {/* Avatar */}
        <div className="mx-auto">
          <Avatar src={profile.avatar_url} name={profile.full_name} size="xl" />
        </div>

        {/* Name + role */}
        <div className="flex flex-col gap-2 text-center">
          <p className="font-heading font-bold text-base leading-snug">
            {profile.full_name ?? '—'}
          </p>
          <Badge
            variant={profile.role === 'admin' ? 'default' : 'secondary'}
            className="mx-auto"
          >
            {roleLabel}
          </Badge>
        </div>

        {/* Contact */}
        <div className="flex flex-col gap-2">
          {profile.email && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MailIcon className="size-3.5 shrink-0" />
              <span className="truncate">{profile.email}</span>
            </div>
          )}
          {profile.phone && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <PhoneIcon className="size-3.5 shrink-0" />
              <span>{formatPhone(profile.phone)}</span>
            </div>
          )}
        </div>

        {/* Primary role */}
        {profile.primary_role && (
          <div className="flex flex-col gap-1.5">
            <p className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">Hovudrolle</p>
            <Badge variant="outline" className="w-fit">{profile.primary_role}</Badge>
          </div>
        )}

        {/* Availability */}
        <div className="flex flex-col gap-3">
          <p className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">Tilgjengelegheit</p>
          <div className="flex items-center gap-1.5">
            <span className={`size-1.5 rounded-full shrink-0 ${
              busyToday === 'gig' ? 'bg-destructive' :
              busyToday === 'blocked' ? 'bg-amber-500' :
              'bg-emerald-500'
            }`} />
            <span className="text-xs text-muted-foreground">
              {busyToday === 'gig' ? 'Opptatt i dag' :
               busyToday === 'blocked' ? 'Utilgjengeleg i dag' :
               'Ledig i dag'}
            </span>
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
                      ? 'bg-amber-500/80'
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

          {upcomingBlocks.length > 0 && (
            <div className="flex flex-col gap-1.5 mt-1">
              <p className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">Blokkeringar</p>
              {upcomingBlocks.map((block) => (
                <div key={block.id} className="flex items-start gap-2">
                  <BanIcon className="size-3 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-xs">{formatBlockRange(block.blocked_from, block.blocked_until)}</span>
                    {block.reason && (
                      <span className="text-[0.65rem] text-muted-foreground">{block.reason}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto flex flex-col gap-16 p-12">

        {/* Hero */}
        <div className="flex flex-col gap-5 max-w-2xl">
          <span className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
            {roleTagline}
          </span>

          <h1
            className="font-heading font-bold leading-none tracking-tight"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}
          >
            {displayName}
          </h1>

          <p className="text-primary text-xl font-medium font-heading">
            {roleLabel}
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-1">
            {profile.email && (
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <MailIcon className="size-4 text-primary/60" />
                {profile.email}
              </span>
            )}
            {profile.phone && (
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <PhoneIcon className="size-4 text-primary/60" />
                {formatPhone(profile.phone)}
              </span>
            )}
          </div>
        </div>

        {/* All assignments */}
        <section className="flex flex-col gap-6">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            Oppdrag ({assignments.length})
          </h2>

          {assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ingen oppdrag registrert.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignments.map((assignment) => {
                const hue = getCardHue(assignment.id)
                return (
                  <Link
                    key={`${assignment.id}-${assignment.item_name ?? 'top'}`}
                    href={`/dashboard/gigs/${assignment.id}`}
                    className="group block rounded-xl overflow-hidden transition-transform hover:-translate-y-0.5"
                  >
                    <div
                      className="h-28 flex items-end p-4"
                      style={{
                        background: `linear-gradient(135deg, oklch(0.28 0.12 ${hue}) 0%, oklch(0.13 0 0) 100%)`,
                      }}
                    >
                      <Badge variant={statusVariants[assignment.status as GigStatus]}>
                        {statusLabels[assignment.status as GigStatus]}
                      </Badge>
                    </div>

                    <div className="bg-surface-container group-hover:bg-surface-high transition-colors p-4 flex flex-col gap-2">
                      <p className="font-heading font-semibold text-sm leading-snug line-clamp-1">
                        {assignment.name}
                      </p>
                      {assignment.item_name && (
                        <p className="text-xs text-primary font-medium">{assignment.item_name}</p>
                      )}
                      {assignment.role_label && (
                        <p className="text-xs text-primary font-medium">{assignment.role_label}</p>
                      )}
                      <div className="flex flex-col gap-1 mt-0.5">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarIcon className="size-3 shrink-0" />
                          {format(new Date(assignment.start_date), 'd. MMM yyyy', { locale: nb })}
                        </span>
                        {assignment.venue && (
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPinIcon className="size-3 shrink-0" />
                            {assignment.venue}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
