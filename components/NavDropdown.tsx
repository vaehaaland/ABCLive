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
          // v2: rounded-lg (was rounded-md), inactive hover goes to text-foreground
          "relative flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
          "text-muted-foreground hover:text-foreground hover:bg-surface-high",
          isActive && [
            "text-primary hover:text-primary hover:bg-transparent",
            // v2: stronger glow using new primary oklch(0.68 0.26 292)
            "after:absolute after:bottom-[-1px] after:left-2 after:right-2 after:h-[2px]",
            "after:rounded-full after:bg-primary",
            "after:[box-shadow:0_0_8px_2px_oklch(0.68_0.26_292_/_0.45)]",
          ]
        )}
      >
        {label}
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform duration-150", open && "rotate-180")}
        />
      </button>

      {open && (
        /*
          Dropdown panel — glassmorphic, matches nav bar aesthetic.
          rounded-xl (was rounded-lg), uses new surface tokens.
        */
        <div className="absolute left-0 top-full mt-1.5 z-50 min-w-[160px] rounded-xl border border-border bg-[oklch(0.10_0.016_282/0.95)] backdrop-blur-xl shadow-[0_16px_48px_oklch(0_0_0/0.4)] py-1 overflow-hidden">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block px-3 py-2 text-sm font-medium transition-colors",
                  "text-muted-foreground hover:text-foreground hover:bg-surface-high",
                  active && "text-primary bg-primary/[0.08]"
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
