'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function getCallerAndRole() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikkje innlogga')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null; error: unknown }

  return { user, isAdmin: profile?.role === 'admin' }
}

export async function setChecklistItemState(
  itemId: string,
  gigId: string,
  state: 'unchecked' | 'checked' | 'na',
) {
  const { user } = await getCallerAndRole()
  const admin = createAdminClient()

  const now = new Date().toISOString()
  const isChecked = state === 'checked'
  const isNa = state === 'na'

  const { error } = await admin
    .from('gig_checklist_items')
    .update({
      is_checked: isChecked,
      is_na: isNa,
      checked_by: isChecked ? user.id : null,
      checked_at: isChecked ? now : null,
      updated_at: now,
    })
    .eq('id', itemId) as { data: unknown; error: { message: string } | null }

  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/gigs/${gigId}`)
}

export async function updateChecklistItemComment(
  itemId: string,
  gigId: string,
  comment: string | null,
) {
  await getCallerAndRole()
  const admin = createAdminClient()

  const { error } = await admin
    .from('gig_checklist_items')
    .update({ comment: comment || null, updated_at: new Date().toISOString() })
    .eq('id', itemId) as { data: unknown; error: { message: string } | null }

  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/gigs/${gigId}`)
}

export async function addChecklistItem(gigId: string, title: string) {
  const { isAdmin } = await getCallerAndRole()
  if (!isAdmin) throw new Error('Berre admins kan leggje til punkt')

  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('gig_checklist_items')
    .select('order_index')
    .eq('gig_id', gigId)
    .order('order_index', { ascending: false })
    .limit(1)
    .single() as { data: { order_index: number } | null; error: unknown }

  const nextIndex = (existing?.order_index ?? -1) + 1

  const { data: inserted, error } = await admin
    .from('gig_checklist_items')
    .insert({ gig_id: gigId, title: title.trim(), order_index: nextIndex })
    .select('*')
    .single() as { data: import('@/types/database').GigChecklistItem | null; error: { message: string } | null }

  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/gigs/${gigId}`)
  return inserted!
}

export async function removeChecklistItem(itemId: string, gigId: string) {
  const { isAdmin } = await getCallerAndRole()
  if (!isAdmin) throw new Error('Berre admins kan slette punkt')

  const admin = createAdminClient()
  const { error } = await admin
    .from('gig_checklist_items')
    .delete()
    .eq('id', itemId) as { data: unknown; error: { message: string } | null }

  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/gigs/${gigId}`)
}

export async function initChecklistFromTemplate(gigId: string) {
  const { isAdmin } = await getCallerAndRole()
  if (!isAdmin) throw new Error('Berre admins kan initialisere sjekkliste')

  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('gig_checklist_items')
    .select('id')
    .eq('gig_id', gigId)
    .limit(1) as { data: { id: string }[] | null; error: unknown }

  if (existing && existing.length > 0) throw new Error('Sjekkliste finst allereie')

  const { data: templateItems, error: tErr } = await admin
    .from('checklist_template_items')
    .select('id, title, order_index')
    .eq('is_active', true)
    .order('order_index', { ascending: true }) as { data: { id: string; title: string; order_index: number }[] | null; error: { message: string } | null }

  if (tErr) throw new Error(tErr.message)
  if (!templateItems || templateItems.length === 0) throw new Error('Ingen aktive malpunkt funne')

  const rows = templateItems.map(t => ({
    gig_id: gigId,
    template_item_id: t.id,
    title: t.title,
    order_index: t.order_index,
  }))

  const { error } = await admin
    .from('gig_checklist_items')
    .insert(rows) as { data: unknown; error: { message: string } | null }

  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/gigs/${gigId}`)
}

// ── Template management (superadmin) ──────────────────────────────────────────

export async function addTemplateItem(title: string, description?: string) {
  const { isAdmin } = await getCallerAndRole()
  if (!isAdmin) throw new Error('Berre admins kan leggje til malpunkt')
  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('checklist_template_items')
    .select('order_index')
    .order('order_index', { ascending: false })
    .limit(1)
    .single() as { data: { order_index: number } | null; error: unknown }

  const nextIndex = (existing?.order_index ?? -1) + 1

  const { error } = await admin
    .from('checklist_template_items')
    .insert({ title: title.trim(), description: description?.trim() || null, order_index: nextIndex }) as { data: unknown; error: { message: string } | null }

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/admin/checklist')
}

export async function updateTemplateItem(
  id: string,
  fields: { title?: string; description?: string | null; is_active?: boolean },
) {
  const { isAdmin } = await getCallerAndRole()
  if (!isAdmin) throw new Error('Berre admins kan oppdatere malpunkt')
  const admin = createAdminClient()
  const { error } = await admin
    .from('checklist_template_items')
    .update(fields)
    .eq('id', id) as { data: unknown; error: { message: string } | null }

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/admin/checklist')
}

export async function deleteTemplateItem(id: string) {
  const { isAdmin } = await getCallerAndRole()
  if (!isAdmin) throw new Error('Berre admins kan slette malpunkt')
  const admin = createAdminClient()
  const { error } = await admin
    .from('checklist_template_items')
    .delete()
    .eq('id', id) as { data: unknown; error: { message: string } | null }

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/admin/checklist')
}

export async function reorderTemplateItems(orderedIds: string[]) {
  const { isAdmin } = await getCallerAndRole()
  if (!isAdmin) throw new Error('Berre admins kan sortere malpunkt')
  const admin = createAdminClient()
  await Promise.all(
    orderedIds.map((id, index) =>
      admin.from('checklist_template_items').update({ order_index: index }).eq('id', id)
    )
  )
  revalidatePath('/dashboard/admin/checklist')
}
