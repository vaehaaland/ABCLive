'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ChangePasswordForm({ onSuccess }: { onSuccess?: () => void }) {
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password !== confirmPassword) {
      setError('Passorda stemmer ikkje overeins.')
      return
    }
    if (password.length < 8) {
      setError('Passordet må vere minst 8 teikn.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setPassword('')
      setConfirmPassword('')
      onSuccess?.()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm">
      <div className="grid gap-2">
        <Label htmlFor="new-password">Nytt passord</Label>
        <Input
          id="new-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          minLength={8}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confirm-new-password">Stadfest nytt passord</Label>
        <Input
          id="confirm-new-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-emerald-500">Passordet er oppdatert.</p>}
      <Button type="submit" disabled={loading} className="self-start">
        {loading ? 'Lagrar…' : 'Endre passord'}
      </Button>
    </form>
  )
}
