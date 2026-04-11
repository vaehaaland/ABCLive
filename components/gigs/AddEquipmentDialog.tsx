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
import type { Equipment } from '@/types/database'

interface Props {
  gigId: string
  gigStartDate: string
  gigEndDate: string
}

interface EquipmentWithAvailability extends Equipment {
  available: number
}

export default function AddEquipmentDialog({ gigId, gigStartDate, gigEndDate }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<EquipmentWithAvailability[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [quantityNeeded, setQuantityNeeded] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    async function load() {
      const { data: allEquipment } = await supabase
        .from('equipment')
        .select('*')
        .order('name')

      if (!allEquipment) return

      // Get all equipment allocations for overlapping gigs (excluding this gig)
      const { data: allocations } = await supabase
        .from('gig_equipment')
        .select('equipment_id, quantity_needed, gigs!inner(start_date, end_date)')
        .neq('gig_id', gigId)

      // Sum up allocated quantities per equipment for conflicting date ranges
      const allocatedMap = new Map<string, number>()
      allocations?.forEach((a) => {
        const gigs = Array.isArray(a.gigs) ? a.gigs : [a.gigs]
        gigs.forEach((g: { start_date: string; end_date: string }) => {
          if (g.start_date <= gigEndDate && g.end_date >= gigStartDate) {
            const current = allocatedMap.get(a.equipment_id) ?? 0
            allocatedMap.set(a.equipment_id, current + a.quantity_needed)
          }
        })
      })

      const withAvailability: EquipmentWithAvailability[] = allEquipment.map((eq) => ({
        ...eq,
        available: eq.quantity - (allocatedMap.get(eq.id) ?? 0),
      }))

      setItems(withAvailability)
    }
    load()
  }, [open, gigId, gigStartDate, gigEndDate])

  async function handleAdd() {
    if (!selectedId) return
    setLoading(true)
    setError(null)

    const { error } = await supabase.from('gig_equipment').insert({
      gig_id: gigId,
      equipment_id: selectedId,
      quantity_needed: quantityNeeded,
    })

    if (error) {
      setError(error.message)
    } else {
      setOpen(false)
      setSelectedId('')
      setQuantityNeeded(1)
      router.refresh()
    }
    setLoading(false)
  }

  const selected = items.find((i) => i.id === selectedId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Legg til utstyr</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Legg til utstyr</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label>Utstyr</Label>
            <Select value={selectedId} onValueChange={(v) => { setSelectedId(v); setQuantityNeeded(1) }}>
              <SelectTrigger>
                <SelectValue placeholder="Vel utstyr…" />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id} disabled={item.available <= 0}>
                    <span>{item.name}</span>
                    <span className={`ml-2 text-xs ${item.available <= 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      ({item.available} av {item.quantity} ledig)
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selected && selected.available <= 0 && (
              <p className="text-sm text-destructive">⚠ Ingen ledige einingar i denne perioden.</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Antal</Label>
            <Input
              type="number"
              min={1}
              max={selected?.available ?? 1}
              value={quantityNeeded}
              onChange={(e) => setQuantityNeeded(Number(e.target.value))}
            />
            {selected && quantityNeeded > selected.available && (
              <p className="text-sm text-destructive">
                Berre {selected.available} tilgjengeleg.
              </p>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            onClick={handleAdd}
            disabled={!selectedId || loading || (selected ? quantityNeeded > selected.available : false)}
          >
            {loading ? 'Legg til…' : 'Legg til'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
