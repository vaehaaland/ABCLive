'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { PhoneIcon, LayoutGridIcon, ListIcon, SearchIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { CompanyBadge } from '@/components/CompanyBadge'

export type SlotStatus = 'free' | 'gig' | 'blocked'

export type PersonWithSlots = {
  id: string
  full_name: string | null
  nickname: string | null
  phone: string | null
  primary_role: string | null
  role: string
  roles: string[]
  busyToday: SlotStatus
  slots: SlotStatus[]
  avatar_url: string | null
  primaryCompany?: { id: string; name: string; slug: string } | null
}

function slotColor(slot: SlotStatus) {
  if (slot === 'gig') return 'bg-primary'
  if (slot === 'blocked') return 'bg-live'
  return 'bg-emerald-500'
}

function accentClass(status: SlotStatus) {
  if (status === 'gig') return 'bg-primary'
  if (status === 'blocked') return 'bg-live'
  return 'bg-emerald-500'
}

function StatusDot({ status }: { status: SlotStatus }) {
  return <span className={cn('size-2 rounded-full shrink-0', accentClass(status))} />
}

function WeekBar({ slots, dayLabels, compact = false }: { slots: SlotStatus[]; dayLabels: string[]; compact?: boolean }) {
  return (
    <div className={compact ? '' : 'shrink-0'}>
      <div className="flex gap-[3px] mb-[3px]">
        {dayLabels.map((d) => (
          <span key={d} className={cn('text-center text-[0.5rem] text-muted-foreground/50', compact ? 'w-[14px]' : 'w-[18px]')}>
            {d}
          </span>
        ))}
      </div>
      <div className="flex gap-[3px]">
        {slots.map((slot, i) => (
          <div key={i} className={cn('rounded-sm', slotColor(slot), compact ? 'w-[14px] h-[5px]' : 'w-[18px] h-[6px]')} />
        ))}
      </div>
    </div>
  )
}

