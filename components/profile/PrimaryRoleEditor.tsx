'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PencilIcon, CheckIcon, XIcon } from 'lucide-react'

interface Props {
  userId: string
  initialValue: string | null
}

export default function PrimaryRoleEditor({ userId, initialValue }: Props) {
  const supabase = createClient()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initialValue ?? '')
  const [saved, setSaved] = useState(initialValue ?? '')
  const [loading, setLoading] = useState(false)

  async function save() {
    setLoading(true)
    await supabase
      .from('profiles')
      .update({ primary_role: value.trim() || null })
      .eq('id', userId)
    setSaved(value.trim())
    setEditing(false)
    setLoading(false)
  }

  function cancel() {
    setValue(saved)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="t.d. Lydtekniker"
          className="h-7 text-sm"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') save()
            if (e.key === 'Escape') cancel()
          }}
        />
        <Button size="icon-xs" onClick={save} disabled={loading}>
          <CheckIcon />
        </Button>
        <Button size="icon-xs" variant="ghost" onClick={cancel}>
          <XIcon />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 group">
      <span className="text-sm text-muted-foreground">
        {saved || <span className="italic">Ikkje sett</span>}
      </span>
      <button
        onClick={() => setEditing(true)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
      >
        <PencilIcon className="size-3" />
      </button>
    </div>
  )
}
