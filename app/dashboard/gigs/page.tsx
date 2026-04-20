import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { format, subDays } from 'date-fns'
import { nb } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PastGigsToggle } from '@/components/gigs/PastGigsToggle'
import { CalendarIcon, MapPinIcon, BuildingIcon } from 'lucide-react'
import type { Gig, GigStatus } from '@/types/database'

const statusLabels: Record<GigStatus, string> = {
  draft: 'Utkast',
  confirmed: 'Bekrefta',
  completed: 'Fullført',
  cancelled: 'Avlyst',
}

const statusVariants: Record<GigStatus, 'default' | 'secondary' | 'outline' | 'status-alert'> = {
  draft: 'outline',
  confirmed: 'default',
  completed: 'secondary',
  cancelled: 'status-alert',
}

function getCardHue(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff
  }
  return Math.abs(hash) % 360
}

type GigSort = 'date' | 'name'

export default async function GigsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; showPast?: string }>
}) {
  const sp = await searchParams
  const sort: GigSort = sp.sort === 'name' ? 'name' : 'date'
  const showPast = sp.showPast === '1'
  const baseParams = new URLSearchParams()
  if (sort === 'name') {
    baseParams.set('sort', 'name')
  }
  if (showPast) {
    baseParams.set('showPast', '1')
  }
  const buildHref = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(baseParams)
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    }
    const query = params.toString()
    return query ? `/dashboard/gigs?${query}` : '/dashboard/gigs'
  }
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single() as { data: { role: string } | null, error: unknown }

  const isAdmin = profile?.role === 'admin'

  let gigsQuery = supabase
    .from('gigs')
    .select('*')

  if (!showPast) {
    gigsQuery = gigsQuery.gt('end_date', format(subDays(new Date(), 3), 'yyyy-MM-dd'))
  }

  gigsQuery = sort === 'name'
    ? gigsQuery.order('name', { ascending: true }).order('start_date', { ascending: true })
    : gigsQuery.order('start_date', { ascending: true }).order('name', { ascending: true })

  const { data: gigs } = await gigsQuery as { data: Gig[] | null, error: unknown }

  const gigList = gigs ?? []
  const festivalIds = gigList.filter((gig) => gig.gig_type === 'festival').map((gig) => gig.id)
  const programItemCountMap = new Map<string, number>()

  if (festivalIds.length > 0) {
    const { data: programItems } = await supabase
      .from('gig_program_items')
      .select('gig_id')
      .in('gig_id', festivalIds) as { data: { gig_id: string }[] | null, error: unknown }

    for (const item of programItems ?? []) {
      const count = programItemCountMap.get(item.gig_id) ?? 0
      programItemCountMap.set(item.gig_id, count + 1)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Oppdrag</h1>
        {isAdmin && (
          <Button asChild>
            <Link href="/dashboard/gigs/new">Nytt arrangement</Link>
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Sorter etter</span>
        <Button asChild size="sm" variant={sort === 'date' ? 'default' : 'outline'}>
          <Link href={buildHref({ sort: null })}>Startdato</Link>
        </Button>
        <Button asChild size="sm" variant={sort === 'name' ? 'default' : 'outline'}>
          <Link href={buildHref({ sort: 'name' })}>Namn</Link>
        </Button>
        <PastGigsToggle defaultChecked={showPast} />
      </div>

      {!gigList.length ? (
        <p className="text-muted-foreground text-sm">Ingen oppdrag å vise.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gigList.map((gig) => {
            const hue = getCardHue(gig.id)
            return (
              <Link
                key={gig.id}
                href={`/dashboard/gigs/${gig.id}`}
                className="group block rounded-xl overflow-hidden transition-transform hover:-translate-y-0.5"
              >
                {/* Colored gradient banner */}
                <div
                  className="h-28 flex items-end p-4"
                  style={{
                    background: `linear-gradient(135deg, oklch(0.28 0.12 ${hue}) 0%, oklch(0.13 0 0) 100%)`,
                  }}
                >
                  <Badge variant={statusVariants[gig.status as GigStatus]}>
                    {statusLabels[gig.status as GigStatus]}
                  </Badge>
                </div>

                {/* Card body */}
                <div className="bg-surface-container group-hover:bg-surface-high transition-colors p-4 flex flex-col gap-2">
                  <p className="font-heading font-semibold text-sm leading-snug line-clamp-1">
                    {gig.name}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {gig.gig_type === 'festival' && <Badge variant="gold">Festival</Badge>}
                    {gig.gig_type === 'festival' && (
                      <Badge variant="outline">
                        {programItemCountMap.get(gig.id) ?? 0} postar
                      </Badge>
                    )}
                  </div>
                  {gig.client && (
                    <p className="flex items-center gap-1.5 text-xs text-primary font-medium">
                      <BuildingIcon className="size-3 shrink-0" />
                      {gig.client}
                    </p>
                  )}
                  <div className="flex flex-col gap-1 mt-0.5">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarIcon className="size-3 shrink-0" />
                      {format(new Date(gig.start_date), 'd. MMM yyyy', { locale: nb })}
                      {gig.start_date !== gig.end_date && (
                        <>{' – '}{format(new Date(gig.end_date), 'd. MMM', { locale: nb })}</>
                      )}
                    </span>
                    {gig.venue && (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPinIcon className="size-3 shrink-0" />
                        {gig.venue}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
