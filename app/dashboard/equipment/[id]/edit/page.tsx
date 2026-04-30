import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EquipmentForm from '@/components/EquipmentForm'
import type { Equipment } from '@/types/database'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: equipment } = await supabase
    .from('equipment')
    .select('name')
    .eq('id', id)
    .maybeSingle() as { data: { name: string } | null, error: unknown }

  return {
    title: equipment?.name ? `Endre utstyr: ${equipment.name}` : 'Endre utstyr',
  }
}

export default async function EditEquipmentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single() as { data: { role: string } | null, error: unknown }
  if (profile?.role !== 'admin') redirect('/dashboard/gigs')

  const { data: equipment } = await supabase.from('equipment').select('*').eq('id', id).single() as { data: Equipment | null, error: unknown }
  if (!equipment) notFound()

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Endre utstyr</h1>
      <EquipmentForm equipment={equipment} />
    </div>
  )
}
