import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Equipment } from '@/types/database'

export type ActiveBooking = {
  venue: string | null
  start_date: string
  end_date: string
  quantity_needed: number
}

export type EnrichedEquipment = Equipment & {
  activeBooking: ActiveBooking | null
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  Audio:    'from-violet-900/70 to-violet-950',
  Lighting: 'from-amber-900/70 to-amber-950',
  Visuals:  'from-blue-900/70 to-blue-950',
  Truss:    'from-emerald-900/70 to-emerald-950',
}

const CATEGORY_ICONS: Record<string, string> = {
  Audio:    '🔊',
  Lighting: '💡',
  Visuals:  '📽️',
  Truss:    '🏗️',
}

function getCategoryKey(category: string | null): string {
  if (!category) return ''
  for (const key of Object.keys(CATEGORY_GRADIENTS)) {
    if (category.toLowerCase().startsWith(key.toLowerCase())) return key
  }
  return ''
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('no-NO', { day: 'numeric', month: 'short' })
}

function getTimelinePercent(start: string, end: string): { left: number; width: number } {
  const now = Date.now()
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  const total = e - s || 1
  const elapsed = Math.min(Math.max(now - s, 0), total)
  return {
    left: 0,
    width: Math.round((elapsed / total) * 100),
  }
}

export function EquipmentCard({ item }: { item: EnrichedEquipment }) {
  const catKey = getCategoryKey(item.category)
  const gradient = CATEGORY_GRADIENTS[catKey] ?? 'from-surface-high to-surface-container'
  const icon = CATEGORY_ICONS[catKey] ?? '📦'

  const categoryPrefix = (item.category ?? 'GEN').slice(0, 3).toUpperCase()
  const shortId = item.id.replace(/-/g, '').slice(-4).toUpperCase()
  const assetNumber = `#${categoryPrefix}-${shortId}`

  const isOnSite = !!item.activeBooking
  const timeline = item.activeBooking
    ? getTimelinePercent(item.activeBooking.start_date, item.activeBooking.end_date)
    : null

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl bg-surface-container border border-white/8 transition-colors hover:border-white/15">
      {/* Image placeholder */}
      <div className={`relative h-36 bg-gradient-to-b ${gradient} flex items-center justify-center`}>
        <span className="text-4xl opacity-40 select-none">{icon}</span>
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container/60 to-transparent" />
        {/* Status badge */}
        <div className="absolute top-2.5 left-2.5">
          <Badge variant={isOnSite ? 'gold' : 'secondary'}>
            {isOnSite ? `PÅ TUR${item.activeBooking?.venue ? ` · ${item.activeBooking.venue}` : ''}` : 'BRAKKO'}
          </Badge>
        </div>
        {/* Edit button */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="secondary" size="xs" asChild>
            <Link href={`/dashboard/equipment/${item.id}/edit`}>Endre</Link>
          </Button>
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-2 px-3 py-3">
        <div>
          <div className="type-title text-sm leading-snug">{item.name}</div>
          <div className="type-label text-muted-foreground font-mono mt-0.5">{assetNumber}</div>
        </div>

        <div className="flex items-center gap-2 type-label text-muted-foreground">
          <span>{item.quantity} {item.quantity === 1 ? 'unit' : 'units'}</span>
          {item.description && (
            <>
              <span className="opacity-30">·</span>
              <span className="truncate">{item.description}</span>
            </>
          )}
        </div>

        {/* Timeline */}
        {item.activeBooking && timeline && (
          <div className="mt-1">
            <div className="flex justify-between type-micro normal-case tracking-normal text-muted-foreground mb-1">
              <span>{formatDate(item.activeBooking.start_date)}</span>
              <span>{formatDate(item.activeBooking.end_date)}</span>
            </div>
            <div className="h-1 w-full rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[--color-spotlight-gold]"
                style={{ width: `${timeline.width}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

