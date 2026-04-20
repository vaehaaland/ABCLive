'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function RemoveProgramItemButton({ itemId }: { itemId: string }) {
  const router = useRouter()
  const supabase = createClient()

  async function handleRemove() {
    await supabase.from('gig_program_items').delete().eq('id', itemId)
    router.refresh()
  }

  return (
    <Button variant="ghost" size="sm" className="text-destructive" onClick={handleRemove}>
      Slett post
    </Button>
  )
}
