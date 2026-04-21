import { describe, it, expect } from 'vitest'
import { buildConflictMap } from '@/lib/gigs/personnel-conflicts'

// The gig being edited spans 2024-06-10 → 2024-06-15
const GIG_START = '2024-06-10'
const GIG_END = '2024-06-15'

describe('buildConflictMap — date overlap detection', () => {
  describe('overlapping cases (should detect conflict)', () => {
    it('exact same dates', () => {
      const map = buildConflictMap(
        [{ profile_id: 'p1', gigs: { id: 'g1', name: 'Gig A', start_date: '2024-06-10', end_date: '2024-06-15' } }],
        GIG_START, GIG_END,
      )
      expect(map.get('p1')).toBe('Gig A')
    })

    it('other starts before and ends during our gig', () => {
      const map = buildConflictMap(
        [{ profile_id: 'p1', gigs: { id: 'g1', name: 'Early', start_date: '2024-06-08', end_date: '2024-06-12' } }],
        GIG_START, GIG_END,
      )
      expect(map.has('p1')).toBe(true)
    })

    it('other starts during and ends after our gig', () => {
      const map = buildConflictMap(
        [{ profile_id: 'p1', gigs: { id: 'g1', name: 'Late', start_date: '2024-06-13', end_date: '2024-06-20' } }],
        GIG_START, GIG_END,
      )
      expect(map.has('p1')).toBe(true)
    })

    it('other gig fully wraps our gig', () => {
      const map = buildConflictMap(
        [{ profile_id: 'p1', gigs: { id: 'g1', name: 'Wrapper', start_date: '2024-06-01', end_date: '2024-06-30' } }],
        GIG_START, GIG_END,
      )
      expect(map.has('p1')).toBe(true)
    })

    it('our gig fully wraps other gig', () => {
      const map = buildConflictMap(
        [{ profile_id: 'p1', gigs: { id: 'g1', name: 'Inner', start_date: '2024-06-11', end_date: '2024-06-13' } }],
        GIG_START, GIG_END,
      )
      expect(map.has('p1')).toBe(true)
    })

    it('other ends on our start date (shared boundary)', () => {
      const map = buildConflictMap(
        [{ profile_id: 'p1', gigs: { id: 'g1', name: 'Boundary', start_date: '2024-06-08', end_date: '2024-06-10' } }],
        GIG_START, GIG_END,
      )
      expect(map.has('p1')).toBe(true)
    })

    it('other starts on our end date (shared boundary)', () => {
      const map = buildConflictMap(
        [{ profile_id: 'p1', gigs: { id: 'g1', name: 'Boundary2', start_date: '2024-06-15', end_date: '2024-06-20' } }],
        GIG_START, GIG_END,
      )
      expect(map.has('p1')).toBe(true)
    })
  })

  describe('non-overlapping cases (should NOT detect conflict)', () => {
    it('other ends one day before our start', () => {
      const map = buildConflictMap(
        [{ profile_id: 'p1', gigs: { id: 'g1', name: 'Before', start_date: '2024-06-01', end_date: '2024-06-09' } }],
        GIG_START, GIG_END,
      )
      expect(map.has('p1')).toBe(false)
    })

    it('other starts one day after our end', () => {
      const map = buildConflictMap(
        [{ profile_id: 'p1', gigs: { id: 'g1', name: 'After', start_date: '2024-06-16', end_date: '2024-06-20' } }],
        GIG_START, GIG_END,
      )
      expect(map.has('p1')).toBe(false)
    })
  })

  describe('multi-gig and multi-person scenarios', () => {
    it('person has two gigs, only one overlapping — stores the overlapping name', () => {
      const map = buildConflictMap(
        [
          { profile_id: 'p1', gigs: { id: 'g1', name: 'Far Away', start_date: '2024-01-01', end_date: '2024-01-05' } },
          { profile_id: 'p1', gigs: { id: 'g2', name: 'Overlapper', start_date: '2024-06-12', end_date: '2024-06-18' } },
        ],
        GIG_START, GIG_END,
      )
      expect(map.get('p1')).toBe('Overlapper')
    })

    it('Supabase array join shape (gigs as array)', () => {
      const map = buildConflictMap(
        [{ profile_id: 'p1', gigs: [{ id: 'g1', name: 'Festival', start_date: '2024-06-11', end_date: '2024-06-14' }] }],
        GIG_START, GIG_END,
      )
      expect(map.has('p1')).toBe(true)
    })

    it('handles empty gigs array without throwing', () => {
      const map = buildConflictMap(
        [{ profile_id: 'p1', gigs: [] }],
        GIG_START, GIG_END,
      )
      expect(map.has('p1')).toBe(false)
    })

    it('returns separate entries for multiple people', () => {
      const map = buildConflictMap(
        [
          { profile_id: 'p1', gigs: { id: 'g1', name: 'Gig A', start_date: '2024-06-10', end_date: '2024-06-15' } },
          { profile_id: 'p2', gigs: { id: 'g2', name: 'Gig B', start_date: '2024-06-14', end_date: '2024-06-20' } },
        ],
        GIG_START, GIG_END,
      )
      expect(map.get('p1')).toBe('Gig A')
      expect(map.get('p2')).toBe('Gig B')
    })

    it('returns empty map for empty input', () => {
      expect(buildConflictMap([], GIG_START, GIG_END).size).toBe(0)
    })
  })

  describe('single-day gig boundary cases', () => {
    it('single-day gig overlaps another single-day gig on same date', () => {
      const map = buildConflictMap(
        [{ profile_id: 'p1', gigs: { id: 'g1', name: 'Same Day', start_date: '2024-06-10', end_date: '2024-06-10' } }],
        '2024-06-10', '2024-06-10',
      )
      expect(map.has('p1')).toBe(true)
    })

    it('single-day gig does not overlap adjacent single-day gig', () => {
      const map = buildConflictMap(
        [{ profile_id: 'p1', gigs: { id: 'g1', name: 'Next Day', start_date: '2024-06-11', end_date: '2024-06-11' } }],
        '2024-06-10', '2024-06-10',
      )
      expect(map.has('p1')).toBe(false)
    })
  })
})
