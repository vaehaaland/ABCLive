'use client'

import { useState, useCallback } from 'react'
import { parseISO } from 'date-fns'
import Link from 'next/link'
import { getGigDisplayStatus } from '@/lib/gig-status'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export type CalendarGig = {
  id: string
  name: string
  start_date: string
  end_date: string
  status: 'draft' | 'confirmed' | 'completed' | 'cancelled'
  gig_type: 'single' | 'festival'
  venue: string | null
  client: string | null
}

type Seg = {
  gig: CalendarGig
  startCol: number // 0–6 (Mon=0)
  endCol: number   // 0–6
  isStart: boolean
  isEnd: boolean
  lane: number
}

// ─── Layout constants ─────────────────────────────────────────────────────────

const EVENT_H = 22  // px height of each event bar
const EVENT_GAP = 3 // px gap between lanes
const DATE_AREA = 34 // px reserved at top of row for day numbers

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function buildCalendar(year: number, month: number): Date[][] {
  const first = new Date(year, month - 1, 1)
  const last = new Date(year, month, 0)
  const dow = (first.getDay() + 6) % 7 // Mon=0
  const start = new Date(first)
  start.setDate(start.getDate() - dow)
  const weeks: Date[][] = []
  const cur = new Date(start)
  while (cur <= last || weeks.length < 4) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cur))
      cur.setDate(cur.getDate() + 1)
    }
    weeks.push(week)
    if (cur > last && weeks.length >= 4) break
  }
  return weeks
}

function getSegmentsForWeek(gigs: CalendarGig[], week: Date[]): Seg[] {
  const wStart = week[0]
  const wEnd = week[6]
  const rawSegs: Omit<Seg, 'lane'>[] = []

  for (const gig of gigs) {
    const eStart = parseISO(gig.start_date)
    const eEnd = parseISO(gig.end_date)
    if (eEnd < wStart || eStart > wEnd) continue

    const sStart = eStart < wStart ? wStart : eStart
    const sEnd = eEnd > wEnd ? wEnd : eEnd
    const startCol = Math.round(
      (sStart.getTime() - wStart.getTime()) / 86400000,
    )
    const endCol = Math.round(
      (sEnd.getTime() - wStart.getTime()) / 86400000,
    )

    rawSegs.push({
      gig,
      startCol,
      endCol,
      isStart: sameDay(sStart, eStart),
      isEnd: sameDay(sEnd, eEnd),
    })
  }

  // Greedy lane assignment — sort by start col first
  rawSegs.sort((a, b) => a.startCol - b.startCol)
  const occupied: number[] = [] // occupied[lane] = last endCol occupying that lane

  const result: Seg[] = rawSegs.map((seg) => {
    let lane = 0
    while (
      occupied[lane] !== undefined &&
      occupied[lane] >= seg.startCol
    ) {
      lane++
    }
    occupied[lane] = seg.endCol
    return { ...seg, lane }
  })

  return result
}

function getEventColorClass(gig: CalendarGig, today: string): string {
  if (gig.gig_type === 'festival') {
    return 'bg-spotlight-gold/80 text-[oklch(0.08_0_0)]'
  }
  switch (getGigDisplayStatus(gig, today)) {
    case 'confirmed':
      return 'bg-primary text-primary-foreground'
    case 'live':
      return 'bg-live text-white'
    case 'completed':
      return 'bg-emerald-500 text-white'
    case 'draft':
      return 'bg-surface-highest text-muted-foreground border border-white/10'
    default:
      return 'bg-surface-highest text-muted-foreground'
  }
}

function formatDateRange(gig: CalendarGig): string {
  const s = parseISO(gig.start_date)
  const e = parseISO(gig.end_date)
  const fmt = (d: Date) =>
    d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })
  if (sameDay(s, e)) return fmt(s)
  return `${fmt(s)} – ${fmt(e)}`
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function Tooltip({
  gig,
  pos,
  today,
}: {
  gig: CalendarGig | null
  pos: { x: number; y: number } | null
  today: string
}) {
  if (!gig || !pos) return null

  const safeLeft =
    typeof window !== 'undefined'
      ? Math.min(pos.x, window.innerWidth - 270)
      : pos.x

  const style: React.CSSProperties = {
    position: 'fixed',
    top: pos.y,
    left: safeLeft,
    zIndex: 9999,
  }

  return (
    <div
      style={style}
      className="w-60 rounded-xl bg-surface-highest border border-border shadow-[0_20px_40px_oklch(0_0_0/0.4)] p-0 overflow-hidden pointer-events-none"
    >
      <div className={cn('h-1', getEventColorClass(gig, today))} />
      <div className="p-3 flex flex-col gap-1.5">
        <p className="type-title text-sm leading-snug">
          {gig.name}
        </p>
        <p className="flex items-center gap-1.5 type-label text-muted-foreground">
          {formatDateRange(gig)}
        </p>
        {gig.venue && (
          <p className="flex items-center gap-1.5 type-label text-muted-foreground">
            {gig.venue}
          </p>
        )}
        {gig.client && (
          <p className="type-label text-primary">{gig.client}</p>
        )}
      </div>
    </div>
  )
}

