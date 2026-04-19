import type { GigWithDetails } from '@/types/database'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AddPersonnelDialog from '@/components/gigs/AddPersonnelDialog'
import AddEquipmentDialog from '@/components/gigs/AddEquipmentDialog'
import RemovePersonnelButton from '@/components/gigs/RemovePersonnelButton'
import PersonHoverCard from '@/components/PersonHoverCard'
import { Avatar } from '@/components/ui/avatar'
import RemoveEquipmentButton from '@/components/gigs/RemoveEquipmentButton'
import GigFilesSection from '@/components/gigs/GigFilesSection'
import type { GigStatus } from '@/types/database'

const statusLabels: Record<GigStatus, string> = {
  draft: 'Utkast',
  confirmed: 'Bekrefta',
  completed: 'Fullført',
  cancelled: 'Avlyst',
}

export default async function GigDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single() as { data: { role: string } | null, error: unknown }

  const isAdmin = profile?.role === 'admin'

  const gigSelect = isAdmin
    ? 'id, name, venue, client, start_date, end_date, description, status, price, price_notes, created_by, created_at'
    : 'id, name, venue, client, start_date, end_date, description, status, created_by, created_at'

  const { data: gig } = await supabase
    .from('gigs')
    .select(gigSelect)
    .eq('id', id)
    .single() as { data: any, error: unknown }

  if (!gig) notFound()

  const { data: personnelRows } = await supabase
    .from('gig_personnel')
    .select('id, role_on_gig, notes, profiles(id, full_name, phone, role)')
    .eq('gig_id', id) as { data: any[] | null, error: unknown }

  const { data: equipmentRows } = await supabase
    .from('gig_equipment')
    .select('id, quantity_needed, notes, equipment(id, name, category, quantity)')
    .eq('gig_id', id) as { data: any[] | null, error: unknown }

  const { data: fileRows } = await supabase
    .from('gig_files')
    .select('*')
    .eq('gig_id', id)
    .order('created_at', { ascending: false }) as { data: any[] | null, error: unknown }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{gig.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {format(new Date(gig.start_date), 'd. MMMM yyyy', { locale: nb })}
            {gig.start_date !== gig.end_date && (
              <> – {format(new Date(gig.end_date), 'd. MMMM yyyy', { locale: nb })}</>
            )}
            {gig.venue && ` · ${gig.venue}`}
            {gig.client && ` · ${gig.client}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={
            gig.status === 'confirmed' ? 'default' :
            gig.status === 'completed' ? 'success' :
            gig.status === 'cancelled' ? 'destructive' :
            'secondary'
          }>
            {statusLabels[gig.status as GigStatus]}
          </Badge>
          {isAdmin && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/gigs/${gig.id}/edit`}>Endre</Link>
            </Button>
          )}
        </div>
      </div>

      {gig.description && (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{gig.description}</p>
      )}

      {isAdmin && gig.price != null && (
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold">
            {new Intl.NumberFormat('nb-NO', {
              style: 'currency',
              currency: 'NOK',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(gig.price)}
          </span>
          {gig.price_notes && (
            <span className="text-sm text-muted-foreground">{gig.price_notes}</span>
          )}
        </div>
      )}

      {/* Personnel */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Personell</CardTitle>
          {isAdmin && (
            <AddPersonnelDialog gigId={gig.id} gigStartDate={gig.start_date} gigEndDate={gig.end_date} />
          )}
        </CardHeader>
        <CardContent>
          {!personnelRows?.length ? (
            <p className="text-sm text-muted-foreground">Ingen teknikarar lagt til.</p>
          ) : (
            <ul className="divide-y">
              {personnelRows.map((row) => {
                const person = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
                return (
                  <li key={row.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2.5">
                      {person?.id ? (
                        <PersonHoverCard profileId={person.id} name={person.full_name}>
                          <div className="flex items-center gap-2.5">
                            <Avatar src={person.avatar_url} name={person.full_name} size="sm" />
                            <p className="text-sm font-medium">{person.full_name ?? 'Ukjend'}</p>
                          </div>
                        </PersonHoverCard>
                      ) : (
                        <p className="text-sm font-medium">Ukjend</p>
                      )}
                      {row.role_on_gig && (
                        <Badge variant="gold">{row.role_on_gig}</Badge>
                      )}
                    </div>
                    {isAdmin && <RemovePersonnelButton assignmentId={row.id} />}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Equipment */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Utstyr</CardTitle>
          {isAdmin && (
            <AddEquipmentDialog gigId={gig.id} gigStartDate={gig.start_date} gigEndDate={gig.end_date} />
          )}
        </CardHeader>
        <CardContent>
          {!equipmentRows?.length ? (
            <p className="text-sm text-muted-foreground">Ingen utstyr lagt til.</p>
          ) : (
            <ul className="divide-y">
              {equipmentRows.map((row) => {
                const item = Array.isArray(row.equipment) ? row.equipment[0] : row.equipment
                return (
                  <li key={row.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">{item?.name ?? 'Ukjend'}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.quantity_needed} stk
                        {item?.category && ` · ${item.category}`}
                      </p>
                    </div>
                    {isAdmin && <RemoveEquipmentButton assignmentId={row.id} />}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
      {/* Files */}
      <GigFilesSection
        gigId={gig.id}
        isAdmin={isAdmin}
        initialFiles={fileRows ?? []}
      />
    </div>
  )
}
