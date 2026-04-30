'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { CompanyBadge } from '@/components/CompanyBadge'
import { approveEquipmentRequest, denyEquipmentRequest } from '@/app/actions/equipment-requests'
import type { GigEquipmentWithRequest } from '@/types/database'

interface Props {
  requests: GigEquipmentWithRequest[]
}

export function EquipmentRequestsSection({ requests }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (requests.length === 0) return null

  function handleApprove(id: string) {
    setError(null)
    startTransition(async () => {
      const result = await approveEquipmentRequest(id)
      if (result.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  function handleDeny(id: string) {
    setError(null)
    startTransition(async () => {
      const result = await denyEquipmentRequest(id)
      if (result.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="mb-6 rounded-xl border border-spotlight-gold/30 bg-spotlight-gold/5 p-4 flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-spotlight-gold">
        Førespurnader om utstyrslån ({requests.length})
      </h2>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-col gap-2">
        {requests.map((req) => {
          const equip = req.equipment
          const gig = req.gig
          return (
            <div
              key={req.id}
              className="flex items-center justify-between gap-3 rounded-lg bg-surface-low px-3 py-2.5"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                  <CompanyBadge company={gig?.company ?? null} size="xs" />
                  <span className="text-muted-foreground">vil låne</span>
                  <span>{req.quantity_needed}× {equip.name}</span>
                </div>
                {gig && (
                  <p className="type-label text-muted-foreground truncate">
                    {gig.name} · {format(new Date(gig.start_date), 'd. MMM yyyy', { locale: nb })}
                    {gig.start_date !== gig.end_date && ` – ${format(new Date(gig.end_date), 'd. MMM yyyy', { locale: nb })}`}
                  </p>
                )}
              </div>

              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2.5 text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                  disabled={pending}
                  onClick={() => handleDeny(req.id)}
                >
                  Avslå
                </Button>
                <Button
                  size="sm"
                  className="h-7 px-2.5"
                  disabled={pending}
                  onClick={() => handleApprove(req.id)}
                >
                  Godkjenn
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

