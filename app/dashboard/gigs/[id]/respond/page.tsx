import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import { acceptGigAssignment, declineGigAssignment } from '@/app/actions/gig-personnel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type AssignmentRow = {
  id: string
  assignment_status: 'pending' | 'accepted' | 'declined'
  responded_at: string | null
  response_note: string | null
  role_on_gig: string | null
  gigs: {
    id: string
    name: string
    start_date: string
    end_date: string
    venue: string | null
  } | null
}

export default async function GigAssignmentRespondPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: gigId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: assignment } = await supabase
    .from('gig_personnel')
    .select('id, assignment_status, responded_at, response_note, role_on_gig, gigs(id, name, start_date, end_date, venue)')
    .eq('gig_id', gigId)
    .eq('profile_id', user.id)
    .maybeSingle() as { data: AssignmentRow | null; error: unknown }

  if (!assignment || !assignment.gigs) {
    notFound()
  }

  const gig = assignment.gigs
  const dateText = gig.start_date === gig.end_date
    ? format(new Date(gig.start_date), 'd. MMMM yyyy', { locale: nb })
    : `${format(new Date(gig.start_date), 'd. MMMM yyyy', { locale: nb })} – ${format(new Date(gig.end_date), 'd. MMMM yyyy', { locale: nb })}`

  async function acceptAction() {
    'use server'
    await acceptGigAssignment(assignment.id)
  }

  async function declineAction(formData: FormData) {
    'use server'
    const note = formData.get('note')
    await declineGigAssignment(assignment.id, typeof note === 'string' ? note : undefined)
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Oppdragsførespurnad</CardTitle>
          <CardDescription>
            Svar på om du kan ta oppdraget.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2 rounded-lg border border-border/70 bg-muted/30 p-4">
            <h2 className="font-heading text-xl font-semibold">{gig.name}</h2>
            <p className="text-sm text-muted-foreground">{dateText}{gig.venue ? ` · ${gig.venue}` : ''}</p>
            {assignment.role_on_gig && (
              <p className="text-sm text-muted-foreground">Rolle: {assignment.role_on_gig}</p>
            )}
          </div>

          {assignment.assignment_status === 'pending' ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <form action={acceptAction}>
                  <Button type="submit">Aksepter oppdrag</Button>
                </form>
                <Link href={`/dashboard/gigs/${gig.id}`}>
                  <Button variant="outline" type="button">Sjå detaljar først</Button>
                </Link>
              </div>

              <form action={declineAction} className="space-y-3 rounded-lg border border-border/70 p-4">
                <label htmlFor="decline-note" className="block text-sm font-medium">
                  Valfri kommentar ved avslag
                </label>
                <textarea
                  id="decline-note"
                  name="note"
                  rows={3}
                  placeholder="Skriv kort kvifor du ikkje kan ta oppdraget…"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <Button type="submit" variant="destructive">Avslå oppdrag</Button>
              </form>
            </div>
          ) : (
            <div className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Du har allereie svart på førespurnaden.</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant={assignment.assignment_status === 'accepted' ? 'success' : 'destructive'}>
                  {assignment.assignment_status === 'accepted' ? 'Akseptert' : 'Avslått'}
                </Badge>
              </div>
              {assignment.responded_at && (
                <p className="text-xs text-muted-foreground">
                  Svara {format(new Date(assignment.responded_at), 'd. MMM yyyy HH:mm', { locale: nb })}
                </p>
              )}
              {assignment.response_note && (
                <p className="text-sm text-muted-foreground">Kommentar: {assignment.response_note}</p>
              )}
              <Link href={`/dashboard/gigs/${gig.id}`}>
                <Button variant="outline" type="button">Til oppdragsdetaljar</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
