'use client'

import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Check, Package } from 'lucide-react'
import { toggleEquipmentPacked } from '@/app/actions/equipment'
import RemoveEquipmentButton from '@/components/gigs/RemoveEquipmentButton'

type EquipmentItem = {
  id: string
  name: string
  category: string | null
  quantity: number
}

type EquipmentRow = {
  id: string
  quantity_needed: number
  notes: string | null
  packed: boolean
  equipment: EquipmentItem | EquipmentItem[] | null
}

interface GigEquipmentListProps {
  initialRows: EquipmentRow[]
  gigId: string
  isAdmin: boolean
  emptyLabel?: string
}

function EquipmentRowItem({
  row,
  gigId,
  isAdmin,
  onOptimisticUpdate,
}: {
  row: EquipmentRow
  gigId: string
  isAdmin: boolean
  onOptimisticUpdate: (id: string, packed: boolean) => void
}) {
  const [isPending, startTransition] = useTransition()
  const item = Array.isArray(row.equipment) ? row.equipment[0] : row.equipment

  function togglePacked() {
    const next = !row.packed
    onOptimisticUpdate(row.id, next)
    startTransition(async () => {
      try {
        await toggleEquipmentPacked(row.id, gigId, next)
      } catch {
        toast.error('Kunne ikkje oppdatere pakka-status')
        onOptimisticUpdate(row.id, row.packed)
      }
    })
  }

  return (
    <li className={`flex items-center justify-between py-1.5 ${isPending ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={togglePacked}
          disabled={isPending}
          title={row.packed ? 'Merk som ikkje pakka' : 'Merk som pakka'}
          className={`h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center transition-all ${
            row.packed
              ? 'bg-green-600 border-green-600 text-white'
              : 'border-border hover:border-primary/50'
          }`}
        >
          {row.packed && <Check className="h-3.5 w-3.5" />}
        </button>
        <div>
          <p className={`text-sm font-medium ${row.packed ? 'text-muted-foreground line-through' : ''}`}>
            {item?.name ?? 'Ukjend'}
          </p>
          <p className="text-xs text-muted-foreground">
            {row.quantity_needed} stk
            {item?.category && ` · ${item.category}`}
          </p>
        </div>
      </div>
      {isAdmin && <RemoveEquipmentButton assignmentId={row.id} />}
    </li>
  )
}

export default function GigEquipmentList({
  initialRows,
  gigId,
  isAdmin,
  emptyLabel = 'Ingen utstyr lagt til.',
}: GigEquipmentListProps) {
  const [rows, setRows] = useState(initialRows)

  useEffect(() => {
    setRows(initialRows)
  }, [initialRows])

  const packedCount = rows.filter(r => r.packed).length
  const total = rows.length

  function optimisticUpdate(id: string, packed: boolean) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, packed } : r))
  }

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>
  }

  return (
    <div>
      {total > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-green-600 transition-all"
              style={{ width: `${Math.round((packedCount / total) * 100)}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
            <Package className="h-3 w-3" />
            {packedCount}/{total}
          </span>
        </div>
      )}
      <ul className="flex flex-col gap-1">
        {rows.map(row => (
          <EquipmentRowItem
            key={row.id}
            row={row}
            gigId={gigId}
            isAdmin={isAdmin}
            onOptimisticUpdate={optimisticUpdate}
          />
        ))}
      </ul>
    </div>
  )
}
