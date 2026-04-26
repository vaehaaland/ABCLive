'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { addExternalPersonnel } from '@/app/actions/gig-external-personnel'

interface Props {
  gigId: string
  open?: boolean
  onOpenChange?: (v: boolean) => void
}

export default function AddExternalPersonnelDialog({ gigId, open: controlledOpen, onOpenChange: controlledOnOpenChange }: Props) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = controlledOnOpenChange ?? setInternalOpen

  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!name.trim()) return
    setLoading(true)
    setError(null)

    const result = await addExternalPersonnel(gigId, {
      name,
      company: company || undefined,
      role_on_gig: role || undefined,
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setOpen(false)
    setName('')
    setCompany('')
    setRole('')
    setLoading(false)
  }

  const isControlled = controlledOpen !== undefined

  return (
    <Dialog open={open} onOpenChange={setOpen} {...(isControlled ? { triggerId: null } : {})}>
      {!isControlled && (
        <DialogTrigger render={<Button size="icon-sm" variant="ghost" aria-label="Legg til ekstern person" />}>
          <Plus className="size-4" />
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Legg til ekstern person</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="ext-name">Namn</Label>
            <Input
              id="ext-name"
              placeholder="Fullt namn"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ext-company">Selskap (valfritt)</Label>
            <Input
              id="ext-company"
              placeholder="Firmanamn"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ext-role">Rolle (valfritt)</Label>
            <Input
              id="ext-role"
              placeholder="t.d. Lydtekniker, Sceneriggar…"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={handleSubmit} disabled={!name.trim() || loading}>
            {loading ? 'Legg til…' : 'Legg til'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
