'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NavLinkProps {
  href: string
  children: React.ReactNode
}

export function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={cn(
        "relative px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
        "text-muted-foreground hover:text-foreground hover:bg-surface-high",
        isActive && [
          "text-primary hover:text-primary hover:bg-transparent",
          "after:absolute after:bottom-[-1px] after:left-2 after:right-2 after:h-[2px]",
          "after:rounded-full after:bg-primary",
          "after:[box-shadow:0_0_6px_2px_oklch(0.74_0.18_295_/_0.4)]",
        ]
      )}
    >
      {children}
    </Link>
  )
}
