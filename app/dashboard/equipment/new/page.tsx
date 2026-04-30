import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EquipmentForm from '@/components/EquipmentForm'

export const metadata: Metadata = {
  title: 'Nytt utstyr',
}

export default async function NewEquipmentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single() as { data: { role: string } | null, error: unknown }
  if (profile?.role !== 'admin') redirect('/dashboard/gigs')

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="type-h2">Nytt utstyr</h1>
      <EquipmentForm />
    </div>
  )
}
