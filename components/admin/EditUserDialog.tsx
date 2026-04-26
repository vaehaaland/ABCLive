'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateUser, resetPassword } from '@/app/dashboard/admin/users/actions'
import {
  addMembership,
  updateMembershipRole,
  removeMembership,
} from '@/app/actions/company-memberships'
import AdminAvatarUploader from '@/components/admin/AdminAvatarUploader'
import { CompanyBadge } from '@/components/CompanyBadge'
import type { UserRole } from '@/types/database'

interface MembershipWithCompany {
  id: string
  profile_id: string
  company_id: string
  role: UserRole
  companies: { id: string; name: string; slug: string } | null
}

interface Company {
  id: string
  name: string
  slug: string
}

export interface EditableUser {
  id: string
  email: string
  full_name: string | null
  nickname: string | null
  role: UserRole
  primary_role: string | null
  is_superadmin: boolean
  avatar_url: string | null
  phone: string | null
  memberships: MembershipWithCompany[]
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: EditableUser
  companies: Company[]
  isSelf: boolean
}

export default function EditUserDialog({ open, onOpenChange, user, companies, isSelf }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const [fullName, setFullName] = useState(user.full_name ?? '')
  const [nickname, setNickname] = useState(user.nickname ?? '')
  const [email, setEmail] = useState(user.email)
  const [phone, setPhone] = useState(user.phone ?? '')
  const [primaryRole, setPrimaryRole] = useState(user.primary_role ?? '')
  const [isSuperadmin, setIsSuperadmin] = useState(user.is_superadmin)
  const [newPassword, setNewPassword] = useState('')

  // Membership state (local copy so changes feel instant before refresh)
  const [memberships, setMemberships] = useState<MembershipWithCompany[]>(user.memberships)

  const memberCompanyIds = new Set(memberships.map((m) => m.company_id))
  const addableCompanies = companies.filter((c) => !memberCompanyIds.has(c.id))

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setStatus(null)
    const trimmedEmail = email.trim()
    startTransition(async () => {
      const result = await updateUser(user.id, {
        full_name: fullName.trim() || null,
        nickname: nickname.trim() || null,
        email: trimmedEmail !== user.email ? trimmedEmail : undefined,
        phone: phone.trim() || null,
        primary_role: primaryRole.trim() || null,
        is_superadmin: isSelf ? undefined : isSuperadmin,
      })
      if (!result.ok) {
        setError(result.error ?? 'Ukjend feil')
        return
      }
      onOpenChange(false)
      router.refresh()
    })
  }

  function handleRoleChange(membershipId: string, newRole: UserRole) {
    startTransition(async () => {
      const result = await updateMembershipRole(membershipId, newRole)
      if (result.error) {
        setError(result.error)
        return
      }
      setMemberships((prev) =>
        prev.map((m) => (m.id === membershipId ? { ...m, role: newRole } : m))
      )
      router.refresh()
    })
  }

  function handleRemoveMembership(membershipId: string) {
    startTransition(async () => {
      const result = await removeMembership(membershipId)
      if (result.error) {
        setError(result.error)
        return
      }
      setMemberships((prev) => prev.filter((m) => m.id !== membershipId))
      router.refresh()
    })
  }

  function handleAddCompany(companyId: string) {
    const company = companies.find((c) => c.id === companyId)
    if (!company) return
    startTransition(async () => {
      const result = await addMembership(user.id, companyId, 'technician')
      if (result.error) {
        setError(result.error)
        return
      }
      // Optimistically add a placeholder; refresh will fill in the real id
      setMemberships((prev) => [
        ...prev,
        { id: 'pending', profile_id: user.id, company_id: companyId, role: 'technician', companies: company },
      ])
      router.refresh()
    })
  }

  function handleReset() {
    setError(null)
    setStatus(null)
    if (newPassword.length < 8) {
      setError('Passord må vere minst 8 teikn')
      return
    }
    startTransition(async () => {
      const result = await resetPassword(user.id, newPassword)
      if (!result.ok) {
        setError(result.error ?? 'Kunne ikkje tilbakestille passord')
        return
      }
      setNewPassword('')
      setStatus('Passord er oppdatert.')
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rediger brukar</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <AdminAvatarUploader
            userId={user.id}
            initialAvatarUrl={user.avatar_url}
            name={user.full_name ?? user.email}
            size="lg"
            className="self-center"
          />

          <div className="grid gap-2">
            <Label htmlFor="edit-email">E-post</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-name">Fullt namn</Label>
            <Input
              id="edit-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-nickname">Kallenavn</Label>
            <Input
              id="edit-nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="t.d. Tommy, Kalle…"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-phone">Telefon</Label>
            <Input
              id="edit-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="12345678"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-primary">Hovudrolle</Label>
            <Input
              id="edit-primary"
              value={primaryRole}
              onChange={(e) => setPrimaryRole(e.target.value)}
            />
          </div>

          {/* Company memberships */}
          <div className="flex flex-col gap-2">
            <Label>Selskapsmedlemskap</Label>
            <div className="flex flex-col gap-2 rounded-md border border-white/10 p-3">
              {memberships.length === 0 && (
                <p className="text-xs text-muted-foreground">Ingen tilgangar tildelt.</p>
              )}
              {memberships.map((m) => (
                <div key={m.id} className="flex items-center gap-2">
                  <CompanyBadge company={m.companies} size="xs" className="shrink-0" />
                  <Select
                    value={m.role}
                    onValueChange={(v) => handleRoleChange(m.id, v as UserRole)}
                    disabled={pending || m.id === 'pending'}
                  >
                    <SelectTrigger className="h-7 text-xs w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technician">Teknikar</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-destructive hover:text-destructive ml-auto"
                    disabled={pending || m.id === 'pending'}
                    onClick={() => handleRemoveMembership(m.id)}
                  >
                    Fjern
                  </Button>
                </div>
              ))}

              {addableCompanies.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1 border-t border-white/10 mt-1">
                  <span className="text-xs text-muted-foreground self-center mr-1">Legg til:</span>
                  {addableCompanies.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="text-xs underline underline-offset-2 text-primary hover:opacity-80 disabled:opacity-40"
                      disabled={pending}
                      onClick={() => handleAddCompany(c.id)}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isSuperadmin}
              disabled={isSelf}
              onChange={(e) => setIsSuperadmin(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">Superadmin</span>
              <span className="block text-muted-foreground text-xs">
                {isSelf
                  ? 'Du kan ikkje endre din eigen superadmin-status.'
                  : 'Kan administrere brukarar i ABCLive.'}
              </span>
            </span>
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={pending}>
            {pending ? 'Lagrar…' : 'Lagre'}
          </Button>
        </form>

        <div className="border-t border-white/10 pt-4 flex flex-col gap-2">
          <Label htmlFor="reset-password">Tilbakestill passord</Label>
          <div className="flex gap-2">
            <Input
              id="reset-password"
              type="password"
              placeholder="Nytt passord (minst 8 teikn)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleReset}
              disabled={pending || newPassword.length < 8}
            >
              Set
            </Button>
          </div>
          {status && <p className="text-xs text-emerald-400">{status}</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
