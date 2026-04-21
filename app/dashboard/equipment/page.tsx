import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EquipmentGrid } from '@/components/equipment/EquipmentGrid'
import type { Equipment } from '@/types/database'
import type { EnrichedEquipment, ActiveBooking } from '@/components/equipment/EquipmentCard'

export default async function EquipmentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single() as { data: { role: string } | null; error: unknown }

  if (profile?.role !== 'admin') redirect('/dashboard/gigs')

  const { data: equipment } = await supabase
    .from('equipment')
    .select('*')
    .order('category', { nullsFirst: false })
    .order('name') as { data: Equipment[] | null; error: unknown }

  const today = new Date().toISOString().split('T')[0]

  // Fetch active confirmed gig bookings overlapping with today
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

  // Build a map of equipment_id → first active booking (filter out rows where gigs relation didn't match)
  const bookingMap = new Map<string, ActiveBooking>()
  for (const row of activeBookings ?? []) {
    if (!row.gigs) continue // gig didn't match the filter
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

  // Compute stats
  const totalUnits = allEquipment.reduce((sum, e) => sum + e.quantity, 0)
  const onSiteUnits = allEquipment.reduce((sum, e) => {
    const booking = bookingMap.get(e.id)
    return sum + (booking ? Math.min(booking.quantity_needed, e.quantity) : 0)
  }, 0)
  const utilizationPct = totalUnits > 0 ? Math.round((onSiteUnits / totalUnits) * 100) : 0

  // Build enriched equipment list
  const enriched: EnrichedEquipment[] = allEquipment.map((e) => ({
    ...e,
    activeBooking: bookingMap.get(e.id) ?? null,
  }))

  // Unique categories (sorted, excluding nulls)
  const categories = [
    ...new Set(allEquipment.map((e) => e.category).filter(Boolean) as string[]),
  ].sort()

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-bold">Inventory Management</h1>
          <p className="text-sm text-muted-foreground">
            Real-time tracking of production assets across all venues.
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 shrink-0">
          <div className="text-right">
            <div className="font-heading text-2xl font-bold text-primary">
              {totalUnits.toLocaleString()}
            </div>
            <div className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">
              Total units
            </div>
          </div>
          <div className="text-right">
            <div className="font-heading text-2xl font-bold text-spotlight-gold">
              {utilizationPct}%
            </div>
            <div className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">
              Ute på tur
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <Button asChild>
          <Link href="/dashboard/equipment/new">+ Add New Gear</Link>
        </Button>
        <Button variant="secondary" disabled>
          Run Audit
        </Button>
      </div>

      {/* Grid with filter tabs */}
      {allEquipment.length === 0 ? (
        <div className="rounded-xl bg-surface-container p-12 flex flex-col items-center gap-3 text-center">
          <p className="font-heading text-lg font-semibold text-foreground">Ingen utstyr registrert</p>
          <p className="text-sm text-muted-foreground max-w-xs">Legg til det første utstyret i inventaret for å kome i gang med sporing.</p>
        </div>
      ) : (
        <EquipmentGrid equipment={enriched} categories={categories} />
      )}
    </div>
  )
}
