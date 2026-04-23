import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NavLink } from '@/components/NavLink'
import { NavDropdown } from '@/components/NavDropdown'
import { Avatar } from '@/components/ui/avatar'
import LogoutButton from '@/components/LogoutButton'
import NotificationBell from '@/components/NotificationBell'
import { getDisplayName } from '@/lib/utils'

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
      <header className="sticky top-0 z-50 w-full border-b border-border bg-[oklch(0.09_0.016_282/0.85)] backdrop-blur-xl">
        <div className="flex h-[52px] items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link href="/dashboard/gigs" className="shrink-0">
              <span className="font-heading font-extrabold text-[1rem] tracking-tight bg-gradient-to-r from-primary to-spotlight-gold bg-clip-text text-transparent">
                ABC Studio
              </span>
            </Link>
            <nav className="flex items-center gap-0.5">
              <NavLink href="/dashboard/gigs">Oppdrag</NavLink>
              {isAdmin && (
                <NavLink href="/dashboard/equipment">Ressursar</NavLink>
              )}
              <NavLink href="/dashboard/calendar">Kalender</NavLink>
              {isSuperadmin && (
                <NavDropdown
                  label="Admin"
                  links={[
                    { href: '/dashboard/admin/users', label: 'Brukarar' },
                    { href: '/dashboard/admin/icloud', label: 'iCloud' },
                  ]}
                />
              )}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2 rounded-xl px-2.5 py-1 transition-colors hover:bg-surface-high"
            >
              <Avatar
                src={profile?.avatar_url}
                name={profile?.full_name}
                size="sm"
              />
              <span className="hidden text-sm font-medium text-muted-foreground sm:block">
                {getDisplayName(profile, user.email ?? '—')}
              </span>
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="flex-1 px-4 py-8">{children}</main>
    </div>
  )
}
