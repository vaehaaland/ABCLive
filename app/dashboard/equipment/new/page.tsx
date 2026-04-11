import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EquipmentForm from '@/components/EquipmentForm'

export default async function NewEquipmentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard/gigs')

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Nytt utstyr</h1>
      <EquipmentForm />
    </div>
  )
}
