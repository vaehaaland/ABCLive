import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { chromium, type Browser } from 'playwright'
import type { FestivalReportData } from '@/app/dashboard/gigs/_lib/festival-report'

const REPORT_CSS = `
  :root {
    color-scheme: light;
    --ink: #151515;
    --muted: #626262;
    --line: #dddddd;
    --panel: #f5f3ef;
    --accent: #b97918;
    --accent-soft: #f4e2c1;
  }

  * {
    box-sizing: border-box;
  }

  html, body {
    margin: 0;
    padding: 0;
    color: var(--ink);
    font-family: "Segoe UI", Arial, sans-serif;
    font-size: 12px;
    line-height: 1.45;
    background: white;
  }

  body {
    padding: 0;
  }

  .document {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .hero {
    display: grid;
    gap: 14px;
    padding: 0 0 14px;
    border-bottom: 1px solid var(--line);
  }

  .eyebrow {
    margin: 0;
    color: var(--accent);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .hero-top {
    display: grid;
    grid-template-columns: 1.5fr 0.9fr;
    gap: 16px;
    align-items: start;
  }

  .hero h1 {
    margin: 0;
    font-size: 28px;
    line-height: 1.08;
  }

  .meta-list {
    display: grid;
    gap: 5px;
    margin-top: 10px;
    color: var(--muted);
  }

  .meta-label {
    font-weight: 700;
    color: var(--ink);
  }

  .summary-card {
    border: 1px solid var(--line);
    background: var(--panel);
    border-radius: 16px;
    padding: 14px;
  }

  .summary-title {
    margin: 0 0 10px;
    color: var(--muted);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px 16px;
  }

  .summary-value {
    display: block;
    font-size: 20px;
    font-weight: 700;
    line-height: 1;
  }

  .summary-label {
    display: block;
    margin-top: 4px;
    color: var(--muted);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  .description {
    margin: 0;
    max-width: 720px;
    color: var(--muted);
    white-space: pre-wrap;
  }

  .intro-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .panel {
    break-inside: avoid;
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 14px;
  }

  .panel h2 {
    margin: 0 0 10px;
    font-size: 15px;
  }

  .simple-list {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .simple-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid #efefef;
  }

  .simple-row:last-child {
    padding-bottom: 0;
    border-bottom: 0;
  }

  .support-text {
    color: var(--muted);
    font-size: 11px;
  }

  .day-section {
    break-before: auto;
    break-inside: avoid-page;
    display: grid;
    gap: 10px;
  }

  .day-header {
    break-after: avoid;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: baseline;
    padding: 0 0 8px;
    border-bottom: 2px solid var(--ink);
  }

  .day-header h2 {
    margin: 0;
    font-size: 18px;
    text-transform: capitalize;
  }

  .day-count {
    color: var(--muted);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .empty-day {
    margin: 0;
    padding: 14px 16px;
    border: 1px dashed var(--line);
    border-radius: 14px;
    color: var(--muted);
  }

  .item-card {
    break-inside: avoid;
    border: 1px solid var(--line);
    border-radius: 16px;
    overflow: hidden;
  }

  .item-main {
    display: grid;
    grid-template-columns: 116px minmax(0, 1fr) 120px;
    gap: 14px;
    align-items: start;
    padding: 14px 16px;
  }

  .time-box {
    border-radius: 14px;
    background: var(--panel);
    padding: 10px 12px;
  }

  .time-label {
    display: block;
    margin-bottom: 5px;
    color: var(--muted);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .time-value {
    display: block;
    font-size: 20px;
    font-weight: 700;
    line-height: 1.05;
  }

  .item-main h3 {
    margin: 0;
    font-size: 18px;
    line-height: 1.18;
  }

  .item-description {
    margin: 6px 0 0;
    color: var(--muted);
  }

  .venue-box {
    display: grid;
    gap: 4px;
    justify-items: end;
    text-align: right;
  }

  .venue-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 34px;
    padding: 6px 10px;
    border-radius: 999px;
    background: var(--accent-soft);
    color: #6f4a0e;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0;
    border-top: 1px solid var(--line);
  }

  .detail-card {
    padding: 12px 16px 14px;
  }

  .detail-card + .detail-card {
    border-left: 1px solid var(--line);
  }

  .detail-card h4 {
    margin: 0 0 8px;
    color: var(--muted);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .detail-list {
    display: grid;
    gap: 7px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .detail-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    align-items: baseline;
  }

  .detail-meta {
    color: var(--muted);
    font-size: 11px;
  }

  .empty-state {
    margin: 0;
    color: var(--muted);
  }
`

