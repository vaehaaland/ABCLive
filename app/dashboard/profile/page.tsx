import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatPhone } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import ProfileAvatar from '@/components/ProfileAvatar'
import PrimaryRoleEditor from '@/components/profile/PrimaryRoleEditor'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import {
  MailIcon,
  PhoneIcon,
  CalendarIcon,
  MapPinIcon,
  LayoutGridIcon,
  UserIcon,
} from 'lucide-react'
import type { GigStatus, AvailabilityBlock } from '@/types/database'
import AvailabilityBlocksManager from '@/components/profile/AvailabilityBlocksManager'

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

// Deterministic gradient hue from gig id
function getCardHue(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff
  }
  return Math.abs(hash) % 360
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
    .select('full_name, role, primary_role, phone, avatar_url')
    .eq('id', user.id)
    .single() as { data: { full_name: string | null, role: string, primary_role: string | null, phone: string | null, avatar_url: string | null } | null, error: unknown }

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
    .slice(0, 6)

  const displayName = profile?.full_name ?? user.email ?? 'Ukjent brukar'
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
          <p className="font-heading font-bold text-base leading-snug">
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
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MailIcon className="size-3.5 shrink-0" />
            <span className="truncate">{user.email}</span>
          </div>
          {profile?.phone && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <PhoneIcon className="size-3.5 shrink-0" />
              <span>{formatPhone(profile.phone)}</span>
            </div>
          )}
        </div>

        {/* Primary role */}
        <div className="flex flex-col gap-1.5">
          <p className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">Hovudrolle</p>
          <PrimaryRoleEditor userId={user.id} initialValue={profile?.primary_role ?? null} />
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 mt-auto">
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-primary bg-primary/10"
          >
            <UserIcon className="size-4" />
            Profil
          </Link>
          <Link
            href="/dashboard/gigs"
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-high transition-colors"
          >
            <LayoutGridIcon className="size-4" />
            Oppdrag
          </Link>
        </nav>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto flex flex-col gap-16 p-12">

        {/* Hero */}
        <div className="flex flex-col gap-5 max-w-2xl">
          <span className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
            {roleTagline}
          </span>

          <h1 className="font-heading font-bold leading-none tracking-tight"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}
          >
            {displayName}
          </h1>

          <p className="text-primary text-xl font-medium font-heading">
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
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            Utilgjengelegheit
          </h2>
          <AvailabilityBlocksManager blocks={availabilityBlocks ?? []} />
        </section>

        {/* Recent assignments */}
        <section className="flex flex-col gap-6">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            Siste oppdrag
          </h2>

          {assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ingen oppdrag å vise.</p>
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
                    {/* Colored gradient banner */}
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

                    {/* Card body */}
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
