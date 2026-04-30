import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatPhone, getDisplayName } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { GigAssignmentCard } from '@/components/gigs/GigAssignmentCard'
import ProfileAvatar from '@/components/ProfileAvatar'
import PrimaryRoleEditor from '@/components/profile/PrimaryRoleEditor'
import NicknameEditor from '@/components/profile/NicknameEditor'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import {
  MailIcon,
  PhoneIcon,
  BanIcon,
} from 'lucide-react'
import type { AvailabilityBlock } from '@/types/database'
import AvailabilityBlocksManager from '@/components/profile/AvailabilityBlocksManager'
import UserActionsMenu from '@/components/profile/UserActionsMenu'

export const metadata: Metadata = {
  title: 'Profil',
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

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, nickname, role, primary_role, phone, avatar_url')
    .eq('id', user.id)
    .single() as { data: { full_name: string | null, nickname: string | null, role: string, primary_role: string | null, phone: string | null, avatar_url: string | null } | null, error: unknown }

  const { data: availabilityBlocks } = await supabase
    .from('availability_blocks')
    .select('*')
    .eq('profile_id', user.id)
    .order('blocked_from') as { data: AvailabilityBlock[] | null, error: unknown }

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
    .eq('profile_id', user.id) as { data: { role_on_gig: string | null, gigs: { id: string, name: string, venue: string | null, start_date: string, end_date: string, status: string } | null }[] | null, error: unknown }

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
    .eq('profile_id', user.id) as {
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
    : { data: [] as { id: string; name: string; venue: string | null; start_date: string; end_date: string; status: string }[] }

  const itemParentGigMap = new Map((itemParentGigs ?? []).map((gig) => [gig.id, gig]))

  const itemsByGigId = new Map<string, { role_on_item: string | null }[]>()
  for (const a of rawItemAssignments ?? []) {
    const gid = a.gig_program_items?.gig_id
    if (!gid) continue
    if (!itemsByGigId.has(gid)) itemsByGigId.set(gid, [])
    itemsByGigId.get(gid)!.push({ role_on_item: a.role_on_item })
  }

  const itemLevelAssignments = [...itemsByGigId.entries()]
    .map(([gig_id, items]): AssignmentCard | null => {
      const parentGig = itemParentGigMap.get(gig_id)
      if (!parentGig) return null
      const roles = [...new Set(items.map((i) => i.role_on_item).filter(Boolean))].join(', ')
      return {
        id: parentGig.id,
        name: parentGig.name,
        venue: parentGig.venue,
        start_date: parentGig.start_date,
        end_date: parentGig.end_date,
        status: parentGig.status,
        role_label: roles || null,
        item_name: null,
        sort_key: parentGig.start_date,
      }
    })
    .filter((assignment): assignment is AssignmentCard => assignment !== null)

  const seen = new Set<string>()
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
    .filter((a) => { if (seen.has(a.id)) return false; seen.add(a.id); return true })

  const today = new Date().toISOString().split('T')[0]
  const windowEnd = new Date(new Date(today).getTime() + 6 * DAY).toISOString().split('T')[0]

  const upcomingAssignments = assignments
    .filter((a) => a.end_date >= today)
    .sort((a, b) => a.sort_key.localeCompare(b.sort_key))

  const pastAssignments = assignments
    .filter((a) => a.end_date < today)
    .slice(0, 6)

  const upcomingBlocks = (availabilityBlocks ?? []).filter((b) => b.blocked_until >= today)
  const upcomingForAvailability = assignments
    .filter((a) => a.end_date >= today && a.start_date <= windowEnd && a.status !== 'cancelled')
    .map((a) => ({ start_date: a.start_date, end_date: a.end_date }))
  const blocksInWindow = upcomingBlocks.filter((b) => b.blocked_from <= windowEnd)

  const { busyToday, slots } = calcBusySlots(upcomingForAvailability, blocksInWindow, today)
  const gigCount = slots.filter((s) => s === 'gig').length
  const todayMs = new Date(today).getTime()

  const displayName = getDisplayName(profile, user.email ?? 'Ukjent brukar')
  const roleLabel = profile?.role === 'admin' ? 'Administrator' : 'Lydtekniker'
  const roleTagline = profile?.role === 'admin' ? 'ABC Studio — Admin' : 'Profesjonelt crew-medlem'

  return (
    // Break out of the dashboard container padding
    <div className="-mx-4 -mt-8 flex" style={{ minHeight: 'calc(100vh - 56px)' }}>

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside className="w-72 shrink-0 bg-surface-low border-r border-white/[0.06] flex flex-col gap-8 p-8">

        {/* Avatar */}
        <ProfileAvatar
          userId={user.id}
          initialAvatarUrl={profile?.avatar_url}
          name={profile?.full_name}
          size="xl"
          editable
          className="mx-auto"
        />

        {/* Name + role */}
        <div className="flex flex-col gap-2 text-center">
          <p className="type-title text-base leading-snug">
            {profile?.full_name ?? '—'}
          </p>
          <Badge
            variant={profile?.role === 'admin' ? 'default' : 'secondary'}
            className="mx-auto"
          >
            {roleLabel}
          </Badge>
        </div>

        {/* Contact */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 type-label text-muted-foreground">
            <MailIcon className="size-3.5 shrink-0" />
            <span className="truncate">{user.email}</span>
          </div>
          {profile?.phone && (
            <div className="flex items-center gap-2 type-label text-muted-foreground">
              <PhoneIcon className="size-3.5 shrink-0" />
              <span>{formatPhone(profile.phone)}</span>
            </div>
          )}
        </div>

        {/* Primary role */}
        <div className="flex flex-col gap-1.5">
          <p className="type-micro tracking-widest text-muted-foreground">Hovudrolle</p>
          <PrimaryRoleEditor userId={user.id} initialValue={profile?.primary_role ?? null} />
        </div>

        {/* Nickname */}
        <div className="flex flex-col gap-1.5">
          <p className="type-micro tracking-widest text-muted-foreground">Kallenavn</p>
          <NicknameEditor userId={user.id} initialValue={profile?.nickname ?? null} />
        </div>

        {/* Availability */}
        <div className="flex flex-col gap-3">
          <p className="type-micro tracking-widest text-muted-foreground">Tilgjengelegheit</p>
          <div className="flex items-center gap-1.5">
            <span className={`size-1.5 rounded-full shrink-0 ${
              busyToday === 'gig' ? 'bg-destructive' :
              busyToday === 'blocked' ? 'bg-spotlight-gold' :
              'bg-emerald-500'
            }`} />
            <span className="type-label text-muted-foreground">
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

          {upcomingBlocks.length > 0 && (
            <div className="flex flex-col gap-1.5 mt-1">
              <p className="type-micro tracking-widest text-muted-foreground">Blokkeringar</p>
              {upcomingBlocks.map((block) => (
                <div key={block.id} className="flex items-start gap-2">
                  <BanIcon className="size-3 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="type-label">{formatBlockRange(block.blocked_from, block.blocked_until)}</span>
                    {block.reason && (
                      <span className="type-micro normal-case tracking-normal text-muted-foreground">{block.reason}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User actions */}
        <div className="mt-auto pt-4 border-t border-white/[0.06]">
          <UserActionsMenu />
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto flex flex-col gap-16 p-12">

        {/* Hero */}
        <div className="flex flex-col gap-5 max-w-2xl">
          <span className="type-micro tracking-[0.15em] text-muted-foreground">
            {roleTagline}
          </span>

          <h1 className="type-display tracking-tight"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}
          >
            {displayName}
          </h1>

          <p className="type-h3 text-primary text-xl">
            {roleLabel}
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-1">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <MailIcon className="size-4 text-primary/60" />
              {user.email}
            </span>
            {profile?.phone && (
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <PhoneIcon className="size-4 text-primary/60" />
                {formatPhone(profile.phone)}
              </span>
            )}
          </div>
        </div>

        {/* Availability blocks */}
        <section className="flex flex-col gap-6">
          <h2 className="type-h3">
            Utilgjengelegheit
          </h2>
          <AvailabilityBlocksManager blocks={availabilityBlocks ?? []} />
        </section>

        {/* Upcoming / active assignments */}
        <section className="flex flex-col gap-6">
          <h2 className="type-h3">
            Neste oppdrag
          </h2>

          {upcomingAssignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ingen kommande oppdrag.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingAssignments.map((assignment) => {
                return (
                  <GigAssignmentCard
                    key={`${assignment.id}-${assignment.item_name ?? 'top'}`}
                    {...assignment}
                  />
                )
              })}
            </div>
          )}
        </section>

        {/* Past assignments */}
        <section className="flex flex-col gap-6">
          <h2 className="type-h3">
            Siste oppdrag
          </h2>

          {pastAssignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ingen tidlegare oppdrag å vise.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastAssignments.map((assignment) => {
                return (
                  <GigAssignmentCard
                    key={`${assignment.id}-${assignment.item_name ?? 'top'}`}
                    {...assignment}
                  />
                )
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}

