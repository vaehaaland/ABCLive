import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { GigStatus } from '@/types/database'

const statusLabels: Record<GigStatus, string> = {
  draft: 'Utkast',
  confirmed: 'Bekrefta',
  completed: 'Fullført',
  cancelled: 'Avlyst',
}

const statusVariants: Record<GigStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'secondary',
  confirmed: 'default',
  completed: 'outline',
  cancelled: 'destructive',
}

export default async function GigsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  let query = supabase
    .from('gigs')
    .select('*')
    .order('start_date', { ascending: true })

  // Technicians only see their own gigs via RLS — no filter needed
  const { data: gigs } = await query

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Oppdrag</h1>
        {isAdmin && (
          <Button asChild>
            <Link href="/dashboard/gigs/new">Nytt oppdrag</Link>
          </Button>
        )}
      </div>

      {!gigs?.length ? (
        <p className="text-muted-foreground text-sm">Ingen oppdrag å vise.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Namn</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Klient</TableHead>
              <TableHead>Dato</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {gigs.map((gig) => (
              <TableRow key={gig.id}>
                <TableCell className="font-medium">{gig.name}</TableCell>
                <TableCell>{gig.venue ?? '—'}</TableCell>
                <TableCell>{gig.client ?? '—'}</TableCell>
                <TableCell>
                  {format(new Date(gig.start_date), 'd. MMM yyyy', { locale: nb })}
                  {gig.start_date !== gig.end_date && (
                    <span className="text-muted-foreground">
                      {' '}– {format(new Date(gig.end_date), 'd. MMM', { locale: nb })}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariants[gig.status as GigStatus]}>
                    {statusLabels[gig.status as GigStatus]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/gigs/${gig.id}`}>Sjå detaljar</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
