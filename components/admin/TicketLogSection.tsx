'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { nb } from 'date-fns/locale'
import type { TicketLog } from '@/types/database'
import { addTicketLog } from '@/app/actions/tickets'
import { getDisplayName } from '@/lib/utils'

interface Props {
  ticketId: string
  initialLogs: (TicketLog & { author: { id: string; full_name: string | null; nickname: string | null; email: string | null; avatar_url?: string | null } | null })[]
}

export default function TicketLogSection({ ticketId, initialLogs }: Props) {
  const [logs, setLogs] = useState(initialLogs)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!note.trim()) {
      setError('Skriv inn eit logginnlegg før du lagrar')
      return
    }

    startTransition(async () => {
      try {
        const result = await addTicketLog(ticketId, note.trim())
        setLogs((current) => [
          {
            ...result.log,
            author: { id: '', full_name: null, nickname: null, email: null },
          },
          ...current,
        ])
        setNote('')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ukjend feil')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Utviklarlogg</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Log input form */}
        <form onSubmit={handleSubmit} className="space-y-3 pb-4 border-b border-border">
          <div className="grid gap-2">
            <Label htmlFor="ticket-log-body" className="text-sm">Notat</Label>
            <Textarea
              id="ticket-log-body"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="Skriv kva du har gjort, kva som må vurderast, eller kva som er avklart"
              className="text-sm resize-none"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? 'Lagres…' : 'Lagre logginnlegg'}
            </Button>
          </div>
        </form>

        {/* Logs history */}
        <div className="space-y-3">
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ingen logginnlegg ennå.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex gap-2.5">
                <Avatar src={log.author?.avatar_url} name={log.author?.full_name} size="sm" id={log.author?.id} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-sm font-medium">
                      {getDisplayName(log.author, log.author?.email ?? 'Utviklar')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: nb })}
                    </span>
                  </div>
                  <p className="text-sm mt-2 whitespace-pre-wrap break-words leading-relaxed">
                    {log.body}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
