'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  createGigAssignmentRequestNotification,
} from '@/app/actions/notifications'

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

function revalidateGigAssignmentSurfaces(gigId: string) {
  revalidatePath(`/dashboard/gigs/${gigId}`)
  revalidatePath(`/dashboard/gigs/${gigId}/respond`)
  revalidatePath('/dashboard/gigs')
  revalidatePath('/dashboard/calendar')
  revalidatePath('/dashboard/profile')
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
      response_note: null,
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
      .map((result) => createGigAssignmentRequestNotification(gigId, result.profileId, user.id).catch(() => {})),
  )

  revalidateGigAssignmentSurfaces(gigId)

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

async function updateOwnGigAssignment(
  assignmentId: string,
  nextStatus: 'accepted' | 'declined',
  note?: string,
): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Ikkje innlogga')
  }

  const admin = createAdminClient()

  const { data: assignment, error: assignmentError } = await admin
    .from('gig_personnel')
    .select('id, gig_id, profile_id, assignment_status')
    .eq('id', assignmentId)
    .maybeSingle()

  if (assignmentError) {
    throw new Error(assignmentError.message)
  }

  if (!assignment || assignment.profile_id !== user.id) {
    throw new Error('Fann ikkje oppdragsførespurnaden')
  }

  if (assignment.assignment_status !== 'pending') {
    throw new Error('Oppdragsførespurnaden er allereie svara på')
  }

  const trimmedNote = note?.trim() ?? ''
  const { error: updateError } = await admin
    .from('gig_personnel')
    .update({
      assignment_status: nextStatus,
      responded_at: new Date().toISOString(),
      response_note: trimmedNote.length > 0 ? trimmedNote : null,
    })
    .eq('id', assignment.id)
    .eq('profile_id', user.id)
    .eq('assignment_status', 'pending')

  if (updateError) {
    throw new Error(updateError.message)
  }

  revalidateGigAssignmentSurfaces(assignment.gig_id)
}

export async function acceptGigAssignment(assignmentId: string): Promise<void> {
  await updateOwnGigAssignment(assignmentId, 'accepted')
}

export async function declineGigAssignment(assignmentId: string, note?: string): Promise<void> {
  await updateOwnGigAssignment(assignmentId, 'declined', note)
}
