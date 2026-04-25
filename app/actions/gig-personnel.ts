'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createGigAddedNotification } from '@/app/actions/notifications'

type AssignmentStatus = 'accepted' | 'pending'
type UpsertOutcome = 'inserted' | 'updated'

export interface GigPersonnelUpsertResult {
  profileId: string
  assignmentStatus: AssignmentStatus
  outcome: UpsertOutcome
}

export interface GigPersonnelUpsertSummary {
  results: GigPersonnelUpsertResult[]
  insertedCount: number
  updatedCount: number
  acceptedCount: number
  pendingCount: number
}

export async function upsertGigPersonnelAssignments(
  gigId: string,
  profileIds: string[],
  roleOnGig?: string | null,
): Promise<GigPersonnelUpsertSummary> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Ikkje innlogga')
  }

  const uniqueProfileIds = [...new Set(profileIds.filter(Boolean))]

  if (uniqueProfileIds.length === 0) {
    return {
      results: [],
      insertedCount: 0,
      updatedCount: 0,
      acceptedCount: 0,
      pendingCount: 0,
    }
  }

  const { data: existingRows, error: existingError } = await supabase
    .from('gig_personnel')
    .select('profile_id')
    .eq('gig_id', gigId)
    .in('profile_id', uniqueProfileIds)

  if (existingError) {
    throw new Error(existingError.message)
  }

  const existingIds = new Set((existingRows ?? []).map((row) => row.profile_id))

  const rows = uniqueProfileIds.map((profileId) => {
    const isActor = profileId === user.id
    const assignmentStatus: AssignmentStatus = isActor ? 'accepted' : 'pending'

    return {
      gig_id: gigId,
      profile_id: profileId,
      role_on_gig: roleOnGig || null,
      assignment_status: assignmentStatus,
      responded_at: isActor ? new Date().toISOString() : null,
    }
  })

  const { error: upsertError } = await supabase
    .from('gig_personnel')
    .upsert(rows, { onConflict: 'gig_id,profile_id' })

  if (upsertError) {
    throw new Error(upsertError.message)
  }

  const results: GigPersonnelUpsertResult[] = uniqueProfileIds.map((profileId) => {
    const isActor = profileId === user.id
    return {
      profileId,
      assignmentStatus: isActor ? 'accepted' : 'pending',
      outcome: existingIds.has(profileId) ? 'updated' : 'inserted',
    }
  })

  await Promise.all(
    results
      .filter((result) => result.outcome === 'inserted' && result.profileId !== user.id)
      .map((result) => createGigAddedNotification(gigId, result.profileId, user.id).catch(() => {})),
  )

  revalidatePath(`/dashboard/gigs/${gigId}`)

  const insertedCount = results.filter((result) => result.outcome === 'inserted').length
  const updatedCount = results.length - insertedCount
  const acceptedCount = results.filter((result) => result.assignmentStatus === 'accepted').length
  const pendingCount = results.length - acceptedCount

  return {
    results,
    insertedCount,
    updatedCount,
    acceptedCount,
    pendingCount,
  }
}
