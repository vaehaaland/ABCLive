import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { NavLink } from '@/components/NavLink'
import { NavDropdown } from '@/components/NavDropdown'
import { Avatar } from '@/components/ui/avatar'
import LogoutButton from '@/components/LogoutButton'
import NotificationBell from '@/components/NotificationBell'
import ReportIssueDialog from '@/components/ReportIssueDialog'
import { ThemeToggle } from '@/components/ThemeToggle'
import { CalendarDays, Grid2x2, SquarePlus } from 'lucide-react'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, nickname, role, avatar_url, is_superadmin')
    .eq('id', user.id)
    .single() as { data: { full_name: string | null, nickname: string | null, role: string, avatar_url: string | null, is_superadmin: boolean } | null, error: unknown }

  const isAdmin = profile?.role === 'admin'
  const isSuperadmin = profile?.is_superadmin === true
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-[oklch(0.11_0.016_282/0.90)] backdrop-blur-2xl">
        <div className="flex h-[52px] items-center justify-between gap-6 px-6">
          <div className="flex min-w-0 items-center gap-2">
            {/* TODO: migrate layout to app/app/layout.tsx — update all hrefs from /dashboard/* to /app/* */}
            <Link href="/dashboard/gigs" className="flex shrink-0 items-center gap-[9px]">
              <span className="relative flex size-7 shrink-0 items-center justify-center">
                <span
                  aria-hidden="true"
                  className="logo-ring-pulse absolute inset-0 rounded-full border border-[oklch(0.67_0.26_28/0.75)]"
                />
                <span
                  aria-hidden="true"
                  className="logo-ring-pulse absolute inset-0 rounded-full border border-[oklch(0.67_0.26_28/0.75)] [animation-delay:0.85s]"
                />
                <Image
                  src="/gemIcon.png"
                  alt="ABC Live"
                  width={28}
                  height={28}
                  className="relative z-10 rounded-full"
                />
              </span>
              <span className="bg-[linear-gradient(135deg,oklch(0.63_0.27_305),oklch(0.53_0.21_305))] bg-clip-text font-heading text-base font-extrabold text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] [font-variation-settings:'wght'_800,'opsz'_16,'ROND'_0]">
                ABC Live
              </span>
            </Link>
            <nav className="flex h-[52px] items-stretch gap-0.5 [&_.text-primary]:text-[oklch(0.84_0.16_198)] [&_.text-primary]:after:bottom-auto [&_.text-primary]:after:top-0 [&_.text-primary]:after:rounded-b-full [&_.text-primary]:after:rounded-t-none [&_.text-primary]:after:bg-[oklch(0.76_0.18_198)] [&_.text-primary]:after:[box-shadow:0_0_10px_2px_oklch(0.76_0.18_198_/_0.5)] [&_a]:flex [&_a]:h-full [&_a]:items-center [&_a]:rounded-none [&_a]:px-[13px] [&_a]:py-0 [&_a]:hover:bg-[oklch(1_0_0/5%)] [&_a]:[gap:5px] [&_button]:flex [&_button]:h-full [&_button]:items-center [&_button]:rounded-none [&_button]:px-[13px] [&_button]:py-0 [&_button]:hover:bg-[oklch(1_0_0/5%)] [&_.text-primary:hover]:text-[oklch(0.84_0.16_198)] [&_svg]:h-[13px] [&_svg]:w-[13px] [&_svg]:shrink-0">
              {/* TODO: /dashboard/gigs → /app/gigs */}
              <NavLink href="/dashboard/gigs">
                <Grid2x2 />
                Oppdrag
              </NavLink>
              {isAdmin && (
                // TODO: /dashboard/equipment → /app/resource/equipment
                // Note: /app/resource/equipment and /app/resource/persons share the /app/resource parent
                <NavLink href="/dashboard/equipment">
                  <SquarePlus />
                  Ressursar
                </NavLink>
              )}
              {/* TODO: /dashboard/calendar → /app/calendar */}
              <NavLink href="/dashboard/calendar">
                <CalendarDays />
                Kalender
              </NavLink>
              {isSuperadmin && (
                // TODO: /dashboard/admin/* → /app/admin/*
                <NavDropdown
                  label="Admin"
                  links={[
                    { href: '/dashboard/admin/users', label: 'Brukarar' },
                    { href: '/dashboard/admin/tickets', label: 'Tickets' },
                    { href: '/dashboard/admin/icloud', label: 'iCloud' },
                    { href: '/dashboard/admin/checklist', label: 'Sjekkliste' },
                  ]}
                />
              )}
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 text-muted-foreground [&_[data-slot=button]]:size-8 [&_[data-slot=button]]:rounded-[0.625rem]">
            <ReportIssueDialog />
            <NotificationBell />
            <ThemeToggle />
            <div className="mx-1 h-5 w-px bg-border" />
            {/* TODO: /dashboard/profile → /app/profile */}
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2 rounded-[0.625rem] px-1 py-1 transition-colors hover:bg-surface-high"
              aria-label="Profil"
            >
              <Avatar
                src={profile?.avatar_url}
                name={profile?.full_name}
                size="sm"
                id={user.id}
              />
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="flex-1 px-4 py-8">{children}</main>
    </div>
  )
}
