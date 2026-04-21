'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'

interface Props {
  assignmentId: string
  currentRole: string | null
}

export default function EditPersonnelRoleInline({ assignmentId, currentRole }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(currentRole ?? '')
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    setValue(currentRole ?? '')
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  async function save() {
    setEditing(false)
    const newRole = value.trim() || null
    if (newRole === (currentRole || null)) return
    await supabase
      .from('gig_personnel')
      .update({ role_on_gig: newRole })
      .eq('id', assignmentId)
    router.refresh()
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={onKeyDown}
        placeholder="Rolle…"
        className="h-5 w-32 rounded border border-white/20 bg-surface-high px-1.5 text-xs text-foreground outline-none focus:border-primary"
      />
    )
  }

  if (currentRole) {
    return (
      <button type="button" onClick={startEdit} className="group">
        <Badge variant="gold" className="cursor-text group-hover:opacity-70 transition-opacity">
          {currentRole}
        </Badge>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
    >
      + rolle
    </button>
  )
}
