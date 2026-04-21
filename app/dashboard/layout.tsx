import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NavLink } from '@/components/NavLink'
import { Avatar } from '@/components/ui/avatar'
import LogoutButton from '@/components/LogoutButton'
import NotificationBell from '@/components/NotificationBell'

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
    .select('full_name, role, avatar_url, is_superadmin')
    .eq('id', user.id)
    .single() as { data: { full_name: string | null, role: string, avatar_url: string | null, is_superadmin: boolean } | null, error: unknown }

  const isAdmin = profile?.role === 'admin'
  const isSuperadmin = profile?.is_superadmin === true

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-background/60 backdrop-blur-[20px]">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link href="/dashboard/gigs">
              <span className="font-heading font-bold text-lg tracking-tight text-foreground">
                ABC Studio
              </span>
            </Link>
            <nav className="flex items-center gap-0.5">
              <NavLink href="/dashboard/gigs">Oppdrag</NavLink>
              {isAdmin && (
                <>
                  <NavLink href="/dashboard/equipment">Utstyr</NavLink>
                  <NavLink href="/dashboard/personnel">Personell</NavLink>
                </>
              )}
              <NavLink href="/dashboard/calendar">Kalender</NavLink>
              {isSuperadmin && (
                <NavLink href="/dashboard/admin/users">Brukarar</NavLink>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              <Avatar
                src={profile?.avatar_url}
                name={profile?.full_name}
                size="sm"
              />
              <span className="text-sm text-muted-foreground hidden sm:block">
                {profile?.full_name ?? user.email}
              </span>
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
