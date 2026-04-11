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
  SelectValue,
} from '@/components/ui/select'
import type { Profile } from '@/types/database'

interface Props {
  gigId: string
  gigStartDate: string
  gigEndDate: string
}

interface PersonWithConflict extends Profile {
  hasConflict: boolean
  conflictGigName?: string
}

export default function AddPersonnelDialog({ gigId, gigStartDate, gigEndDate }: Props) {
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

      const conflictMap = new Map<string, string>()
      conflicts?.forEach((c) => {
        const gigs = Array.isArray(c.gigs) ? c.gigs : [c.gigs]
        gigs.forEach((g: { id: string; name: string; start_date: string; end_date: string }) => {
          if (g.start_date <= gigEndDate && g.end_date >= gigStartDate) {
            conflictMap.set(c.profile_id, g.name)
          }
        })
      })

      const withConflicts: PersonWithConflict[] = profiles
        .filter((p) => !existingIds.has(p.id))
        .map((p) => ({
          ...p,
          hasConflict: conflictMap.has(p.id),
          conflictGigName: conflictMap.get(p.id),
        }))

      setPersonnel(withConflicts)
    }
    load()
  }, [open, gigId, gigStartDate, gigEndDate])

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
      <DialogTrigger asChild>
        <Button size="sm">Legg til teknikar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Legg til teknikar</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label>Teknikar</Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger>
                <SelectValue placeholder="Vel ein teknikar…" />
              </SelectTrigger>
              <SelectContent>
                {personnel.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span>{p.full_name ?? p.id}</span>
                    {p.hasConflict && (
                      <span className="ml-2 text-destructive text-xs">⚠ konflikt</span>
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
