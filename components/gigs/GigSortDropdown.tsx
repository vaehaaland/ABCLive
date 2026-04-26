'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { ArrowUpDownIcon, CheckIcon, ChevronDownIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type GigSort = 'date' | 'name'

const OPTIONS: { value: GigSort; label: string }[] = [
  { value: 'date', label: 'Startdato' },
  { value: 'name', label: 'Namn' },
]

export function GigSortDropdown({ defaultValue }: { defaultValue: GigSort }) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState<GigSort>(defaultValue)
  const [prevDefault, setPrevDefault] = useState<GigSort>(defaultValue)
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)

  if (prevDefault !== defaultValue) {
    setPrevDefault(defaultValue)
    setValue(defaultValue)
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

  function select(next: GigSort) {
    setValue(next)
    setOpen(false)
    const params = new URLSearchParams(searchParams.toString())
    if (next === 'date') {
      params.delete('sort')
    } else {
      params.set('sort', next)
    }
    const query = params.toString()
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname)
    })
  }

  const currentLabel = OPTIONS.find((o) => o.value === value)?.label ?? 'Startdato'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-xl border bg-surface-high px-3 py-1.5 text-xs font-medium transition-all',
          open ? 'border-primary/40 text-foreground' : 'border-white/10 text-muted-foreground hover:text-foreground',
          isPending && 'opacity-70'
        )}
      >
        <ArrowUpDownIcon className="size-3 shrink-0" />
        {currentLabel}
        <ChevronDownIcon className={cn('size-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[140px] rounded-xl border border-white/10 bg-surface-container shadow-xl overflow-hidden">
          {OPTIONS.map(({ value: optVal, label }) => {
            const active = value === optVal
            return (
              <button
                key={optVal}
                onClick={() => select(optVal)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-left transition-colors',
                  active
                    ? 'bg-surface-high text-foreground'
                    : 'text-muted-foreground hover:bg-surface-high hover:text-foreground'
                )}
              >
                <span className="flex-1">{label}</span>
                {active && <CheckIcon className="size-3 text-primary" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
