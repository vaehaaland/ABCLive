'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function toggleEquipmentPacked(
  assignmentId: string,
  gigId: string,
  packed: boolean,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikkje innlogga')

  const admin = createAdminClient()
  const { error } = await admin
    .from('gig_equipment')
    .update({ packed })
    .eq('id', assignmentId) as { data: unknown; error: { message: string } | null }

  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/gigs/${gigId}`)
}
