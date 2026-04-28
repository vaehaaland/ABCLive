'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, XCircle, ChevronDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { acceptGigAssignment, declineGigAssignment } from '@/app/actions/gig-personnel'

interface Props {
  assignmentId: string
}

export default function GigAssignmentRespondBanner({ assignmentId }: Props) {
  const [showDeclineForm, setShowDeclineForm] = useState(false)
  const [declineNote, setDeclineNote] = useState('')
  const [isPending, startTransition] = useTransition()
  const [pendingAction, setPendingAction] = useState<'accept' | 'decline' | null>(null)

  function handleAccept() {
    setPendingAction('accept')
    startTransition(async () => {
      await acceptGigAssignment(assignmentId)
    })
  }

  function handleDecline() {
    setPendingAction('decline')
    startTransition(async () => {
      await declineGigAssignment(assignmentId, declineNote || undefined)
    })
  }

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
      <p className="text-sm font-medium">Du er invitert til dette oppdraget — kan du ta det?</p>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={handleAccept}
          disabled={isPending}
        >
          {isPending && pendingAction === 'accept'
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <CheckCircle2 className="h-3.5 w-3.5" />
          }
          Aksepter oppdrag
        </Button>

        {!showDeclineForm && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDeclineForm(true)}
            disabled={isPending}
          >
            <ChevronDown className="h-3.5 w-3.5" />
            Avslå
          </Button>
        )}
      </div>

      {showDeclineForm && (
        <div className="space-y-2 pt-1">
          <Textarea
            rows={2}
            placeholder="Kvifor kan du ikkje ta oppdraget? (valfri)"
            value={declineNote}
            onChange={(e) => setDeclineNote(e.target.value)}
            disabled={isPending}
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDecline}
              disabled={isPending}
            >
              {isPending && pendingAction === 'decline'
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <XCircle className="h-3.5 w-3.5" />
              }
              Avslå oppdrag
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDeclineForm(false)}
              disabled={isPending}
            >
              Avbryt
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
