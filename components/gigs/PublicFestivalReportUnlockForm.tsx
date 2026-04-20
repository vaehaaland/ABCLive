'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { PublicReportUnlockState } from '@/app/festival-report/actions'
import { unlockFestivalReport } from '@/app/festival-report/actions'

const INITIAL_STATE: PublicReportUnlockState = { ok: false }

interface PublicFestivalReportUnlockFormProps {
  slug: string
}

export default function PublicFestivalReportUnlockForm({ slug }: PublicFestivalReportUnlockFormProps) {
  const action = unlockFestivalReport.bind(null, slug)
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE)

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-surface-container p-6">
      <div className="space-y-1">
        <h2 className="font-heading text-lg font-semibold">Lås opp festivalsrapport</h2>
        <p className="text-sm text-muted-foreground">
          Skriv inn passordet for å opne denne delte rapporten.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="festival-report-password">Passord</Label>
        <Input id="festival-report-password" name="password" type="password" required />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? 'Opnar…' : 'Opne rapport'}
      </Button>
    </form>
  )
}
