'use client'

import { useState } from 'react'
import { Menu } from '@base-ui/react/menu'
import { KeyRoundIcon, MoreHorizontalIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import ChangePasswordForm from '@/components/profile/ChangePasswordForm'

export default function UserActionsMenu() {
  const [passwordOpen, setPasswordOpen] = useState(false)

  return (
    <>
      <Menu.Root>
        <Menu.Trigger
          render={
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            />
          }
        >
          <MoreHorizontalIcon className="size-4" />
          Kontoinnstillingar
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className="isolate z-50" side="top" align="start" sideOffset={4}>
            <Menu.Popup className="min-w-48 rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 origin-(--transform-origin) data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
              <Menu.Item
                className="flex w-full cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none select-none focus:bg-accent focus:text-accent-foreground"
                onClick={() => setPasswordOpen(true)}
              >
                <KeyRoundIcon className="size-4 text-muted-foreground" />
                Endre passord
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Endre passord</DialogTitle>
            <DialogDescription>
              Vel eit nytt passord for kontoen din. Minimum 8 teikn.
            </DialogDescription>
          </DialogHeader>
          <ChangePasswordForm onSuccess={() => setPasswordOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
