'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { BellIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { nb } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { NotificationWithContext } from '@/types/database'
import { getDisplayName } from '@/lib/utils'

const POLL_INTERVAL_MS = 30_000

export default function NotificationBell() {
  const supabase = createClient()
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationWithContext[]>([])
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchCount() {
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('read', false)
      setUnreadCount(count ?? 0)
    }
    void fetchCount()
    const timer = setInterval(fetchCount, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [supabase])

  async function handleOpen() {
    setOpen(true)
    setLoading(true)
    const [{ data }] = await Promise.all([
      supabase
        .from('notifications')
        .select('*, actor:actor_id(id, full_name, nickname, avatar_url), gig:gig_id(id, name), ticket:ticket_id(id, title)')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('notifications')
        .update({ read: true })
        .eq('read', false),
    ])
    setNotifications((data ?? []) as NotificationWithContext[])
    setLoading(false)
    setUnreadCount(0)
  }

  function handleNotificationClick(n: NotificationWithContext) {
    if (n.type === 'ticket_created' && n.ticket_id) {
      router.push(`/dashboard/admin/tickets/${n.ticket_id}`)
      setOpen(false)
    }
    // Other notification types can be handled here if needed
  }

  function notificationText(n: NotificationWithContext): string {
    const actorName = getDisplayName(n.actor, 'Nokon')
    const gigName = n.gig?.name ?? 'eit oppdrag'
    if (n.type === 'gig_added') {
      return `${actorName} la deg til på «${gigName}»`
    }
    if (n.type === 'comment_mention') {
      return `${actorName} nemnte deg i ein kommentar på «${gigName}»`
    }
    if (n.type === 'ticket_created') {
      const ticketTitle = n.ticket?.title ?? 'ein ticket'
      return `Ny ticket: «${ticketTitle}»`
    }
    return `${actorName} nemnte deg i ein kommentar på «${gigName}»`
  }

  return (
    <div className="relative" ref={panelRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={open ? () => setOpen(false) : handleOpen}
        aria-label="Varslingar"
        aria-expanded={open}
        className="relative"
      >
        <BellIcon className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl bg-popover ring-1 ring-foreground/10 shadow-[0_40px_60px_oklch(0_0_0_/_0.06)] overflow-hidden">
          <div className="px-4 py-3 bg-surface-high rounded-t-xl">
            <span className="text-sm font-medium font-heading">Varslingar</span>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                Laster…
              </p>
            )}
            {!loading && notifications.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                Ingen varslingar.
              </p>
            )}
            {!loading && notifications.map(n => (
              <div
                key={n.id}
                className={`flex gap-3 px-4 py-3 ${!n.read ? 'bg-primary/[0.05]' : ''} ${n.type === 'ticket_created' ? 'cursor-pointer hover:bg-primary/[0.08]' : ''}`}
                onClick={() => handleNotificationClick(n)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug">{notificationText(n)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: nb })}
                  </p>
                </div>
                {!n.read && (
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
