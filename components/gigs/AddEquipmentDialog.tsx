'use client'

import { useState, useEffect } from 'react'
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
import { buildAllocatedMap, computeAvailability } from '@/lib/gigs/equipment-availability'
import { CompanyBadge } from '@/components/CompanyBadge'

interface Props {
  gigId: string
  gigStartDate: string
  gigEndDate: string
  gigCompanyId: string
  dialogTitle?: string
}

interface EquipmentItem extends Equipment {
  available: number
  company: { id: string; name: string; slug: string } | null
}

// equipmentId → { quantity, existingRowId?, requestStatus? }
type Selections = Map<string, { quantity: number; existingRowId?: string; requestStatus?: string | null }>

export default function AddEquipmentDialog({
  gigId,
  gigStartDate,
  gigEndDate,
  gigCompanyId,
  dialogTitle = 'Utstyr på oppdraget',
}: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<EquipmentItem[]>([])
  const [selections, setSelections] = useState<Selections>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showAllCompanies, setShowAllCompanies] = useState(false)

  useEffect(() => {
    if (!open) return
    async function load() {
      const { data: allEquipment } = await supabase
        .from('equipment')
        .select('*, company:company_id(id, name, slug)')
        .order('category', { nullsFirst: false })
        .order('name')

      if (!allEquipment) return

      const { data: existing } = await supabase
        .from('gig_equipment')
        .select('id, equipment_id, quantity_needed, request_status')
        .eq('gig_id', gigId)

      const existingMap = new Map<string, { id: string; quantity: number; requestStatus: string | null }>()
      existing?.forEach((e) => existingMap.set(e.equipment_id, { id: e.id, quantity: e.quantity_needed, requestStatus: e.request_status ?? null }))

      const { data: allocations } = await supabase
        .from('gig_equipment')
        .select('equipment_id, quantity_needed, gigs!inner(start_date, end_date, deleted_at)')
        .neq('gig_id', gigId)

      const allocatedMap = buildAllocatedMap(allocations ?? [], gigStartDate, gigEndDate)
      const computed = computeAvailability(allEquipment, allocatedMap) as EquipmentItem[]
      // Attach company join (computeAvailability passes through extra fields)
      computed.forEach((item, i) => {
        item.company = (allEquipment[i] as typeof allEquipment[number] & { company: { id: string; name: string; slug: string } | null }).company ?? null
      })
      setItems(computed)

      const init: Selections = new Map()
      existingMap.forEach(({ id, quantity, requestStatus }, equipId) => {
        init.set(equipId, { quantity, existingRowId: id, requestStatus })
      })
      setSelections(init)
    }
    load()
  }, [open, gigId, gigStartDate, gigEndDate, supabase])

  function toggle(item: EquipmentItem) {
    const isCrossCompany = item.company_id !== gigCompanyId
    if (item.available <= 0 && !selections.has(item.id) && !isCrossCompany) return
    setSelections((prev) => {
      const next = new Map(prev)
      if (next.has(item.id)) {
        next.delete(item.id)
      } else {
        next.set(item.id, { quantity: 1 })
      }
      return next
    })
  }

  function setQuantity(id: string, qty: number) {
    setSelections((prev) => {
      const next = new Map(prev)
      const cur = next.get(id)
      if (cur) next.set(id, { ...cur, quantity: Math.max(1, qty) })
      return next
    })
  }

  async function handleSave() {
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()

    const { data: existing } = await supabase
      .from('gig_equipment')
      .select('id, equipment_id, quantity_needed, request_status')
      .eq('gig_id', gigId)

    const existingMap = new Map<string, { id: string; quantity: number; requestStatus: string | null }>()
    existing?.forEach((e) => existingMap.set(e.equipment_id, { id: e.id, quantity: e.quantity_needed, requestStatus: e.request_status ?? null }))

    const itemMap = new Map(items.map((i) => [i.id, i]))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ops: Promise<{ error: any }>[] = []

    selections.forEach(({ quantity }, equipId) => {
      const item = itemMap.get(equipId)
      const isCrossCompany = item ? item.company_id !== gigCompanyId : false
      const ex = existingMap.get(equipId)

      if (!ex) {
        const payload: Record<string, unknown> = {
          gig_id: gigId,
          equipment_id: equipId,
          quantity_needed: quantity,
        }
        if (isCrossCompany && user) {
          payload.request_status = 'pending'
          payload.requested_by = user.id
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ops.push(supabase.from('gig_equipment').insert(payload as any) as unknown as Promise<{ error: any }>)
      } else if (ex.quantity !== quantity) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ops.push(supabase.from('gig_equipment').update({ quantity_needed: quantity }).eq('id', ex.id) as unknown as Promise<{ error: any }>)
      }
    })

    existingMap.forEach(({ id }, equipId) => {
      if (!selections.has(equipId)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ops.push(supabase.from('gig_equipment').delete().eq('id', id) as unknown as Promise<{ error: any }>)
      }
    })

    const results = await Promise.all(ops)
    const failed = results.find((r) => r.error)
    if (failed?.error) {
      setError(typeof failed.error === 'object' && 'message' in failed.error ? failed.error.message : String(failed.error))
    } else {
      setOpen(false)
      router.refresh()
    }
    setLoading(false)
  }

  const q = search.toLowerCase().trim()
  const visibleItems = showAllCompanies
    ? items
    : items.filter((i) => i.company_id === gigCompanyId)

  const filteredItems = q
    ? visibleItems.filter((i) => i.name.toLowerCase().includes(q) || (i.category ?? '').toLowerCase().includes(q))
    : visibleItems

  const categories = [...new Set(filteredItems.map((i) => i.category ?? 'Anna'))].sort()

  const crossCompanySelections = Array.from(selections.keys()).filter((id) => {
    const item = items.find((i) => i.id === id)
    return item && item.company_id !== gigCompanyId
  })

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setSearch(''); setShowAllCompanies(false) } }}>
      <DialogTrigger render={<Button size="sm" variant="outline" aria-label={dialogTitle}><Plus className="size-4" />Legg til</Button>} />
      <DialogContent className="sm:max-w-2xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Input
              placeholder="Søk etter utstyr…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="flex-1"
            />
            <Button
              type="button"
              variant={showAllCompanies ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowAllCompanies((v) => !v)}
            >
              {showAllCompanies ? 'Vis eige utstyr' : 'Vis alt utstyr'}
            </Button>
          </div>

          {crossCompanySelections.length > 0 && (
            <p className="text-xs text-spotlight-gold">
              {crossCompanySelections.length} innlånt utstyr krev godkjenning frå eigarselskapet.
            </p>
          )}

          {/* Scrollable equipment list */}
          <div className="max-h-[60vh] overflow-y-auto flex flex-col gap-5 pr-0.5">
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-10">Laster utstyr…</p>
            )}
            {filteredItems.length === 0 && items.length > 0 && (
              <p className="text-sm text-muted-foreground text-center py-10">Ingen utstyr funne</p>
            )}
            {categories.map((cat) => {
              const catItems = filteredItems.filter((i) => (i.category ?? 'Anna') === cat)
              if (catItems.length === 0) return null
              return (
              <div key={cat}>
                <p className="text-[0.65rem] uppercase tracking-widest text-muted-foreground mb-2 px-1">
                  {cat}
                </p>
                <div className="flex flex-col gap-1">
                  {catItems.map((item) => {
                    const sel = selections.get(item.id)
                    const isSelected = !!sel
                    const isCrossCompany = item.company_id !== gigCompanyId
                    const isPending = sel?.requestStatus === 'pending'
                    const exhausted = item.available <= 0 && !isSelected && !isCrossCompany

                    return (
                      <div
                        key={item.id}
                        onClick={() => toggle(item)}
                        className={[
                          'flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors',
                          isSelected
                            ? 'bg-primary/10 ring-1 ring-inset ring-primary/25'
                            : exhausted
                            ? 'opacity-40 cursor-not-allowed'
                            : 'hover:bg-surface-high cursor-pointer',
                        ].join(' ')}
                      >
                        <div className="flex items-center gap-3">
                          {/* Checkbox */}
                          <div
                            className={[
                              'size-4 rounded-sm border flex items-center justify-center shrink-0 transition-colors',
                              isSelected ? 'bg-primary border-primary' : 'border-white/25',
                            ].join(' ')}
                          >
                            {isSelected && (
                              <svg viewBox="0 0 10 8" className="size-2.5 fill-primary-foreground">
                                <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium leading-tight">{item.name}</p>
                              {isCrossCompany && <CompanyBadge company={item.company} size="xs" />}
                            </div>
                            {isPending ? (
                              <p className="text-xs mt-0.5 text-spotlight-gold">Venter på godkjenning</p>
                            ) : (
                              <p className={`text-xs mt-0.5 ${item.available <= 0 && !isCrossCompany ? 'text-destructive' : 'text-muted-foreground'}`}>
                                {isCrossCompany
                                  ? `${item.available} av ${item.quantity} ledig · krev godkjenning`
                                  : `${item.available} av ${item.quantity} ledig`}
                              </p>
                            )}
                          </div>
                        </div>

                        {isSelected && !isPending && (
                          <div
                            className="flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-xs text-muted-foreground">Antal</span>
                            <Input
                              type="number"
                              min={1}
                              max={isCrossCompany ? undefined : item.available}
                              value={sel.quantity}
                              onChange={(e) => setQuantity(item.id, Number(e.target.value))}
                              className="h-7 w-16 text-center px-1"
                            />
                          </div>
                        )}
                        {isSelected && isPending && (
                          <span className="text-xs text-muted-foreground shrink-0">{sel.quantity} stk</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )})}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex items-center justify-between border-t border-white/8 pt-3">
            <span className="text-xs text-muted-foreground">
              {selections.size} {selections.size === 1 ? 'utstyrstype' : 'utstyrstypar'} valt
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
