'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CloudIcon, CheckCircle2Icon, XCircleIcon, Loader2Icon } from 'lucide-react'

export default function ICloudSettingsPage() {
  const supabase = createClient()
  const [appleId, setAppleId] = useState('')
  const [appPassword, setAppPassword] = useState('')
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [loadingSettings, setLoadingSettings] = useState(true)

  useEffect(() => {
    ;(supabase
      .from('icloud_settings')
      .select('apple_id, updated_at')
      .limit(1)
      .single() as unknown as Promise<{ data: { apple_id: string; updated_at: string } | null }>)
      .then(({ data }) => {
        if (data) {
          setAppleId(data.apple_id)
          setUpdatedAt(data.updated_at)
        }
        setLoadingSettings(false)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/icloud/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apple_id: appleId, app_password: appPassword }),
      })
      const json = await res.json()
      if (!res.ok) {
        setStatus('error')
        setErrorMsg(json.error ?? 'Ukjend feil')
        return
      }
      setStatus('ok')
      setUpdatedAt(new Date().toISOString())
      setAppPassword('')
    } catch {
      setStatus('error')
      setErrorMsg('Nettverksfeil')
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-lg">
      <div className="flex items-center gap-3">
        <CloudIcon className="size-7 text-muted-foreground" />
        <h1 className="font-heading text-3xl font-bold tracking-tight">iCloud Kalender</h1>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">
        Kople ABCLive til ein felles iCloud-konto for å importere events som gigs.
        Du treng eit <strong>app-spesifikt passord</strong> frå{' '}
        <span className="font-mono text-xs bg-surface-high px-1 py-0.5 rounded">appleid.apple.com</span>
        {' '}— bruk ikkje det vanlege Apple-passordet ditt.
      </p>

      {loadingSettings ? (
        <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
      ) : (
        <form onSubmit={handleSave} className="flex flex-col gap-5">
          {updatedAt && (
            <p className="text-xs text-muted-foreground">
              Sist lagra: {new Date(updatedAt).toLocaleString('nb-NO')}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="apple-id">Apple ID (e-post)</Label>
            <Input
              id="apple-id"
              type="email"
              value={appleId}
              onChange={(e) => setAppleId(e.target.value)}
              placeholder="firma@icloud.com"
              required
              autoComplete="username"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="app-password">App-spesifikt passord</Label>
            <Input
              id="app-password"
              type="password"
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
              placeholder={updatedAt ? '(uendra — skriv nytt for å oppdatere)' : 'xxxx-xxxx-xxxx-xxxx'}
              required={!updatedAt}
              autoComplete="new-password"
            />
          </div>

          {status === 'ok' && (
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle2Icon className="size-4" />
              Tilkopling OK — credentials lagra.
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <XCircleIcon className="size-4" />
              {errorMsg}
            </div>
          )}

          <Button type="submit" disabled={status === 'loading'} className="self-start">
            {status === 'loading' && <Loader2Icon className="size-4 animate-spin mr-2" />}
            Test og lagre
          </Button>
        </form>
      )}
    </div>
  )
}
