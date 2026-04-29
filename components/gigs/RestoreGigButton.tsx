'use client'

import { useTransition } from 'react'
import { ArchiveRestoreIcon, LoaderCircleIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { restoreGig } from '@/app/dashboard/gigs/actions'

export default function RestoreGigButton({ gigId }: { gigId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        startTransition(() => restoreGig(gigId))
      }}
    >
      {isPending
        ? <LoaderCircleIcon className="size-3.5 animate-spin" />
        : <ArchiveRestoreIcon className="size-3.5" />
      }
      Gjenopprett
    </Button>
  )
}
