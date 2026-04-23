'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { PhoneIcon, GridIcon, ListIcon, SearchIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type SlotStatus = 'free' | 'gig' | 'blocked'

export type PersonWithSlots = {
  id: string
  full_name: string | null
  phone: string | null
  primary_role: string | null
  role: string
  roles: string[]
  busyToday: SlotStatus
  slots: SlotStatus[]
  avatarGradient: string
  initials: string
}

const ALL_DAYS_SHORT = ['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø']

function slotColor(slot: SlotStatus) {
  if (slot === 'gig') return 'bg-primary'
  if (slot === 'blocked') return 'bg-live'
  return 'bg-emerald-500'
}

function StatusDot({ status }: { status: SlotStatus }) {
  const cls =
    status === 'gig' ? 'bg-primary' :
    status === 'blocked' ? 'bg-live' :
    'bg-emerald-500'
  return <span className={cn('size-2 rounded-full shrink-0', cls)} />
}

function PersonCard({ person, dayLabels }: { person: PersonWithSlots; dayLabels: string[] }) {
  const statusLabel =
    person.busyToday === 'gig' ? 'Opptatt i dag' :
    person.busyToday === 'blocked' ? 'Utilgjengeleg i dag' :
    'Ledig i dag'

  const stripeClass =
    person.busyToday === 'gig' ? 'bg-primary' :
    person.busyToday === 'blocked' ? 'bg-live' :
    'bg-emerald-500'

  return (
    <Link
      href={`/dashboard/personnel/${person.id}`}
      className="flex flex-col rounded-xl overflow-hidden bg-surface-container hover:bg-surface-high transition-colors"
    >
      {/* Top color stripe */}
      <div className={cn('h-[3px]', stripeClass)} />

      <div className="p-4 flex flex-col gap-3">
        {/* Avatar + name */}
        <div className="flex items-center gap-3">
          <div
            className="size-[42px] rounded-full flex items-center justify-center text-[0.8125rem] font-bold shrink-0"
            style={{ background: person.avatarGradient, color: 'oklch(0.08 0 0)' }}
          >
            {person.initials}
          </div>
          <div className="min-w-0">
            <p className="font-heading font-bold text-[0.9375rem] leading-tight truncate">
              {person.full_name ?? '—'}
            </p>
            {person.phone ? (
              <p className="flex items-center gap-1 text-[0.6875rem] text-muted-foreground mt-0.5">
                <PhoneIcon className="size-2.5" />
                {person.phone}
              </p>
            ) : (
              <p className="text-[0.6875rem] text-muted-foreground mt-0.5">—</p>
            )}
          </div>
        </div>

        {/* Primary role */}
        <div>
          <p className="text-[0.6rem] font-semibold text-muted-foreground uppercase tracking-[0.08em] mb-1.5">
            Hovudrolle
          </p>
          <Badge variant="default" className="uppercase text-[0.6rem] tracking-[0.05em]">
            {person.primary_role ?? person.role}
          </Badge>
        </div>

        {/* Roles on gig */}
        {person.roles.length > 0 && (
          <div>
            <p className="text-[0.6rem] font-semibold text-muted-foreground uppercase tracking-[0.08em] mb-1.5">
              Roller på oppdrag
            </p>
            <div className="flex flex-wrap gap-1">
              {person.roles.map((r) => (
                <span
                  key={r}
                  className="text-[0.6875rem] font-medium px-2 py-0.5 rounded-full bg-surface-highest text-muted-foreground"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Status dot + week bar */}
        <div className="flex items-end justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <StatusDot status={person.busyToday} />
            <span className="text-xs text-muted-foreground whitespace-nowrap">{statusLabel}</span>
          </div>
          <div className="shrink-0">
            <div className="flex gap-[3px] mb-[3px]">
              {dayLabels.map((d) => (
                <span key={d} className="w-[18px] text-center text-[0.5rem] text-muted-foreground/50">
                  {d}
                </span>
              ))}
            </div>
            <div className="flex gap-[3px]">
              {person.slots.map((slot, i) => (
                <div key={i} className={cn('w-[18px] h-[6px] rounded-sm', slotColor(slot))} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

function PersonRow({ person }: { person: PersonWithSlots }) {
  const statusLabel =
    person.busyToday === 'gig' ? 'Opptatt' :
    person.busyToday === 'blocked' ? 'Utilgjengeleg' :
    'Ledig'
  const badgeVariant: 'default' | 'live' | 'success' =
    person.busyToday === 'gig' ? 'default' :
    person.busyToday === 'blocked' ? 'live' :
    'success'

  return (
    <Link
      href={`/dashboard/personnel/${person.id}`}
      className="flex items-center gap-4 px-4 py-3 rounded-xl bg-surface-container hover:bg-surface-high transition-colors"
    >
      <div
        className="size-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        style={{ background: person.avatarGradient, color: 'oklch(0.08 0 0)' }}
      >
        {person.initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-heading font-semibold text-sm truncate">{person.full_name ?? '—'}</p>
        {person.primary_role && (
          <p className="text-xs text-muted-foreground truncate">{person.primary_role}</p>
        )}
      </div>
      <div className="flex flex-wrap gap-1 flex-1 min-w-0">
        {person.roles.slice(0, 3).map((r) => (
          <span key={r} className="text-[0.6875rem] px-2 py-0.5 rounded-full bg-surface-highest text-muted-foreground">
            {r}
          </span>
        ))}
      </div>
      <Badge variant={badgeVariant} className="shrink-0">{statusLabel}</Badge>
    </Link>
  )
}

interface Props {
  people: PersonWithSlots[]
  dayLabels: string[]
  isAdmin: boolean
}

export function PersonnelGrid({ people, dayLabels, isAdmin }: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'alle' | SlotStatus>('alle')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const counts = useMemo(() => ({
    alle: people.length,
    free: people.filter((p) => p.busyToday === 'free').length,
    gig: people.filter((p) => p.busyToday === 'gig').length,
    blocked: people.filter((p) => p.busyToday === 'blocked').length,
  }), [people])

  const filtered = useMemo(() => {
    let list = people
    if (statusFilter !== 'alle') list = list.filter((p) => p.busyToday === statusFilter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (p) =>
          p.full_name?.toLowerCase().includes(q) ||
          p.primary_role?.toLowerCase().includes(q) ||
          p.roles.some((r) => r.toLowerCase().includes(q)),
      )
    }
    return list
  }, [people, statusFilter, search])

  const filters: { key: 'alle' | SlotStatus; label: string; count: number }[] = [
    { key: 'alle', label: 'Alle', count: counts.alle },
    { key: 'free', label: 'Ledig', count: counts.free },
    { key: 'gig', label: 'Opptatt', count: counts.gig },
    { key: 'blocked', label: 'Utilgjengeleg', count: counts.blocked },
  ]

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <input
            className="h-9 w-full rounded-lg border border-input bg-surface-high pl-9 pr-3 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-ring transition-colors"
            placeholder="Søk på namn eller rolle…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status filter chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                'text-xs font-medium px-3 py-1.5 rounded-full transition-colors',
                statusFilter === f.key
                  ? 'bg-surface-highest text-foreground'
                  : 'bg-surface-high text-muted-foreground hover:text-foreground',
              )}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {/* Grid/list toggle */}
        <div className="ml-auto flex bg-surface-high rounded-lg p-[3px] gap-0.5">
          <button
            onClick={() => setView('grid')}
            className={cn(
              'size-7 flex items-center justify-center rounded-[7px] transition-colors',
              view === 'grid' ? 'bg-surface-highest text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <GridIcon className="size-3.5" />
          </button>
          <button
            onClick={() => setView('list')}
            className={cn(
              'size-7 flex items-center justify-center rounded-[7px] transition-colors',
              view === 'list' ? 'bg-surface-highest text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <ListIcon className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ingen personell funne.</p>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <PersonCard key={p.id} person={p} dayLabels={dayLabels} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((p) => (
            <PersonRow key={p.id} person={p} />
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        {filtered.length} av {people.length} personar
      </p>
    </>
  )
}
