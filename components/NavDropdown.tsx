'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavDropdownProps {
  label: string
  links: { href: string; label: string }[]
}

export function NavDropdown({ label, links }: NavDropdownProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const isActive = links.some(
    (l) => pathname === l.href || pathname.startsWith(l.href + '/')
  )

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
          "text-muted-foreground hover:text-primary hover:bg-surface-high",
          isActive && [
            "text-primary hover:text-primary hover:bg-transparent",
            "after:absolute after:bottom-[-1px] after:left-2 after:right-2 after:h-[2px]",
            "after:rounded-full after:bg-primary",
            "after:[box-shadow:0_0_6px_2px_oklch(0.74_0.18_295_/_0.4)]",
          ]
        )}
      >
        {label}
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 min-w-[140px] rounded-lg border border-white/[0.08] bg-surface-low shadow-lg py-1">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block px-3 py-2 text-sm font-medium transition-colors",
                  "text-muted-foreground hover:text-primary hover:bg-surface-high",
                  active && "text-primary"
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
