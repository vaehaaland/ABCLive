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
import type { GigStatus } from '@/types/database'

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

function getDayLetter(todayMs: number, offset: number): string {
  const d = new Date(todayMs + offset * DAY)
  return DAY_LETTERS[d.getDay() === 0 ? 6 : d.getDay() - 1]
}

function calcBusySlots(
  gigs: { start_date: string; end_date: string }[],
  today: string,
): { busyToday: boolean; slots: boolean[] } {
  const todayMs = new Date(today).getTime()
  const busySet = new Set<number>()

  for (const g of gigs) {
    const gigStart = new Date(g.start_date).getTime()
    const gigEnd = new Date(g.end_date).getTime()
    for (let i = 0; i < 7; i++) {
      const dayMs = todayMs + i * DAY
      if (dayMs >= gigStart && dayMs <= gigEnd) busySet.add(i)
    }
  }

  return {
    busyToday: busySet.has(0),
    slots: Array.from({ length: 7 }, (_, i) => busySet.has(i)),
  }
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

  const assignments = (rawAssignments ?? [])
    .filter((a) => a.gigs !== null)
    .sort((a, b) =>
      (b.gigs!.start_date ?? '').localeCompare(a.gigs!.start_date ?? '')
    )

  const today = new Date().toISOString().split('T')[0]
  const windowEnd = new Date(Date.now() + 6 * DAY).toISOString().split('T')[0]

  // Upcoming gigs for availability
  const upcomingForAvailability = assignments
    .filter((a) => a.gigs && a.gigs.end_date >= today && a.gigs.start_date <= windowEnd && a.gigs.status !== 'cancelled')
    .map((a) => ({ start_date: a.gigs!.start_date, end_date: a.gigs!.end_date }))

  const { busyToday, slots } = calcBusySlots(upcomingForAvailability, today)
  const busyCount = slots.filter(Boolean).length
  const todayMs = Date.now()

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
            <span className={`size-1.5 rounded-full shrink-0 ${busyToday ? 'bg-destructive' : 'bg-emerald-500'}`} />
            <span className="text-xs text-muted-foreground">
              {busyToday ? 'Opptatt i dag' : 'Ledig i dag'}
            </span>
          </div>
          <div className="flex gap-0.5">
            {slots.map((busy, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <div
                  className={`h-1.5 w-4 rounded-sm ${
                    busy
                      ? busyCount >= 5
                        ? 'bg-destructive/80'
                        : busyCount >= 3
                        ? 'bg-spotlight-gold/80'
                        : 'bg-emerald-500/80'
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
              {assignments.map(({ role_on_gig, gigs: gig }) => {
                if (!gig) return null
                const hue = getCardHue(gig.id)
                return (
                  <Link
                    key={gig.id}
                    href={`/dashboard/gigs/${gig.id}`}
                    className="group block rounded-xl overflow-hidden transition-transform hover:-translate-y-0.5"
                  >
                    <div
                      className="h-28 flex items-end p-4"
                      style={{
                        background: `linear-gradient(135deg, oklch(0.28 0.12 ${hue}) 0%, oklch(0.13 0 0) 100%)`,
                      }}
                    >
                      <Badge variant={statusVariants[gig.status as GigStatus]}>
                        {statusLabels[gig.status as GigStatus]}
                      </Badge>
                    </div>

                    <div className="bg-surface-container group-hover:bg-surface-high transition-colors p-4 flex flex-col gap-2">
                      <p className="font-heading font-semibold text-sm leading-snug line-clamp-1">
                        {gig.name}
                      </p>
                      {role_on_gig && (
                        <p className="text-xs text-primary font-medium">{role_on_gig}</p>
                      )}
                      <div className="flex flex-col gap-1 mt-0.5">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarIcon className="size-3 shrink-0" />
                          {format(new Date(gig.start_date), 'd. MMM yyyy', { locale: nb })}
                        </span>
                        {gig.venue && (
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPinIcon className="size-3 shrink-0" />
                            {gig.venue}
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