let browserPromise: Promise<Browser> | null = null

function getBrowser() {
  if (!browserPromise) {
    browserPromise = chromium.launch({
      headless: true,
      args: ['--disable-dev-shm-usage', '--no-sandbox'],
    })
  }

  return browserPromise
}

function formatFestivalDateRange(startDate: string, endDate: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (startDate === endDate) {
    return format(start, 'd. MMMM yyyy', { locale: nb })
  }

  return `${format(start, 'd. MMMM yyyy', { locale: nb })} – ${format(end, 'd. MMMM yyyy', { locale: nb })}`
}

function formatTimeRange(startAt: string, endAt: string) {
  return `${format(new Date(startAt), 'HH:mm')}–${format(new Date(endAt), 'HH:mm')}`
}

function formatGeneratedAt(date: Date) {
  return format(date, 'd. MMM yyyy HH:mm', { locale: nb })
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function buildHeaderTemplate(title: string) {
  return `
    <div style="width:100%;padding:0 14mm;font-family:'Segoe UI',Arial,sans-serif;font-size:9px;color:#666;display:flex;justify-content:space-between;align-items:center;">
      <span style="letter-spacing:0.08em;text-transform:uppercase;">Festivalrapport</span>
      <span>${escapeHtml(title)}</span>
    </div>
  `
}

function buildFooterTemplate(generatedAt: string) {
  return `
    <div style="width:100%;padding:0 14mm;font-family:'Segoe UI',Arial,sans-serif;font-size:9px;color:#666;display:flex;justify-content:space-between;align-items:center;">
      <span>Generert ${escapeHtml(generatedAt)}</span>
      <span>Side <span class="pageNumber"></span> / <span class="totalPages"></span></span>
    </div>
  `
}

function renderFestivalReportDocument(report: FestivalReportData) {
  const totalItems = report.days.reduce((sum, day) => sum + day.items.length, 0)
  const festivalCrewMarkup = report.festivalCrew.length === 0
    ? '<p class="empty-state">Ikkje sett</p>'
    : `
      <ul class="simple-list">
        ${report.festivalCrew.map((crew) => `
          <li class="simple-row">
            <span>${escapeHtml(crew.name)}</span>
            <span class="support-text">${escapeHtml(crew.role ?? 'Utan rolle')}</span>
          </li>
        `).join('')}
      </ul>
    `

  const festivalEquipmentMarkup = report.festivalEquipment.length === 0
    ? '<p class="empty-state">Ikkje sett</p>'
    : `
      <ul class="simple-list">
        ${report.festivalEquipment.map((equipment) => `
          <li class="simple-row">
            <span>
              ${escapeHtml(equipment.name)}
              ${equipment.category ? `<span class="support-text"> · ${escapeHtml(equipment.category)}</span>` : ''}
            </span>
            <span class="support-text">${equipment.quantity} stk</span>
          </li>
        `).join('')}
      </ul>
    `

  const daysMarkup = report.days.map((day) => {
    const itemsMarkup = day.items.length === 0
      ? '<p class="empty-day">Ingen programpostar denne dagen.</p>'
      : day.items.map((item) => `
          <article class="item-card">
            <section class="item-main">
              <div class="time-box">
                <span class="time-label">Tid</span>
                <span class="time-value">${formatTimeRange(item.startAt, item.endAt)}</span>
              </div>

              <div>
                <h3>${escapeHtml(item.name)}</h3>
                ${item.description ? `<p class="item-description">${escapeHtml(item.description)}</p>` : ''}
              </div>

              <div class="venue-box">
                <span class="time-label">Venue</span>
                <span class="venue-chip">${escapeHtml(item.venue ?? report.festival.venue ?? 'Ikkje sett')}</span>
              </div>
            </section>

            <section class="detail-grid">
              <div class="detail-card">
                <h4>Teknikarar</h4>
                ${item.crew.length === 0 ? '<p class="empty-state">Ikkje sett</p>' : `
                  <ul class="detail-list">
                    ${item.crew.map((crew) => `
                      <li class="detail-row">
                        <span>${escapeHtml(crew.name)}</span>
                        <span class="detail-meta">${escapeHtml(crew.role ?? 'Utan rolle')}</span>
                      </li>
                    `).join('')}
                  </ul>
                `}
              </div>

              <div class="detail-card">
                <h4>Utstyr</h4>
                ${item.equipment.length === 0 ? '<p class="empty-state">Ikkje sett</p>' : `
                  <ul class="detail-list">
                    ${item.equipment.map((equipment) => `
                      <li class="detail-row">
                        <span>
                          ${escapeHtml(equipment.name)}
                          ${equipment.category ? `<span class="detail-meta"> · ${escapeHtml(equipment.category)}</span>` : ''}
                        </span>
                        <span class="detail-meta">${equipment.quantity} stk</span>
                      </li>
                    `).join('')}
                  </ul>
                `}
              </div>
            </section>
          </article>
        `).join('')

    return `
      <section class="day-section">
        <header class="day-header">
          <h2>${escapeHtml(day.label)}</h2>
          <span class="day-count">${day.items.length} ${day.items.length === 1 ? 'post' : 'postar'}</span>
        </header>
        ${itemsMarkup}
      </section>
    `
  }).join('')

  return `
    <main class="document">
      <header class="hero">
        <div class="hero-top">
          <div>
            <p class="eyebrow">Festivalrapport</p>
            <h1>${escapeHtml(report.festival.name)}</h1>
            <div class="meta-list">
              <div><span class="meta-label">Dato:</span> ${escapeHtml(formatFestivalDateRange(report.festival.startDate, report.festival.endDate))}</div>
              ${report.festival.venue ? `<div><span class="meta-label">Venue:</span> ${escapeHtml(report.festival.venue)}</div>` : ''}
              ${report.festival.client ? `<div><span class="meta-label">Klient:</span> ${escapeHtml(report.festival.client)}</div>` : ''}
            </div>
          </div>

          <aside class="summary-card">
            <p class="summary-title">Samandrag</p>
            <div class="summary-grid">
              <div>
                <span class="summary-value">${report.days.length}</span>
                <span class="summary-label">Festivaldagar</span>
              </div>
              <div>
                <span class="summary-value">${totalItems}</span>
                <span class="summary-label">Programpostar</span>
              </div>
              <div>
                <span class="summary-value">${report.festivalCrew.length}</span>
                <span class="summary-label">Festivalcrew</span>
              </div>
              <div>
                <span class="summary-value">${report.festivalEquipment.length}</span>
                <span class="summary-label">Utstyrslinjer</span>
              </div>
            </div>
          </aside>
        </div>

        ${report.festival.description ? `<p class="description">${escapeHtml(report.festival.description)}</p>` : ''}
      </header>

      <section class="intro-grid">
        <section class="panel">
          <h2>Festivalcrew</h2>
          ${festivalCrewMarkup}
        </section>

        <section class="panel">
          <h2>Festivalutstyr</h2>
          ${festivalEquipmentMarkup}
        </section>
      </section>

      ${daysMarkup}
    </main>
  `
}

function renderFestivalReportHtml(report: FestivalReportData) {
  return `<!DOCTYPE html>
<html lang="nb">
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(report.festival.name)} · Festivalrapport</title>
    <style>${REPORT_CSS}</style>
  </head>
  <body>${renderFestivalReportDocument(report)}</body>
</html>`
}

export function createFestivalReportFilename(report: FestivalReportData) {
  const base = `${report.festival.name}-${report.festival.startDate}-festivalrapport`
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `${base || 'festivalrapport'}.pdf`
}

export async function generateFestivalReportPdf(report: FestivalReportData) {
  const browser = await getBrowser()
  const page = await browser.newPage()
  const generatedAt = formatGeneratedAt(new Date())

  try {
    await page.setContent(renderFestivalReportHtml(report), { waitUntil: 'load' })
    await page.emulateMedia({ media: 'print' })

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '18mm',
        right: '12mm',
        bottom: '18mm',
        left: '12mm',
      },
      displayHeaderFooter: true,
      headerTemplate: buildHeaderTemplate(report.festival.name),
      footerTemplate: buildFooterTemplate(generatedAt),
    })

    return Buffer.from(pdf)
  } finally {
    await page.close()
  }
}
