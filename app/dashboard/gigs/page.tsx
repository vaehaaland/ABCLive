import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  addWeeks,
  isWithinInterval,
  parseISO,
} from 'date-fns'
import { nb } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PastGigsToggle } from '@/components/gigs/PastGigsToggle'
import { GigSearchInput } from '@/components/gigs/GigSearchInput'
import {
  CalendarIcon,
  MapPinIcon,
  BuildingIcon,
  LayoutGridIcon,
  ListIcon,
  PlusIcon,
  CloudUploadIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Gig, GigStatus } from '@/types/database'

const statusLabels: Record<GigStatus, string> = {
  draft: 'Utkast',
  confirmed: 'Bekrefta',
  completed: 'Fullført',
  cancelled: 'Avlyst',
}

const statusVariants: Record<GigStatus, 'default' | 'secondary' | 'success' | 'destructive'> = {
  draft: 'secondary',
  confirmed: 'default',
  completed: 'success',
  cancelled: 'destructive',
}

const accentClass: Record<GigStatus, string> = {
  confirmed: 'bg-primary',
  completed: 'bg-emerald-500',
  draft: 'bg-surface-highest',
  cancelled: 'bg-destructive',
}

type GigSort = 'date' | 'name'
type GigLayout = 'grid' | 'list'
type WeekGroup = 'Denne veka' | 'Neste veke' | 'Seinare'

const WEEK_ORDER: WeekGroup[] = ['Denne veka', 'Neste veke', 'Seinare']

function getWeekGroup(startDate: string, now: Date): WeekGroup {
  const date = parseISO(startDate)
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const nextWeekStart = startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 })
  const nextWeekEnd = endOfWeek(addWeeks(now, 1), { weekStartsOn: 1 })

  if (isWithinInterval(date, { start: weekStart, end: weekEnd })) {
    return 'Denne veka'
  }
  if (isWithinInterval(date, { start: nextWeekStart, end: nextWeekEnd })) {
    return 'Neste veke'
  }
  return 'Seinare'
}

