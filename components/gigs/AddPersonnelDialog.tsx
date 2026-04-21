'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import type { Profile } from '@/types/database'
import { createGigAddedNotification } from '@/app/actions/notifications'
import { buildConflictMap } from '@/lib/gigs/personnel-conflicts'

interface Props {
  gigId: string
  gigStartDate: string
  gigEndDate: string
  currentUserId: string
  buttonLabel?: string
  dialogTitle?: string
}

interface PersonWithConflict extends Profile {
  hasConflict: boolean
  conflictGigName?: string
  hasBlock: boolean
  blockFrom?: string
  blockUntil?: string
  blockReason?: string | null
}

export default function AddPersonnelDialog({
  gigId,
  gigStartDate,
  gigEndDate,
  currentUserId,
  buttonLabel = 'Legg til teknikar',
  dialogTitle = 'Legg til teknikar',
}: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [open, setOpen] = useState(false)
  const [personnel, setPersonnel] = useState<PersonWithConflict[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [roleOnGig, setRoleOnGig] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    async function load() {
      // Get all technicians
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name')

      if (!profiles) return

      // Get already-added personnel for this gig
      const { data: existing } = await supabase
        .from('gig_personnel')
        .select('profile_id')
        .eq('gig_id', gigId)

      const existingIds = new Set(existing?.map((r) => r.profile_id) ?? [])

      // Check conflicts: other gigs overlapping this date range
      const { data: conflicts } = await supabase
        .from('gig_personnel')
        .select('profile_id, gigs!inner(id, name, start_date, end_date)')
        .neq('gig_id', gigId)

      const conflictMap = buildConflictMap(conflicts ?? [], gigStartDate, gigEndDate)

      // Check availability blocks overlapping the gig date range
      const { data: blocks } = await supabase
        .from('availability_blocks')
        .select('profile_id, blocked_from, blocked_until, reason')
        .lte('blocked_from', gigEndDate)
        .gte('blocked_until', gigStartDate)

      const blockMap = new Map<string, { blocked_from: string; blocked_until: string; reason: string | null }>()
      blocks?.forEach((b) => {
        if (!blockMap.has(b.profile_id)) {
          blockMap.set(b.profile_id, { blocked_from: b.blocked_from, blocked_until: b.blocked_until, reason: b.reason })
        }
      })

      const withConflicts: PersonWithConflict[] = profiles
        .filter((p) => !existingIds.has(p.id))
        .map((p) => {
          const block = blockMap.get(p.id)
          return {
            ...p,
            hasConflict: conflictMap.has(p.id),
            conflictGigName: conflictMap.get(p.id),
            hasBlock: !!block,
            blockFrom: block?.blocked_from,
            blockUntil: block?.blocked_until,
            blockReason: block?.reason,
          }
        })

      setPersonnel(withConflicts)
    }
    load()
  }, [open, gigId, gigStartDate, gigEndDate, supabase])

  async function handleAdd() {
    if (!selectedId) return
    setLoading(true)
    setError(null)

    const { error } = await supabase.from('gig_personnel').insert({
      gig_id: gigId,
      profile_id: selectedId,
      role_on_gig: roleOnGig || null,
    })

    if (error) {
      setError(error.message)
    } else {
      createGigAddedNotification(gigId, selectedId, currentUserId).catch(() => {})
      setOpen(false)
      setSelectedId('')
      setRoleOnGig('')
      router.refresh()
    }
    setLoading(false)
  }

  const selected = personnel.find((p) => p.id === selectedId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button size="sm" />}>
        {buttonLabel}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label>Teknikar</Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="w-full">
                {selectedId
                  ? <span className="flex-1 text-left text-sm truncate">{selected?.full_name ?? selectedId}</span>
                  : <span className="flex-1 text-left text-sm text-muted-foreground">Vel ein teknikar…</span>
                }
              </SelectTrigger>
              <SelectContent>
                {personnel.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span>{p.full_name ?? p.id}</span>
                    {p.hasConflict && (
                      <span className="ml-2 text-destructive text-xs">⚠ konflikt</span>
                    )}
                    {!p.hasConflict && p.hasBlock && (
                      <span className="ml-2 text-amber-500 text-xs">⚠ utilgjengeleg</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selected?.hasConflict && (
              <p className="text-sm text-destructive">
                ⚠ {selected.full_name} er allereie booka på «{selected.conflictGigName}» i same periode.
              </p>
            )}
            {!selected?.hasConflict && selected?.hasBlock && (
              <p className="text-sm text-amber-500">
                ⚠ {selected.full_name} har markert seg som utilgjengeleg {selected.blockFrom === selected.blockUntil ? `${selected.blockFrom}` : `${selected.blockFrom} – ${selected.blockUntil}`}{selected.blockReason ? ` (${selected.blockReason})` : ''}.
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Rolle på oppdraget</Label>
            <Input
              placeholder="t.d. Lydtekniker, Sceneriggar…"
              value={roleOnGig}
              onChange={(e) => setRoleOnGig(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={handleAdd} disabled={!selectedId || loading}>
            {loading ? 'Legg til…' : 'Legg til'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
