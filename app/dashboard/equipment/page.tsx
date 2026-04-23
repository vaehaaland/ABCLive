import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EquipmentTable } from '@/components/equipment/EquipmentTable'
import { PlusIcon } from 'lucide-react'
import type { Equipment } from '@/types/database'
import type { EnrichedEquipment, ActiveBooking } from '@/components/equipment/EquipmentTable'

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

  // Build enriched equipment list
  const enriched: EnrichedEquipment[] = allEquipment.map((e) => ({
    ...e,
    activeBooking: bookingMap.get(e.id) ?? null,
  }))

  return (
    <>
      {/* Subnav — break out of layout padding to go full-width */}
      <div className="border-b border-border bg-surface-low -mx-4 -mt-8">
        <div className="max-w-[1200px] mx-auto px-6 flex gap-0">
          <Link href="/dashboard/equipment" className="relative px-4 py-2.5 text-sm font-medium text-primary border-b-2 border-primary -mb-px">Utstyr</Link>
          <Link href="/dashboard/personnel" className="relative px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent -mb-px">Personell</Link>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-8 w-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-heading font-extrabold text-[1.75rem] leading-none tracking-[-0.035em]">Utstyr</h1>
            <p className="text-sm text-muted-foreground mt-1">Oversikt over produksjonsutstyr og tilgjengelegheit</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/equipment/new"><PlusIcon className="size-4" />Legg til utstyr</Link>
          </Button>
        </div>

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
