'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { ChevronDownIcon, CheckIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GigStatus } from '@/types/database'

const STATUS_OPTIONS: { value: GigStatus; label: string; dotClass: string }[] = [
  { value: 'confirmed', label: 'Bekrefta', dotClass: 'bg-primary' },
  { value: 'draft', label: 'Utkast', dotClass: 'bg-surface-highest border border-input' },
  { value: 'completed', label: 'Fullført', dotClass: 'bg-emerald-500' },
  { value: 'cancelled', label: 'Avlyst', dotClass: 'bg-destructive' },
]

export function GigStatusFilter({ defaultValue }: { defaultValue: GigStatus[] }) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selected, setSelected] = useState<GigStatus[]>(defaultValue)
  const [prevDefault, setPrevDefault] = useState<GigStatus[]>(defaultValue)
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)

  if ([...prevDefault].sort().join(',') !== [...defaultValue].sort().join(',')) {
    setPrevDefault(defaultValue)
    setSelected(defaultValue)
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function toggle(status: GigStatus) {
    const next = selected.includes(status)
      ? selected.filter((s) => s !== status)
      : [...selected, status]
    setSelected(next)

    const params = new URLSearchParams(searchParams.toString())
    if (next.length > 0) {
      params.set('status', next.join(','))
    } else {
      params.delete('status')
    }
    const query = params.toString()
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname)
    })
  }

  const activeCount = selected.length

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-xl border bg-surface-high px-3 py-1.5 type-label transition-all',
          open ? 'border-primary/40 text-foreground' : 'border-input text-muted-foreground hover:text-foreground',
          isPending && 'opacity-70'
        )}
      >
        Status
        {activeCount > 0 && (
          <span className="flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[0.625rem] font-bold size-4 leading-none">
            {activeCount}
          </span>
        )}
        <ChevronDownIcon
          className={cn('size-3.5 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 min-w-[160px] overflow-hidden rounded-xl border border-input bg-surface-container shadow-xl">
          {STATUS_OPTIONS.map(({ value, label, dotClass }) => {
            const checked = selected.includes(value)
            return (
              <button
                key={value}
                onClick={() => toggle(value)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 type-label text-left transition-colors',
                  checked ? 'bg-surface-high text-foreground' : 'text-muted-foreground hover:bg-surface-high hover:text-foreground'
                )}
              >
                <span className={cn('size-2 rounded-full shrink-0', dotClass)} />
                <span className="flex-1">{label}</span>
                {checked && <CheckIcon className="size-3 text-primary" />}
              </button>
            )
          })}
          {activeCount > 0 && (
            <>
              <div className="mx-2 h-px bg-border" />
              <button
                onClick={() => {
                  setSelected([])
                  const params = new URLSearchParams(searchParams.toString())
                  params.delete('status')
                  const query = params.toString()
                  startTransition(() => {
                    router.push(query ? `${pathname}?${query}` : pathname)
                  })
                  setOpen(false)
                }}
                className="w-full px-3 py-2 type-label text-muted-foreground hover:text-foreground transition-colors text-left"
              >
                Nullstill filter
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

