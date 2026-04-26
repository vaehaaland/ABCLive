'use client'

import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
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
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!menuOpen || !btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    setMenuPos({
      top: rect.bottom + window.scrollY + 4,
      left: rect.right + window.scrollX,
    })
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (btnRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  return (
    <>
      <Button
        ref={btnRef}
        size="sm"
        variant="outline"
        aria-label="Legg til personell"
        onClick={() => setMenuOpen((v) => !v)}
      >
        <Plus className="size-4" />
        Legg til
      </Button>

      {menuOpen && createPortal(
        <div
          ref={menuRef}
          className="fixed z-50 min-w-[160px] rounded-md border border-white/10 bg-surface-high py-1 shadow-lg"
          style={{ top: menuPos.top, left: menuPos.left, transform: 'translateX(-100%)' }}
        >
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
        </div>,
        document.body
      )}

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
