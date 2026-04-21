import { describe, it, expect } from 'vitest'
import { buildFestivalReportData } from '@/app/dashboard/gigs/_lib/festival-report'

// Minimal valid ReportGig for tests
const baseGig = {
  id: 'gig-1',
  name: 'Sommerfestival',
  gig_type: 'festival' as const,
  public_report_enabled: false,
  public_report_slug: null,
  public_report_password_hash: null,
  venue: 'Etne',
  client: 'ABC Studio',
  start_date: '2024-06-10',
  end_date: '2024-06-12',
  description: null,
  status: 'confirmed' as const,
  price: null,
  price_notes: null,
}

describe('buildFestivalReportData', () => {
  it('generates one FestivalReportDay per calendar day in range', () => {
    const result = buildFestivalReportData(baseGig, [], [], [], [], [])
    expect(result.days).toHaveLength(3)
    expect(result.days.map((d) => d.date)).toEqual(['2024-06-10', '2024-06-11', '2024-06-12'])
  })

  it('single-day festival produces one day', () => {
    const gig = { ...baseGig, start_date: '2024-06-10', end_date: '2024-06-10' }
    const result = buildFestivalReportData(gig, [], [], [], [], [])
    expect(result.days).toHaveLength(1)
  })

  it('day labels use Norwegian locale format', () => {
    const result = buildFestivalReportData(baseGig, [], [], [], [], [])
    // 2024-06-10 is a Monday → "mandag 10. juni 2024" in nb locale
    expect(result.days[0].label).toMatch(/mandag/)
    expect(result.days[0].label).toMatch(/juni/)
    expect(result.days[0].label).toMatch(/2024/)
  })

  it('days with no program items have empty items array', () => {
    const result = buildFestivalReportData(baseGig, [], [], [], [], [])
    result.days.forEach((day) => {
      expect(day.items).toEqual([])
    })
  })

  it('program item lands in the day bucket matching its start_at date', () => {
    const programItem = {
      id: 'item-1',
      gig_id: 'gig-1',
      name: 'Hovudscene',
      venue: null,
      start_at: '2024-06-11T19:00:00',
      end_at: '2024-06-11T23:00:00',
      description: null,
    }
    const result = buildFestivalReportData(baseGig, [], [], [programItem], [], [])
    const june11 = result.days.find((d) => d.date === '2024-06-11')
    expect(june11?.items).toHaveLength(1)
    expect(june11?.items[0].name).toBe('Hovudscene')
    // Other days should be empty
    expect(result.days.find((d) => d.date === '2024-06-10')?.items).toHaveLength(0)
  })

  it('items within a day are sorted by startAt', () => {
    const items = [
      { id: 'i2', gig_id: 'gig-1', name: 'B', venue: null, start_at: '2024-06-10T20:00:00', end_at: '2024-06-10T22:00:00', description: null },
      { id: 'i1', gig_id: 'gig-1', name: 'A', venue: null, start_at: '2024-06-10T10:00:00', end_at: '2024-06-10T12:00:00', description: null },
    ]
    const result = buildFestivalReportData(baseGig, [], [], items, [], [])
    const june10 = result.days.find((d) => d.date === '2024-06-10')!
    expect(june10.items[0].name).toBe('A')
    expect(june10.items[1].name).toBe('B')
  })

  it('festivalCrew is sorted alphabetically with Norwegian locale', () => {
    const personnelRows = [
      { id: 'r1', role_on_gig: null, profiles: { id: 'p1', full_name: 'Øyvind Vik' } },
      { id: 'r2', role_on_gig: null, profiles: { id: 'p2', full_name: 'Anders Bakke' } },
      { id: 'r3', role_on_gig: null, profiles: { id: 'p3', full_name: 'Åse Dalen' } },
    ]
    const result = buildFestivalReportData(baseGig, personnelRows, [], [], [], [])
    const names = result.festivalCrew.map((c) => c.name)
    expect(names).toEqual(['Anders Bakke', 'Øyvind Vik', 'Åse Dalen'])
  })

  it('program item with no assigned crew has crew: []', () => {
    const item = {
      id: 'item-1', gig_id: 'gig-1', name: 'Test', venue: null,
      start_at: '2024-06-10T10:00:00', end_at: '2024-06-10T12:00:00', description: null,
    }
    const result = buildFestivalReportData(baseGig, [], [], [item], [], [])
    expect(result.days[0].items[0].crew).toEqual([])
  })

  it('program item with no equipment has equipment: []', () => {
    const item = {
      id: 'item-1', gig_id: 'gig-1', name: 'Test', venue: null,
      start_at: '2024-06-10T10:00:00', end_at: '2024-06-10T12:00:00', description: null,
    }
    const result = buildFestivalReportData(baseGig, [], [], [item], [], [])
    expect(result.days[0].items[0].equipment).toEqual([])
  })

  it('handles Supabase array join shape for profiles (array)', () => {
    const personnelRows = [
      { id: 'r1', role_on_gig: 'Lydtekniker', profiles: [{ id: 'p1', full_name: 'Per Ola' }] },
    ]
    const result = buildFestivalReportData(baseGig, personnelRows, [], [], [], [])
    expect(result.festivalCrew[0].name).toBe('Per Ola')
    expect(result.festivalCrew[0].role).toBe('Lydtekniker')
  })

  it('skips personnel rows with null profiles', () => {
    const personnelRows = [
      { id: 'r1', role_on_gig: null, profiles: null },
    ]
    const result = buildFestivalReportData(baseGig, personnelRows, [], [], [], [])
    expect(result.festivalCrew).toHaveLength(0)
  })

  it('maps festival metadata from gig correctly', () => {
    const result = buildFestivalReportData(baseGig, [], [], [], [], [])
    expect(result.festival).toMatchObject({
      id: 'gig-1',
      name: 'Sommerfestival',
      venue: 'Etne',
      client: 'ABC Studio',
      startDate: '2024-06-10',
      endDate: '2024-06-12',
    })
  })
})
