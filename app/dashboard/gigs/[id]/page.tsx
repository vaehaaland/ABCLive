import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AddPersonnelDialog from '@/components/gigs/AddPersonnelDialog'
import AddEquipmentDialog from '@/components/gigs/AddEquipmentDialog'
import AddProgramItemPersonnelDialog from '@/components/gigs/AddProgramItemPersonnelDialog'
import AddProgramItemEquipmentDialog from '@/components/gigs/AddProgramItemEquipmentDialog'
import ProgramItemDialog from '@/components/gigs/ProgramItemDialog'
import RemovePersonnelButton from '@/components/gigs/RemovePersonnelButton'
import RemoveEquipmentButton from '@/components/gigs/RemoveEquipmentButton'
import RemoveProgramItemButton from '@/components/gigs/RemoveProgramItemButton'
import RemoveProgramItemPersonnelButton from '@/components/gigs/RemoveProgramItemPersonnelButton'
import RemoveProgramItemEquipmentButton from '@/components/gigs/RemoveProgramItemEquipmentButton'
import PersonHoverCard from '@/components/PersonHoverCard'
import { Avatar } from '@/components/ui/avatar'
import FestivalReportSharingPanel from '@/components/gigs/FestivalReportSharingPanel'
import GigFilesSection from '@/components/gigs/GigFilesSection'
import GigCommentsSection from '@/components/gigs/GigCommentsSection'
import type { GigFile, GigProgramItem, GigStatus, GigType, GigCommentWithAuthor } from '@/types/database'

const statusLabels: Record<GigStatus, string> = {
  draft: 'Utkast',
  confirmed: 'Bekrefta',
  completed: 'Fullført',
  cancelled: 'Avlyst',
}

function formatProgramItemRange(startAt: string, endAt: string) {
  const start = new Date(startAt)
  const end = new Date(endAt)
  const sameDay = start.toDateString() === end.toDateString()

  if (sameDay) {
    return `${format(start, 'd. MMM yyyy', { locale: nb })} · ${format(start, 'HH:mm')}–${format(end, 'HH:mm')}`
  }

  return `${format(start, 'd. MMM yyyy HH:mm', { locale: nb })} – ${format(end, 'd. MMM yyyy HH:mm', { locale: nb })}`
}

type ProgramItemPersonRow = {
  id: string
  program_item_id: string
  role_on_item: string | null
  profiles: {
    id: string
    full_name: string | null
    phone: string | null
    role: string
    avatar_url?: string | null
  } | null
}

type ProgramItemEquipmentRow = {
  id: string
  program_item_id: string
  quantity_needed: number
  equipment: {
    id: string
    name: string
    category: string | null
    quantity: number
  } | null
}

type GigDetailRow = {
  id: string
  name: string
  gig_type: GigType
  public_report_enabled: boolean
  public_report_slug: string | null
  venue: string | null
  client: string | null
  start_date: string
  end_date: string
  description: string | null
  status: GigStatus
  price?: number | null
  price_notes?: string | null
  created_by: string | null
  created_at: string
}

type GigPersonnelRow = {
  id: string
  role_on_gig: string | null
  notes: string | null
  profiles: {
    id: string
    full_name: string | null
    phone: string | null
    role: string
    avatar_url?: string | null
  } | {
    id: string
    full_name: string | null
    phone: string | null
    role: string
    avatar_url?: string | null
  }[] | null
}