function PersonCard({ person, dayLabels }: { person: PersonWithSlots; dayLabels: string[] }) {
  const statusLabel =
    person.busyToday === 'gig' ? 'Opptatt i dag' :
    person.busyToday === 'blocked' ? 'Utilgjengeleg i dag' :
    'Ledig i dag'

  return (
    <Link
      href={`/dashboard/personnel/${person.id}`}
      className="flex flex-col rounded-xl overflow-hidden bg-surface-container hover:bg-surface-high transition-colors"
    >
      {/* Top color stripe */}
      <div className={cn('h-[5px]', accentClass(person.busyToday))} />

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Avatar + name */}
        <div className="flex items-center gap-3">
          <Avatar
            src={person.avatar_url}
            name={person.full_name}
            size="md"
            id={person.id}
          />
          <div className="min-w-0">
            <p className="type-title text-[0.9375rem] leading-tight truncate">
              {person.full_name ?? '—'}
              {person.nickname && (
                <span className="font-normal text-muted-foreground"> ({person.nickname})</span>
              )}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {person.phone ? (
                <p className="type-micro normal-case tracking-normal flex items-center gap-1 text-muted-foreground">
                  <PhoneIcon className="size-2.5" />
                  {person.phone}
                </p>
              ) : (
                <p className="type-micro normal-case tracking-normal text-muted-foreground">—</p>
              )}
              {person.primaryCompany && <CompanyBadge company={person.primaryCompany} size="xs" />}
            </div>
          </div>
        </div>

        {/* Primary role */}
        <div>
          <p className="type-micro text-muted-foreground mb-1.5">
            Hovudrolle
          </p>
          <Badge variant="default" className="type-micro h-auto py-1 whitespace-normal text-left leading-tight">
            {person.primary_role ?? person.role}
          </Badge>
        </div>

        {/* Roles on gig */}
        {person.roles.length > 0 && (
          <div>
            <p className="type-micro text-muted-foreground mb-1.5">
              Roller på oppdrag
            </p>
            <div className="flex flex-wrap gap-1">
              {person.roles.map((r) => (
                <span
                  key={r}
                  className="type-micro normal-case tracking-normal px-2 py-0.5 rounded-full bg-surface-highest text-muted-foreground"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Spacer pushes status+weekbar to bottom */}
        <div className="flex-1" />

        {/* Status dot + week bar */}
        <div className="flex items-end justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <StatusDot status={person.busyToday} />
            <span className="type-label text-muted-foreground">{statusLabel}</span>
          </div>
          <WeekBar slots={person.slots} dayLabels={dayLabels} />
        </div>
      </div>
    </Link>
  )
}

function PersonRow({ person, dayLabels }: { person: PersonWithSlots; dayLabels: string[] }) {
  const statusLabel =
    person.busyToday === 'gig' ? 'Opptatt i dag' :
    person.busyToday === 'blocked' ? 'Utilgjengeleg i dag' :
    'Ledig i dag'

  return (
    <Link
      href={`/dashboard/personnel/${person.id}`}
      className="group flex items-center gap-0 rounded-xl overflow-hidden bg-surface-container hover:bg-surface-high transition-colors"
    >
      {/* Left accent bar */}
      <div className={cn('w-[3px] self-stretch shrink-0', accentClass(person.busyToday))} />

      {/* NAMN */}
      <div className="flex items-center gap-3 px-4 py-3 w-[220px] shrink-0">
        <Avatar
          src={person.avatar_url}
          name={person.full_name}
          size="sm"
          id={person.id}
        />
        <div className="min-w-0">
          <p className="type-title text-sm leading-tight truncate">
            {person.full_name ?? '—'}
            {person.nickname && (
              <span className="font-normal text-muted-foreground"> ({person.nickname})</span>
            )}
          </p>
          {person.phone && (
            <p className="type-micro normal-case tracking-normal flex items-center gap-1 text-muted-foreground">
              <PhoneIcon className="size-2.5" />{person.phone}
            </p>
          )}
        </div>
      </div>

      {/* HOVUDROLLE */}
      <div className="px-3 py-3 w-[180px] shrink-0">
        <Badge variant="default" className="type-micro h-auto py-1 whitespace-normal leading-tight">
          {person.primary_role ?? person.role}
        </Badge>
      </div>

      {/* ROLLER PÅ OPPDRAG */}
      <div className="px-3 py-3 flex-1 min-w-0">
        <div className="flex flex-wrap gap-1">
          {person.roles.map((r) => (
            <span
              key={r}
              className="type-micro normal-case tracking-normal px-2 py-0.5 rounded-full bg-surface-highest text-muted-foreground whitespace-nowrap"
            >
              {r}
            </span>
          ))}
          {person.roles.length === 0 && (
            <span className="type-micro normal-case tracking-normal text-muted-foreground/40">—</span>
          )}
        </div>
      </div>

      {/* STATUS I DAG */}
      <div className="px-3 py-3 w-[160px] shrink-0">
        <div className="flex items-center gap-1.5">
          <StatusDot status={person.busyToday} />
          <span className="type-label text-muted-foreground">{statusLabel}</span>
        </div>
      </div>

      {/* DENNE VEKA */}
      <div className="px-4 py-3 shrink-0">
        <WeekBar slots={person.slots} dayLabels={dayLabels} compact />
      </div>
    </Link>
  )
}

interface Props {
  people: PersonWithSlots[]
  dayLabels: string[]
}

export function PersonnelGrid({ people, dayLabels }: Props) {
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
          p.nickname?.toLowerCase().includes(q) ||
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
                'type-label px-3 py-1.5 rounded-full transition-colors border',
                statusFilter === f.key
                  ? 'bg-surface-highest text-foreground border-white/15'
                  : 'bg-transparent text-muted-foreground border-white/10 hover:text-foreground hover:bg-surface-high',
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
            <LayoutGridIcon className="size-3.5" />
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
        <div className="rounded-2xl overflow-hidden bg-surface-container">
          {/* Table headers */}
          <div className="flex items-center gap-0 px-4 py-2 border-b border-border">
            <div className="w-[3px] shrink-0" /> {/* accent bar spacer */}
            <div className="w-[220px] shrink-0 pl-3">
              <span className="type-micro text-muted-foreground">Namn</span>
            </div>
            <div className="w-[180px] shrink-0 px-3">
              <span className="type-micro text-muted-foreground">Hovudrolle</span>
            </div>
            <div className="flex-1 px-3">
              <span className="type-micro text-muted-foreground">Roller på oppdrag</span>
            </div>
            <div className="w-[160px] shrink-0 px-3">
              <span className="type-micro text-muted-foreground">Status i dag</span>
            </div>
            <div className="shrink-0 px-4">
              <span className="type-micro text-muted-foreground">Denne veka</span>
            </div>
          </div>
          <div className="divide-y divide-border">
            {filtered.map((p) => (
              <PersonRow key={p.id} person={p} dayLabels={dayLabels} />
            ))}
          </div>
        </div>
      )}

      <p className="mt-4 type-label text-muted-foreground">
        {filtered.length} av {people.length} personar
      </p>
    </>
  )
}

