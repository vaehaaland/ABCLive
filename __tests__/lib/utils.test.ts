import { describe, it, expect } from 'vitest'
import { formatPhone } from '@/lib/utils'

describe('formatPhone', () => {
  it('formats 8-digit number as XX XX XX XX', () => {
    expect(formatPhone('12345678')).toBe('12 34 56 78')
  })

  it('strips non-digit chars before formatting 8-digit number', () => {
    expect(formatPhone('1234-5678')).toBe('12 34 56 78')
  })

  it('returns original string when not exactly 8 digits', () => {
    expect(formatPhone('1234567')).toBe('1234567')
    expect(formatPhone('123456789')).toBe('123456789')
    expect(formatPhone('+4712345678')).toBe('+4712345678')
  })

  it('returns empty string for null', () => {
    expect(formatPhone(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(formatPhone(undefined)).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(formatPhone('')).toBe('')
  })
})
