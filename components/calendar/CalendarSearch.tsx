'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'

export function CalendarSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [value, setValue] = useState(searchParams.get('q') ?? '')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value
    setValue(next)
    const params = new URLSearchParams(searchParams.toString())
    if (next) {
      params.set('q', next)
    } else {
      params.delete('q')
    }
    startTransition(() => {
      router.push(`/dashboard/calendar?${params.toString()}`)
    })
  }

  return (
    <Input
      type="search"
      placeholder="Søk etter oppdrag..."
      value={value}
      onChange={handleChange}
      className="w-56"
    />
  )
}
