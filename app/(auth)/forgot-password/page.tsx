'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, oklch(0.74 0.18 295 / 0.10) 0%, transparent 60%)',
        }}
      />
      <Card className="relative z-10 w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="font-heading text-2xl font-bold tracking-tight">
            Tilbakestill passord
          </CardTitle>
          <CardDescription>
            {sent
              ? 'Sjekk e-posten din for ein tilbakestillingslenke.'
              : 'Skriv inn e-postadressa di, so sender vi ein lenke.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground text-center">
                Ei tilbakestillingslenke er sendt til <strong>{email}</strong>. Sjekk òg
                søppelpost-mappa di.
              </p>
              <Link
                href="/login"
                className="text-sm text-primary underline-offset-4 hover:underline text-center"
              >
                Tilbake til innlogging
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">E-post</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={loading}>
                {loading ? 'Sender…' : 'Send tilbakestillingslenke'}
              </Button>
              <Link
                href="/login"
                className="text-sm text-muted-foreground underline-offset-4 hover:underline text-center"
              >
                Tilbake til innlogging
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
