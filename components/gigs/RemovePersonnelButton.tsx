'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

export default function RemovePersonnelButton({ assignmentId }: { assignmentId: string }) {
  const router = useRouter()
  const supabase = createClient()

  async function handleRemove() {
    await supabase.from('gig_personnel').delete().eq('id', assignmentId)
    router.refresh()
  }

  return (
    <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" onClick={handleRemove} aria-label="Fjern teknikar">
      <Trash2 className="size-4" />
    </Button>
  )
}
