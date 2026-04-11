import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GigForm from '@/components/gigs/GigForm'

export default async function EditGigPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard/gigs')

  const { data: gig } = await supabase.from('gigs').select('*').eq('id', id).single()
  if (!gig) notFound()

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Endre oppdrag</h1>
      <GigForm gig={gig} />
    </div>
  )
}