export default async function GigsPage({
  searchParams,
}: {
  searchParams: Promise<{
    sort?: string
    showPast?: string
    view?: string
    search?: string
    layout?: string
  }>
}) {
  const sp = await searchParams
  const sort: GigSort = sp.sort === 'name' ? 'name' : 'date'
  const showPast = sp.showPast === '1'
  const search = sp.search?.trim() ?? ''
  const layout: GigLayout = sp.layout === 'list' ? 'list' : 'grid'

  const baseParams = new URLSearchParams()
  if (sort === 'name') baseParams.set('sort', 'name')
  if (showPast) baseParams.set('showPast', '1')
  if (sp.view === 'mine') baseParams.set('view', 'mine')
  if (search) baseParams.set('search', search)
  if (layout === 'list') baseParams.set('layout', 'list')

  const buildHref = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(baseParams)
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) params.delete(key)
      else params.set(key, value)
    }
    const query = params.toString()
    return query ? `/dashboard/gigs?${query}` : '/dashboard/gigs'
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: profile }, { data: myAssignments }] = await Promise.all([
    supabase
      .from('profiles')
      .select('role, is_superadmin')
      .eq('id', user!.id)
      .single() as Promise<{
      data: { role: string; is_superadmin: boolean } | null
      error: unknown
    }>,
    supabase
      .from('gig_personnel')
      .select('gig_id, role_on_gig')
      .eq('profile_id', user!.id) as Promise<{
      data: { gig_id: string; role_on_gig: string | null }[] | null
      error: unknown
    }>,
  ])

  const isAdmin = profile?.role === 'admin'
  const isSuperadmin = profile?.is_superadmin === true
  const viewMine = isAdmin && sp.view === 'mine'

  const myRoleMap = new Map(
    (myAssignments ?? []).map((a) => [a.gig_id, a.role_on_gig])
  )
  const myGigIds = [...myRoleMap.keys()]

  // Stats query — all non-cancelled gigs, no date filter
  const statsQueryPromise = supabase
    .from('gigs')
    .select('status')
    .neq('status', 'cancelled') as Promise<{
    data: { status: string }[] | null
    error: unknown
  }>

  let gigsQuery = supabase.from('gigs').select('*')

  if (!showPast) {
    gigsQuery = gigsQuery.gt(
      'end_date',
      format(subDays(new Date(), 3), 'yyyy-MM-dd')
    )
  }

  if (viewMine) {
    if (myGigIds.length === 0) {
      gigsQuery = gigsQuery.eq('id', '00000000-0000-0000-0000-000000000000')
    } else {
      gigsQuery = gigsQuery.in('id', myGigIds)
    }
  }

  if (search) {
    gigsQuery = gigsQuery.or(
      `name.ilike.%${search}%,venue.ilike.%${search}%,client.ilike.%${search}%`
    )
  }

  gigsQuery =
    sort === 'name'
      ? gigsQuery
          .order('name', { ascending: true })
          .order('start_date', { ascending: true })
      : gigsQuery
          .order('start_date', { ascending: true })
          .order('name', { ascending: true })

  const [{ data: gigs }, { data: statsData }] = await Promise.all([
    gigsQuery as Promise<{ data: Gig[] | null; error: unknown }>,
    statsQueryPromise,
  ])

  const gigList = gigs ?? []

  // Stats counts
  const allNonCancelled = statsData ?? []
  const totalCount = allNonCancelled.length
  const confirmedCount = allNonCancelled.filter(
    (g) => g.status === 'confirmed'
  ).length
  const draftCount = allNonCancelled.filter((g) => g.status === 'draft').length
  const completedCount = allNonCancelled.filter(
    (g) => g.status === 'completed'
  ).length

  // Festival program item counts
  const festivalIds = gigList
    .filter((gig) => gig.gig_type === 'festival')
    .map((gig) => gig.id)
  const programItemCountMap = new Map<string, number>()

  if (festivalIds.length > 0) {
    const { data: programItems } = (await supabase
      .from('gig_program_items')
      .select('gig_id')
      .in('gig_id', festivalIds)) as {
      data: { gig_id: string }[] | null
      error: unknown
    }

    for (const item of programItems ?? []) {
      const count = programItemCountMap.get(item.gig_id) ?? 0
      programItemCountMap.set(item.gig_id, count + 1)
    }
  }

  // Week grouping (only when sorting by date and not searching)
  const now = new Date()
  const useWeekGroups = sort === 'date' && !search

  type GroupEntry = { label: WeekGroup; gigs: Gig[] }
  let groups: GroupEntry[] = []

  if (useWeekGroups && gigList.length > 0) {
    const groupMap = new Map<WeekGroup, Gig[]>(
      WEEK_ORDER.map((label) => [label, []])
    )
    for (const gig of gigList) {
      const label = getWeekGroup(gig.start_date, now)
      groupMap.get(label)!.push(gig)
    }
    groups = WEEK_ORDER.filter(
      (label) => groupMap.get(label)!.length > 0
    ).map((label) => ({ label, gigs: groupMap.get(label)! }))
  }

  const renderGigCard = (gig: Gig) => {
    const statusLabel = statusLabels[gig.status as GigStatus]
    const statusVariant = statusVariants[gig.status as GigStatus]
    const accent = accentClass[gig.status as GigStatus]
    const formattedDate =
      gig.start_date === gig.end_date
        ? format(new Date(gig.start_date), 'd. MMM yyyy', { locale: nb })
        : `${format(new Date(gig.start_date), 'd. MMM', { locale: nb })} – ${format(new Date(gig.end_date), 'd. MMM yyyy', { locale: nb })}`

    if (layout === 'list') {
      return (
        <Link
          key={gig.id}
          href={`/dashboard/gigs/${gig.id}`}
          className="group flex rounded-xl overflow-hidden bg-surface-container hover:bg-surface-high transition-colors cursor-pointer"
        >
          <div className={cn('w-[3px] shrink-0', accent)} />
          <div className="flex-1 px-4 py-3 flex items-center gap-4 min-w-0">
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold text-sm leading-snug truncate">
                {gig.name}
              </p>
              {gig.client && (
                <p className="flex items-center gap-1 text-xs text-primary font-medium mt-0.5">
                  <BuildingIcon className="size-3" />
                  {gig.client}
                </p>
              )}
            </div>
            <div className="flex items-center gap-5 shrink-0 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarIcon className="size-3" />
                {formattedDate}
              </span>
              {gig.venue && (
                <span className="flex items-center gap-1">
                  <MapPinIcon className="size-3" />
                  {gig.venue}
                </span>
              )}
            </div>
            <Badge variant={statusVariant} className="shrink-0">
              {statusLabel}
            </Badge>
          </div>
        </Link>
      )
    }

    return (
      <Link
        key={gig.id}
        href={`/dashboard/gigs/${gig.id}`}
        className="group flex rounded-2xl overflow-hidden bg-surface-container hover:bg-surface-high transition-all hover:-translate-y-px hover:shadow-[0_8px_24px_oklch(0_0_0/0.25)] cursor-pointer"
      >
        <div className={cn('w-[3px] shrink-0 self-stretch', accent)} />
        <div className="flex-1 p-4 min-w-0 flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          </div>
          <p className="font-heading font-bold text-[0.9375rem] leading-snug tracking-[-0.02em] text-foreground line-clamp-2">
            {gig.name}
          </p>
          {gig.client && (
            <p className="flex items-center gap-1 text-xs text-primary font-medium">
              <BuildingIcon className="size-3 shrink-0" />
              {gig.client}
            </p>
          )}
          <div className="flex flex-wrap gap-3 mt-0.5">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarIcon className="size-3 shrink-0" />
              {formattedDate}
            </span>
            {gig.venue && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPinIcon className="size-3 shrink-0" />
                {gig.venue}
              </span>
            )}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Page header */}
      <div className="flex items-center justify-between mb-7">
        <h1 className="font-heading font-extrabold text-[1.75rem] leading-none tracking-[-0.035em]">
          Oppdrag
        </h1>
        {isAdmin && (
          <div className="flex items-center gap-2.5">
            {isSuperadmin && (
              <Button asChild variant="secondary">
                <Link href="/dashboard/gigs/import">
                  <CloudUploadIcon className="size-4" />
                  Importer frå iCloud
                </Link>
              </Button>
            )}
            <Button asChild size="lg">
              <Link href="/dashboard/gigs/new">
                <PlusIcon className="size-4" />
                Nytt arrangement
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div className="flex gap-px rounded-[0.875rem] overflow-hidden bg-border mb-7">
        {[
          { label: 'Totalt', value: totalCount, colorClass: '' },
          { label: 'Bekrefta', value: confirmedCount, colorClass: 'text-primary' },
          { label: 'Utkast', value: draftCount, colorClass: 'text-muted-foreground' },
          { label: 'Fullførte', value: completedCount, colorClass: 'text-emerald-400' },
        ].map(({ label, value, colorClass }) => (
          <div
            key={label}
            className="flex-1 bg-surface-container hover:bg-surface-high transition-colors px-4 py-3.5 flex flex-col gap-0.5 cursor-default"
          >
            <span
              className={cn(
                'font-heading font-extrabold text-2xl leading-none tracking-[-0.04em]',
                colorClass
              )}
            >
              {value}
            </span>
            <span className="text-[0.6875rem] font-medium text-muted-foreground uppercase tracking-[0.08em]">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap mb-6">
        {/* Tab group */}
        {isAdmin && (
          <div className="flex bg-surface-high rounded-xl p-[3px] gap-0.5">
            <Link
              href={buildHref({ view: null })}
              className={cn(
                'text-xs font-medium px-3.5 py-[5px] rounded-[0.5625rem] transition-colors',
                !viewMine
                  ? 'bg-surface-highest text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Alle
            </Link>
            <Link
              href={buildHref({ view: 'mine' })}
              className={cn(
                'text-xs font-medium px-3.5 py-[5px] rounded-[0.5625rem] transition-colors',
                viewMine
                  ? 'bg-surface-highest text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Mine
            </Link>
          </div>
        )}

        {/* Search */}
        <div className="flex-1 min-w-[200px] max-w-xs">
          <GigSearchInput defaultValue={search} />
        </div>

        {/* Sort */}
        <span className="text-xs text-muted-foreground/60 ml-auto">Sorter</span>
        <Link
          href={buildHref({ sort: null })}
          className={cn(
            'text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors',
            sort === 'date'
              ? 'text-primary bg-primary/10'
              : 'text-muted-foreground hover:text-foreground hover:bg-surface-high'
          )}
        >
          Startdato
        </Link>
        <Link
          href={buildHref({ sort: 'name' })}
          className={cn(
            'text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors',
            sort === 'name'
              ? 'text-primary bg-primary/10'
              : 'text-muted-foreground hover:text-foreground hover:bg-surface-high'
          )}
        >
          Namn
        </Link>

        {/* Past gigs toggle */}
        <PastGigsToggle defaultChecked={showPast} />

        {/* Grid/list toggle */}
        <div className="flex bg-surface-high rounded-lg p-[3px] gap-0.5">
          <Link
            href={buildHref({ layout: null })}
            className={cn(
              'size-7 flex items-center justify-center rounded-[7px] transition-colors',
              layout === 'grid'
                ? 'bg-surface-highest text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <LayoutGridIcon className="size-3.5" />
          </Link>
          <Link
            href={buildHref({ layout: 'list' })}
            className={cn(
              'size-7 flex items-center justify-center rounded-[7px] transition-colors',
              layout === 'list'
                ? 'bg-surface-highest text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <ListIcon className="size-3.5" />
          </Link>
        </div>
      </div>

      {/* Gig list */}
      {!gigList.length ? (
        <p className="text-muted-foreground text-sm">Ingen oppdrag å vise.</p>
      ) : useWeekGroups ? (
        <div className="flex flex-col gap-8">
          {groups.map(({ label, gigs: groupGigs }) => (
            <div key={label}>
              <div className="flex items-center gap-3 mb-3.5">
                <span className="font-heading font-bold text-sm text-muted-foreground tracking-[-0.01em]">
                  {label}
                </span>
                <span className="font-mono text-[0.6875rem] text-muted-foreground/60 bg-surface-high px-2 py-0.5 rounded-full">
                  {groupGigs.length}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div
                className={
                  layout === 'list'
                    ? 'flex flex-col gap-2'
                    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'
                }
              >
                {groupGigs.map((gig) => renderGigCard(gig))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className={
            layout === 'list'
              ? 'flex flex-col gap-2'
              : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'
          }
        >
          {gigList.map((gig) => renderGigCard(gig))}
        </div>
      )}
    </div>
  )
}
