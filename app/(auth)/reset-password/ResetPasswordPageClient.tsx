'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ResetPasswordPageClient() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sessionReady, setSessionReady] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setSessionReady(!!data.user)
    })
  }, [supabase])

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

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard/gigs')
      router.refresh()
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
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
            Nytt passord
          </CardTitle>
          <CardDescription>
            {sessionReady === false
              ? 'Lenka er ugyldig eller har gått ut.'
              : 'Vel eit nytt passord for kontoen din.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessionReady === false ? (
            <div className="flex flex-col gap-4">
              <p className="text-center text-sm text-muted-foreground">
                Tilbakestillingslenka er ikkje lenger gyldig. Be om ei ny lenke.
              </p>
              <Link
                href="/forgot-password"
                className="text-center text-sm text-primary underline-offset-4 hover:underline"
              >
                Send ny tilbakestillingslenke
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="password">Nytt passord</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  minLength={8}
                  disabled={sessionReady === null}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Stadfest passord</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  disabled={sessionReady === null}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={loading || sessionReady === null}>
                {loading ? 'Lagrar…' : 'Lagre nytt passord'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
