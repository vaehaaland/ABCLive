'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { GigProgramItem } from '@/types/database'

interface ProgramItemDialogProps {
  gigId: string
  festivalStartDate: string
  festivalEndDate: string
  item?: GigProgramItem
}

function toDateTimeInputValue(value: string) {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function getDefaultStart(startDate: string) {
  return `${startDate}T12:00`
}

function getDefaultEnd(startDate: string) {
  return `${startDate}T13:00`
}

export default function ProgramItemDialog({
  gigId,
  festivalStartDate,
  festivalEndDate,
  item,
}: ProgramItemDialogProps) {
  const router = useRouter()
  const supabase = createClient()

  const [open, setOpen] = useState(false)
  const [name, setName] = useState(item?.name ?? '')
  const [venue, setVenue] = useState(item?.venue ?? '')
  const [startAt, setStartAt] = useState(item?.start_at ? toDateTimeInputValue(item.start_at) : getDefaultStart(festivalStartDate))
  const [endAt, setEndAt] = useState(item?.end_at ? toDateTimeInputValue(item.end_at) : getDefaultEnd(festivalStartDate))
  const [description, setDescription] = useState(item?.description ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const startDate = startAt.slice(0, 10)
    const endDate = endAt.slice(0, 10)

    if (startAt >= endAt) {
      setError('Slutttid må vere etter starttid.')
      setLoading(false)
      return
    }

    if (startDate < festivalStartDate || endDate > festivalEndDate) {
      setError('Programposten må vere innanfor festivalperioden.')
      setLoading(false)
      return
    }

    const payload = {
      gig_id: gigId,
      name,
      venue: venue || null,
      start_at: startAt,
      end_at: endAt,
      description: description || null,
    }

    const result = item
      ? await supabase.from('gig_program_items').update(payload).eq('id', item.id)
      : await supabase.from('gig_program_items').insert(payload)

    if (result.error) {
      setError(result.error.message)
      setLoading(false)
      return
    }

    setOpen(false)
    router.refresh()
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size={item ? 'sm' : 'default'} variant={item ? 'outline' : 'default'} />}>
        {item ? 'Endre post' : 'Ny programpost'}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{item ? 'Endre programpost' : 'Ny programpost'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="program-item-name">Namn *</Label>
            <Input
              id="program-item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="program-item-venue">Venue</Label>
            <Input
              id="program-item-venue"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="program-item-start">Start *</Label>
              <Input
                id="program-item-start"
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                min={`${festivalStartDate}T00:00`}
                max={`${festivalEndDate}T23:59`}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="program-item-end">Slutt *</Label>
              <Input
                id="program-item-end"
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                min={startAt}
                max={`${festivalEndDate}T23:59`}
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="program-item-description">Beskriving</Label>
            <Textarea
              id="program-item-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Lagrar…' : item ? 'Lagre endringer' : 'Opprett post'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Avbryt
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
