'use client'

import { useState, useEffect } from 'react'
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
import type { Profile } from '@/types/database'
import { getDisplayName } from '@/lib/utils'
import { createGigAddedNotification } from '@/app/actions/notifications'
import { buildConflictMap } from '@/lib/gigs/personnel-conflicts'

interface Props {
  gigId: string
  gigStartDate: string
  gigEndDate: string
  currentUserId: string
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
  dialogTitle = 'Legg til teknikar',
}: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [open, setOpen] = useState(false)
  const [personnel, setPersonnel] = useState<PersonWithConflict[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [roleOnGig, setRoleOnGig] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    async function load() {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name')

      if (!profiles) return

      const { data: existing } = await supabase
        .from('gig_personnel')
        .select('profile_id')
        .eq('gig_id', gigId)

      const existingIds = new Set(existing?.map((r) => r.profile_id) ?? [])

      const { data: conflicts } = await supabase
        .from('gig_personnel')
        .select('profile_id, gigs!inner(id, name, start_date, end_date)')
        .neq('gig_id', gigId)

      const conflictMap = buildConflictMap(conflicts ?? [], gigStartDate, gigEndDate)

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

  function togglePerson(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleAdd() {
    if (!selectedIds.size) return
    setLoading(true)
    setError(null)

    const rows = Array.from(selectedIds).map((profileId) => ({
      gig_id: gigId,
      profile_id: profileId,
      role_on_gig: roleOnGig || null,
    }))

    const { error } = await supabase.from('gig_personnel').insert(rows)

    if (error) {
      setError(error.message)
    } else {
      await Promise.all(
        Array.from(selectedIds).map((profileId) =>
          createGigAddedNotification(gigId, profileId, currentUserId).catch(() => {})
        )
      )
      setOpen(false)
      setSelectedIds(new Set())
      setRoleOnGig('')
      setSearch('')
      router.refresh()
    }
    setLoading(false)
  }

  const filtered = personnel.filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    return p.full_name?.toLowerCase().includes(q) || p.nickname?.toLowerCase().includes(q)
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="icon-sm" variant="ghost" aria-label={dialogTitle} />}>
        <Plus className="size-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label>Teknikarar</Label>
            <Input
              placeholder="Søk…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex flex-col gap-0.5 max-h-56 overflow-y-auto rounded-md border border-white/10 p-1">
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground px-2 py-3 text-center">Ingen teknikarar å vise.</p>
              )}
              {filtered.map((p) => {
                const checked = selectedIds.has(p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePerson(p.id)}
                    className={`flex items-center gap-3 rounded px-2 py-1.5 text-left text-sm transition-colors ${
                      checked ? 'bg-surface-highest' : 'hover:bg-surface-high'
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-xs ${
                        checked
                          ? 'border-primary bg-primary text-white'
                          : 'border-white/20'
                      }`}
                    >
                      {checked && '✓'}
                    </span>
                    <span className="flex-1 truncate">{getDisplayName(p, p.id)}</span>
                    {p.hasConflict && (
                      <span className="text-destructive text-xs shrink-0">⚠ konflikt</span>
                    )}
                    {!p.hasConflict && p.hasBlock && (
                      <span className="text-spotlight-gold text-xs shrink-0">⚠ utilgjengeleg</span>
                    )}
                  </button>
                )
              })}
            </div>
            {selectedIds.size > 0 && (
              <p className="text-xs text-muted-foreground">{selectedIds.size} valt</p>
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

          <Button onClick={handleAdd} disabled={!selectedIds.size || loading}>
            {loading ? 'Legg til…' : `Legg til${selectedIds.size > 1 ? ` (${selectedIds.size})` : ''}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
