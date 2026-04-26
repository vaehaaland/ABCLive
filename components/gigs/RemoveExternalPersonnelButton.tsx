'use client'

import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { removeExternalPersonnel } from '@/app/actions/gig-external-personnel'

interface Props {
  id: string
  gigId: string
}

export default function RemoveExternalPersonnelButton({ id, gigId }: Props) {
  async function handleRemove() {
    if (!window.confirm('Fjerne ekstern person?')) return
    await removeExternalPersonnel(id, gigId)
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="text-muted-foreground hover:text-destructive"
      onClick={handleRemove}
      aria-label="Fjern ekstern person"
    >
      <Trash2 className="size-4" />
    </Button>
  )
}
