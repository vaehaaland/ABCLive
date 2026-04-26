'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Gig, GigStatus, GigType } from '@/types/database'

interface Company {
  id: string
  name: string
  slug: string
}

interface GigFormProps {
  gig?: Gig
  isAdmin?: boolean
  companies?: Company[]
  defaultCompanyId?: string
}

export default function GigForm({ gig, isAdmin, companies = [], defaultCompanyId }: GigFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState(gig?.name ?? '')
  const [gigType, setGigType] = useState<GigType>((gig?.gig_type ?? 'single') as GigType)
  const [companyId, setCompanyId] = useState<string>(
    gig?.company_id ?? defaultCompanyId ?? companies[0]?.id ?? ''
  )
  const [venue, setVenue] = useState(gig?.venue ?? '')
  const [client, setClient] = useState(gig?.client ?? '')
  const [startDate, setStartDate] = useState(gig?.start_date ?? '')
  const [endDate, setEndDate] = useState(gig?.end_date ?? '')
  const [description, setDescription] = useState(gig?.description ?? '')
  const [status, setStatus] = useState<GigStatus>((gig?.status ?? 'draft') as GigStatus)
  const [price, setPrice] = useState<string>(gig?.price != null ? String(gig.price) : '')
  const [priceNotes, setPriceNotes] = useState(gig?.price_notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const payload = {
      gig_type: gigType,
      name, venue, client, start_date: startDate, end_date: endDate, description, status,
      ...(isAdmin && {
        price: price ? parseFloat(price) : null,
        price_notes: priceNotes || null,
      }),
    }

    let result
    if (gig) {
      result = await supabase
        .from('gigs')
        .update(payload)
        .eq('id', gig.id)
        .select('id, gig_type')
        .single()
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      result = await supabase
        .from('gigs')
        .insert({ ...payload, company_id: companyId, created_by: user!.id })
        .select('id, gig_type')
        .single()
    }

    if (result.error) {
      setError(result.error.message)
      setLoading(false)
    } else {
      router.push(`/dashboard/gigs/${result.data.id}`)
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {!gig && companies.length > 1 && (
        <div className="grid gap-2">
          <Label htmlFor="company_id">Selskap</Label>
          <Select value={companyId} onValueChange={(v) => { if (v) setCompanyId(v) }}>
            <SelectTrigger id="company_id">
              <SelectValue>
                {companies.find((c) => c.id === companyId)?.name ?? ''}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="name">Namn *</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="gig_type">Type</Label>
        <Select value={gigType} onValueChange={(value) => setGigType(value as GigType)}>
          <SelectTrigger id="gig_type">
            <SelectValue>
              {gigType === 'festival' ? 'Festival' : 'Enkelt Arrangement'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="single">Enkelt Arrangement</SelectItem>
            <SelectItem value="festival">Festival</SelectItem>
          </SelectContent>
        </Select>
        {gigType === 'festival' && (
          <p className="text-xs text-muted-foreground">
            Programmet blir lagt inn etter at festivalen er oppretta.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="venue">{gigType === 'festival' ? 'Festivalvenue' : 'Venue'}</Label>
          <Input id="venue" value={venue} onChange={(e) => setVenue(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="client">Klient</Label>
          <Input id="client" value={client} onChange={(e) => setClient(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="start_date">{gigType === 'festival' ? 'Festivalstart *' : 'Startdato *'}</Label>
          <Input id="start_date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="end_date">{gigType === 'festival' ? 'Festivalslutt *' : 'Sluttdato *'}</Label>
          <Input id="end_date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required min={startDate} />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="status">Status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as GigStatus)}>
          <SelectTrigger id="status">
            <SelectValue>
              {status === 'confirmed' ? 'Bekrefta' : status === 'completed' ? 'Fullført' : status === 'cancelled' ? 'Avlyst' : 'Utkast'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Utkast</SelectItem>
            <SelectItem value="confirmed">Bekrefta</SelectItem>
            <SelectItem value="completed">Fullført</SelectItem>
            <SelectItem value="cancelled">Avlyst</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Beskriving</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      </div>

      {isAdmin && (
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="price">Pris (NOK)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="price_notes">Prisnotat</Label>
            <Input
              id="price_notes"
              value={priceNotes}
              onChange={(e) => setPriceNotes(e.target.value)}
              placeholder="t.d. inkl. MVA"
            />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Lagrar…' : gig ? 'Lagre endringer' : 'Opprett arrangement'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Avbryt
        </Button>
      </div>
    </form>
  )
}
