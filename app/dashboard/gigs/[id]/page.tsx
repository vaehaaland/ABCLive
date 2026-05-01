import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AddEquipmentDialog from '@/components/gigs/AddEquipmentDialog'
import PersonnelAddDropdown from '@/components/gigs/PersonnelAddDropdown'
import AddProgramItemPersonnelDialog from '@/components/gigs/AddProgramItemPersonnelDialog'
import AddProgramItemEquipmentDialog from '@/components/gigs/AddProgramItemEquipmentDialog'
import ProgramItemDialog from '@/components/gigs/ProgramItemDialog'
import RemovePersonnelButton from '@/components/gigs/RemovePersonnelButton'
import RemoveExternalPersonnelButton from '@/components/gigs/RemoveExternalPersonnelButton'
import EditPersonnelRoleInline from '@/components/gigs/EditPersonnelRoleInline'
import RemoveProgramItemButton from '@/components/gigs/RemoveProgramItemButton'
import RemoveProgramItemPersonnelButton from '@/components/gigs/RemoveProgramItemPersonnelButton'
import RemoveProgramItemEquipmentButton from '@/components/gigs/RemoveProgramItemEquipmentButton'
import PersonHoverCard from '@/components/PersonHoverCard'
import { Avatar } from '@/components/ui/avatar'
import FestivalReportSharingPanel from '@/components/gigs/FestivalReportSharingPanel'
import GigFilesSection from '@/components/gigs/GigFilesSection'
import GigCommentsSection from '@/components/gigs/GigCommentsSection'
import GigChecklistSection from '@/components/gigs/GigChecklistSection'
import GigActionsDropdown from '@/components/gigs/GigActionsDropdown'
import RestoreGigButton from '@/components/gigs/RestoreGigButton'
import GigEquipmentList from '@/components/gigs/GigEquipmentList'
import GigAssignmentRespondDialog from '@/components/gigs/GigAssignmentRespondDialog'
import type { GigFile, GigProgramItem, GigStatus, GigType, GigCommentWithAuthor, GigChecklistItem, GigExternalPersonnel } from '@/types/database'
import { getGigDisplayStatus, statusLabels } from '@/lib/gig-status'
import { CheckCircle2, Clock3, Cloud, XCircle } from 'lucide-react'
import { CompanyBadge } from '@/components/CompanyBadge'

type GigChecklistItemWithChecker = GigChecklistItem & {
  checker: { id: string; full_name: string | null; nickname: string | null } | null
}
import { getDisplayName } from '@/lib/utils'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: gig } = await supabase
    .from('gigs')
    .select('name')
    .eq('id', id)
    .maybeSingle() as { data: { name: string } | null, error: unknown }

  return {
    title: gig?.name ?? 'Oppdrag',
  }
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
    nickname: string | null
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
  icloud_uid: string | null
  company_id: string
  deleted_at: string | null
  company: { id: string; name: string; slug: string } | null
}

type GigPersonnelRow = {
  id: string
  role_on_gig: string | null
  notes: string | null
  assignment_status: 'pending' | 'accepted' | 'declined'
  responded_at: string | null
  response_note: string | null
  profiles: {
    id: string
    full_name: string | null
    nickname: string | null
    phone: string | null
    role: string
    avatar_url?: string | null
  } | {
    id: string
    full_name: string | null
    nickname: string | null
    phone: string | null
    role: string
    avatar_url?: string | null
  }[] | null
}

