'use server'

import { createClient } from '@/lib/supabase/server'
import { refresh, revalidatePath } from 'next/cache'

async function getCallerAndRole() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, isAdmin: false, supabase }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null; error: unknown }

  return { user, isAdmin: profile?.role === 'admin', supabase }
}

export async function addExternalPersonnel(
  gigId: string,
  data: { name: string; company?: string; role_on_gig?: string },
): Promise<{ error?: string }> {
  const { user, isAdmin, supabase } = await getCallerAndRole()

  if (!user || !isAdmin) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('gig_external_personnel')
    .insert({
      gig_id: gigId,
      name: data.name.trim(),
      company: data.company?.trim() || null,
      role_on_gig: data.role_on_gig?.trim() || null,
      created_by: user.id,
    }) as { data: unknown; error: { message: string } | null }

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/gigs/${gigId}`)
  refresh()
  return {}
}

export async function removeExternalPersonnel(
  id: string,
  gigId: string,
): Promise<{ error?: string }> {
  const { user, isAdmin, supabase } = await getCallerAndRole()

  if (!user || !isAdmin) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('gig_external_personnel')
    .delete()
    .eq('id', id) as { data: unknown; error: { message: string } | null }

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/gigs/${gigId}`)
  refresh()
  return {}
}
