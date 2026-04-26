'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import EditUserDialog, { type EditableUser } from '@/components/admin/EditUserDialog'
import { deleteUser, resendInvite } from '@/app/dashboard/admin/users/actions'

interface Company {
  id: string
  name: string
  slug: string
}

interface Props {
  user: EditableUser & { pending: boolean }
  companies: Company[]
  isSelf: boolean
}

export default function UserRowActions({ user, companies, isSelf }: Props) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [busy, startTransition] = useTransition()
  const [inviteStatus, setInviteStatus] = useState<string | null>(null)

  function handleDelete() {
    if (isSelf) return
    if (!confirm(`Slette ${user.full_name ?? user.email}? Dette kan ikkje angrast.`)) return
    startTransition(async () => {
      const result = await deleteUser(user.id)
      if (!result.ok) alert(result.error ?? 'Kunne ikkje slette brukaren')
      else router.refresh()
    })
  }

  function handleResend() {
    startTransition(async () => {
      const result = await resendInvite(user.id)
      if (!result.ok) alert(result.error ?? 'Kunne ikkje sende invitasjon')
      else setInviteStatus('Sendt')
    })
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      {user.pending && (
        <Button size="sm" variant="ghost" onClick={handleResend} disabled={busy}>
          {inviteStatus ?? 'Send invitasjon på nytt'}
        </Button>
      )}
      <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}>
        Rediger
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={handleDelete}
        disabled={busy || isSelf}
      >
        Slett
      </Button>
      <EditUserDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        user={user}
        companies={companies}
        isSelf={isSelf}
      />
    </div>
  )
}
