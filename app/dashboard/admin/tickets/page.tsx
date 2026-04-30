import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireSuperadmin } from '@/lib/auth/requireSuperadmin'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import TicketStatusSelect from '@/components/admin/TicketStatusSelect'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import Link from 'next/link'
import type { Ticket, TicketStatus } from '@/types/database'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Tickets',
}

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  await requireSuperadmin()

  const admin = createAdminClient()

  const statusFilter = (searchParams.status as TicketStatus) || null

  let query = admin
    .from('tickets')
    .select(`
      *,
      created_by_profile:profiles!tickets_created_by_fkey(id, full_name, nickname, email)
    `)
    .order('created_at', { ascending: false })

  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }

  const { data: tickets } = await (query as unknown as Promise<{
    data: (Ticket & {
      created_by_profile: { id: string; full_name: string | null; nickname: string | null; email: string | null }
    })[] | null
  }>)

  const statusOptions: { value: TicketStatus; label: string }[] = [
    { value: 'reported', label: 'Rapportert' },
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'Vurder/implementer' },
    { value: 'implemented', label: 'Implementert' },
    { value: 'not_implemented', label: 'Ikke implementert' },
    { value: 'closed', label: 'Lukket' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="type-h2">Tickets</h1>
          <p className="text-sm text-muted-foreground">
            Administrer brukar-rapporterte problem og ønskje. Berre synleg for superadmin.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <form className="flex items-center gap-2">
          <span className="text-sm font-medium">Filter status:</span>
          <select
            name="status"
            defaultValue={statusFilter || ''}
            className="w-40 rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            <option value="">Alle statusar</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button type="submit" className="text-sm text-primary hover:underline">
            Filtrer
          </button>
        </form>
      </div>

      {!tickets || tickets.length === 0 ? (
        <p className="text-muted-foreground text-sm">Ingen tickets funne.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tittel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Oppretta av</TableHead>
              <TableHead>Oppretta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/dashboard/admin/tickets/${ticket.id}`}
                    className="text-primary hover:underline"
                  >
                    {ticket.title}
                  </Link>
                </TableCell>
                <TableCell>
                  <TicketStatusSelect ticketId={ticket.id} currentStatus={ticket.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {ticket.created_by_profile?.full_name ||
                   ticket.created_by_profile?.nickname ||
                   ticket.created_by_profile?.email ||
                   'Ukjend'}
                </TableCell>
                <TableCell className="type-label text-muted-foreground">
                  {format(new Date(ticket.created_at), 'd. MMM yyyy', { locale: nb })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
