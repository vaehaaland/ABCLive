import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GigForm from '@/components/gigs/GigForm'

export const metadata: Metadata = {
  title: 'Nytt arrangement',
}

export default async function NewGigPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user!.id).single() as unknown as Promise<{
      data: { role: string } | null
      error: unknown
    }>,
    supabase
      .from('company_memberships')
      .select('company_id, role, companies(id, name, slug)')
      .eq('profile_id', user!.id)
      .eq('role', 'admin'),
  ])

  if (profile?.role !== 'admin') redirect('/dashboard/gigs')

  type MemberCompany = { id: string; name: string; slug: string }
  const companies: MemberCompany[] = (memberships ?? [])
    .map((m) => (m.companies as MemberCompany | null))
    .filter((c): c is MemberCompany => c !== null)

  const defaultCompanyId = companies[0]?.id ?? ''

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="type-h2">Nytt arrangement</h1>
      <GigForm isAdmin companies={companies} defaultCompanyId={defaultCompanyId} />
    </div>
  )
}
