'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Company, CompanyMembershipWithProfile, UserRole } from '@/types/database'
import { ABC_STUDIO_ID } from '@/lib/companies'

export async function getMyCompanies(): Promise<Company[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('companies')
    .select('*')
    .order('name')

  return data ?? []
}

export async function getCompanyMembers(companyId: string): Promise<CompanyMembershipWithProfile[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('company_memberships')
    .select('*, profiles(id, full_name, nickname, avatar_url, email)')
    .eq('company_id', companyId)
    .order('created_at')

  return (data ?? []) as CompanyMembershipWithProfile[]
}

async function requireSuperadmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_superadmin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_superadmin) throw new Error('Superadmin required')
  return user
}

// Keeps profiles.role in sync with company_memberships so existing code
// that reads profile.role continues to work during the transition period.
async function syncProfileRole(profileId: string, admin: ReturnType<typeof createAdminClient>) {
  const { data: memberships } = await admin
    .from('company_memberships')
    .select('role')
    .eq('profile_id', profileId)

  const isAdminAnywhere = (memberships ?? []).some(m => m.role === 'admin')
  await admin
    .from('profiles')
    .update({ role: isAdminAnywhere ? 'admin' : 'technician' })
    .eq('id', profileId)
}

export async function addMembership(
  profileId: string,
  companyId: string,
  role: UserRole,
): Promise<{ error?: string }> {
  try {
    await requireSuperadmin()
  } catch {
    return { error: 'Unauthorized' }
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from('company_memberships')
    .upsert({ profile_id: profileId, company_id: companyId, role }, { onConflict: 'profile_id,company_id' })

  if (error) return { error: error.message }

  // Set primary_company_id if the profile doesn't have one yet
  await admin
    .from('profiles')
    .update({ primary_company_id: companyId })
    .eq('id', profileId)
    .is('primary_company_id', null)

  await syncProfileRole(profileId, admin)
  revalidatePath('/dashboard/admin/users')
  return {}
}

export async function updateMembershipRole(
  membershipId: string,
  role: UserRole,
): Promise<{ error?: string }> {
  try {
    await requireSuperadmin()
  } catch {
    return { error: 'Unauthorized' }
  }

  const admin = createAdminClient()

  const { data: membership, error: fetchError } = await admin
    .from('company_memberships')
    .select('profile_id')
    .eq('id', membershipId)
    .single()

  if (fetchError || !membership) return { error: 'Membership not found' }

  const { error } = await admin
    .from('company_memberships')
    .update({ role })
    .eq('id', membershipId)

  if (error) return { error: error.message }

  await syncProfileRole(membership.profile_id, admin)
  revalidatePath('/dashboard/admin/users')
  return {}
}

export async function removeMembership(membershipId: string): Promise<{ error?: string }> {
  try {
    await requireSuperadmin()
  } catch {
    return { error: 'Unauthorized' }
  }

  const admin = createAdminClient()

  const { data: membership, error: fetchError } = await admin
    .from('company_memberships')
    .select('profile_id, company_id')
    .eq('id', membershipId)
    .single()

  if (fetchError || !membership) return { error: 'Membership not found' }

  // Don't allow removing the only remaining membership (must keep at least ABC Studio)
  const { count } = await admin
    .from('company_memberships')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', membership.profile_id)

  if ((count ?? 0) <= 1) {
    return { error: 'Cannot remove the last company membership' }
  }

  const { error } = await admin
    .from('company_memberships')
    .delete()
    .eq('id', membershipId)

  if (error) return { error: error.message }

  // If primary_company_id was this company, reset to ABC Studio
  await admin
    .from('profiles')
    .update({ primary_company_id: ABC_STUDIO_ID })
    .eq('id', membership.profile_id)
    .eq('primary_company_id', membership.company_id)

  await syncProfileRole(membership.profile_id, admin)
  revalidatePath('/dashboard/admin/users')
  return {}
}