// ─── WeekRow ──────────────────────────────────────────────────────────────────

function WeekRow({
  week,
  month,
  today,
  segs,
  searchQuery,
  onEventHover,
  onEventLeave,
  todayKey,
}: {
  week: Date[]
  month: number
  today: Date
  segs: Seg[]
  searchQuery: string
  onEventHover: (gig: CalendarGig, e: React.MouseEvent) => void
  onEventLeave: () => void
  todayKey: string
}) {
  const maxLane = segs.reduce((m, s) => Math.max(m, s.lane), -1)
  const rowH =
    DATE_AREA + (maxLane + 1) * (EVENT_H + EVENT_GAP) + 12

  return (
    <div
      className="relative grid grid-cols-7"
      style={{ minHeight: Math.max(rowH, 80) }}
    >
      {/* Background day cells */}
      {week.map((day, i) => {
        const isToday = sameDay(day, today)
        const isCurMonth = day.getMonth() === month - 1
        const isWeekend = i >= 5
        return (
          <div
            key={i}
            className={cn(
              'border-r border-border last:border-r-0 pt-1.5 px-1',
              isWeekend && 'bg-surface-low/50',
              !isCurMonth && 'opacity-40',
            )}
          >
            <div
              className={cn(
                'size-[26px] flex items-center justify-center type-label rounded-full mx-auto',
                isToday
                  ? 'bg-primary text-primary-foreground font-bold'
                  : 'text-muted-foreground',
              )}
            >
              {day.getDate()}
            </div>
          </div>
        )
      })}

      {/* Event bars layer — absolute positioned over the day grid */}
      <div className="absolute inset-0 pointer-events-none">
        {segs.map((seg, si) => {
          const { gig, startCol, endCol, isStart, isEnd, lane } = seg
          const colW = 100 / 7
          const CELL_PAD = 3
          const left = `calc(${startCol * colW}% + ${CELL_PAD}px)`
          const width = `calc(${(endCol - startCol + 1) * colW}% - ${CELL_PAD * 2}px)`
          const top = DATE_AREA + lane * (EVENT_H + EVENT_GAP)

          const isFaded =
            searchQuery &&
            !gig.name.toLowerCase().includes(searchQuery.toLowerCase())

          const colorClass = getEventColorClass(gig, todayKey)
          // A segment that starts at col 0 but isn't the actual event start
          // is a continuation from the previous week
          const isContinuation = !isStart && startCol === 0

          return (
            <Link
              key={si}
              href={`/dashboard/gigs/${gig.id}`}
              className={cn(
                'absolute h-[22px] rounded-md flex items-center px-2 type-micro normal-case tracking-normal truncate pointer-events-auto cursor-pointer transition-opacity hover:opacity-80',
                colorClass,
                isFaded && 'opacity-30',
                !isStart && !isContinuation && 'rounded-l-none',
                !isEnd && 'rounded-r-none',
              )}
              style={{ left, width, top }}
              onMouseEnter={(e) => onEventHover(gig, e)}
              onMouseLeave={onEventLeave}
            >
              {(isStart || isContinuation) && (
                <span className="truncate">
                  {!isStart && '← '}
                  {gig.name}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// ─── CalendarGrid (exported) ──────────────────────────────────────────────────

export function CalendarGrid({
  gigs,
  year,
  month,
  searchQuery,
}: {
  gigs: CalendarGig[]
  year: number
  month: number
  searchQuery: string
}) {
  const today = new Date()
  const todayKey = today.toLocaleDateString('sv-SE')
  const weeks = buildCalendar(year, month)
  const weekSegs = weeks.map((week) => getSegmentsForWeek(gigs, week))

  const [hoveredGig, setHoveredGig] = useState<CalendarGig | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(
    null,
  )

  const handleHover = useCallback(
    (gig: CalendarGig, e: React.MouseEvent) => {
      setHoveredGig(gig)
      setTooltipPos({ x: e.clientX + 12, y: e.clientY + 12 })
    },
    [],
  )

  const clearHover = useCallback(() => {
    setHoveredGig(null)
    setTooltipPos(null)
  }, [])

  return (
    <>
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 border-b border-border bg-surface-low sticky top-[calc(56px+52px)] z-20">
        {['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø'].map((d, i) => (
          <div
            key={d}
            className={cn(
              'py-2 text-center type-label',
              i >= 5 ? 'text-muted-foreground/40' : 'text-muted-foreground',
            )}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Week rows */}
      <div className="divide-y divide-border">
        {weeks.map((week, wi) => (
          <WeekRow
            key={wi}
            week={week}
            month={month}
            today={today}
            segs={weekSegs[wi]}
            searchQuery={searchQuery}
            onEventHover={handleHover}
            onEventLeave={clearHover}
            todayKey={todayKey}
          />
        ))}
      </div>

      {/* Hover tooltip */}
      <Tooltip gig={hoveredGig} pos={tooltipPos} today={todayKey} />
    </>
  )
}

