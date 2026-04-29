'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { cn } from '@/lib/utils'

export function ShowDeletedToggle({
  defaultChecked,
}: {
  defaultChecked: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [checked, setChecked] = useState(defaultChecked)
  const [prevDefault, setPrevDefault] = useState(defaultChecked)
  const [isPending, startTransition] = useTransition()

  if (prevDefault !== defaultChecked) {
    setPrevDefault(defaultChecked)
    setChecked(defaultChecked)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.checked
    setChecked(next)

    const params = new URLSearchParams(searchParams.toString())
    if (next) {
      params.set('showDeleted', '1')
    } else {
      params.delete('showDeleted')
    }

    const query = params.toString()
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname)
    })
  }

  return (
    <label
      className={cn(
        'inline-flex items-center gap-2 rounded-xl border border-input bg-surface-high px-3 py-1.5 text-sm transition-opacity',
        isPending && 'opacity-70'
      )}
    >
      <span className={cn('transition-colors', checked ? 'text-foreground' : 'text-muted-foreground')}>
        Vis sletta
      </span>
      <span className="relative inline-flex items-center">
        <input
          type="checkbox"
          role="switch"
          aria-label="Vis sletta oppdrag"
          checked={checked}
          onChange={handleChange}
          disabled={isPending}
          className="sr-only"
        />
        <span
          aria-hidden="true"
          className={cn(
            'relative h-5 w-9 rounded-full transition-colors',
            checked ? 'bg-destructive' : 'bg-surface-highest'
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 size-4 rounded-full bg-surface-container shadow-sm transition-transform',
              checked ? 'translate-x-[18px]' : 'translate-x-0.5'
            )}
          />
        </span>
      </span>
    </label>
  )
}
