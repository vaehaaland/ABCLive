import { requireSuperadmin } from '@/lib/auth/requireSuperadmin'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ChecklistTemplateItem } from '@/types/database'
import ChecklistTemplateManager from './ChecklistTemplateManager'

export const dynamic = 'force-dynamic'

export default async function AdminChecklistPage() {
  await requireSuperadmin()

  const admin = createAdminClient()
  const { data: items } = await admin
    .from('checklist_template_items')
    .select('*')
    .order('order_index', { ascending: true }) as { data: ChecklistTemplateItem[] | null }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Sjekklistemal</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Desse punkta vert kopiert til nye oppdrag når ein initialiserer sjekklista.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Standardpunkt</CardTitle>
        </CardHeader>
        <CardContent>
          <ChecklistTemplateManager initialItems={items ?? []} />
        </CardContent>
      </Card>
    </div>
  )
}
