'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { GigEquipmentWithRequest } from '@/types/database'

export async function getPendingRequestsForCompany(
  companyId: string,
): Promise<GigEquipmentWithRequest[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Caller must be admin of this company or superadmin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_superadmin')
    .eq('id', user.id)
    .single()

  const { data: membership } = await supabase
    .from('company_memberships')
    .select('role')
    .eq('profile_id', user.id)
    .eq('company_id', companyId)
    .single()

  if (!profile?.is_superadmin && membership?.role !== 'admin') return []

  // Use admin client because the gig_equipment RLS is scoped to the requesting
  // gig's company admin, not the equipment-owning company admin.
  const admin = createAdminClient()
  const { data } = await admin
    .from('gig_equipment')
    .select(`
      *,
      equipment!inner(*, company:company_id(*)),
      requester:profiles!requested_by(id, full_name, nickname),
      gig:gigs(id, name, start_date, end_date, company_id, company:company_id(id, name, slug))
    `)
    .eq('equipment.company_id', companyId)
    .eq('request_status', 'pending')
    .order('gig_id')

  return (data ?? []) as unknown as GigEquipmentWithRequest[]
}

export async function approveEquipmentRequest(
  gigEquipmentId: string,
  note?: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const admin = createAdminClient()

  // Fetch the row to verify the caller is admin of the equipment's company
  const { data: row } = await admin
    .from('gig_equipment')
    .select('gig_id, equipment_id, request_status')
    .eq('id', gigEquipmentId)
    .single()

  if (!row || row.request_status !== 'pending') return { error: 'Request not found or already resolved' }

  const { data: equip } = await admin
    .from('equipment')
    .select('company_id')
    .eq('id', row.equipment_id)
    .single()

  if (!equip) return { error: 'Equipment not found' }

  // Verify caller is admin of the equipment-owning company or superadmin
  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('is_superadmin')
    .eq('id', user.id)
    .single()

  const { data: membership } = await supabase
    .from('company_memberships')
    .select('role')
    .eq('profile_id', user.id)
    .eq('company_id', equip.company_id)
    .single()

  if (!callerProfile?.is_superadmin && membership?.role !== 'admin') {
    return { error: 'Unauthorized: not admin of equipment-owning company' }
  }

  const { error } = await admin
    .from('gig_equipment')
    .update({
      request_status: 'approved',
      responded_by: user.id,
      responded_at: new Date().toISOString(),
      response_note: note ?? null,
    })
    .eq('id', gigEquipmentId)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/gigs/${row.gig_id}`)
  revalidatePath('/dashboard/equipment')
  return {}
}

export async function denyEquipmentRequest(
  gigEquipmentId: string,
  note?: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const admin = createAdminClient()

  const { data: row } = await admin
    .from('gig_equipment')
    .select('gig_id, equipment_id, request_status')
    .eq('id', gigEquipmentId)
    .single()

  if (!row || row.request_status !== 'pending') return { error: 'Request not found or already resolved' }

  const { data: equip } = await admin
    .from('equipment')
    .select('company_id')
    .eq('id', row.equipment_id)
    .single()

  if (!equip) return { error: 'Equipment not found' }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('is_superadmin')
    .eq('id', user.id)
    .single()

  const { data: membership } = await supabase
    .from('company_memberships')
    .select('role')
    .eq('profile_id', user.id)
    .eq('company_id', equip.company_id)
    .single()

  if (!callerProfile?.is_superadmin && membership?.role !== 'admin') {
    return { error: 'Unauthorized: not admin of equipment-owning company' }
  }

  const { error } = await admin
    .from('gig_equipment')
    .update({
      request_status: 'denied',
      responded_by: user.id,
      responded_at: new Date().toISOString(),
      response_note: note ?? null,
    })
    .eq('id', gigEquipmentId)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/gigs/${row.gig_id}`)
  revalidatePath('/dashboard/equipment')
  return {}
}
