import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireSuperadmin } from '@/lib/auth/requireSuperadmin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import TicketStatusSelect from '@/components/admin/TicketStatusSelect'
import { ArrowLeftIcon } from 'lucide-react'
import type { Ticket } from '@/types/database'
import { getDisplayName } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  await requireSuperadmin()

  const admin = createAdminClient()
  const { data: ticket } = await admin
    .from('tickets')
    .select('title')
    .eq('id', id)
    .maybeSingle() as { data: { title: string } | null }

  return {
    title: ticket?.title ?? 'Ticket',
  }
}

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireSuperadmin()

  const admin = createAdminClient()

  const { data: ticket } = await admin
    .from('tickets')
    .select(`
      *,
      created_by_profile:profiles!tickets_created_by_fkey(id, full_name, nickname, email, avatar_url),
      assigned_to_profile:profiles!tickets_assigned_to_fkey(id, full_name, nickname, email, avatar_url)
    `)
    .eq('id', id)
    .single() as unknown as {
      data: (Ticket & {
        created_by_profile: { id: string; full_name: string | null; nickname: string | null; email: string | null; avatar_url: string | null }
        assigned_to_profile: { id: string; full_name: string | null; nickname: string | null; email: string | null; avatar_url: string | null }
      }) | null
    }

  if (!ticket) {
    notFound()
  }

  const statusOptions: { value: string; label: string }[] = [
    { value: 'reported', label: 'Rapportert' },
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'Vurder/implementer' },
    { value: 'implemented', label: 'Implementert' },
    { value: 'not_implemented', label: 'Ikke implementert' },
    { value: 'closed', label: 'Lukket' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/admin/tickets">
            <ArrowLeftIcon className="size-4 mr-2" />
            Tilbake til tickets
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-bold">{ticket.title}</h1>
          <p className="text-sm text-muted-foreground">
            Ticket #{ticket.id.slice(-8)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          <TicketStatusSelect ticketId={ticket.id} currentStatus={ticket.status} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Beskrivelse</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {ticket.description}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detaljar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm font-medium">Status:</span>
                <div className="mt-1">
                  <Badge
                    variant={
                      ticket.status === 'reported'
                        ? 'secondary'
                        : ticket.status === 'open'
                        ? 'default'
                        : ticket.status === 'in_progress'
                        ? 'destructive'
                        : ticket.status === 'implemented'
                        ? 'secondary'
                        : ticket.status === 'not_implemented'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {statusOptions.find((o) => o.value === ticket.status)?.label}
                  </Badge>
                </div>
              </div>

              <div>
                <span className="text-sm font-medium">Oppretta av:</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {getDisplayName(ticket.created_by_profile, ticket.created_by_profile?.email ?? 'Ukjend')}
                </p>
              </div>

              <div>
                <span className="text-sm font-medium">Tildelt til:</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {getDisplayName(ticket.assigned_to_profile, ticket.assigned_to_profile?.email ?? 'Ukjend')}
                </p>
              </div>

              <div>
                <span className="text-sm font-medium">Oppretta:</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {format(new Date(ticket.created_at), "d. MMM yyyy 'kl.' HH:mm", { locale: nb })}
                </p>
              </div>

              {ticket.updated_at !== ticket.created_at && (
                <div>
                  <span className="text-sm font-medium">Sist oppdatert:</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(new Date(ticket.updated_at), "d. MMM yyyy 'kl.' HH:mm", { locale: nb })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
