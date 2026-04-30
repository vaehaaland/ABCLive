'use client'

import { useState, useMemo, useRef } from 'react'
import { toast } from 'sonner'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { updateEquipmentField } from '@/app/dashboard/equipment/actions'
import type { Equipment } from '@/types/database'

export type ActiveBooking = {
  venue: string | null
  start_date: string
  end_date: string
  quantity_needed: number
}

export type EnrichedEquipment = Equipment & { activeBooking: ActiveBooking | null }

type SortKey = 'name' | 'category' | 'quantity' | 'status'
type SortDir = 'asc' | 'desc'
type EditableCol = 'name' | 'category' | 'description' | 'quantity'

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== col) return <ArrowUpDown className="size-3 opacity-35 ml-1.5 shrink-0" />
  return sortDir === 'asc' ? (
    <ArrowUp className="size-3 ml-1.5 shrink-0 text-primary" />
  ) : (
    <ArrowDown className="size-3 ml-1.5 shrink-0 text-primary" />
  )
}

interface EditingCell {
  rowId: string
  col: EditableCol
}

interface Props {
  equipment: EnrichedEquipment[]
}

export function EquipmentTable({ equipment }: Props) {
  const [items, setItems] = useState<EnrichedEquipment[]>(equipment)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [pendingValue, setPendingValue] = useState('')
  const [catFilter, setCatFilter] = useState('Alle')
  const saving = useRef(false)

  const categories = useMemo(
    () => [...new Set(items.map((i) => i.category).filter(Boolean) as string[])].sort(),
    [items],
  )

  const sorted = useMemo(() => {
    const copy = [...items]
    copy.sort((a, b) => {
      let av: string | number
      let bv: string | number
      if (sortKey === 'status') {
        av = a.activeBooking ? 1 : 0
        bv = b.activeBooking ? 1 : 0
      } else if (sortKey === 'quantity') {
        av = a.quantity
        bv = b.quantity
      } else {
        av = ((a[sortKey] as string | null) ?? '').toLowerCase()
        bv = ((b[sortKey] as string | null) ?? '').toLowerCase()
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    if (catFilter !== 'Alle') {
      return copy.filter((item) => item.category === catFilter)
    }
    return copy
  }, [items, sortKey, sortDir, catFilter])

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function startEdit(rowId: string, col: EditableCol, currentValue: string) {
    setEditingCell({ rowId, col })
    setPendingValue(currentValue)
  }

  async function commitEdit() {
    if (!editingCell || saving.current) return
    const { rowId, col } = editingCell
    const item = items.find((i) => i.id === rowId)
    if (!item) return

    const trimmed = col === 'quantity' ? pendingValue : pendingValue.trim()
    const current = String(item[col] ?? '')

    if (trimmed === current) {
      setEditingCell(null)
      return
    }

    const optimisticValue = col === 'quantity' ? Number(trimmed) : trimmed || null
    setItems((prev) => prev.map((i) => (i.id === rowId ? { ...i, [col]: optimisticValue } : i)))
    setEditingCell(null)

    saving.current = true
    const result = await updateEquipmentField(rowId, col, col === 'quantity' ? Number(trimmed) : trimmed)
    saving.current = false

    if (!result.ok) {
      setItems((prev) => prev.map((i) => (i.id === rowId ? { ...i, [col]: item[col] } : i)))
      toast.error(result.error ?? 'Kunne ikkje lagre')
    }
  }

  function cancelEdit() {
    setEditingCell(null)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitEdit()
    }
    if (e.key === 'Escape') cancelEdit()
  }

  return (
    <div>
      <datalist id="equipment-categories">
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      {/* Category chips */}
      <div className="flex flex-wrap gap-1.5 mb-4 px-4 pt-4">
        {['Alle', ...categories].map(cat => (
          <button
            key={cat}
            onClick={() => setCatFilter(cat)}
            className={cn(
              'type-label px-3 py-1.5 rounded-full transition-colors border',
              catFilter === cat
                ? 'bg-primary text-white border-transparent'
                : 'bg-transparent text-muted-foreground border-white/10 hover:text-foreground hover:bg-surface-high'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-white/8 hover:bg-transparent bg-surface-high/50">
            <TableHead
              className="type-micro cursor-pointer select-none text-muted-foreground tracking-[0.06em]"
              onClick={() => handleSort('name')}
            >
              <span className="flex items-center gap-0.5">
                Namn
                <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} />
              </span>
            </TableHead>
            <TableHead
              className="type-micro cursor-pointer select-none w-36 text-muted-foreground tracking-[0.06em]"
              onClick={() => handleSort('category')}
            >
              <span className="flex items-center gap-0.5">
                Kategori
                <SortIcon col="category" sortKey={sortKey} sortDir={sortDir} />
              </span>
            </TableHead>
            <TableHead className="type-micro text-muted-foreground tracking-[0.06em]">Beskriving</TableHead>
            <TableHead
              className="type-micro cursor-pointer select-none w-24 text-muted-foreground tracking-[0.06em]"
              onClick={() => handleSort('quantity')}
            >
              <span className="flex items-center gap-0.5">
                Antal
                <SortIcon col="quantity" sortKey={sortKey} sortDir={sortDir} />
              </span>
            </TableHead>
            <TableHead
              className="type-micro cursor-pointer select-none w-28 text-muted-foreground tracking-[0.06em]"
              onClick={() => handleSort('status')}
            >
              <span className="flex items-center gap-0.5">
                Status
                <SortIcon col="status" sortKey={sortKey} sortDir={sortDir} />
              </span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((item) => {
            const editing = editingCell?.rowId === item.id ? editingCell.col : null

            return (
              <TableRow key={item.id} className="border-white/8">
                {/* Namn */}
                <TableCell>
                  {editing === 'name' ? (
                    <input
                      type="text"
                      value={pendingValue}
                      onChange={(e) => setPendingValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      className="w-full bg-transparent outline-none ring-1 ring-primary/50 rounded px-1.5 py-0.5 text-sm"
                    />
                  ) : (
                    <span
                      onClick={() => startEdit(item.id, 'name', item.name)}
                      className="block w-full cursor-text rounded px-1.5 py-0.5 hover:bg-white/5 text-sm"
                    >
                      {item.name}
                    </span>
                  )}
                </TableCell>

                {/* Kategori */}
                <TableCell>
                  {editing === 'category' ? (
                    <input
                      type="text"
                      list="equipment-categories"
                      value={pendingValue}
                      onChange={(e) => setPendingValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      className="w-full bg-transparent outline-none ring-1 ring-primary/50 rounded px-1.5 py-0.5 text-sm"
                    />
                  ) : (
                    <span
                      onClick={() => startEdit(item.id, 'category', item.category ?? '')}
                      className="block w-full cursor-text rounded px-1.5 py-0.5 hover:bg-white/5 text-sm"
                    >
                      {item.category ?? (
                        <span className="type-label text-muted-foreground/50 italic">—</span>
                      )}
                    </span>
                  )}
                </TableCell>

                {/* Beskriving */}
                <TableCell>
                  {editing === 'description' ? (
                    <input
                      type="text"
                      value={pendingValue}
                      onChange={(e) => setPendingValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      className="w-full bg-transparent outline-none ring-1 ring-primary/50 rounded px-1.5 py-0.5 text-sm"
                    />
                  ) : (
                    <span
                      onClick={() => startEdit(item.id, 'description', item.description ?? '')}
                      className="block w-full cursor-text rounded px-1.5 py-0.5 hover:bg-white/5 text-sm text-muted-foreground truncate max-w-xs"
                      title={item.description ?? undefined}
                    >
                      {item.description ?? (
                        <span className="type-label text-muted-foreground/40 italic">—</span>
                      )}
                    </span>
                  )}
                </TableCell>

                {/* Antal */}
                <TableCell>
                  {editing === 'quantity' ? (
                    <input
                      type="number"
                      min={1}
                      value={pendingValue}
                      onChange={(e) => setPendingValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      className="w-16 bg-transparent outline-none ring-1 ring-primary/50 rounded px-1.5 py-0.5 text-sm text-center"
                    />
                  ) : (
                    <span
                      onClick={() => startEdit(item.id, 'quantity', String(item.quantity))}
                      className="block w-16 cursor-text rounded px-1.5 py-0.5 hover:bg-white/5 text-sm text-center"
                    >
                      {item.quantity}
                    </span>
                  )}
                </TableCell>

                {/* Status */}
                <TableCell>
                  {item.activeBooking !== null ? (
                    <Badge variant="default" className="gap-1.5">
                      <span className="size-1.5 rounded-full bg-primary animate-pulse shrink-0" />
                      På tur
                    </Badge>
                  ) : (
                    <Badge variant="success">Ledig</Badge>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
