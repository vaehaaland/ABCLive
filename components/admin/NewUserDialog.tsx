'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createUser, type CreateUserMode } from '@/app/dashboard/admin/users/actions'
import type { UserRole } from '@/types/database'

export default function NewUserDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<UserRole>('technician')
  const [primaryRole, setPrimaryRole] = useState('')
  const [mode, setMode] = useState<CreateUserMode>('invite')
  const [password, setPassword] = useState('')

  function reset() {
    setEmail('')
    setFullName('')
    setRole('technician')
    setPrimaryRole('')
    setMode('invite')
    setPassword('')
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await createUser({
        email: email.trim(),
        full_name: fullName.trim(),
        role,
        primary_role: primaryRole.trim() || undefined,
        mode,
        password: mode === 'password' ? password : undefined,
      })
      if (!result.ok) {
        setError(result.error ?? 'Ukjend feil')
        return
      }
      reset()
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        setOpen(next)
      }}
    >
      <DialogTrigger render={<Button />}>Ny brukar</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ny brukar</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="new-user-email">E-post</Label>
            <Input
              id="new-user-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="navn@example.no"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="new-user-name">Fullt namn</Label>
            <Input
              id="new-user-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ola Nordmann"
            />
          </div>

          <div className="grid gap-2">
            <Label>Rolle</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technician">Teknikar</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="new-user-primary">Hovudrolle (valfri)</Label>
            <Input
              id="new-user-primary"
              value={primaryRole}
              onChange={(e) => setPrimaryRole(e.target.value)}
              placeholder="t.d. Lydtekniker"
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium mb-1">Korleis skal brukaren logge inn?</legend>
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="mode"
                value="invite"
                checked={mode === 'invite'}
                onChange={() => setMode('invite')}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium">Send invitasjon på e-post</span>
                <span className="block text-muted-foreground text-xs">
                  Brukaren set passord sjølv via ei lenke i e-posten.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="mode"
                value="password"
                checked={mode === 'password'}
                onChange={() => setMode('password')}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium">Set passord no</span>
                <span className="block text-muted-foreground text-xs">
                  Passordet må delast med brukaren på ein trygg måte.
                </span>
              </span>
            </label>
          </fieldset>

          {mode === 'password' && (
            <div className="grid gap-2">
              <Label htmlFor="new-user-password">Passord (minst 8 teikn)</Label>
              <Input
                id="new-user-password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={pending}>
            {pending ? 'Lagrar…' : mode === 'invite' ? 'Send invitasjon' : 'Opprett brukar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
