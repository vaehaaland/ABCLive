import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'

// Fetches the caller's profile and redirects away if they aren't a superadmin.
// Use at the top of any Server Component or Server Action under /dashboard/admin.
export async function requireSuperadmin(): Promise<Profile> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  if (!profile?.is_superadmin) redirect('/dashboard/gigs')

  return profile
}
