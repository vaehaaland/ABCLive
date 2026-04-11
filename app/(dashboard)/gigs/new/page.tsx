import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GigForm from '@/components/gigs/GigForm'

export default async function NewGigPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard/gigs')

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Nytt oppdrag</h1>
      <GigForm />
    </div>
  )
}
