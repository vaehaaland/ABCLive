'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircle2Icon,
  LinkIcon,
  Loader2Icon,
  MapPinIcon,
  XIcon,
} from 'lucide-react'
import { format, addMonths } from 'date-fns'
import type { ICloudEventWithStatus } from '@/app/api/icloud/events/route'

type GigOption = { id: string; name: string; start_date: string }

function today() {
  return format(new Date(), 'yyyy-MM-dd')
}
function threeMonthsFromNow() {
  return format(addMonths(new Date(), 3), 'yyyy-MM-dd')
}

export default function ImportICloudPage() {
  const router = useRouter()
  const supabase = createClient()

  const [from, setFrom] = useState(today())
  const [to, setTo] = useState(threeMonthsFromNow())
  const [events, setEvents] = useState<ICloudEventWithStatus[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [fetchStatus, setFetchStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [fetchError, setFetchError] = useState('')
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'done'>('idle')
  const [importedGigs, setImportedGigs] = useState<{ id: string; name: string }[]>([])

  // Link-to-existing state
  const [linkingUid, setLinkingUid] = useState<string | null>(null)
  const [gigSearch, setGigSearch] = useState('')
  const [allGigs, setAllGigs] = useState<GigOption[]>([])
  const [gigsLoaded, setGigsLoaded] = useState(false)
  const [linking, setLinking] = useState<string | null>(null) // uid being linked right now
  const searchRef = useRef<HTMLInputElement>(null)

  // Lazy-load gig list when user opens the link picker
  useEffect(() => {
    if (!linkingUid || gigsLoaded) return
    supabase
      .from('gigs')
      .select('id, name, start_date')
      .order('start_date', { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setAllGigs((data ?? []) as GigOption[])
        setGigsLoaded(true)
        setTimeout(() => searchRef.current?.focus(), 50)
      })
  }, [linkingUid]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (linkingUid) setTimeout(() => searchRef.current?.focus(), 50)
  }, [linkingUid])

  async function handleFetch(e: React.FormEvent) {
    e.preventDefault()
    setFetchStatus('loading')
    setFetchError('')
    setEvents([])
    setSelected(new Set())
    setLinkingUid(null)
    try {
      const res = await fetch(`/api/icloud/events?from=${from}&to=${to}`)
      const json = await res.json()
      if (!res.ok) {
        setFetchStatus('error')
        setFetchError(json.error ?? 'Ukjend feil')
        return
      }
      setEvents(json as ICloudEventWithStatus[])
      setFetchStatus('done')
    } catch {
      setFetchStatus('error')
      setFetchError('Nettverksfeil')
    }
  }

  function toggleSelect(uid: string) {
    // Deselect link mode when toggling checkbox
    if (linkingUid === uid) setLinkingUid(null)
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(uid)) next.delete(uid)
      else next.add(uid)
      return next
    })
  }

  function openLinkPicker(uid: string) {
    // Deselect import checkbox when opening link picker
    setSelected((prev) => { const n = new Set(prev); n.delete(uid); return n })
    setGigSearch('')
    setLinkingUid((prev) => (prev === uid ? null : uid))
  }

  function toggleAll() {
    const importable = events.filter((e) => !e.existingGigId).map((e) => e.uid)
    if (selected.size === importable.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(importable))
      setLinkingUid(null)
    }
  }

  async function linkToGig(eventUid: string, gigId: string) {
    setLinking(eventUid)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gigsTable = supabase.from('gigs') as any
    const { error } = await gigsTable
      .update({ icloud_uid: eventUid })
      .eq('id', gigId) as { error: { message: string } | null }

    if (!error) {
      const gig = allGigs.find((g) => g.id === gigId)
      setEvents((prev) =>
        prev.map((e) =>
          e.uid === eventUid
            ? { ...e, existingGigId: gigId, existingGigName: gig?.name ?? gigId }
            : e
        )
      )
      setLinkingUid(null)
    }
    setLinking(null)
  }

  async function handleImport() {
    const toImport = events.filter((e) => selected.has(e.uid))
    if (!toImport.length) return
    setImportStatus('loading')
    const { data: { user } } = await supabase.auth.getUser()
    const created: { id: string; name: string }[] = []
    for (const event of toImport) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gigsTable = supabase.from('gigs') as any
      const { data } = await gigsTable
        .insert({
          name: event.title,
          start_date: event.startDate,
          end_date: event.endDate,
          venue: event.location,
          description: event.description,
          icloud_uid: event.uid,
          gig_type: 'single',
          status: 'draft',
          created_by: user?.id,
        })
        .select('id, name')
        .single() as { data: { id: string; name: string } | null }
      if (data) created.push(data)
    }
    setImportedGigs(created)
    setImportStatus('done')
    router.refresh()
  }

  const importableCount = events.filter((e) => !e.existingGigId).length

  const filteredGigs = gigSearch.trim()
    ? allGigs.filter((g) => g.name.toLowerCase().includes(gigSearch.toLowerCase()))
    : allGigs

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/gigs">
            <ArrowLeftIcon className="size-4" />
          </Link>
        </Button>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Importer frå iCloud</h1>
      </div>

      {/* Date range picker */}
      <form onSubmit={handleFetch} className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="from-date">Frå dato</Label>
          <Input
            id="from-date"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="to-date">Til dato</Label>
          <Input
            id="to-date"
            type="date"
            value={to}
            min={from}
            onChange={(e) => setTo(e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={fetchStatus === 'loading'}>
          {fetchStatus === 'loading' && <Loader2Icon className="size-4 animate-spin mr-2" />}
          Hent events
        </Button>
      </form>

      {fetchStatus === 'error' && (
        <p className="text-sm text-destructive">{fetchError}</p>
      )}

      {/* Event list */}
      {fetchStatus === 'done' && (
        <div className="flex flex-col gap-4">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ingen events i denne perioden.</p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {events.length} events — {importableCount} kan importerast
                </p>
                {importableCount > 0 && (
                  <Button variant="outline" size="sm" onClick={toggleAll}>
                    {selected.size === importableCount ? 'Fjern alle' : 'Vel alle'}
                  </Button>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {events.map((event) => {
                  const alreadyLinked = !!event.existingGigId
                  const isSelected = selected.has(event.uid)
                  const isLinking = linkingUid === event.uid

                  return (
                    <div key={event.uid} className="flex flex-col gap-0">
                      {/* Event row */}
                      <div
                        className={`rounded-lg border p-4 flex items-start gap-3 transition-colors ${
                          isLinking
                            ? 'rounded-b-none border-b-0 border-primary/40 bg-surface-high'
                            : alreadyLinked
                            ? 'border-white/5 bg-surface-container opacity-60'
                            : isSelected
                            ? 'border-primary/40 bg-surface-high'
                            : 'border-white/10 bg-surface-container hover:bg-surface-high'
                        }`}
                      >
                        {/* Checkbox / status icon */}
                        <div
                          className="mt-0.5 flex-shrink-0 cursor-pointer"
                          onClick={() => !alreadyLinked && toggleSelect(event.uid)}
                        >
                          {alreadyLinked ? (
                            <CheckCircle2Icon className="size-5 text-emerald-400" />
                          ) : (
                            <div
                              className={`size-5 rounded border-2 flex items-center justify-center ${
                                isSelected ? 'border-primary bg-primary' : 'border-white/30'
                              }`}
                            >
                              {isSelected && (
                                <svg viewBox="0 0 12 10" className="size-3 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="1,5 4,8 11,1" />
                                </svg>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Event details */}
                        <div
                          className={`flex flex-col gap-1 min-w-0 flex-1 ${!alreadyLinked ? 'cursor-pointer' : ''}`}
                          onClick={() => !alreadyLinked && toggleSelect(event.uid)}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm leading-snug">{event.title}</span>
                            {alreadyLinked && (
                              <Badge variant="secondary">
                                <Link
                                  href={`/dashboard/gigs/${event.existingGigId}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="hover:underline"
                                >
                                  {event.existingGigName}
                                </Link>
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="size-3" />
                              {event.startDate === event.endDate
                                ? event.startDate
                                : `${event.startDate} → ${event.endDate}`}
                            </span>
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPinIcon className="size-3" />
                                {event.location}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Link-to-existing button (only for unlinked events) */}
                        {!alreadyLinked && (
                          <button
                            onClick={(e) => { e.stopPropagation(); openLinkPicker(event.uid) }}
                            className={`flex-shrink-0 flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-colors ${
                              isLinking
                                ? 'text-primary bg-primary/10'
                                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                            }`}
                            title="Knytt til eksisterande gig"
                          >
                            {isLinking ? <XIcon className="size-3.5" /> : <LinkIcon className="size-3.5" />}
                            <span className="hidden sm:inline">{isLinking ? 'Avbryt' : 'Link'}</span>
                          </button>
                        )}
                      </div>

                      {/* Inline gig picker (only visible when in link mode) */}
                      {isLinking && (
                        <div className="border border-t-0 border-primary/40 rounded-b-lg bg-surface-container p-3 flex flex-col gap-2">
                          <Input
                            ref={searchRef}
                            placeholder="Søk etter gig…"
                            value={gigSearch}
                            onChange={(e) => setGigSearch(e.target.value)}
                            className="h-8 text-sm"
                          />
                          {!gigsLoaded ? (
                            <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                              <Loader2Icon className="size-3 animate-spin" /> Lastar gigs…
                            </div>
                          ) : filteredGigs.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-1">Ingen gigs funne.</p>
                          ) : (
                            <div className="flex flex-col max-h-48 overflow-y-auto">
                              {filteredGigs.map((gig) => (
                                <button
                                  key={gig.id}
                                  onClick={() => linkToGig(event.uid, gig.id)}
                                  disabled={linking === event.uid}
                                  className="flex items-center justify-between text-left px-2 py-1.5 rounded text-sm hover:bg-surface-high transition-colors disabled:opacity-50"
                                >
                                  <span className="truncate">{gig.name}</span>
                                  <span className="text-xs text-muted-foreground ml-3 flex-shrink-0">{gig.start_date}</span>
                                  {linking === event.uid && <Loader2Icon className="size-3 animate-spin ml-2 flex-shrink-0" />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Import action */}
              {importStatus === 'done' ? (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-emerald-400 flex items-center gap-2">
                    <CheckCircle2Icon className="size-4" />
                    {importedGigs.length} gig{importedGigs.length !== 1 ? 's' : ''} oppretta.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {importedGigs.map((g) => (
                      <Button key={g.id} asChild variant="outline" size="sm">
                        <Link href={`/dashboard/gigs/${g.id}`}>{g.name}</Link>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : selected.size > 0 ? (
                <Button
                  onClick={handleImport}
                  disabled={importStatus === 'loading'}
                  className="self-start"
                >
                  {importStatus === 'loading' && <Loader2Icon className="size-4 animate-spin mr-2" />}
                  Importer {selected.size} event{selected.size !== 1 ? 's' : ''} som gig
                </Button>
              ) : null}
            </>
          )}
        </div>
      )}
    </div>
  )
}
