'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { SearchIcon, XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function GigSearchInput({ defaultValue }: { defaultValue: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(defaultValue)
  const [prevDefault, setPrevDefault] = useState(defaultValue)
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (prevDefault !== defaultValue) {
    setPrevDefault(defaultValue)
    setValue(defaultValue)
  }

  function push(search: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (search) {
      params.set('search', search)
    } else {
      params.delete('search')
    }
    const query = params.toString()
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname)
    })
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value
    setValue(next)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => push(next), 300)
  }

  function handleClear() {
    setValue('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    push('')
  }

  return (
    <div
      className={cn(
        'relative flex w-full items-center rounded-xl border border-input bg-surface-high transition-opacity',
        isPending && 'opacity-70'
      )}
    >
      <SearchIcon className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
      <input
        type="search"
        placeholder="Søk på namn, stad eller kunde…"
        value={value}
        onChange={handleChange}
        className="w-full bg-transparent py-2 pl-9 pr-8 text-sm outline-none placeholder:text-muted-foreground"
      />
      {value && (
        <button
          onClick={handleClear}
          aria-label="Tøm søk"
          className="absolute right-2.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <XIcon className="size-4" />
        </button>
      )}
    </div>
  )
}
