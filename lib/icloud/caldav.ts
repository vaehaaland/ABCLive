import { DAVClient } from 'tsdav'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ICAL = require('ical.js') as {
  parse: (ics: string) => unknown
  Component: new (jcal: unknown) => ICALComponent
  Time: { fromJSDate: (d: Date) => ICALTime }
}

interface ICALTime {
  toJSDate(): Date
  isDate: boolean
}

interface ICALComponent {
  getAllSubcomponents(name: string): ICALComponent[]
  getFirstPropertyValue(prop: string): unknown
}

export interface ICloudEvent {
  uid: string
  title: string
  startDate: string
  endDate: string
  location: string | null
  description: string | null
}

function isoDate(time: ICALTime): string {
  return time.toJSDate().toISOString().slice(0, 10)
}

function parseVEvents(icsData: string): ICloudEvent[] {
  let jcal: unknown
  try {
    jcal = ICAL.parse(icsData)
  } catch {
    return []
  }
  const comp = new ICAL.Component(jcal)
  const vevents = comp.getAllSubcomponents('vevent')
  const events: ICloudEvent[] = []

  for (const vevent of vevents) {
    const uid = vevent.getFirstPropertyValue('uid') as string | null
    const summary = vevent.getFirstPropertyValue('summary') as string | null
    const dtstart = vevent.getFirstPropertyValue('dtstart') as ICALTime | null
    const dtend = vevent.getFirstPropertyValue('dtend') as ICALTime | null
    if (!uid || !dtstart || !dtend) continue

    let endDate = isoDate(dtend)
    // All-day events: DTEND is exclusive (next day), subtract one day
    if (dtend.isDate) {
      const d = new Date(endDate)
      d.setDate(d.getDate() - 1)
      endDate = d.toISOString().slice(0, 10)
    }

    events.push({
      uid,
      title: summary ?? 'Utan tittel',
      startDate: isoDate(dtstart),
      endDate,
      location: (vevent.getFirstPropertyValue('location') as string | null) ?? null,
      description: (vevent.getFirstPropertyValue('description') as string | null) ?? null,
    })
  }
  return events
}

export async function fetchICloudEvents(
  appleId: string,
  appPassword: string,
  from: string,
  to: string
): Promise<ICloudEvent[]> {
  const client = new DAVClient({
    serverUrl: 'https://caldav.icloud.com',
    credentials: { username: appleId, password: appPassword },
    authMethod: 'Basic',
    defaultAccountType: 'caldav',
  })
  await client.login()

  const calendars = await client.fetchCalendars()
  const allEvents: ICloudEvent[] = []

  for (const calendar of calendars) {
    const objects = await client.fetchCalendarObjects({
      calendar,
      timeRange: { start: from, end: to },
    })
    for (const obj of objects) {
      if (!obj.data) continue
      const events = parseVEvents(obj.data)
      allEvents.push(...events)
    }
  }

  // Deduplicate by uid
  const seen = new Set<string>()
  return allEvents.filter((e) => {
    if (seen.has(e.uid)) return false
    seen.add(e.uid)
    return true
  })
}

export async function testICloudConnection(appleId: string, appPassword: string): Promise<void> {
  const client = new DAVClient({
    serverUrl: 'https://caldav.icloud.com',
    credentials: { username: appleId, password: appPassword },
    authMethod: 'Basic',
    defaultAccountType: 'caldav',
  })
  await client.login()
  await client.fetchCalendars()
}
