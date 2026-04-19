'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { requireSuperadmin } from '@/lib/auth/requireSuperadmin'
import type { UserRole } from '@/types/database'

const USERS_PATH = '/dashboard/admin/users'

export type CreateUserMode = 'invite' | 'password'

export interface CreateUserInput {
  email: string
  full_name: string
  role: UserRole
  primary_role?: string
  mode: CreateUserMode
  password?: string
}

export interface UpdateUserInput {
  full_name?: string | null
  role?: UserRole
  primary_role?: string | null
  is_superadmin?: boolean
  phone?: string | null
  email?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface ActionResult {
  ok: boolean
  error?: string
  avatarUrl?: string
}

const AVATAR_MAX_BYTES = 2 * 1024 * 1024
const AVATAR_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function createUser(input: CreateUserInput): Promise<ActionResult> {
  await requireSuperadmin()

  if (!input.email.trim()) return { ok: false, error: 'E-post er påkrevd' }
  if (input.mode === 'password' && (input.password?.length ?? 0) < 8) {
    return { ok: false, error: 'Passord må vere minst 8 teikn' }
  }

  const admin = createAdminClient()
  const metadata = { full_name: input.full_name, role: input.role }

  const { data, error } =
    input.mode === 'invite'
      ? await admin.auth.admin.inviteUserByEmail(input.email, { data: metadata })
      : await admin.auth.admin.createUser({
          email: input.email,
          password: input.password!,
          email_confirm: true,
          user_metadata: metadata,
        })

  if (error || !data.user) {
    return { ok: false, error: error?.message ?? 'Kunne ikkje opprette brukar' }
  }

  // The handle_new_user() trigger already inserted a profile row with full_name/role/email.
  // Patch in primary_role if provided.
  if (input.primary_role?.trim()) {
    await admin
      .from('profiles')
      .update({ primary_role: input.primary_role.trim() })
      .eq('id', data.user.id)
  }

  revalidatePath(USERS_PATH)
  return { ok: true }
}

export async function updateUser(userId: string, input: UpdateUserInput): Promise<ActionResult> {
  const caller = await requireSuperadmin()

  if (userId === caller.id && input.is_superadmin === false) {
    return { ok: false, error: 'Du kan ikkje fjerne superadmin frå din eigen konto' }
  }

  const trimmedEmail = input.email?.trim()
  if (trimmedEmail !== undefined && !EMAIL_RE.test(trimmedEmail)) {
    return { ok: false, error: 'Ugyldig e-postadresse' }
  }

  const admin = createAdminClient()

  // Auth.users.email is the canonical source — update it via admin API first.
  // On success, mirror the new email into profiles.email below.
  if (trimmedEmail !== undefined) {
    const { error: authError } = await admin.auth.admin.updateUserById(userId, {
      email: trimmedEmail,
      email_confirm: true,
    })
    if (authError) return { ok: false, error: authError.message }
  }

  const profileUpdate = {
    ...(input.full_name !== undefined && { full_name: input.full_name }),
    ...(input.role !== undefined && { role: input.role }),
    ...(input.primary_role !== undefined && { primary_role: input.primary_role }),
    ...(input.is_superadmin !== undefined && { is_superadmin: input.is_superadmin }),
    ...(input.phone !== undefined && { phone: input.phone }),
    ...(trimmedEmail !== undefined && { email: trimmedEmail }),
  }

  if (Object.keys(profileUpdate).length > 0) {
    const { error } = await admin.from('profiles').update(profileUpdate).eq('id', userId)
    if (error) return { ok: false, error: error.message }
  }

  revalidatePath(USERS_PATH)
  return { ok: true }
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  const caller = await requireSuperadmin()

  if (userId === caller.id) {
    return { ok: false, error: 'Du kan ikkje slette din eigen konto' }
  }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return { ok: false, error: error.message }

  revalidatePath(USERS_PATH)
  return { ok: true }
}

export async function resendInvite(userId: string): Promise<ActionResult> {
  await requireSuperadmin()

  const server = await createClient()
  const { data: profile } = await server
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single<{ email: string | null }>()

  if (!profile?.email) return { ok: false, error: 'Fann ikkje e-post for brukaren' }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.inviteUserByEmail(profile.email)
  if (error) return { ok: false, error: error.message }

  return { ok: true }
}

export async function uploadAvatar(userId: string, formData: FormData): Promise<ActionResult> {
  await requireSuperadmin()

  const file = formData.get('file')
  if (!(file instanceof File)) return { ok: false, error: 'Ingen fil vald' }
  if (file.size > AVATAR_MAX_BYTES) return { ok: false, error: 'Maks 2 MB' }
  if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, error: 'Berre JPEG, PNG eller WebP' }
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${userId}/avatar.${ext}`

  const admin = createAdminClient()
  const { error: uploadError } = await admin.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) return { ok: false, error: uploadError.message }

  const { data: { publicUrl } } = admin.storage.from('avatars').getPublicUrl(path)
  const bustedUrl = `${publicUrl}?v=${Date.now()}`

  const { error: updateError } = await admin
    .from('profiles')
    .update({ avatar_url: bustedUrl })
    .eq('id', userId)

  if (updateError) return { ok: false, error: updateError.message }

  revalidatePath(USERS_PATH)
  return { ok: true, avatarUrl: bustedUrl }
}

export async function resetPassword(userId: string, newPassword: string): Promise<ActionResult> {
  await requireSuperadmin()

  if (newPassword.length < 8) return { ok: false, error: 'Passord må vere minst 8 teikn' }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword })
  if (error) return { ok: false, error: error.message }

  return { ok: true }
}
