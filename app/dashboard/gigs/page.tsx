import type { Metadata } from 'next'
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
import { ShowDeletedToggle } from '@/components/gigs/ShowDeletedToggle'
import { GigSearchInput } from '@/components/gigs/GigSearchInput'
import { GigStatusFilter } from '@/components/gigs/GigStatusFilter'
import { GigSortDropdown } from '@/components/gigs/GigSortDropdown'
import {
  CalendarIcon,
  MapPinIcon,
  BuildingIcon,
  LayoutGridIcon,
  ListIcon,
  PlusIcon,
  CloudUploadIcon,
  Cloud,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CompanyBadge } from '@/components/CompanyBadge'
import type { Gig, GigStatus } from '@/types/database'
import { statusLabels, statusAccentClass } from '@/lib/gig-status'
import RestoreGigButton from '@/components/gigs/RestoreGigButton'

export const metadata: Metadata = {
  title: 'Oppdrag',
}

const statusVariants: Record<GigStatus, 'default' | 'secondary' | 'success' | 'destructive'> = {
  draft: 'secondary',
  confirmed: 'default',
  completed: 'success',
  cancelled: 'destructive',
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
    showDeleted?: string
    view?: string
    search?: string
    layout?: string
    status?: string
    company?: string
  }>
}) {
  const sp = await searchParams
  const sort: GigSort = sp.sort === 'name' ? 'name' : 'date'
  const showPast = sp.showPast === '1'
  // showDeleted is resolved after isAdmin is known; placeholder here, applied below
  const showDeletedParam = sp.showDeleted === '1'
  const search = sp.search?.trim() ?? ''
  const layout: GigLayout = sp.layout === 'list' ? 'list' : 'grid'
  const companyFilter = sp.company ?? null

  const ALL_STATUSES: GigStatus[] = ['draft', 'confirmed', 'completed', 'cancelled']
  const statusFilter: GigStatus[] = sp.status
    ? (sp.status.split(',').filter((s) => ALL_STATUSES.includes(s as GigStatus)) as GigStatus[])
    : []

  const baseParams = new URLSearchParams()
  if (sort === 'name') baseParams.set('sort', 'name')
  if (showPast) baseParams.set('showPast', '1')
  if (sp.view === 'mine') baseParams.set('view', 'mine')
  if (search) baseParams.set('search', search)
  if (layout === 'list') baseParams.set('layout', 'list')
  if (statusFilter.length > 0) baseParams.set('status', statusFilter.join(','))
  if (companyFilter) baseParams.set('company', companyFilter)
  if (showDeletedParam) baseParams.set('showDeleted', '1')

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

  type Company = { id: string; name: string; slug: string }

  const [{ data: profile }, { data: myAssignments }, { data: memberships }] = await Promise.all([
    supabase
      .from('profiles')
      .select('role, is_superadmin')
      .eq('id', user!.id)
      .single() as unknown as Promise<{
      data: { role: string; is_superadmin: boolean } | null
      error: unknown
    }>,
    supabase
      .from('gig_personnel')
      .select('gig_id, role_on_gig')
      .eq('profile_id', user!.id) as unknown as Promise<{
      data: { gig_id: string; role_on_gig: string | null }[] | null
      error: unknown
    }>,
    supabase
      .from('company_memberships')
      .select('company_id, companies(id, name, slug)')
      .eq('profile_id', user!.id) as unknown as Promise<{
      data: { company_id: string; companies: Company | null }[] | null
      error: unknown
    }>,
  ])

  const userCompanies: Company[] = (memberships ?? [])
    .map((m) => m.companies)
    .filter((c): c is Company => c !== null)

  const companyById = new Map(userCompanies.map((c) => [c.id, c]))
  const showCompanyFilter = userCompanies.length > 1

  const isAdmin = profile?.role === 'admin'
  const isSuperadmin = profile?.is_superadmin === true
  const viewMine = isAdmin && sp.view === 'mine'
  const showDeleted = isAdmin && showDeletedParam

  const myRoleMap = new Map(
    (myAssignments ?? []).map((a) => [a.gig_id, a.role_on_gig])
  )
  const myGigIds = [...myRoleMap.keys()]

  const userCompanyIds = userCompanies.map((company) => company.id)

  // Stats query — global across UI filters/search/date scope, but limited to the user's company memberships.
  // Includes non-deleted gigs and excludes cancelled gigs for consistency with existing stat definitions.
  let statsQuery = supabase.from('gigs').select('status').neq('status', 'cancelled').is('deleted_at', null)
  if (userCompanyIds.length > 0) {
    statsQuery = statsQuery.in('company_id', userCompanyIds)
  }
  const statsQueryPromise = statsQuery as unknown as Promise<{
    data: { status: string }[] | null
    error: unknown
  }>

  let gigsQuery = supabase.from('gigs').select('id, name, gig_type, venue, client, start_date, end_date, status, icloud_uid, company_id, deleted_at')

  if (!showDeleted) {
    gigsQuery = gigsQuery.is('deleted_at', null)
  }

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

  if (statusFilter.length > 0) {
    gigsQuery = gigsQuery.in('status', statusFilter)
  }

  if (companyFilter) {
    gigsQuery = gigsQuery.eq('company_id', companyFilter)
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
    gigsQuery as unknown as Promise<{ data: Gig[] | null; error: unknown }>,
    statsQueryPromise,
  ])

  const gigList = gigs ?? []

  const gigIds = gigList.map((gig) => gig.id)
  const gigsWithoutPersonnel = new Set<string>(gigIds)

  if (gigIds.length > 0) {
    const [{ data: internalPersonnel }, { data: externalPersonnel }] =
      await Promise.all([
        supabase
          .from('gig_personnel')
          .select('gig_id')
          .in('gig_id', gigIds) as unknown as Promise<{
          data: { gig_id: string }[] | null
          error: unknown
        }>,
        supabase
          .from('gig_external_personnel')
          .select('gig_id')
          .in('gig_id', gigIds) as unknown as Promise<{
          data: { gig_id: string }[] | null
          error: unknown
        }>,
      ])

    for (const row of internalPersonnel ?? []) {
      gigsWithoutPersonnel.delete(row.gig_id)
    }
    for (const row of externalPersonnel ?? []) {
      gigsWithoutPersonnel.delete(row.gig_id)
    }
  }

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
  // Domain rule: `live` is a persisted gig status, not a UI-computed instant value.
  // "Live no" is global (independent of current UI filters/search/date scope) by counting all scoped gigs with status `live`.
  // Scope here is the user's company memberships, not the current page filter state.
  // No realtime subscription is used; status transitions are driven by manual updates and optional server-side jobs.
  const liveNowCount = allNonCancelled.filter((g) => g.status === 'live').length

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

  const renderGigCard = (gig: Gig, showCompany: boolean) => {
    const isDeleted = !!gig.deleted_at
    const statusLabel = statusLabels[gig.status as GigStatus]
    const statusVariant = statusVariants[gig.status as GigStatus]
    const accent = statusAccentClass[gig.status as GigStatus]
    const clientLabel = gig.client?.trim() ? gig.client : '-'
    const venueLabel = gig.venue?.trim() ? gig.venue : '-'
    const formattedDate =
      gig.start_date === gig.end_date
        ? format(new Date(gig.start_date), 'd. MMM yyyy', { locale: nb })
        : `${format(new Date(gig.start_date), 'd. MMM', { locale: nb })} – ${format(new Date(gig.end_date), 'd. MMM yyyy', { locale: nb })}`

    const gigCompany = companyById.get(gig.company_id)

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
              <p className="type-title text-sm leading-snug truncate">
                {gig.name}
              </p>
              <p
                className={cn(
                  'flex items-center gap-1 type-label mt-0.5',
                  clientLabel === '-' ? 'text-muted-foreground' : 'text-primary'
                )}
              >
                <BuildingIcon className="size-3" />
                {clientLabel}
              </p>
            </div>
            <div className="flex items-center gap-5 shrink-0 type-label text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarIcon className="size-3" />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1">
                <MapPinIcon className="size-3" />
                {venueLabel}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {showCompany && gigCompany && <CompanyBadge company={gigCompany} size="xs" />}
              {gigsWithoutPersonnel.has(gig.id) && (
                <Badge variant="destructive">Ingen personell</Badge>
              )}
              <div className="flex items-center gap-1.5">
                {gig.icloud_uid && (
                  <Cloud className="h-3.5 w-3.5 text-muted-foreground/40" aria-label="Synkronisert frå iCloud" />
                )}
                <Badge variant={statusVariant}>{statusLabel}</Badge>
              </div>
              {isDeleted && <Badge variant="destructive">Sletta</Badge>}
              {isDeleted && <RestoreGigButton gigId={gig.id} />}
            </div>
          </div>
        </Link>
      )
    }
    return (
      <Link
        key={gig.id}
        href={`/dashboard/gigs/${gig.id}`}
        className={cn(
          'group flex rounded-2xl overflow-hidden bg-surface-container border border-border hover:bg-surface-high transition-all hover:-translate-y-px hover:shadow-[0_8px_24px_oklch(0_0_0/0.25)] cursor-pointer',
          (gig.status === 'cancelled' || gig.status === 'draft') && 'opacity-70'
        )}
      >
        <div className={cn(
          'w-[58px] shrink-0 border-r border-border flex flex-col items-center justify-center gap-0.5 py-3.5',
          gig.status === 'confirmed' && 'bg-primary/10',
          gig.status === 'completed' && 'bg-emerald-500/10',
          gig.status === 'draft' && 'bg-surface-high',
          gig.status === 'cancelled' && 'bg-destructive/10'
        )}>
          <span className={cn(
            'type-h2 leading-none',
            gig.status === 'confirmed' && 'text-primary',
            gig.status === 'completed' && 'text-emerald-500',
            gig.status === 'draft' && 'text-muted-foreground',
            gig.status === 'cancelled' && 'text-destructive'
          )}>
            {format(new Date(gig.start_date), 'd', { locale: nb })}
          </span>
          <span className="type-micro tracking-[0.1em] text-muted-foreground">
            {format(new Date(gig.start_date), 'MMM', { locale: nb })}
          </span>
        </div>
        <div className="flex-1 px-3.5 py-3 min-w-0 flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2 min-w-0">
            <p className="type-title text-[0.9375rem] leading-snug tracking-[-0.02em] text-foreground line-clamp-2 min-w-0">
              {gig.name}
            </p>
            <div className="flex items-center gap-1.5 shrink-0">
              {gig.icloud_uid && (
                <Cloud className="h-3.5 w-3.5 text-muted-foreground/40" aria-label="Synkronisert frå iCloud" />
              )}
              <Badge variant={statusVariant}>{statusLabel}</Badge>
            </div>
          </div>
          <p
            className={cn(
              'flex items-center gap-1 type-label',
              clientLabel === '-' ? 'text-muted-foreground' : 'text-primary'
            )}
          >
            <BuildingIcon className="size-3 shrink-0" />
            {clientLabel}
          </p>
          <div className="flex flex-wrap gap-3 mt-0.5">
            <span className="flex items-center gap-1 type-label text-muted-foreground">
              <CalendarIcon className="size-3 shrink-0" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1 type-label text-muted-foreground">
              <MapPinIcon className="size-3 shrink-0" />
              {venueLabel}
            </span>
          </div>
          <div className="h-px bg-border -mx-3.5 mt-0.5" />
          <div className="pt-0.5 flex items-center gap-1.5 flex-wrap">
            {showCompany && gigCompany && <CompanyBadge company={gigCompany} size="xs" />}
            {gigsWithoutPersonnel.has(gig.id) && (
              <Badge variant="destructive">Ingen personell</Badge>
            )}
            {isDeleted && <Badge variant="destructive">Sletta</Badge>}
          </div>
          {isDeleted && (
            <div className="mt-1 flex items-center gap-2">
              <RestoreGigButton gigId={gig.id} />
            </div>
          )}
        </div>
      </Link>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Page header */}
      <div className="flex items-center justify-between mb-7">
        <h1 className="type-h2">
          Oppdrag
        </h1>
        {isAdmin && (
          <div className="flex items-center gap-2.5">
            {isSuperadmin && (
              <Button asChild variant="secondary" size="lg">
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
          { label: 'Totalt', value: totalCount, colorClass: 'text-foreground', trend: '—' },
          {
            label: 'Live no',
            value: liveNowCount,
            colorClass: 'text-[oklch(0.67_0.26_28)]',
            trend: null,
            segmentClass: 'bg-[oklch(0.67_0.26_28/0.07)] hover:bg-[oklch(0.67_0.26_28/0.11)]',
            isLive: true,
          },
          { label: 'Bekrefta', value: confirmedCount, colorClass: 'text-primary', trend: '—' },
          { label: 'Utkast', value: draftCount, colorClass: 'text-muted-foreground', trend: '—' },
          { label: 'Fullførte', value: completedCount, colorClass: 'text-success', trend: null },
        ].map(({ label, value, colorClass, trend, segmentClass, isLive }) => (
          <div
            key={label}
            className={cn(
              'flex-1 bg-surface-container hover:bg-surface-high transition-colors px-4 py-3 flex flex-col gap-1 cursor-default',
              segmentClass
            )}
          >
            <div className="flex items-center gap-1.5">
              {isLive && <span className="size-1.5 rounded-full bg-[oklch(0.67_0.26_28)] live-dot-pulse" />}
              <span className={cn('type-h2 leading-none tracking-[-0.03em]', colorClass)}>
                {value}
              </span>
              {trend && (
                <span className="type-micro text-muted-foreground pb-0.5">
                  {trend}
                </span>
              )}
            </div>
            <span className="type-micro uppercase tracking-[0.1em] text-muted-foreground">
              {label}
            </span>
          </div>
        ))}
      </div>
      {/* Company filter */}
      {showCompanyFilter && (
        <div className="flex items-center gap-1.5 mb-4">
          <Link
            href={buildHref({ company: null })}
            className={cn(
              'type-label px-3 py-1.5 rounded-full transition-colors',
              !companyFilter
                ? 'bg-surface-highest text-foreground'
                : 'bg-surface-high text-muted-foreground hover:text-foreground'
            )}
          >
            Alle selskap
          </Link>
          {userCompanies.map((c) => (
            <Link
              key={c.id}
              href={buildHref({ company: c.id })}
              className={cn(
                'type-label px-3 py-1.5 rounded-full transition-colors',
                companyFilter === c.id
                  ? 'bg-surface-highest text-foreground'
                  : 'bg-surface-high text-muted-foreground hover:text-foreground'
              )}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap mb-6">
        {/* Tab group */}
        {isAdmin && (
          <div className="flex bg-surface-high rounded-xl p-[3px] gap-0.5">
            <Link
              href={buildHref({ view: null })}
              className={cn(
                'type-label px-3.5 py-[5px] rounded-[0.5625rem] transition-colors',
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
                'type-label px-3.5 py-[5px] rounded-[0.5625rem] transition-colors',
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
        <GigSortDropdown defaultValue={sort} />

        {/* Status filter */}
        <GigStatusFilter defaultValue={statusFilter} />

        {/* Past gigs toggle */}
        <PastGigsToggle defaultChecked={showPast} />
        {/* Show deleted toggle */}
        {isAdmin && <ShowDeletedToggle defaultChecked={showDeleted} />}


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
                <span className="type-title text-sm text-muted-foreground">
                  {label}
                </span>
                <span className="type-micro normal-case tracking-normal font-mono text-muted-foreground/60 bg-surface-high px-2 py-0.5 rounded-full">
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
                {groupGigs.map((gig) => renderGigCard(gig, showCompanyFilter))}
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
          {gigList.map((gig) => renderGigCard(gig, showCompanyFilter))}
        </div>
      )}
    </div>
  )
}
