'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { Equipment } from '@/types/database'

interface Props {
  programItemId: string
  parentGigId: string
  gigStartDate: string
  gigEndDate: string
  itemStartAt: string
  itemEndAt: string
}

interface EquipmentItem extends Equipment {
  parentPoolQuantity: number
  overlappingFestivalUsage: number
  externalAllocated: number
}

type SelectionMap = Map<string, number>

type AllocationWindow = {
  equipmentId: string
  quantity: number
  startAt: string
  endAt: string
}

function intervalsOverlap(startA: string, endA: string, startB: string, endB: string) {
  return new Date(startA).getTime() < new Date(endB).getTime()
    && new Date(endA).getTime() > new Date(startB).getTime()
}

function buildPeakUsageMap(rows: AllocationWindow[]) {
  const grouped = new Map<string, { at: number; delta: number }[]>()

  for (const row of rows) {
    const events = grouped.get(row.equipmentId) ?? []
    events.push({ at: new Date(row.startAt).getTime(), delta: row.quantity })
    events.push({ at: new Date(row.endAt).getTime(), delta: -row.quantity })
    grouped.set(row.equipmentId, events)
  }

  const peaks = new Map<string, number>()

  grouped.forEach((events, equipmentId) => {
    const sorted = [...events].sort((a, b) => {
      if (a.at !== b.at) return a.at - b.at
      return a.delta - b.delta
    })

    let current = 0
    let peak = 0

    for (const event of sorted) {
      current += event.delta
      peak = Math.max(peak, current)
    }

    peaks.set(equipmentId, peak)
  })

  return peaks
}

