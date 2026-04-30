import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireSuperadmin } from '@/lib/auth/requireSuperadmin'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import NewUserDialog from '@/components/admin/NewUserDialog'
import UserRowActions from '@/components/admin/UserRowActions'
import { CompanyBadge } from '@/components/CompanyBadge'
import { endOfMonth, endOfWeek, format, isSameDay, startOfDay, startOfMonth, startOfWeek } from 'date-fns'
import { nb } from 'date-fns/locale'
import type { Profile } from '@/types/database'
import { formatPhone } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Brukarar',
}

function formatLastSeen(value: string | null) {
  if (!value) {
    return { label: 'Aldri', title: 'Aldri logga inn' }
  }

  const date = new Date(value)
  const now = new Date()
  const exact = format(date, 'd. MMM yyyy HH:mm', { locale: nb })

  if (isSameDay(date, now)) {
    return { label: 'I dag', title: exact }
  }

  const weekStart = startOfWeek(startOfDay(now), { weekStartsOn: 1 })
  const weekEnd = endOfWeek(startOfDay(now), { weekStartsOn: 1 })
  if (date >= weekStart && date <= weekEnd) {
    return { label: 'Denne veka', title: exact }
  }

  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  if (date >= monthStart && date <= monthEnd) {
    return { label: 'Denne månaden', title: exact }
  }

  return { label: format(date, 'd. MMM yyyy', { locale: nb }), title: exact }
}

export default async function AdminUsersPage() {
  const caller = await requireSuperadmin()

  const admin = createAdminClient()

  const [{ data: authData }, { data: profiles }, { data: companies }, { data: allMemberships }] =
    await Promise.all([
      admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
      admin.from('profiles').select('*').order('full_name') as unknown as Promise<{
        data: Profile[] | null
      }>,
      admin.from('companies').select('id, name, slug').order('name'),
      admin
        .from('company_memberships')
        .select('id, profile_id, company_id, role, companies(id, name, slug)')
        .order('created_at'),
    ])

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]))

  type MembershipWithCompany = {
    id: string
    profile_id: string
    company_id: string
    role: 'admin' | 'technician'
    companies: { id: string; name: string; slug: string } | null
  }
  const membershipsByProfileId = new Map<string, MembershipWithCompany[]>()
  for (const m of (allMemberships ?? []) as MembershipWithCompany[]) {
    const list = membershipsByProfileId.get(m.profile_id) ?? []
    list.push(m)
    membershipsByProfileId.set(m.profile_id, list)
  }

  const users = (authData?.users ?? []).map((u) => {
    const p = profileById.get(u.id)
    return {
      id: u.id,
      email: u.email ?? p?.email ?? '',
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      confirmed_at: u.confirmed_at ?? u.email_confirmed_at,
      full_name: p?.full_name ?? null,
      nickname: p?.nickname ?? null,
      role: p?.role ?? 'technician',
      primary_role: p?.primary_role ?? null,
      avatar_url: p?.avatar_url ?? null,
      is_superadmin: p?.is_superadmin ?? false,
      phone: p?.phone ?? null,
      memberships: membershipsByProfileId.get(u.id) ?? [],
    }
  })

  users.sort((a, b) =>
    (a.full_name ?? a.email).localeCompare(b.full_name ?? b.email, 'nb')
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="type-h2">Brukarar</h1>
          <p className="text-sm text-muted-foreground">
            Administrer innloggingar til ABCLive. Berre synleg for superadmin.
          </p>
        </div>
        <NewUserDialog />
      </div>

      {users.length === 0 ? (
        <p className="text-muted-foreground text-sm">Ingen brukarar registrert.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Namn</TableHead>
              <TableHead>E-post</TableHead>
              <TableHead>Tilgang</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Oppretta</TableHead>
              <TableHead>Sist innlogga</TableHead>
              <TableHead className="text-right">Handlingar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const isSelf = u.id === caller.id
              const pending = !u.confirmed_at && !u.last_sign_in_at
              const lastSeen = formatLastSeen(u.last_sign_in_at ?? null)
              return (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar src={u.avatar_url} name={u.full_name} size="sm" id={u.id} />
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{u.full_name ?? '—'}</span>
                        {u.primary_role && (
                          <span className="type-label text-muted-foreground">{u.primary_role}</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1">
                      {u.memberships.map((m) => (
                        <div key={m.id} className="flex items-center gap-1">
                          <CompanyBadge company={m.companies} size="xs" />
                          <span className="type-label text-muted-foreground">
                            {m.role === 'admin' ? 'Admin' : 'Teknikar'}
                          </span>
                        </div>
                      ))}
                      {u.is_superadmin && <Badge variant="gold">Superadmin</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {pending ? (
                      <Badge variant="outline">Invitert</Badge>
                    ) : (
                      <Badge variant="success">Aktiv</Badge>
                    )}
                  </TableCell>
                  <TableCell className="type-label text-muted-foreground">
                    {format(new Date(u.created_at), 'd. MMM yyyy', { locale: nb })}
                  </TableCell>
                  <TableCell className="type-label text-muted-foreground">
                    <span title={lastSeen.title}>{lastSeen.label}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <UserRowActions
                      user={{
                        id: u.id,
                        email: u.email,
                        full_name: u.full_name,
                        nickname: u.nickname,
                        role: u.role as 'admin' | 'technician',
                        primary_role: u.primary_role,
                        is_superadmin: u.is_superadmin,
                        avatar_url: u.avatar_url,
                        // phone: u.phone, but formatted with formatPhone util to add spaces and country code if missing
                        phone: u.phone ? formatPhone(u.phone) : null,
                        pending,
                        memberships: u.memberships,
                      }}
                      companies={companies ?? []}
                      isSelf={isSelf}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

