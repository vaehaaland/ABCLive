'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { updateFestivalReportSharing, type FestivalReportSharingState } from '@/app/dashboard/gigs/report-actions'
import CopyPublicReportLinkButton from '@/components/gigs/CopyPublicReportLinkButton'

interface FestivalReportSharingPanelProps {
  gigId: string
  initialEnabled: boolean
  initialPublicPath: string | null
}

const INITIAL_STATE: FestivalReportSharingState = { ok: false }

export default function FestivalReportSharingPanel({
  gigId,
  initialEnabled,
  initialPublicPath,
}: FestivalReportSharingPanelProps) {
  const action = updateFestivalReportSharing.bind(null, gigId)
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE)
  const [open, setOpen] = useState(false)

  const enabled = state.enabled ?? initialEnabled
  const publicPath = state.publicPath ?? initialPublicPath

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={enabled ? 'secondary' : 'outline'} size="sm" />}>
        {enabled ? 'Offentleg deling' : 'Sett opp deling'}
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Offentleg rapportdeling</DialogTitle>
          <DialogDescription>
            Del ein passordbeskytta rapportlenke for festivalen når du faktisk vil publisere han.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <label className="flex items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              name="public_report_enabled"
              defaultChecked={enabled}
              className="size-4 rounded border border-white/20 bg-transparent"
            />
            Aktiver offentleg rapport
          </label>

          <div className="grid gap-2">
            <Label htmlFor={`festival-report-password-${gigId}`}>Nytt passord</Label>
            <Input
              id={`festival-report-password-${gigId}`}
              name="public_report_password"
              type="password"
              placeholder={enabled ? 'La stå tomt for å behalde noverande passord' : 'Set passord for offentleg lenke'}
            />
          </div>

          {publicPath && (
            <div className="grid gap-2">
              <Label>Offentleg lenke</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input value={publicPath} readOnly className="font-mono text-xs" />
                <CopyPublicReportLinkButton publicPath={publicPath} />
              </div>
            </div>
          )}

          {(state.error || state.message) && (
            <p className={`text-sm ${state.error ? 'text-destructive' : 'text-muted-foreground'}`}>
              {state.error ?? state.message}
            </p>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? 'Lagrar…' : 'Lagre rapportdeling'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Lukk
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
