'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateTicketStatus } from '@/app/actions/tickets'
import type { TicketStatus } from '@/types/database'

interface Props {
  ticketId: string
  currentStatus: TicketStatus
}

export default function TicketStatusSelect({ ticketId, currentStatus }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleChange(status: TicketStatus) {
    startTransition(async () => {
      try {
        await updateTicketStatus(ticketId, status)
        router.refresh()
      } catch (error) {
        alert('Kunne ikkje oppdatere status: ' + (error as Error).message)
      }
    })
  }

  return (
    <select
      value={currentStatus}
      onChange={(e) => handleChange(e.target.value as TicketStatus)}
      disabled={pending}
      className="w-48 rounded border border-input bg-background px-2 py-1 text-sm"
    >
      <option value="reported">Rapportert</option>
      <option value="open">Open</option>
      <option value="in_progress">Vurder/implementer</option>
      <option value="implemented">Implementert</option>
      <option value="not_implemented">Ikke implementert</option>
      <option value="closed">Lukket</option>
    </select>
  )
}