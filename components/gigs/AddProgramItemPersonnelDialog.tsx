'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
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
import { getDisplayName } from '@/lib/utils'

interface Props {
  programItemId: string
  parentGigId: string
  itemStartAt: string
  itemEndAt: string
}

interface PersonWithConflict extends Profile {
  hasConflict: boolean
  conflictLabel?: string
}

function intervalsOverlap(startA: string, endA: string, startB: string, endB: string) {
  return new Date(startA).getTime() < new Date(endB).getTime()
    && new Date(endA).getTime() > new Date(startB).getTime()
}

export default function AddProgramItemPersonnelDialog({
  programItemId,
  parentGigId,
  itemStartAt,
  itemEndAt,
}: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [open, setOpen] = useState(false)
  const [personnel, setPersonnel] = useState<PersonWithConflict[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [roleOnItem, setRoleOnItem] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    async function load() {
      const startDate = itemStartAt.slice(0, 10)
      const endDate = itemEndAt.slice(0, 10)

      const [
        { data: profiles },
        { data: existing },
        { data: gigConflicts },
        { data: itemConflicts },
      ] = await Promise.all([
        supabase.from('profiles').select('*').order('full_name'),
        supabase.from('gig_program_item_personnel').select('profile_id').eq('program_item_id', programItemId),
        supabase
          .from('gig_personnel')
          .select('profile_id, gigs!inner(id, name, start_date, end_date)')
          .neq('gig_id', parentGigId),
        supabase
          .from('gig_program_item_personnel')
          .select('profile_id, gig_program_items!inner(id, gig_id, name, start_at, end_at)')
          .neq('program_item_id', programItemId),
      ])

      if (!profiles) return

      const existingIds = new Set(existing?.map((row) => row.profile_id) ?? [])
      const conflictMap = new Map<string, string>()

      for (const row of gigConflicts ?? []) {
        const gig = Array.isArray(row.gigs) ? row.gigs[0] : row.gigs
        if (!gig) continue
        if (gig.start_date <= endDate && gig.end_date >= startDate) {
          conflictMap.set(row.profile_id, gig.name)
        }
      }

      for (const row of itemConflicts ?? []) {
        const otherItem = Array.isArray(row.gig_program_items) ? row.gig_program_items[0] : row.gig_program_items
        if (!otherItem) continue
        if (intervalsOverlap(itemStartAt, itemEndAt, otherItem.start_at, otherItem.end_at)) {
          conflictMap.set(row.profile_id, otherItem.name)
        }
      }

      setPersonnel(
        profiles
          .filter((profile) => !existingIds.has(profile.id))
          .map((profile) => ({
            ...profile,
            hasConflict: conflictMap.has(profile.id),
            conflictLabel: conflictMap.get(profile.id),
          }))
      )
    }

    load()
  }, [open, programItemId, parentGigId, itemStartAt, itemEndAt, supabase])

  async function handleAdd() {
    if (!selectedId) return
    setLoading(true)
    setError(null)

    const { error: insertError } = await supabase.from('gig_program_item_personnel').insert({
      program_item_id: programItemId,
      profile_id: selectedId,
      role_on_item: roleOnItem || null,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    setOpen(false)
    setSelectedId('')
    setRoleOnItem('')
    router.refresh()
    setLoading(false)
  }

  const selected = personnel.find((person) => person.id === selectedId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" aria-label="Legg til teknikar"><Plus className="size-4" />Legg til</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Teknikar på programpost</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label>Teknikar</Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="w-full">
                {selectedId
                  ? <span className="flex-1 truncate text-left text-sm">{getDisplayName(selected, selectedId)}</span>
                  : <span className="flex-1 text-left text-sm text-muted-foreground">Vel ein teknikar…</span>
                }
              </SelectTrigger>
              <SelectContent>
                {personnel.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    <span>{getDisplayName(person, person.id)}</span>
                    {person.hasConflict && (
                      <span className="ml-2 type-label text-destructive">⚠ konflikt</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selected?.hasConflict && (
              <p className="text-sm text-destructive">
                ⚠ {getDisplayName(selected)} har allereie eit overlappande oppdrag eller programpost: «{selected.conflictLabel}».
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Rolle på posten</Label>
            <Input
              placeholder="t.d. FOH, monitor, sceneskift…"
              value={roleOnItem}
              onChange={(e) => setRoleOnItem(e.target.value)}
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

