import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EquipmentTable } from '@/components/equipment/EquipmentTable'
import { EquipmentRequestsSection } from '@/components/equipment/EquipmentRequestsSection'
import { PlusIcon } from 'lucide-react'
import type { Equipment } from '@/types/database'
import type { EnrichedEquipment, ActiveBooking } from '@/components/equipment/EquipmentTable'
import { getPendingRequestsForCompany } from '@/app/actions/equipment-requests'

export default async function EquipmentPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single() as { data: { role: string } | null; error: unknown }

  if (profile?.role !== 'admin') redirect('/dashboard/gigs')

  const resolvedParams = await searchParams

  // Fetch user's company memberships to support per-company filter
  const { data: memberships } = await supabase
    .from('company_memberships')
    .select('role, company_id, companies(id, name, slug)')
    .eq('profile_id', user!.id)

  type MemberCompany = { id: string; name: string; slug: string }
  const userCompanies: MemberCompany[] = (memberships ?? [])
    .map((m) => (m.companies as MemberCompany | null))
    .filter((c): c is MemberCompany => c !== null)

  const adminCompanies = (memberships ?? [])
    .filter((m) => m.role === 'admin')
    .map((m) => (m.companies as MemberCompany | null))
    .filter((c): c is MemberCompany => c !== null)

  const showCompanyFilter = userCompanies.length > 1
  const companyFilter = resolvedParams.company ?? null

  let equipmentQuery = supabase
    .from('equipment')
    .select('*')
    .order('category', { nullsFirst: false })
    .order('name')

  if (companyFilter) {
    equipmentQuery = equipmentQuery.eq('company_id', companyFilter) as typeof equipmentQuery
  }

  const { data: equipment } = await equipmentQuery as { data: Equipment[] | null; error: unknown }

  const today = new Date().toISOString().split('T')[0]

  const { data: activeBookings } = await supabase
    .from('gig_equipment')
    .select('equipment_id, quantity_needed, gigs(venue, start_date, end_date, status)')
    .filter('gigs.start_date', 'lte', today)
    .filter('gigs.end_date', 'gte', today)
    .filter('gigs.status', 'eq', 'confirmed') as {
      data: {
        equipment_id: string
        quantity_needed: number
        gigs: {
          venue: string | null
          start_date: string
          end_date: string
          status: string
        } | null
      }[] | null
      error: unknown
    }

  const bookingMap = new Map<string, ActiveBooking>()
  for (const row of activeBookings ?? []) {
    if (!row.gigs) continue
    if (!bookingMap.has(row.equipment_id)) {
      bookingMap.set(row.equipment_id, {
        venue: row.gigs.venue,
        start_date: row.gigs.start_date,
        end_date: row.gigs.end_date,
        quantity_needed: row.quantity_needed,
      })
    }
  }

  const allEquipment: Equipment[] = equipment ?? []

  const enriched: EnrichedEquipment[] = allEquipment.map((e) => ({
    ...e,
    activeBooking: bookingMap.get(e.id) ?? null,
  }))

  // Fetch pending requests for all companies the user admins
  const pendingRequests = (
    await Promise.all(adminCompanies.map((c) => getPendingRequestsForCompany(c.id)))
  ).flat()

  return (
    <>
      <div className="border-b border-border bg-surface-low -mx-4 -mt-8">
        <div className="px-6 flex gap-0">
          <Link href="/dashboard/equipment" className="relative px-4 py-2.5 text-sm font-medium text-primary border-b-2 border-primary -mb-px">Utstyr</Link>
          <Link href="/dashboard/personnel" className="relative px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent -mb-px">Personell</Link>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-8 w-full">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-heading font-extrabold text-[1.75rem] leading-none tracking-[-0.035em]">Utstyr</h1>
            <p className="text-sm text-muted-foreground mt-1">Oversikt over produksjonsutstyr og tilgjengelegheit</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/equipment/new"><PlusIcon className="size-4" />Legg til utstyr</Link>
          </Button>
        </div>

        <EquipmentRequestsSection requests={pendingRequests} />

        {showCompanyFilter && (
          <div className="flex flex-wrap gap-2 mb-5">
            <Link
              href="/dashboard/equipment"
              className={`rounded-full px-3 py-1 text-sm font-medium border transition-colors ${
                !companyFilter
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-white/15 text-muted-foreground hover:text-foreground'
              }`}
            >
              Alle
            </Link>
            {userCompanies.map((c) => (
              <Link
                key={c.id}
                href={`/dashboard/equipment?company=${c.id}`}
                className={`rounded-full px-3 py-1 text-sm font-medium border transition-colors ${
                  companyFilter === c.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-white/15 text-muted-foreground hover:text-foreground'
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        {allEquipment.length === 0 ? (
          <div className="rounded-xl bg-surface-container p-12 flex flex-col items-center gap-3 text-center">
            <p className="font-heading text-lg font-semibold text-foreground">Ingen utstyr registrert</p>
            <p className="text-sm text-muted-foreground max-w-xs">Legg til det første utstyret i inventaret for å kome i gang med sporing.</p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden bg-surface-container">
            <EquipmentTable equipment={enriched} />
          </div>
        )}
      </div>
    </>
  )
}
