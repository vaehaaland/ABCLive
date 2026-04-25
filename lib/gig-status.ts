import type { GigStatus } from '@/types/database'

export const statusLabels: Record<GigStatus, string> = {
  draft: 'Utkast',
  confirmed: 'Bekrefta',
  completed: 'Fullført',
  cancelled: 'Avlyst',
}

export const statusAccentClass: Record<GigStatus, string> = {
  confirmed: 'bg-primary',
  completed: 'bg-emerald-500',
  draft: 'bg-surface-highest',
  cancelled: 'bg-destructive',
}
