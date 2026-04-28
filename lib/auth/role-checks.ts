import type { UserRole } from '@/types/database'

export function canManageGigs(role: UserRole): boolean {
  return role === 'admin'
}

export function canViewEquipment(role: UserRole): boolean {
  return role === 'admin'
}

export function canViewPersonnel(role: UserRole): boolean {
  return role === 'admin'
}

export function canAccessAdmin(role: UserRole): boolean {
  return role === 'admin'
}

export function isSuperadmin(profile: { is_superadmin?: boolean | null }): boolean {
  return profile.is_superadmin === true
}

type AssignmentResponseError = 'not_your_assignment' | 'already_responded'

export function canRespondToAssignment(
  assignment: { profile_id: string; assignment_status: string },
  userId: string,
): { ok: true } | { ok: false; reason: AssignmentResponseError } {
  if (assignment.profile_id !== userId) {
    return { ok: false, reason: 'not_your_assignment' }
  }
  if (assignment.assignment_status !== 'pending') {
    return { ok: false, reason: 'already_responded' }
  }
  return { ok: true }
}
