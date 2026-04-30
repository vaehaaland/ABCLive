'use client'

import { useRef, useState, useTransition, useEffect } from 'react'
import { ChevronDownIcon, CheckCircleIcon, BanIcon, ArchiveRestoreIcon, CalendarRangeIcon, LoaderCircleIcon, Trash2Icon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { updateGigStatus, convertToFestival, deleteGig } from '@/app/dashboard/gigs/actions'
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
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setConfirmingDelete(false)
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

  function runAction(action: () => Promise<void>) {
    setOpen(false)
    setConfirmingDelete(false)
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

            {(statusItems.length > 0 || typeItems.length > 0) && (
              <div className="my-1 h-px bg-border" />
            )}

            {!confirmingDelete ? (
              <button
                onClick={() => setConfirmingDelete(true)}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2Icon className="size-4" />
                Slett gig
              </button>
            ) : (
              <div className="px-2.5 py-2 flex flex-col gap-2">
                <p className="type-label text-destructive">Sikker? Oppdraget kan gjenopprettast seinare.</p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => runAction(() => deleteGig(gigId))}
                    className="flex-1 type-label rounded-md px-2 py-1 bg-destructive text-destructive-foreground hover:bg-destructive/80 transition-colors"
                  >
                    Slett
                  </button>
                  <button
                    onClick={() => setConfirmingDelete(false)}
                    className="flex-1 type-label rounded-md px-2 py-1 bg-surface-high hover:bg-surface-highest transition-colors"
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

