import { describe, it, expect } from 'vitest'
import {
  generatePublicReportSlug,
  hashPublicReportPassword,
  verifyPublicReportPassword,
  getPublicReportCookieName,
  getPublicReportAccessToken,
} from '@/app/dashboard/gigs/_lib/festival-report'

describe('generatePublicReportSlug', () => {
  it('returns a 36-character hex string (18 random bytes)', () => {
    expect(generatePublicReportSlug()).toMatch(/^[0-9a-f]{36}$/)
  })

  it('generates unique slugs on each call', () => {
    const slugs = new Set(Array.from({ length: 100 }, generatePublicReportSlug))
    expect(slugs.size).toBe(100)
  })
})

describe('hashPublicReportPassword / verifyPublicReportPassword', () => {
  it('verifies correct password returns true', () => {
    const hash = hashPublicReportPassword('secret123')
    expect(verifyPublicReportPassword('secret123', hash)).toBe(true)
  })

  it('rejects incorrect password', () => {
    const hash = hashPublicReportPassword('secret123')
    expect(verifyPublicReportPassword('wrong', hash)).toBe(false)
  })

  it('produces unique hashes for the same password (different salts)', () => {
    const h1 = hashPublicReportPassword('same')
    const h2 = hashPublicReportPassword('same')
    expect(h1).not.toBe(h2)
    expect(verifyPublicReportPassword('same', h1)).toBe(true)
    expect(verifyPublicReportPassword('same', h2)).toBe(true)
  })

  it('returns false for malformed stored hash (no colon separator)', () => {
    expect(verifyPublicReportPassword('any', 'nocolon')).toBe(false)
  })

  it('returns false for empty stored hash', () => {
    expect(verifyPublicReportPassword('any', '')).toBe(false)
  })
})

describe('getPublicReportAccessToken', () => {
  it('returns a 64-character hex SHA-256 string', () => {
    expect(getPublicReportAccessToken('my-slug', 'salt:hashvalue')).toMatch(/^[0-9a-f]{64}$/)
  })

  it('is deterministic for the same inputs', () => {
    expect(getPublicReportAccessToken('slug', 'hash')).toBe(getPublicReportAccessToken('slug', 'hash'))
  })

  it('differs when slug changes', () => {
    expect(getPublicReportAccessToken('slug-a', 'hash')).not.toBe(
      getPublicReportAccessToken('slug-b', 'hash'),
    )
  })
})

describe('getPublicReportCookieName', () => {
  it('returns the correct cookie name format', () => {
    expect(getPublicReportCookieName('abc123')).toBe('festival-report-access-abc123')
  })
})
