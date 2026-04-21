'use client'

import { useRef, useState, useTransition, useEffect } from 'react'
import { ChevronDownIcon, CheckCircleIcon, BanIcon, ArchiveRestoreIcon, CalendarRangeIcon, LoaderCircleIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { updateGigStatus, convertToFestival } from '@/app/dashboard/gigs/actions'
import type { GigStatus, GigType } from '@/types/database'

type Props = {
  gigId: string
  status: GigStatus
  gigType: GigType
}

type MenuItem = {
  label: string
  icon: React.ReactNode
  className?: string
  action: () => Promise<void>
}

export default function GigActionsDropdown({ gigId, status, gigType }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const statusItems: MenuItem[] = []

  if (status === 'draft') {
    statusItems.push({
      label: 'Bekreft gig',
      icon: <CheckCircleIcon className="size-4 text-emerald-400" />,
      className: 'text-emerald-400 hover:bg-emerald-400/10',
      action: () => updateGigStatus(gigId, 'confirmed'),
    })
  }

  if (status === 'confirmed') {
    statusItems.push({
      label: 'Marker som fullført',
      icon: <CheckCircleIcon className="size-4" />,
      action: () => updateGigStatus(gigId, 'completed'),
    })
    statusItems.push({
      label: 'Avlys gig',
      icon: <BanIcon className="size-4 text-destructive" />,
      className: 'text-destructive hover:bg-destructive/10',
      action: () => updateGigStatus(gigId, 'cancelled'),
    })
  }

  if (status === 'completed' || status === 'cancelled') {
    statusItems.push({
      label: 'Tilbakestill til utkast',
      icon: <ArchiveRestoreIcon className="size-4" />,
      action: () => updateGigStatus(gigId, 'draft'),
    })
  }

  const typeItems: MenuItem[] = []

  if (gigType === 'single') {
    typeItems.push({
      label: 'Gjer til festival',
      icon: <CalendarRangeIcon className="size-4" />,
      action: () => convertToFestival(gigId),
    })
  }

  const allItems = [...statusItems, ...typeItems]
  if (allItems.length === 0) return null

  function runAction(action: () => Promise<void>) {
    setOpen(false)
    startTransition(async () => {
      await action()
    })
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="outline"
        size="sm"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
      >
        {isPending
          ? <LoaderCircleIcon className="size-4 animate-spin" />
          : 'Handlingar'
        }
        <ChevronDownIcon className={cn('size-3.5 transition-transform', open && 'rotate-180')} />
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 min-w-44 rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10">
          <div className="p-1">
            {statusItems.map((item) => (
              <button
                key={item.label}
                onClick={() => runAction(item.action)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                  item.className,
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}

            {statusItems.length > 0 && typeItems.length > 0 && (
              <div className="my-1 h-px bg-border" />
            )}

            {typeItems.map((item) => (
              <button
                key={item.label}
                onClick={() => runAction(item.action)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                  item.className,
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
