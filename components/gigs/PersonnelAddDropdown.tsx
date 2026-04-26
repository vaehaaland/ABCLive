'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, User, Briefcase } from 'lucide-react'
import AddPersonnelDialog from './AddPersonnelDialog'
import AddExternalPersonnelDialog from './AddExternalPersonnelDialog'

interface Props {
  gigId: string
  gigStartDate: string
  gigEndDate: string
  dialogTitle?: string
}

export default function PersonnelAddDropdown({ gigId, gigStartDate, gigEndDate, dialogTitle }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [internOpen, setInternOpen] = useState(false)
  const [freelanceOpen, setFreelanceOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  return (
    <>
      <div ref={ref} className="relative">
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Legg til personell"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <Plus className="size-4" />
        </Button>

        {menuOpen && (
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-md border border-white/10 bg-surface-high py-1 shadow-lg">
            <button
              type="button"
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-surface-highest transition-colors"
              onClick={() => { setMenuOpen(false); setInternOpen(true) }}
            >
              <User className="size-4 text-muted-foreground" />
              Intern
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-surface-highest transition-colors"
              onClick={() => { setMenuOpen(false); setFreelanceOpen(true) }}
            >
              <Briefcase className="size-4 text-muted-foreground" />
              Freelance
            </button>
          </div>
        )}
      </div>

      <AddPersonnelDialog
        gigId={gigId}
        gigStartDate={gigStartDate}
        gigEndDate={gigEndDate}
        dialogTitle={dialogTitle}
        open={internOpen}
        onOpenChange={setInternOpen}
      />

      <AddExternalPersonnelDialog
        gigId={gigId}
        open={freelanceOpen}
        onOpenChange={setFreelanceOpen}
      />
    </>
  )
}
