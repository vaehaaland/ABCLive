import { describe, it, expect } from 'vitest'
import { parseVEvents } from '@/lib/icloud/caldav'

function makeICS(...events: string[]): string {
  return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${events.join('')}END:VCALENDAR\r\n`
}

function makeEvent(props: Record<string, string>): string {
  const lines = Object.entries(props)
    .map(([k, v]) => `${k}:${v}`)
    .join('\r\n')
  return `BEGIN:VEVENT\r\n${lines}\r\nEND:VEVENT\r\n`
}

function makeAllDayEvent(uid: string, summary: string, dtstart: string, dtend: string): string {
  return `BEGIN:VEVENT\r\nUID:${uid}\r\nSUMMARY:${summary}\r\nDTSTART;VALUE=DATE:${dtstart}\r\nDTEND;VALUE=DATE:${dtend}\r\nEND:VEVENT\r\n`
}

describe('parseVEvents', () => {
  describe('basic timed events', () => {
    it('parses uid, title, dates, location, description', () => {
      const data = makeICS(
        makeEvent({
          UID: 'uid1@test',
          SUMMARY: 'Konsert i Bergen',
          DTSTART: '20240610T120000Z',
          DTEND: '20240610T200000Z',
          LOCATION: 'Grieghallen',
          DESCRIPTION: 'Lydsjekk kl 14',
        }),
      )
      const [evt] = parseVEvents(data)
      expect(evt).toMatchObject({
        uid: 'uid1@test',
        title: 'Konsert i Bergen',
        startDate: '2024-06-10',
        endDate: '2024-06-10',
        location: 'Grieghallen',
        description: 'Lydsjekk kl 14',
      })
    })

    it('sets location and description to null when absent', () => {
      const data = makeICS(
        makeEvent({
          UID: 'uid2@test',
          SUMMARY: 'Gig utan ekstra',
          DTSTART: '20240610T120000Z',
          DTEND: '20240611T120000Z',
        }),
      )
      const [evt] = parseVEvents(data)
      expect(evt.location).toBeNull()
      expect(evt.description).toBeNull()
    })

    it('falls back to "Utan tittel" when SUMMARY is missing', () => {
      const data = makeICS(
        makeEvent({
          UID: 'uid3@test',
          DTSTART: '20240610T120000Z',
          DTEND: '20240611T120000Z',
        }),
      )
      const [evt] = parseVEvents(data)
      expect(evt.title).toBe('Utan tittel')
    })

    it('parses a multi-day timed event correctly', () => {
      const data = makeICS(
        makeEvent({
          UID: 'multi@test',
          SUMMARY: 'Festival',
          DTSTART: '20240610T120000Z',
          DTEND: '20240614T120000Z',
        }),
      )
      const [evt] = parseVEvents(data)
      expect(evt.startDate).toBe('2024-06-10')
      expect(evt.endDate).toBe('2024-06-14')
    })

    it('parses multiple events and preserves order', () => {
      const data = makeICS(
        makeEvent({ UID: 'a@test', SUMMARY: 'First', DTSTART: '20240610T120000Z', DTEND: '20240611T120000Z' }),
        makeEvent({ UID: 'b@test', SUMMARY: 'Second', DTSTART: '20240615T120000Z', DTEND: '20240616T120000Z' }),
      )
      const events = parseVEvents(data)
      expect(events).toHaveLength(2)
      expect(events[0].uid).toBe('a@test')
      expect(events[1].uid).toBe('b@test')
    })
  })

  describe('all-day events (VALUE=DATE)', () => {
    it('subtracts one day from exclusive DTEND', () => {
      // DTSTART=June10, DTEND=June12 (exclusive) → endDate = June11
      // Test timezone-independent: endDate must be exactly 1 day after startDate
      const data = makeICS(makeAllDayEvent('allday@test', 'Festival', '20240610', '20240612'))
      const [evt] = parseVEvents(data)
      const start = new Date(evt.startDate)
      const end = new Date(evt.endDate)
      const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      expect(diffDays).toBe(1)
    })

    it('single-day all-day event has same startDate and endDate', () => {
      // DTSTART=June10, DTEND=June11 (exclusive) → startDate === endDate
      const data = makeICS(makeAllDayEvent('singleday@test', 'Dagsgig', '20240610', '20240611'))
      const [evt] = parseVEvents(data)
      expect(evt.startDate).toBe(evt.endDate)
    })

    it('three-day all-day event spans two days', () => {
      // DTSTART=June10, DTEND=June13 (exclusive) → endDate - startDate = 2 days
      const data = makeICS(makeAllDayEvent('threeday@test', 'Fleirdag', '20240610', '20240613'))
      const [evt] = parseVEvents(data)
      const start = new Date(evt.startDate)
      const end = new Date(evt.endDate)
      const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      expect(diffDays).toBe(2)
    })
  })

  describe('invalid / incomplete events', () => {
    it('skips event missing UID', () => {
      const data = makeICS(
        makeEvent({ SUMMARY: 'No UID', DTSTART: '20240610T120000Z', DTEND: '20240611T120000Z' }),
      )
      expect(parseVEvents(data)).toHaveLength(0)
    })

    it('skips event missing DTSTART', () => {
      const data = makeICS(
        makeEvent({ UID: 'uid@test', SUMMARY: 'No start', DTEND: '20240611T120000Z' }),
      )
      expect(parseVEvents(data)).toHaveLength(0)
    })

    it('skips event missing DTEND', () => {
      const data = makeICS(
        makeEvent({ UID: 'uid@test', SUMMARY: 'No end', DTSTART: '20240610T120000Z' }),
      )
      expect(parseVEvents(data)).toHaveLength(0)
    })

    it('returns empty array for invalid ICS string', () => {
      expect(parseVEvents('this is not valid ics')).toEqual([])
    })

    it('returns empty array for empty string', () => {
      expect(parseVEvents('')).toEqual([])
    })

    it('returns empty array for VCALENDAR with no events', () => {
      expect(parseVEvents('BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR\r\n')).toEqual([])
    })

    it('skips invalid events but still returns valid ones', () => {
      const data = makeICS(
        makeEvent({ SUMMARY: 'No UID', DTSTART: '20240610T120000Z', DTEND: '20240611T120000Z' }),
        makeEvent({ UID: 'valid@test', SUMMARY: 'Valid', DTSTART: '20240615T120000Z', DTEND: '20240616T120000Z' }),
      )
      const events = parseVEvents(data)
      expect(events).toHaveLength(1)
      expect(events[0].uid).toBe('valid@test')
    })
  })
})
