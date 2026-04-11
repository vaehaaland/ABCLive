'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function RemovePersonnelButton({ assignmentId }: { assignmentId: string }) {
  const router = useRouter()
  const supabase = createClient()

  async function handleRemove() {
    await supabase.from('gig_personnel').delete().eq('id', assignmentId)
    router.refresh()
  }

  return (
    <Button variant="ghost" size="sm" className="text-destructive" onClick={handleRemove}>
      Fjern
    </Button>
  )
}
