'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { PlusIcon, Trash2Icon, BanIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { createAvailabilityBlock, deleteAvailabilityBlock } from '@/app/actions/availability'
import type { AvailabilityBlock } from '@/types/database'

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatDateRange(from: string, until: string): string {
  const f = parseLocalDate(from)
  const u = parseLocalDate(until)
  if (from === until) return format(f, 'd. MMM yyyy', { locale: nb })
  if (f.getFullYear() === u.getFullYear()) {
    return `${format(f, 'd. MMM', { locale: nb })} – ${format(u, 'd. MMM yyyy', { locale: nb })}`
  }
  return `${format(f, 'd. MMM yyyy', { locale: nb })} – ${format(u, 'd. MMM yyyy', { locale: nb })}`
}

interface Props {
  blocks: AvailabilityBlock[]
}

export default function AvailabilityBlocksManager({ blocks }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState('')
  const [until, setUntil] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]

  function handleFromChange(val: string) {
    setFrom(val)
    if (until && val > until) setUntil(val)
  }

  async function handleAdd() {
    if (!from || !until) {
      setError('Vel frå- og til-dato.')
      return
    }
    setSaving(true)
    setError(null)
    const result = await createAvailabilityBlock(from, until, reason || null)
    setSaving(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setOpen(false)
    setFrom('')
    setUntil('')
    setReason('')
    router.refresh()
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    await deleteAvailabilityBlock(id)
    setDeletingId(null)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      {blocks.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ingen registrerte blokkeringar.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {blocks.map((block) => (
            <li
              key={block.id}
              className="flex items-center justify-between gap-3 rounded-lg bg-surface-container px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <BanIcon className="size-4 text-amber-500 shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">
                    {formatDateRange(block.blocked_from, block.blocked_until)}
                  </span>
                  {block.reason && (
                    <span className="text-xs text-muted-foreground">{block.reason}</span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDelete(block.id)}
                disabled={deletingId === block.id}
                className="text-muted-foreground hover:text-destructive shrink-0"
              >
                <Trash2Icon className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button size="sm" variant="outline" className="w-fit" />}>
          <PlusIcon className="size-4 mr-1.5" />
          Legg til blokk
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Legg til utilgjengelegheit</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Frå</Label>
                <Input
                  type="date"
                  value={from}
                  min={today}
                  onChange={(e) => handleFromChange(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Til</Label>
                <Input
                  type="date"
                  value={until}
                  min={from || today}
                  onChange={(e) => setUntil(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Grunn (valfri)</Label>
              <Input
                placeholder="t.d. Ferie, Sjukdom…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button onClick={handleAdd} disabled={!from || !until || saving}>
              {saving ? 'Lagrar…' : 'Lagra'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
