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
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import type { Profile } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const caller = await requireSuperadmin()

  const admin = createAdminClient()

  const [{ data: authData }, { data: profiles }] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    admin.from('profiles').select('*').order('full_name') as unknown as Promise<{
      data: Profile[] | null
    }>,
  ])

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]))
  const users = (authData?.users ?? []).map((u) => {
    const p = profileById.get(u.id)
    return {
      id: u.id,
      email: u.email ?? p?.email ?? '',
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      confirmed_at: u.confirmed_at ?? u.email_confirmed_at,
      full_name: p?.full_name ?? null,
      role: p?.role ?? 'technician',
      primary_role: p?.primary_role ?? null,
      avatar_url: p?.avatar_url ?? null,
      is_superadmin: p?.is_superadmin ?? false,
      phone: p?.phone ?? null,
    }
  })

  users.sort((a, b) =>
    (a.full_name ?? a.email).localeCompare(b.full_name ?? b.email, 'nb')
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-bold">Brukarar</h1>
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
              <TableHead>Rolle</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Oppretta</TableHead>
              <TableHead className="text-right">Handlingar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const isSelf = u.id === caller.id
              const pending = !u.confirmed_at && !u.last_sign_in_at
              return (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar src={u.avatar_url} name={u.full_name} size="sm" />
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{u.full_name ?? '—'}</span>
                        {u.primary_role && (
                          <span className="text-xs text-muted-foreground">{u.primary_role}</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                        {u.role === 'admin' ? 'Admin' : 'Teknikar'}
                      </Badge>
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
                  <TableCell className="text-muted-foreground text-xs">
                    {format(new Date(u.created_at), 'd. MMM yyyy', { locale: nb })}
                  </TableCell>
                  <TableCell className="text-right">
                    <UserRowActions
                      user={{
                        id: u.id,
                        email: u.email,
                        full_name: u.full_name,
                        role: u.role,
                        primary_role: u.primary_role,
                        is_superadmin: u.is_superadmin,
                        avatar_url: u.avatar_url,
                        phone: u.phone,
                        pending,
                      }}
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
