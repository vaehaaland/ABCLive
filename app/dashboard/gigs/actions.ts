'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { GigStatus } from '@/types/database'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Forbidden')
  return supabase
}

export async function updateGigStatus(gigId: string, newStatus: GigStatus) {
  const supabase = await requireAdmin()
  const { error } = await supabase
    .from('gigs').update({ status: newStatus }).eq('id', gigId)
  if (error) throw error
  revalidatePath(`/dashboard/gigs/${gigId}`)
}

export async function convertToFestival(gigId: string) {
  const supabase = await requireAdmin()
  const { error } = await supabase
    .from('gigs').update({ gig_type: 'festival' }).eq('id', gigId)
  if (error) throw error
  revalidatePath(`/dashboard/gigs/${gigId}`)
}

export async function deleteGig(gigId: string) {
  const supabase = await requireAdmin()
  const { error } = await supabase
    .from('gigs').update({ deleted_at: new Date().toISOString() }).eq('id', gigId)
  if (error) throw error
  revalidatePath('/dashboard/gigs')
  revalidatePath(`/dashboard/gigs/${gigId}`)
}

export async function restoreGig(gigId: string) {
  const supabase = await requireAdmin()
  const { error } = await supabase
    .from('gigs').update({ deleted_at: null }).eq('id', gigId)
  if (error) throw error
  revalidatePath('/dashboard/gigs')
  revalidatePath(`/dashboard/gigs/${gigId}`)
}