type GigEquipmentRow = {
  id: string
  quantity_needed: number
  notes: string | null
  packed: boolean
  request_status: string | null
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
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ showDeclined?: string }>
}) {
  const { id } = await params
  const resolvedSearchParams = await searchParams
  const supabase = await createClient()
  const showDeclined = resolvedSearchParams.showDeclined === '1'

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, avatar_url')
    .eq('id', user!.id)
    .single() as { data: { role: string; full_name: string | null; avatar_url: string | null } | null, error: unknown }

  const isAdmin = profile?.role === 'admin'

  const gigSelect = isAdmin
    ? 'id, name, gig_type, public_report_enabled, public_report_slug, venue, client, start_date, end_date, description, status, price, price_notes, created_by, created_at, icloud_uid, company_id, deleted_at, company:company_id(id, name, slug)'
    : 'id, name, gig_type, public_report_enabled, public_report_slug, venue, client, start_date, end_date, description, status, created_by, created_at, icloud_uid, company_id, deleted_at, company:company_id(id, name, slug)'

  const { data: gig } = await supabase
    .from('gigs')
    .select(gigSelect)
    .eq('id', id)
    .single() as { data: GigDetailRow | null, error: unknown }

  if (!gig) notFound()
  if (!isAdmin && gig.deleted_at) notFound()

  const { data: personnelRows } = await supabase
    .from('gig_personnel')
    .select('id, role_on_gig, notes, assignment_status, responded_at, response_note, profiles!gig_personnel_profile_id_fkey(id, full_name, nickname, phone, role, avatar_url)')
    .eq('gig_id', id) as { data: GigPersonnelRow[] | null, error: unknown }

  const visiblePersonnelRows = (personnelRows ?? []).filter((row) => showDeclined || row.assignment_status !== 'declined')
  const declinedCount = (personnelRows ?? []).filter((row) => row.assignment_status === 'declined').length

  const myAssignment = !isAdmin
    ? (personnelRows ?? []).find((row) => {
        const person = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
        return person?.id === user!.id
      })
    : undefined

  const { data: equipmentRows } = await supabase
    .from('gig_equipment')
    .select('id, quantity_needed, notes, packed, request_status, equipment(id, name, category, quantity)')
    .eq('gig_id', id) as { data: GigEquipmentRow[] | null, error: unknown }

  const { data: fileRows } = await supabase
    .from('gig_files')
    .select('*')
    .eq('gig_id', id)
    .order('created_at', { ascending: false }) as { data: GigFile[] | null, error: unknown }

  const { data: commentRows } = await supabase
    .from('gig_comments')
    .select('*, profiles(id, full_name, nickname, avatar_url)')
    .eq('gig_id', id)
    .order('created_at', { ascending: true }) as { data: GigCommentWithAuthor[] | null, error: unknown }

  const { data: checklistRows } = await supabase
    .from('gig_checklist_items')
    .select('*, checker:checked_by(id, full_name, nickname)')
    .eq('gig_id', id)
    .order('order_index', { ascending: true }) as { data: GigChecklistItemWithChecker[] | null, error: unknown }

  const { count: templateCount } = await supabase
    .from('checklist_template_items')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)

  const { data: externalPersonnelRows } = await supabase
    .from('gig_external_personnel')
    .select('*')
    .eq('gig_id', gig.id)
    .order('created_at', { ascending: true }) as { data: GigExternalPersonnel[] | null, error: unknown }

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
          .select('id, program_item_id, role_on_item, notes, profiles(id, full_name, nickname, phone, role, avatar_url)')
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

  const displayStatus = getGigDisplayStatus(gig, format(new Date(), 'yyyy-MM-dd'))

  return (
    <div className={`grid grid-cols-1 gap-6 ${isFestival ? 'max-w-7xl lg:grid-cols-2' : 'max-w-5xl lg:grid-cols-2'}`}>
      <div className="flex flex-col gap-6">

      {isAdmin && gig.deleted_at && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-destructive font-medium">
            Dette oppdraget er sletta ({format(new Date(gig.deleted_at), 'd. MMM yyyy', { locale: nb })})
          </p>
          <RestoreGigButton gigId={gig.id} />
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h1 className="type-h2">{gig.name}</h1>
            {isFestival && <Badge variant="gold">Festival</Badge>}
            <CompanyBadge company={gig.company} size="xs" />
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
          {gig.icloud_uid && (
            <Cloud className="h-4 w-4 text-muted-foreground/50 shrink-0" aria-label="Synkronisert frå iCloud" />
          )}
          <Badge variant={
            displayStatus === 'confirmed' ? 'default' :
            displayStatus === 'live' ? 'live' :
            displayStatus === 'completed' ? 'success' :
            displayStatus === 'cancelled' ? 'destructive' :
            'secondary'
          }>
            {statusLabels[displayStatus]}
          </Badge>
          {isAdmin && !gig.deleted_at && (
            <>
              <GigActionsDropdown gigId={gig.id} status={gig.status} gigType={gig.gig_type} />
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/gigs/${gig.id}/edit`}>Endre</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {gig.description && (
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{gig.description}</p>
      )}

      {myAssignment?.assignment_status === 'pending' && (
        <GigAssignmentRespondDialog assignmentId={myAssignment.id} />
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
            <div className="flex items-center gap-2">
              <CardTitle>{isFestival ? 'Festivalcrew' : 'Personell'}</CardTitle>
              {declinedCount > 0 && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href={showDeclined ? `/dashboard/gigs/${gig.id}` : `/dashboard/gigs/${gig.id}?showDeclined=1`}>
                    {showDeclined ? 'Skjul avslått' : `Vis avslått (${declinedCount})`}
                  </Link>
                </Button>
              )}
            </div>
            {isAdmin && (
              <PersonnelAddDropdown
                gigId={gig.id}
                gigStartDate={gig.start_date}
                gigEndDate={gig.end_date}
                dialogTitle={isFestival ? 'Legg til festivalcrew' : 'Legg til teknikar'}
              />
            )}
          </CardHeader>
          <CardContent>
            {!visiblePersonnelRows.length && !(externalPersonnelRows ?? []).length ? (
              <p className="text-sm text-muted-foreground">
                {declinedCount > 0
                  ? 'Alle forespurnader er avslått i gjeldande visning.'
                  : isFestival ? 'Ingen teknikarar lagt til på festivalnivå.' : 'Ingen teknikarar lagt til.'}
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {visiblePersonnelRows.map((row) => {
                  const person = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
                  const statusBadge = row.assignment_status === 'accepted'
                    ? <Badge variant="success"><CheckCircle2 className="h-3 w-3" /></Badge>
                    : row.assignment_status === 'declined'
                      ? <Badge variant="destructive"><XCircle className="h-3 w-3" /></Badge>
                      : <Badge variant="gold"><Clock3 className="h-3 w-3" /></Badge>
                  return (
                    <li key={row.id} className="flex items-center justify-between py-1.5">
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <div className="flex flex-wrap items-center gap-2.5">
                          {person?.id ? (
                            <PersonHoverCard profileId={person.id} name={person.full_name}>
                              <div className="flex items-center gap-2.5">
                                <Avatar src={person.avatar_url} name={person.full_name} size="sm" id={person.id} />
                                <p className="text-sm font-medium">{getDisplayName(person, 'Ukjend')}</p>
                              </div>
                            </PersonHoverCard>
                          ) : (
                            <p className="text-sm font-medium">Ukjend</p>
                          )}
                          {isAdmin
                            ? <EditPersonnelRoleInline assignmentId={row.id} currentRole={row.role_on_gig ?? null} />
                            : row.role_on_gig && <Badge variant="role">{row.role_on_gig}</Badge>
                          }
                          {statusBadge}
                        </div>
                        {row.assignment_status === 'declined' && row.response_note && (
                          <p className="pl-0.5 type-label text-muted-foreground italic">
                            &ldquo;{row.response_note}&rdquo;
                          </p>
                        )}
                      </div>
                      {isAdmin && <RemovePersonnelButton assignmentId={row.id} />}
                    </li>
                  )
                })}
              </ul>
            )}
            {(externalPersonnelRows ?? []).length > 0 && (
              <>
                <div className="my-3 border-t" />
                <ul className="flex flex-col gap-1">
                  {(externalPersonnelRows ?? []).map((row) => (
                    <li key={row.id} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2.5">
                        <p className="text-sm font-medium">{row.name}</p>
                        {row.role_on_gig && <Badge variant="role">{row.role_on_gig}</Badge>}
                        <Badge variant="outline" className="type-label">Ekstern</Badge>
                        {row.company && (
                          <span className="type-label text-muted-foreground">{row.company}</span>
                        )}
                      </div>
                      {isAdmin && <RemoveExternalPersonnelButton id={row.id} gigId={gig.id} />}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>{isFestival ? 'Festivalutstyr' : 'Utstyr'}</CardTitle>
            {isAdmin && (
              <AddEquipmentDialog
                gigId={gig.id}
                gigStartDate={gig.start_date}
                gigEndDate={gig.end_date}
                gigCompanyId={gig.company_id}
                dialogTitle={isFestival ? 'Utstyr i festivalpoolen' : 'Utstyr på oppdraget'}
              />
            )}
          </CardHeader>
          <CardContent>
            <GigEquipmentList
              initialRows={equipmentRows ?? []}
              gigId={gig.id}
              isAdmin={isAdmin}
              emptyLabel={isFestival ? 'Ingen utstyr lagt til på festivalnivå.' : 'Ingen utstyr lagt til.'}
            />
          </CardContent>
        </Card>
      </div>


      {isFestival && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle>Program</CardTitle>
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
                                            <Avatar src={person.avatar_url} name={person.full_name} size="sm" id={person.id} />
                                            <p className="text-sm font-medium">{getDisplayName(person, 'Ukjend')}</p>
                                          </div>
                                        </PersonHoverCard>
                                      ) : (
                                        <p className="text-sm font-medium">Ukjend</p>
                                      )}
                                      {row.role_on_item && <Badge variant="role">{row.role_on_item}</Badge>}
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
                                      <p className="type-label text-muted-foreground">
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

      <div className="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start">
        <GigChecklistSection
          gigId={gig.id}
          isAdmin={isAdmin}
          initialItems={checklistRows ?? []}
          hasTemplate={(templateCount ?? 0) > 0}
        />
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