export default function AddProgramItemEquipmentDialog({
  programItemId,
  parentGigId,
  gigStartDate,
  gigEndDate,
  itemStartAt,
  itemEndAt,
}: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<EquipmentItem[]>([])
  const [selections, setSelections] = useState<SelectionMap>(new Map())
  const [festivalRows, setFestivalRows] = useState<AllocationWindow[]>([])
  const [parentPoolMap, setParentPoolMap] = useState<Map<string, { rowId?: string; quantity: number }>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!open) return

    async function load() {
      const [
        { data: allEquipment },
        { data: existingRows },
        { data: parentPoolRows },
        { data: siblingRows },
        { data: externalRows },
      ] = await Promise.all([
        supabase
          .from('equipment')
          .select('*')
          .order('category', { nullsFirst: false })
          .order('name'),
        supabase
          .from('gig_program_item_equipment')
          .select('equipment_id, quantity_needed')
          .eq('program_item_id', programItemId),
        supabase
          .from('gig_equipment')
          .select('id, equipment_id, quantity_needed')
          .eq('gig_id', parentGigId),
        supabase
          .from('gig_program_item_equipment')
          .select('equipment_id, quantity_needed, gig_program_items!inner(id, gig_id, start_at, end_at)')
          .neq('program_item_id', programItemId),
        supabase
          .from('gig_equipment')
          .select('equipment_id, quantity_needed, gigs!inner(id, start_date, end_date)')
          .neq('gig_id', parentGigId),
      ])

      if (!allEquipment) return

      const nextSelections: SelectionMap = new Map()
      for (const row of existingRows ?? []) {
        nextSelections.set(row.equipment_id, row.quantity_needed)
      }
      setSelections(nextSelections)

      const nextParentPoolMap = new Map<string, { rowId?: string; quantity: number }>()
      for (const row of parentPoolRows ?? []) {
        nextParentPoolMap.set(row.equipment_id, { rowId: row.id, quantity: row.quantity_needed })
      }
      setParentPoolMap(nextParentPoolMap)

      const allFestivalRows: AllocationWindow[] = []
      const overlappingUsageMap = new Map<string, number>()

      for (const row of siblingRows ?? []) {
        const item = Array.isArray(row.gig_program_items) ? row.gig_program_items[0] : row.gig_program_items
        if (!item || item.gig_id !== parentGigId) continue

        allFestivalRows.push({
          equipmentId: row.equipment_id,
          quantity: row.quantity_needed,
          startAt: item.start_at,
          endAt: item.end_at,
        })

        if (intervalsOverlap(itemStartAt, itemEndAt, item.start_at, item.end_at)) {
          const current = overlappingUsageMap.get(row.equipment_id) ?? 0
          overlappingUsageMap.set(row.equipment_id, current + row.quantity_needed)
        }
      }

      setFestivalRows(allFestivalRows)

      const externalAllocatedMap = new Map<string, number>()
      for (const row of externalRows ?? []) {
        const gig = Array.isArray(row.gigs) ? row.gigs[0] : row.gigs
        if (!gig) continue
        if (gig.start_date <= gigEndDate && gig.end_date >= gigStartDate) {
          const current = externalAllocatedMap.get(row.equipment_id) ?? 0
          externalAllocatedMap.set(row.equipment_id, current + row.quantity_needed)
        }
      }

      setItems(
        allEquipment.map((item) => ({
          ...item,
          parentPoolQuantity: nextParentPoolMap.get(item.id)?.quantity ?? 0,
          overlappingFestivalUsage: overlappingUsageMap.get(item.id) ?? 0,
          externalAllocated: externalAllocatedMap.get(item.id) ?? 0,
        }))
      )
    }

    load()
  }, [open, programItemId, parentGigId, gigStartDate, gigEndDate, itemStartAt, itemEndAt, supabase])

  function toggle(item: EquipmentItem) {
    setSelections((prev) => {
      const next = new Map(prev)
      if (next.has(item.id)) {
        next.delete(item.id)
      } else {
        next.set(item.id, 1)
      }
      return next
    })
  }

  function setQuantity(id: string, quantity: number) {
    setSelections((prev) => {
      const next = new Map(prev)
      if (next.has(id)) {
        next.set(id, Math.max(1, quantity || 1))
      }
      return next
    })
  }

  async function handleSave() {
    setLoading(true)
    setError(null)

    const nextFestivalRows = [...festivalRows]
    selections.forEach((quantity, equipmentId) => {
      nextFestivalRows.push({
        equipmentId,
        quantity,
        startAt: itemStartAt,
        endAt: itemEndAt,
      })
    })

    const peakUsageMap = buildPeakUsageMap(nextFestivalRows)

    for (const item of items) {
      const peakUsage = peakUsageMap.get(item.id) ?? 0
      const requiredPool = Math.max(item.parentPoolQuantity, peakUsage)
      const globalAvailableForFestival = item.quantity - item.externalAllocated

      if (requiredPool > globalAvailableForFestival && requiredPool > item.parentPoolQuantity) {
        setError(`Ikkje nok ${item.name} på lager for festivalpoolen.`)
        setLoading(false)
        return
      }
    }

    const poolOperations: Promise<{ error: { message: string } | null }>[] = []

    for (const item of items) {
      const peakUsage = peakUsageMap.get(item.id) ?? 0
      const existingPool = parentPoolMap.get(item.id)

      if (peakUsage <= 0 || (existingPool?.quantity ?? 0) >= peakUsage) continue

      if (existingPool?.rowId) {
        poolOperations.push(
          supabase
            .from('gig_equipment')
            .update({ quantity_needed: peakUsage })
            .eq('id', existingPool.rowId)
        )
      } else {
        poolOperations.push(
          supabase
            .from('gig_equipment')
            .insert({
              gig_id: parentGigId,
              equipment_id: item.id,
              quantity_needed: peakUsage,
            })
        )
      }
    }

    const poolResults = await Promise.all(poolOperations)
    const poolFailure = poolResults.find((result) => result.error)
    if (poolFailure?.error) {
      setError(poolFailure.error.message)
      setLoading(false)
      return
    }

    const { data: existingRows } = await supabase
      .from('gig_program_item_equipment')
      .select('id, equipment_id, quantity_needed')
      .eq('program_item_id', programItemId)

    const existingMap = new Map<string, { rowId: string; quantity: number }>()
    for (const row of existingRows ?? []) {
      existingMap.set(row.equipment_id, { rowId: row.id, quantity: row.quantity_needed })
    }

    const itemOperations: Promise<{ error: { message: string } | null }>[] = []

    selections.forEach((quantity, equipmentId) => {
      const existing = existingMap.get(equipmentId)
      if (!existing) {
        itemOperations.push(
          supabase
            .from('gig_program_item_equipment')
            .insert({
              program_item_id: programItemId,
              equipment_id: equipmentId,
              quantity_needed: quantity,
            })
        )
      } else if (existing.quantity !== quantity) {
        itemOperations.push(
          supabase
            .from('gig_program_item_equipment')
            .update({ quantity_needed: quantity })
            .eq('id', existing.rowId)
        )
      }
    })

    existingMap.forEach((existing, equipmentId) => {
      if (!selections.has(equipmentId)) {
        itemOperations.push(
          supabase
            .from('gig_program_item_equipment')
            .delete()
            .eq('id', existing.rowId)
        )
      }
    })

    const itemResults = await Promise.all(itemOperations)
    const itemFailure = itemResults.find((result) => result.error)

    if (itemFailure?.error) {
      setError(itemFailure.error.message)
      setLoading(false)
      return
    }

    setOpen(false)
    router.refresh()
    setLoading(false)
  }

  const q = search.toLowerCase().trim()
  const filteredItems = q
    ? items.filter((item) =>
        item.name.toLowerCase().includes(q) || (item.category ?? '').toLowerCase().includes(q)
      )
    : items

  const categories = [...new Set(filteredItems.map((item) => item.category ?? 'Anna'))].sort()

  return (
    <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) setSearch('') }}>
      <DialogTrigger render={<Button size="sm" variant="outline" aria-label="Legg til utstyr"><Plus className="size-4" />Legg til</Button>} />
      <DialogContent className="sm:max-w-2xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Utstyr på programpost</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Input
            placeholder="Søk etter utstyr…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />

          <div className="max-h-[60vh] overflow-y-auto pr-0.5">
            <div className="flex flex-col gap-5">
              {filteredItems.length === 0 && (
                <p className="py-10 text-center text-sm text-muted-foreground">Ingen utstyr funne</p>
              )}

              {categories.map((category) => {
                const categoryItems = filteredItems.filter((item) => (item.category ?? 'Anna') === category)
                if (categoryItems.length === 0) return null

                return (
                  <div key={category}>
                    <p className="mb-2 px-1 text-[0.65rem] uppercase tracking-widest text-muted-foreground">
                      {category}
                    </p>
                    <div className="flex flex-col gap-1">
                      {categoryItems.map((item) => {
                        const selectedQuantity = selections.get(item.id)
                        const isSelected = selectedQuantity != null
                        const globalAvailableForFestival = Math.max(0, item.quantity - item.externalAllocated)

                        return (
                          <div
                            key={item.id}
                            onClick={() => toggle(item)}
                            className={[
                              'flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors',
                              isSelected
                                ? 'bg-primary/10 ring-1 ring-inset ring-primary/25'
                                : 'hover:bg-surface-high cursor-pointer',
                            ].join(' ')}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={[
                                  'flex size-4 shrink-0 items-center justify-center rounded-sm border transition-colors',
                                  isSelected ? 'border-primary bg-primary' : 'border-white/25',
                                ].join(' ')}
                              >
                                {isSelected && (
                                  <svg viewBox="0 0 10 8" className="size-2.5 fill-primary-foreground">
                                    <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>

                              <div>
                                <p className="text-sm font-medium leading-tight">{item.name}</p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  Festivalpool {item.parentPoolQuantity} stk · opptatt no {item.overlappingFestivalUsage} stk
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Lager tilgjengeleg for festivalen {globalAvailableForFestival} av {item.quantity} stk
                                </p>
                              </div>
                            </div>

                            {isSelected && (
                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <span className="text-xs text-muted-foreground">Antal</span>
                                <Input
                                  type="number"
                                  min={1}
                                  value={selectedQuantity}
                                  onChange={(e) => setQuantity(item.id, Number(e.target.value))}
                                  className="h-7 w-16 px-1 text-center"
                                />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex items-center justify-between border-t border-white/8 pt-3">
            <span className="text-xs text-muted-foreground">
              Utstyr som blir lagt til her blir automatisk reservert på festivalnivå ved behov.
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Avbryt
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Lagrar…' : 'Lagre'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
