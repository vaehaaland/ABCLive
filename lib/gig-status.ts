import type { GigStatus } from '@/types/database'

export type GigDisplayStatus = GigStatus | 'live'
export type GigStatusFilterValue = GigDisplayStatus

export const statusLabels: Record<GigDisplayStatus, string> = {
  draft: 'Utkast',
  confirmed: 'Bekrefta',
  live: 'Live',
  completed: 'Fullført',
  cancelled: 'Avlyst',
}

export const statusAccentClass: Record<GigDisplayStatus, string> = {
  confirmed: 'bg-primary',
  live: 'bg-live',
  completed: 'bg-emerald-500',
  draft: 'bg-surface-highest',
  cancelled: 'bg-destructive',
}

export function isGigLiveOnDate(
  gig: { status: string; start_date: string; end_date: string },
  today: string
) {
  return (
    gig.status === 'confirmed' &&
    gig.start_date <= today &&
    gig.end_date >= today
  )
}

export function getGigDisplayStatus(
  gig: { status: string; start_date: string; end_date: string },
  today: string
): GigDisplayStatus {
  return isGigLiveOnDate(gig, today) ? 'live' : (gig.status as GigStatus)
}
