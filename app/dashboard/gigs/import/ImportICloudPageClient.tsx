'use client'

import { useEffect, useRef, useState } from 'react'
import { format, addMonths } from 'date-fns'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircle2Icon,
  LinkIcon,
  Loader2Icon,
  MapPinIcon,
  XIcon,
} from 'lucide-react'
import type { ICloudEventWithStatus } from '@/app/api/icloud/events/route'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

type GigOption = { id: string; name: string; start_date: string }

const ABC_STUDIO_ID = '00000000-0000-0000-0000-000000000001'

function today() {
  return format(new Date(), 'yyyy-MM-dd')
}

function threeMonthsFromNow() {
  return format(addMonths(new Date(), 3), 'yyyy-MM-dd')
}

export default function ImportICloudPageClient() {
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
  const [linkingUid, setLinkingUid] = useState<string | null>(null)
  const [gigSearch, setGigSearch] = useState('')
  const [allGigs, setAllGigs] = useState<GigOption[]>([])
  const [gigsLoaded, setGigsLoaded] = useState(false)
  const [linking, setLinking] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

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
  }, [gigsLoaded, linkingUid, supabase])

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
    if (linkingUid === uid) setLinkingUid(null)
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(uid)) next.delete(uid)
      else next.add(uid)
      return next
    })
  }

  function openLinkPicker(uid: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.delete(uid)
      return next
    })
    setGigSearch('')
    setLinkingUid((prev) => (prev === uid ? null : uid))
  }

  function toggleAll() {
    const importable = events.filter((event) => !event.existingGigId).map((event) => event.uid)
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
      const gig = allGigs.find((item) => item.id === gigId)
      setEvents((prev) =>
        prev.map((event) =>
          event.uid === eventUid
            ? { ...event, existingGigId: gigId, existingGigName: gig?.name ?? gigId }
            : event
        )
      )
      setLinkingUid(null)
    }
    setLinking(null)
  }

  async function handleImport() {
    const toImport = events.filter((event) => selected.has(event.uid))
    if (!toImport.length) return
    setImportStatus('loading')
    const {
      data: { user },
    } = await supabase.auth.getUser()
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
          company_id: ABC_STUDIO_ID,
        })
        .select('id, name')
        .single() as { data: { id: string; name: string } | null }
      if (data) created.push(data)
    }
    setImportedGigs(created)
    setImportStatus('done')
    router.refresh()
  }

  const importableCount = events.filter((event) => !event.existingGigId).length
  const filteredGigs = gigSearch.trim()
    ? allGigs.filter((gig) => gig.name.toLowerCase().includes(gigSearch.toLowerCase()))
    : allGigs

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/gigs">
            <ArrowLeftIcon className="size-4" />
          </Link>
        </Button>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Importer frå iCloud</h1>
      </div>

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
          {fetchStatus === 'loading' && <Loader2Icon className="mr-2 size-4 animate-spin" />}
          Hent events
        </Button>
      </form>

      {fetchStatus === 'error' && <p className="text-sm text-destructive">{fetchError}</p>}

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
                      <div
                        className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
                          isLinking
                            ? 'rounded-b-none border-b-0 border-primary/40 bg-surface-high'
                            : alreadyLinked
                              ? 'border-white/5 bg-surface-container opacity-60'
                              : isSelected
                                ? 'border-primary/40 bg-surface-high'
                                : 'border-white/10 bg-surface-container hover:bg-surface-high'
                        }`}
                      >
                        <div
                          className="mt-0.5 shrink-0 cursor-pointer"
                          onClick={() => !alreadyLinked && toggleSelect(event.uid)}
                        >
                          {alreadyLinked ? (
                            <CheckCircle2Icon className="size-5 text-emerald-400" />
                          ) : (
                            <div
                              className={`flex size-5 items-center justify-center rounded border-2 ${
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

                        <div
                          className={`flex min-w-0 flex-1 flex-col gap-1 ${!alreadyLinked ? 'cursor-pointer' : ''}`}
                          onClick={() => !alreadyLinked && toggleSelect(event.uid)}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium leading-snug">{event.title}</span>
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

                        {!alreadyLinked && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openLinkPicker(event.uid)
                            }}
                            className={`flex shrink-0 items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors ${
                              isLinking
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                            }`}
                            title="Knytt til eksisterande gig"
                          >
                            {isLinking ? <XIcon className="size-3.5" /> : <LinkIcon className="size-3.5" />}
                            <span className="hidden sm:inline">{isLinking ? 'Avbryt' : 'Link'}</span>
                          </button>
                        )}
                      </div>

                      {isLinking && (
                        <div className="flex flex-col gap-2 rounded-b-lg border border-t-0 border-primary/40 bg-surface-container p-3">
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
                            <p className="py-1 text-xs text-muted-foreground">Ingen gigs funne.</p>
                          ) : (
                            <div className="flex max-h-48 flex-col overflow-y-auto">
                              {filteredGigs.map((gig) => (
                                <button
                                  key={gig.id}
                                  onClick={() => linkToGig(event.uid, gig.id)}
                                  disabled={linking === event.uid}
                                  className="flex items-center justify-between rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-surface-high disabled:opacity-50"
                                >
                                  <span className="truncate">{gig.name}</span>
                                  <span className="ml-3 shrink-0 text-xs text-muted-foreground">{gig.start_date}</span>
                                  {linking === event.uid && <Loader2Icon className="ml-2 size-3 shrink-0 animate-spin" />}
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

              {importStatus === 'done' ? (
                <div className="flex flex-col gap-3">
                  <p className="flex items-center gap-2 text-sm text-emerald-400">
                    <CheckCircle2Icon className="size-4" />
                    {importedGigs.length} gig{importedGigs.length !== 1 ? 's' : ''} oppretta.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {importedGigs.map((gig) => (
                      <Button key={gig.id} asChild variant="outline" size="sm">
                        <Link href={`/dashboard/gigs/${gig.id}`}>{gig.name}</Link>
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
                  {importStatus === 'loading' && <Loader2Icon className="mr-2 size-4 animate-spin" />}
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
