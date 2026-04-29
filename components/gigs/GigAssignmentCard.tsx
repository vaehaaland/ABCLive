import Link from 'next/link'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { CalendarIcon, MapPinIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { statusAccentClass, statusLabels } from '@/lib/gig-status'
import { cn } from '@/lib/utils'
import type { GigStatus } from '@/types/database'

const statusVariants: Record<GigStatus, 'default' | 'secondary' | 'success' | 'destructive'> = {
  draft: 'secondary',
  confirmed: 'default',
  completed: 'success',
  cancelled: 'destructive',
}

type GigAssignmentCardProps = {
  id: string
  name: string
  venue: string | null
  start_date: string
  status: string
  role_label: string | null
  item_name: string | null
}

export function GigAssignmentCard({
  id,
  name,
  venue,
  start_date,
  status,
  role_label,
  item_name,
}: GigAssignmentCardProps) {
  const statusLabel = statusLabels[status as GigStatus]
  const statusVariant = statusVariants[status as GigStatus]
  const accent = statusAccentClass[status as GigStatus]

  return (
    <Link
      href={`/dashboard/gigs/${id}`}
      className="group flex h-full rounded-2xl overflow-hidden bg-surface-container hover:bg-surface-high transition-all hover:-translate-y-px hover:shadow-[0_8px_24px_oklch(0_0_0/0.25)] cursor-pointer"
    >
      <div className={cn('w-[3px] shrink-0 self-stretch', accent)} />
      <div className="flex-1 min-w-0 p-4 flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={statusVariant}>{statusLabel}</Badge>
            {role_label && <Badge variant="role">{role_label}</Badge>}
          </div>
        </div>
        <p className="font-heading font-bold text-[0.9375rem] leading-snug tracking-[-0.02em] text-foreground line-clamp-2">
          {name}
        </p>
        {item_name && (
          <p className="flex items-center gap-1 text-xs text-primary font-medium">
            {item_name}
          </p>
        )}
        <div className="flex flex-wrap gap-3 mt-0.5">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarIcon className="size-3 shrink-0" />
            {format(new Date(start_date), 'd. MMM yyyy', { locale: nb })}
          </span>
          {venue && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPinIcon className="size-3 shrink-0" />
              {venue}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
