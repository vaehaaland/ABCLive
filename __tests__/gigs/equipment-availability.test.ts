import { describe, it, expect } from 'vitest'
import { buildAllocatedMap, computeAvailability } from '@/lib/gigs/equipment-availability'

const GIG_START = '2024-06-10'
const GIG_END = '2024-06-15'

describe('buildAllocatedMap', () => {
  it('sums quantities from overlapping allocations for the same equipment', () => {
    const map = buildAllocatedMap(
      [
        { equipment_id: 'eq1', quantity_needed: 2, gigs: { start_date: '2024-06-11', end_date: '2024-06-13' } },
        { equipment_id: 'eq1', quantity_needed: 1, gigs: { start_date: '2024-06-14', end_date: '2024-06-16' } },
      ],
      GIG_START, GIG_END,
    )
    expect(map.get('eq1')).toBe(3)
  })

  it('ignores allocations from non-overlapping gigs', () => {
    const map = buildAllocatedMap(
      [{ equipment_id: 'eq1', quantity_needed: 5, gigs: { start_date: '2024-07-01', end_date: '2024-07-05' } }],
      GIG_START, GIG_END,
    )
    expect(map.has('eq1')).toBe(false)
  })

  it('handles Supabase array join shape for gigs', () => {
    const map = buildAllocatedMap(
      [{ equipment_id: 'eq1', quantity_needed: 3, gigs: [{ start_date: '2024-06-10', end_date: '2024-06-15' }] }],
      GIG_START, GIG_END,
    )
    expect(map.get('eq1')).toBe(3)
  })

  it('returns empty map for empty allocations', () => {
    expect(buildAllocatedMap([], GIG_START, GIG_END).size).toBe(0)
  })

  it('tracks multiple equipment items independently', () => {
    const map = buildAllocatedMap(
      [
        { equipment_id: 'eq1', quantity_needed: 2, gigs: { start_date: '2024-06-10', end_date: '2024-06-15' } },
        { equipment_id: 'eq2', quantity_needed: 4, gigs: { start_date: '2024-06-10', end_date: '2024-06-15' } },
      ],
      GIG_START, GIG_END,
    )
    expect(map.get('eq1')).toBe(2)
    expect(map.get('eq2')).toBe(4)
  })
})

describe('computeAvailability', () => {
  it('subtracts allocated from total quantity', () => {
    const result = computeAvailability(
      [{ id: 'eq1', quantity: 10 }],
      new Map([['eq1', 3]]),
    )
    expect(result[0].available).toBe(7)
  })

  it('returns full quantity when equipment has no allocation', () => {
    const result = computeAvailability([{ id: 'eq1', quantity: 5 }], new Map())
    expect(result[0].available).toBe(5)
  })

  it('returns 0 when fully allocated', () => {
    const result = computeAvailability(
      [{ id: 'eq1', quantity: 4 }],
      new Map([['eq1', 4]]),
    )
    expect(result[0].available).toBe(0)
  })

  it('returns negative when over-allocated (does not throw)', () => {
    const result = computeAvailability(
      [{ id: 'eq1', quantity: 2 }],
      new Map([['eq1', 5]]),
    )
    expect(result[0].available).toBe(-3)
  })

  it('processes multiple equipment items independently', () => {
    const equipment = [
      { id: 'eq1', quantity: 10 },
      { id: 'eq2', quantity: 5 },
      { id: 'eq3', quantity: 8 },
    ]
    const allocated = new Map([['eq1', 2], ['eq3', 8]])
    const result = computeAvailability(equipment, allocated)
    expect(result.find((e) => e.id === 'eq1')?.available).toBe(8)
    expect(result.find((e) => e.id === 'eq2')?.available).toBe(5)
    expect(result.find((e) => e.id === 'eq3')?.available).toBe(0)
  })

  it('preserves all original equipment fields', () => {
    const result = computeAvailability(
      [{ id: 'eq1', quantity: 10, name: 'Mic', category: 'Audio' }],
      new Map(),
    )
    expect(result[0]).toMatchObject({ id: 'eq1', quantity: 10, name: 'Mic', category: 'Audio', available: 10 })
  })
})
