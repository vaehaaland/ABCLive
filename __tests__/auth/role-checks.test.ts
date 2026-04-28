import { describe, it, expect } from 'vitest'
import {
  canManageGigs,
  canViewEquipment,
  canViewPersonnel,
  canAccessAdmin,
  isSuperadmin,
  canRespondToAssignment,
} from '@/lib/auth/role-checks'

describe('role predicates', () => {
  describe('canManageGigs', () => {
    it('returns true for admin', () => expect(canManageGigs('admin')).toBe(true))
    it('returns false for technician', () => expect(canManageGigs('technician')).toBe(false))
  })

  describe('canViewEquipment', () => {
    it('returns true for admin', () => expect(canViewEquipment('admin')).toBe(true))
    it('returns false for technician', () => expect(canViewEquipment('technician')).toBe(false))
  })

  describe('canViewPersonnel', () => {
    it('returns true for admin', () => expect(canViewPersonnel('admin')).toBe(true))
    it('returns false for technician', () => expect(canViewPersonnel('technician')).toBe(false))
  })

  describe('canAccessAdmin', () => {
    it('returns true for admin', () => expect(canAccessAdmin('admin')).toBe(true))
    it('returns false for technician', () => expect(canAccessAdmin('technician')).toBe(false))
  })

  describe('isSuperadmin', () => {
    it('returns true when is_superadmin is true', () => {
      expect(isSuperadmin({ is_superadmin: true })).toBe(true)
    })

    it('returns false when is_superadmin is false', () => {
      expect(isSuperadmin({ is_superadmin: false })).toBe(false)
    })

    it('returns false when is_superadmin is null', () => {
      expect(isSuperadmin({ is_superadmin: null })).toBe(false)
    })

    it('returns false when is_superadmin is undefined', () => {
      expect(isSuperadmin({})).toBe(false)
    })

    it('admin role alone does not grant superadmin', () => {
      // Superadmin is a separate flag — role=admin is not enough
      expect(isSuperadmin({ is_superadmin: false })).toBe(false)
    })
  })
})

describe('canRespondToAssignment', () => {
  it('allows response when userId matches and assignment is pending', () => {
    const result = canRespondToAssignment(
      { profile_id: 'user-1', assignment_status: 'pending' },
      'user-1',
    )
    expect(result.ok).toBe(true)
  })

  it('rejects when userId does not match assignment owner', () => {
    const result = canRespondToAssignment(
      { profile_id: 'user-1', assignment_status: 'pending' },
      'user-2',
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('not_your_assignment')
  })

  it('rejects when assignment is already accepted', () => {
    const result = canRespondToAssignment(
      { profile_id: 'user-1', assignment_status: 'accepted' },
      'user-1',
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('already_responded')
  })

  it('rejects when assignment is already declined', () => {
    const result = canRespondToAssignment(
      { profile_id: 'user-1', assignment_status: 'declined' },
      'user-1',
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('already_responded')
  })

  it('ownership check takes priority over status check', () => {
    const result = canRespondToAssignment(
      { profile_id: 'user-1', assignment_status: 'accepted' },
      'user-2',
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('not_your_assignment')
  })
})
