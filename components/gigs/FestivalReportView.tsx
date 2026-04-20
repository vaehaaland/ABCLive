import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import type { FestivalReportData } from '@/app/dashboard/gigs/_lib/festival-report'

function formatTimeRange(startAt: string, endAt: string) {
  return `${format(new Date(startAt), 'HH:mm')}–${format(new Date(endAt), 'HH:mm')}`
}

function formatFestivalDateRange(startDate: string, endDate: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (startDate === endDate) {
    return format(start, 'd. MMMM yyyy', { locale: nb })
  }

  return `${format(start, 'd. MMMM yyyy', { locale: nb })} – ${format(end, 'd. MMMM yyyy', { locale: nb })}`
}

function statusLabel(status: FestivalReportData['festival']['status']) {
  switch (status) {
    case 'confirmed':
      return 'Bekrefta'
    case 'completed':
      return 'Fullført'
    case 'cancelled':
      return 'Avlyst'
    default:
      return 'Utkast'
  }
}

export default function FestivalReportView({ report }: { report: FestivalReportData }) {
  return (
    <div className="festival-report-shell mx-auto flex w-full max-w-[980px] flex-col gap-6 text-foreground print:max-w-none print:gap-4 print:text-black">
      <section className="festival-report-page flex flex-col gap-6 rounded-2xl border border-white/10 bg-white p-8 text-black shadow-[0_28px_80px_rgba(0,0,0,0.35)] print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <header className="border-b border-black/10 pb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-3xl font-bold">{report.festival.name}</h1>
                <Badge variant="gold">Festivalrapport</Badge>
                <Badge variant="outline">{statusLabel(report.festival.status)}</Badge>
              </div>

              <div className="grid gap-1.5 text-sm text-black/70">
                <p>{formatFestivalDateRange(report.festival.startDate, report.festival.endDate)}</p>
                {report.festival.venue && <p>Venue: {report.festival.venue}</p>}
                {report.festival.client && <p>Klient: {report.festival.client}</p>}
              </div>
            </div>

            <div className="min-w-[220px] rounded-2xl border border-black/10 bg-black/[0.03] p-4 text-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-black/55">Samandrag</p>
              <div className="mt-3 grid gap-2">
                <p>{report.days.length} festivaldagar</p>
                <p>{report.days.reduce((sum, day) => sum + day.items.length, 0)} programpostar</p>
                <p>{report.festivalCrew.length} festivalcrew</p>
                <p>{report.festivalEquipment.length} utstyrslinjer</p>
              </div>
            </div>
          </div>

          {report.festival.description && (
            <p className="mt-5 whitespace-pre-wrap text-sm text-black/75">
              {report.festival.description}
            </p>
          )}
        </header>

        <section className="grid gap-4 md:grid-cols-2 print:grid-cols-2">
          <article className="break-inside-avoid rounded-2xl border border-black/10 p-4">
            <h2 className="mb-3 font-heading text-lg font-semibold">Festivalcrew</h2>
            {report.festivalCrew.length === 0 ? (
              <p className="text-sm text-black/60">Ikkje sett</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {report.festivalCrew.map((crew) => (
                  <li key={crew.id} className="flex items-center justify-between gap-3 border-b border-black/6 pb-2 last:border-0 last:pb-0">
                    <span>{crew.name}</span>
                    <span className="text-black/60">{crew.role ?? 'Utan rolle'}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="break-inside-avoid rounded-2xl border border-black/10 p-4">
            <h2 className="mb-3 font-heading text-lg font-semibold">Festivalutstyr</h2>
            {report.festivalEquipment.length === 0 ? (
              <p className="text-sm text-black/60">Ikkje sett</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {report.festivalEquipment.map((equipment) => (
                  <li key={equipment.id} className="flex items-start justify-between gap-3 border-b border-black/6 pb-2 last:border-0 last:pb-0">
                    <div className="min-w-0">
                      <p>{equipment.name}</p>
                      {equipment.category && (
                        <p className="text-xs text-black/55">{equipment.category}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-black/60">{equipment.quantity} stk</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>

        <section className="flex flex-col gap-5">
          {report.days.map((day) => (
            <article key={day.date} className="break-inside-avoid rounded-2xl border border-black/10 overflow-hidden">
              <header className="border-b border-black/10 bg-black/[0.03] px-5 py-4">
                <h2 className="font-heading text-xl font-semibold capitalize">{day.label}</h2>
              </header>

              {day.items.length === 0 ? (
                <div className="px-5 py-4">
                  <p className="text-sm text-black/60">Ingen programpostar denne dagen.</p>
                </div>
              ) : (
                <div className="divide-y divide-black/8">
                  {day.items.map((item) => (
                    <section key={item.id} className="break-inside-avoid px-5 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-heading text-lg font-semibold">{item.name}</h3>
                            <Badge variant="outline">{formatTimeRange(item.startAt, item.endAt)}</Badge>
                            {item.venue && <Badge variant="ghost">{item.venue}</Badge>}
                          </div>
                          {item.description && (
                            <p className="text-sm text-black/70">{item.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr]">
                        <div className="rounded-xl border border-black/8 p-3">
                          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-black/55">Crew</p>
                          {item.crew.length === 0 ? (
                            <p className="text-sm text-black/60">Ikkje sett</p>
                          ) : (
                            <ul className="space-y-1.5 text-sm">
                              {item.crew.map((crew) => (
                                <li key={crew.id} className="flex items-center justify-between gap-3">
                                  <span>{crew.name}</span>
                                  <span className="text-black/60">{crew.role ?? 'Utan rolle'}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        <div className="rounded-xl border border-black/8 p-3">
                          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-black/55">Utstyr</p>
                          {item.equipment.length === 0 ? (
                            <p className="text-sm text-black/60">Ikkje sett</p>
                          ) : (
                            <ul className="space-y-1.5 text-sm">
                              {item.equipment.map((equipment) => (
                                <li key={equipment.id} className="flex items-start justify-between gap-3">
                                  <span>{equipment.name}</span>
                                  <span className="shrink-0 text-black/60">{equipment.quantity} stk</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </article>
          ))}
        </section>
      </section>
    </div>
  )
}