type GigEquipmentRow = {
  id: string
  quantity_needed: number
  notes: string | null
  equipment: {
    id: string
    name: string
    category: string | null
    quantity: number
  } | {
    id: string
    name: string
    category: string | null
    quantity: number
  }[] | null
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
    .select('role, full_name, avatar_url')
    .eq('id', user!.id)
    .single() as { data: { role: string; full_name: string | null; avatar_url: string | null } | null, error: unknown }

  const isAdmin = profile?.role === 'admin'

  const gigSelect = isAdmin
    ? 'id, name, gig_type, public_report_enabled, public_report_slug, venue, client, start_date, end_date, description, status, price, price_notes, created_by, created_at'
    : 'id, name, gig_type, public_report_enabled, public_report_slug, venue, client, start_date, end_date, description, status, created_by, created_at'

  const { data: gig } = await supabase
    .from('gigs')
    .select(gigSelect)
    .eq('id', id)
    .single() as { data: GigDetailRow | null, error: unknown }

  if (!gig) notFound()

  const { data: personnelRows } = await supabase
    .from('gig_personnel')
    .select('id, role_on_gig, notes, profiles(id, full_name, phone, role, avatar_url)')
    .eq('gig_id', id) as { data: GigPersonnelRow[] | null, error: unknown }

  const { data: equipmentRows } = await supabase
    .from('gig_equipment')
    .select('id, quantity_needed, notes, equipment(id, name, category, quantity)')
    .eq('gig_id', id) as { data: GigEquipmentRow[] | null, error: unknown }

  const { data: fileRows } = await supabase
    .from('gig_files')
    .select('*')
    .eq('gig_id', id)
    .order('created_at', { ascending: false }) as { data: GigFile[] | null, error: unknown }

  const { data: commentRows } = await supabase
    .from('gig_comments')
    .select('*, profiles(id, full_name, avatar_url)')
    .eq('gig_id', id)
    .order('created_at', { ascending: true }) as { data: GigCommentWithAuthor[] | null, error: unknown }

  const isFestival = gig.gig_type === 'festival'

  let programItems: GigProgramItem[] = []
  let itemPersonnelRows: ProgramItemPersonRow[] = []
  let itemEquipmentRows: ProgramItemEquipmentRow[] = []

  if (isFestival) {
    const { data: fetchedProgramItems } = await supabase
      .from('gig_program_items')
      .select('*')
      .eq('gig_id', id)
      .order('start_at', { ascending: true }) as { data: GigProgramItem[] | null, error: unknown }

    programItems = fetchedProgramItems ?? []

    if (programItems.length > 0) {
      const programItemIds = programItems.map((item) => item.id)

      const [{ data: fetchedItemPersonnel }, { data: fetchedItemEquipment }] = await Promise.all([
        supabase
          .from('gig_program_item_personnel')
          .select('id, program_item_id, role_on_item, notes, profiles(id, full_name, phone, role, avatar_url)')
          .in('program_item_id', programItemIds),
        supabase
          .from('gig_program_item_equipment')
          .select('id, program_item_id, quantity_needed, notes, equipment(id, name, category, quantity)')
          .in('program_item_id', programItemIds),
      ])

      itemPersonnelRows = (fetchedItemPersonnel ?? []) as ProgramItemPersonRow[]
      itemEquipmentRows = (fetchedItemEquipment ?? []) as ProgramItemEquipmentRow[]
    }
  }

  const itemPersonnelMap = new Map<string, ProgramItemPersonRow[]>()
  for (const row of itemPersonnelRows) {
    const list = itemPersonnelMap.get(row.program_item_id) ?? []
    list.push(row)
    itemPersonnelMap.set(row.program_item_id, list)
  }

  const itemEquipmentMap = new Map<string, ProgramItemEquipmentRow[]>()
  for (const row of itemEquipmentRows) {
    const list = itemEquipmentMap.get(row.program_item_id) ?? []
    list.push(row)
    itemEquipmentMap.set(row.program_item_id, list)
  }

  return (
    <div className={`grid grid-cols-1 gap-6 ${isFestival ? 'max-w-7xl lg:grid-cols-2' : 'max-w-5xl lg:grid-cols-2'}`}>
      <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{gig.name}</h1>
            {isFestival && <Badge variant="gold">Festival</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
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
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{gig.description}</p>
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

      {isFestival && (
        <div className={`grid gap-4 ${isAdmin ? 'xl:grid-cols-[auto_1fr]' : ''}`}>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href={`/api/festival-report/${gig.id}`} target="_blank">PDF-rapport</Link>
            </Button>
          </div>

          {isAdmin && (
            <FestivalReportSharingPanel
              gigId={gig.id}
              initialEnabled={gig.public_report_enabled}
              initialPublicPath={gig.public_report_slug ? `/festival-report/${gig.public_report_slug}/pdf` : null}
            />
          )}
        </div>
      )}

      <div className={`grid gap-6 ${isFestival ? 'xl:grid-cols-[1fr_1fr]' : ''}`}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">{isFestival ? 'Festivalcrew' : 'Personell'}</CardTitle>
            {isAdmin && (
              <AddPersonnelDialog
                gigId={gig.id}
                gigStartDate={gig.start_date}
                gigEndDate={gig.end_date}
                currentUserId={user!.id}
                buttonLabel={isFestival ? 'Legg til festivalcrew' : 'Legg til teknikar'}
                dialogTitle={isFestival ? 'Legg til festivalcrew' : 'Legg til teknikar'}
              />
            )}
          </CardHeader>
          <CardContent>
            {!personnelRows?.length ? (
              <p className="text-sm text-muted-foreground">
                {isFestival ? 'Ingen teknikarar lagt til på festivalnivå.' : 'Ingen teknikarar lagt til.'}
              </p>
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
                        {row.role_on_gig && <Badge variant="gold">{row.role_on_gig}</Badge>}
                      </div>
                      {isAdmin && <RemovePersonnelButton assignmentId={row.id} />}
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">{isFestival ? 'Festivalutstyr' : 'Utstyr'}</CardTitle>
            {isAdmin && (
              <AddEquipmentDialog
                gigId={gig.id}
                gigStartDate={gig.start_date}
                gigEndDate={gig.end_date}
                buttonLabel={isFestival ? 'Legg til festivalutstyr' : 'Legg til utstyr'}
                dialogTitle={isFestival ? 'Utstyr i festivalpoolen' : 'Utstyr på oppdraget'}
              />
            )}
          </CardHeader>
          <CardContent>
            {!equipmentRows?.length ? (
              <p className="text-sm text-muted-foreground">
                {isFestival ? 'Ingen utstyr lagt til på festivalnivå.' : 'Ingen utstyr lagt til.'}
              </p>
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
      </div>

      {isFestival && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-base">Program</CardTitle>
              <p className="text-sm text-muted-foreground">
                Venue, tidspunkt, teknikarar og utstyr blir styrt per programpost.
              </p>
            </div>
            {isAdmin && (
              <ProgramItemDialog
                gigId={gig.id}
                festivalStartDate={gig.start_date}
                festivalEndDate={gig.end_date}
              />
            )}
          </CardHeader>
          <CardContent>
            {programItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ingen programpostar oppretta enno.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {programItems.map((item) => {
                  const personnel = itemPersonnelMap.get(item.id) ?? []
                  const equipment = itemEquipmentMap.get(item.id) ?? []

                  return (
                    <div key={item.id} className="rounded-xl border border-white/8 bg-surface-low p-4">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold">{item.name}</h3>
                            {item.venue && <Badge variant="outline">{item.venue}</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatProgramItemRange(item.start_at, item.end_at)}
                          </p>
                          {item.description && (
                            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                              {item.description}
                            </p>
                          )}
                        </div>
                        {isAdmin && (
                          <div className="flex flex-wrap gap-2">
                            <ProgramItemDialog
                              gigId={gig.id}
                              festivalStartDate={gig.start_date}
                              festivalEndDate={gig.end_date}
                              item={item}
                            />
                            <RemoveProgramItemButton itemId={item.id} />
                          </div>
                        )}
                      </div>

                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <div className="rounded-lg border border-white/8 bg-background/40 p-3">
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">Teknikarar</p>
                            {isAdmin && (
                              <AddProgramItemPersonnelDialog
                                programItemId={item.id}
                                parentGigId={gig.id}
                                itemStartAt={item.start_at}
                                itemEndAt={item.end_at}
                              />
                            )}
                          </div>
                          {personnel.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Ingen teknikarar på denne posten.</p>
                          ) : (
                            <ul className="divide-y divide-white/8">
                              {personnel.map((row) => {
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
                                      {row.role_on_item && <Badge variant="gold">{row.role_on_item}</Badge>}
                                    </div>
                                    {isAdmin && <RemoveProgramItemPersonnelButton assignmentId={row.id} />}
                                  </li>
                                )
                              })}
                            </ul>
                          )}
                        </div>

                        <div className="rounded-lg border border-white/8 bg-background/40 p-3">
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">Utstyr</p>
                            {isAdmin && (
                              <AddProgramItemEquipmentDialog
                                programItemId={item.id}
                                parentGigId={gig.id}
                                gigStartDate={gig.start_date}
                                gigEndDate={gig.end_date}
                                itemStartAt={item.start_at}
                                itemEndAt={item.end_at}
                              />
                            )}
                          </div>
                          {equipment.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Ingen utstyr knytt til denne posten.</p>
                          ) : (
                            <ul className="divide-y divide-white/8">
                              {equipment.map((row) => {
                                const itemEquipment = Array.isArray(row.equipment) ? row.equipment[0] : row.equipment
                                return (
                                  <li key={row.id} className="flex items-center justify-between py-2">
                                    <div>
                                      <p className="text-sm font-medium">{itemEquipment?.name ?? 'Ukjend'}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {row.quantity_needed} stk
                                        {itemEquipment?.category && ` · ${itemEquipment.category}`}
                                      </p>
                                    </div>
                                    {isAdmin && <RemoveProgramItemEquipmentButton assignmentId={row.id} />}
                                  </li>
                                )
                              })}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

        <GigFilesSection
          gigId={gig.id}
          isAdmin={isAdmin}
          initialFiles={fileRows ?? []}
        />
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <GigCommentsSection
          gigId={gig.id}
          currentUserId={user!.id}
          currentUserName={profile?.full_name ?? null}
          currentUserAvatarUrl={profile?.avatar_url ?? null}
          isAdmin={isAdmin}
          initialComments={commentRows ?? []}
        />
      </div>
    </div>
  )
}
