import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { eachDayOfInterval, format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { GigStatus, GigType } from '@/types/database'

type ReportGig = {
  id: string
  name: string
  gig_type: GigType
  public_report_enabled: boolean
  public_report_slug: string | null
  public_report_password_hash: string | null
  venue: string | null
  client: string | null
  start_date: string
  end_date: string
  description: string | null
  status: GigStatus
  price: number | null
  price_notes: string | null
}

type ReportCrewRow = {
  id: string
  role_on_gig: string | null
  profiles: {
    id: string
    full_name: string | null
  } | {
    id: string
    full_name: string | null
  }[] | null
}

type ReportEquipmentRow = {
  id: string
  quantity_needed: number
  equipment: {
    id: string
    name: string
    category: string | null
  } | {
    id: string
    name: string
    category: string | null
  }[] | null
}

type ReportProgramItem = {
  id: string
  gig_id: string
  name: string
  venue: string | null
  start_at: string
  end_at: string
  description: string | null
}

type ReportProgramItemCrewRow = {
  id: string
  program_item_id: string
  role_on_item: string | null
  profiles: {
    id: string
    full_name: string | null
  } | {
    id: string
    full_name: string | null
  }[] | null
}

type ReportProgramItemEquipmentRow = {
  id: string
  program_item_id: string
  quantity_needed: number
  equipment: {
    id: string
    name: string
    category: string | null
  } | {
    id: string
    name: string
    category: string | null
  }[] | null
}

type PublicReportMeta = {
  id: string
  name: string
  start_date: string
  end_date: string
  public_report_enabled: boolean
  public_report_slug: string | null
  public_report_password_hash: string | null
}

export type FestivalReportCrew = {
  id: string
  name: string
  role: string | null
}

export type FestivalReportEquipment = {
  id: string
  name: string
  category: string | null
  quantity: number
}

export type FestivalReportItem = {
  id: string
  name: string
  venue: string | null
  startAt: string
  endAt: string
  description: string | null
  crew: FestivalReportCrew[]
  equipment: FestivalReportEquipment[]
}

export type FestivalReportDay = {
  date: string
  label: string
  items: FestivalReportItem[]
}

export type FestivalReportData = {
  festival: {
    id: string
    name: string
    venue: string | null
    client: string | null
    startDate: string
    endDate: string
    description: string | null
    status: GigStatus
    price: number | null
    priceNotes: string | null
    publicReportEnabled: boolean
    publicReportSlug: string | null
  }
  days: FestivalReportDay[]
  festivalCrew: FestivalReportCrew[]
  festivalEquipment: FestivalReportEquipment[]
}

function normalizeProfile<T extends { id: string; full_name: string | null }>(
  profile: T | T[] | null,
) {
  return Array.isArray(profile) ? profile[0] ?? null : profile
}

function normalizeEquipment<T extends { id: string; name: string; category: string | null }>(
  equipment: T | T[] | null,
) {
  return Array.isArray(equipment) ? equipment[0] ?? null : equipment
}

function toCrew(row: ReportCrewRow | ReportProgramItemCrewRow): FestivalReportCrew | null {
  const profile = normalizeProfile(row.profiles)
  if (!profile) return null

  return {
    id: profile.id,
    name: profile.full_name ?? 'Ukjend',
    role: 'role_on_gig' in row ? row.role_on_gig : row.role_on_item,
  }
}

function toEquipment(row: ReportEquipmentRow | ReportProgramItemEquipmentRow): FestivalReportEquipment | null {
  const equipment = normalizeEquipment(row.equipment)
  if (!equipment) return null

  return {
    id: equipment.id,
    name: equipment.name,
    category: equipment.category,
    quantity: row.quantity_needed,
  }
}

function buildFestivalReportData(
  gig: ReportGig,
  personnelRows: ReportCrewRow[],
  equipmentRows: ReportEquipmentRow[],
  programItems: ReportProgramItem[],
  itemPersonnelRows: ReportProgramItemCrewRow[],
  itemEquipmentRows: ReportProgramItemEquipmentRow[],
): FestivalReportData {
  const festivalCrew = personnelRows
    .map(toCrew)
    .filter((row): row is FestivalReportCrew => row !== null)
    .sort((a, b) => a.name.localeCompare(b.name, 'nb'))

  const festivalEquipment = equipmentRows
    .map(toEquipment)
    .filter((row): row is FestivalReportEquipment => row !== null)
    .sort((a, b) => a.name.localeCompare(b.name, 'nb'))

  const itemCrewMap = new Map<string, FestivalReportCrew[]>()
  for (const row of itemPersonnelRows) {
    const crew = toCrew(row)
    if (!crew) continue
    const list = itemCrewMap.get(row.program_item_id) ?? []
    list.push(crew)
    itemCrewMap.set(row.program_item_id, list)
  }

  const itemEquipmentMap = new Map<string, FestivalReportEquipment[]>()
  for (const row of itemEquipmentRows) {
    const equipment = toEquipment(row)
    if (!equipment) continue
    const list = itemEquipmentMap.get(row.program_item_id) ?? []
    list.push(equipment)
    itemEquipmentMap.set(row.program_item_id, list)
  }

  const itemsByDate = new Map<string, FestivalReportItem[]>()
  for (const item of programItems) {
    const itemDate = item.start_at.slice(0, 10)
    const list = itemsByDate.get(itemDate) ?? []
    list.push({
      id: item.id,
      name: item.name,
      venue: item.venue,
      startAt: item.start_at,
      endAt: item.end_at,
      description: item.description,
      crew: (itemCrewMap.get(item.id) ?? []).sort((a, b) => a.name.localeCompare(b.name, 'nb')),
      equipment: (itemEquipmentMap.get(item.id) ?? []).sort((a, b) => a.name.localeCompare(b.name, 'nb')),
    })
    itemsByDate.set(itemDate, list)
  }

  const days = eachDayOfInterval({
    start: new Date(gig.start_date),
    end: new Date(gig.end_date),
  }).map((date) => {
    const key = format(date, 'yyyy-MM-dd')
    const items = (itemsByDate.get(key) ?? []).sort((a, b) => a.startAt.localeCompare(b.startAt))

    return {
      date: key,
      label: format(date, 'EEEE d. MMMM yyyy', { locale: nb }),
      items,
    }
  })

  return {
    festival: {
      id: gig.id,
      name: gig.name,
      venue: gig.venue,
      client: gig.client,
      startDate: gig.start_date,
      endDate: gig.end_date,
      description: gig.description,
      status: gig.status,
      price: gig.price,
      priceNotes: gig.price_notes,
      publicReportEnabled: gig.public_report_enabled,
      publicReportSlug: gig.public_report_slug,
    },
    days,
    festivalCrew,
    festivalEquipment,
  }
}

async function fetchFestivalReportDataByGigId(
  gigId: string,
  useAdminClient = false,
): Promise<FestivalReportData | null> {
  const supabase = useAdminClient ? createAdminClient() : await createClient()

  const { data: gig } = await supabase
    .from('gigs')
    .select('id, name, gig_type, public_report_enabled, public_report_slug, public_report_password_hash, venue, client, start_date, end_date, description, status, price, price_notes')
    .eq('id', gigId)
    .single() as { data: ReportGig | null, error: unknown }

  if (!gig || gig.gig_type !== 'festival') return null

  const [{ data: personnelRows }, { data: equipmentRows }, { data: programItems }] = await Promise.all([
    supabase
      .from('gig_personnel')
      .select('id, role_on_gig, profiles(id, full_name)')
      .eq('gig_id', gigId) as Promise<{ data: ReportCrewRow[] | null }>,
    supabase
      .from('gig_equipment')
      .select('id, quantity_needed, equipment(id, name, category)')
      .eq('gig_id', gigId) as Promise<{ data: ReportEquipmentRow[] | null }>,
    supabase
      .from('gig_program_items')
      .select('id, gig_id, name, venue, start_at, end_at, description')
      .eq('gig_id', gigId)
      .order('start_at', { ascending: true }) as Promise<{ data: ReportProgramItem[] | null }>,
  ])

  const programItemIds = (programItems ?? []).map((item) => item.id)
  let itemPersonnelRows: ReportProgramItemCrewRow[] = []
  let itemEquipmentRows: ReportProgramItemEquipmentRow[] = []

  if (programItemIds.length > 0) {
    const [{ data: fetchedItemPersonnelRows }, { data: fetchedItemEquipmentRows }] = await Promise.all([
      supabase
        .from('gig_program_item_personnel')
        .select('id, program_item_id, role_on_item, profiles(id, full_name)')
        .in('program_item_id', programItemIds) as Promise<{ data: ReportProgramItemCrewRow[] | null }>,
      supabase
        .from('gig_program_item_equipment')
        .select('id, program_item_id, quantity_needed, equipment(id, name, category)')
        .in('program_item_id', programItemIds) as Promise<{ data: ReportProgramItemEquipmentRow[] | null }>,
    ])

    itemPersonnelRows = fetchedItemPersonnelRows ?? []
    itemEquipmentRows = fetchedItemEquipmentRows ?? []
  }

  return buildFestivalReportData(
    gig,
    personnelRows ?? [],
    equipmentRows ?? [],
    programItems ?? [],
    itemPersonnelRows,
    itemEquipmentRows,
  )
}

export async function getInternalFestivalReportData(gigId: string) {
  return fetchFestivalReportDataByGigId(gigId, false)
}

export async function getPublicFestivalReportMeta(slug: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('gigs')
    .select('id, name, start_date, end_date, public_report_enabled, public_report_slug, public_report_password_hash')
    .eq('public_report_slug', slug)
    .single() as { data: PublicReportMeta | null, error: unknown }

  return data
}

export async function getPublicFestivalReportData(slug: string) {
  const meta = await getPublicFestivalReportMeta(slug)
  if (!meta?.public_report_enabled) return null

  return fetchFestivalReportDataByGigId(meta.id, true)
}

export function generatePublicReportSlug() {
  return randomBytes(18).toString('hex')
}

export function hashPublicReportPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPublicReportPassword(password: string, storedHash: string) {
  const [salt, expectedHash] = storedHash.split(':')
  if (!salt || !expectedHash) return false

  const derivedHash = scryptSync(password, salt, 64)
  const expectedBuffer = Buffer.from(expectedHash, 'hex')
  if (derivedHash.length !== expectedBuffer.length) return false

  return timingSafeEqual(derivedHash, expectedBuffer)
}

export function getPublicReportCookieName(slug: string) {
  return `festival-report-access-${slug}`
}

export function getPublicReportAccessToken(slug: string, storedHash: string) {
  return createHash('sha256').update(`${slug}:${storedHash}`).digest('hex')
}
