'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export interface ActionResult {
  ok: boolean
  error?: string
}

const ALLOWED_FIELDS = ['name', 'category', 'description', 'quantity'] as const
export type EquipmentField = (typeof ALLOWED_FIELDS)[number]

export type EquipmentFlag = 'needs_service' | 'needs_reorder'

// Supabase's generated Update type for 'equipment' resolves to never without a
// Relationships key — use a typed helper to keep call sites clean.
async function equipmentUpdate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
  patch: Record<string, unknown>,
): Promise<{ error: { message: string } | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from('equipment').update(patch).eq('id', id)
}

async function getAdminOrNull(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null; error: unknown }
  return profile?.role === 'admin' ? user : null
}

export async function toggleEquipmentFlag(
  id: string,
  flag: EquipmentFlag,
  value: boolean,
): Promise<ActionResult> {
  const supabase = await createClient()
  const admin = await getAdminOrNull(supabase)
  if (!admin) return { ok: false, error: 'Ikkje tilgang' }

  const { error } = await equipmentUpdate(supabase, id, { [flag]: value })
  if (error) return { ok: false, error: error.message }

  revalidatePath('/dashboard/equipment')
  return { ok: true }
}

export async function updateEquipmentField(
  id: string,
  field: EquipmentField,
  value: string | number,
): Promise<ActionResult> {
  const supabase = await createClient()
  const admin = await getAdminOrNull(supabase)
  if (!admin) redirect('/login')

  if (!(ALLOWED_FIELDS as readonly string[]).includes(field)) {
    return { ok: false, error: 'Ugyldig felt' }
  }

  let updateValue: string | number | null
  if (field === 'quantity') {
    updateValue = Math.max(1, Number(value))
    if (isNaN(updateValue)) return { ok: false, error: 'Ugyldig antal' }
  } else {
    updateValue = (value as string).trim() || null
  }

  if (field === 'name' && !updateValue) return { ok: false, error: 'Namn kan ikkje vere tomt' }

  const { error } = await equipmentUpdate(supabase, id, { [field]: updateValue })
  if (error) return { ok: false, error: error.message }

  revalidatePath('/dashboard/equipment')
  return { ok: true }
}
