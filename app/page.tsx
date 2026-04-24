import { redirect } from 'next/navigation'

export default function RootPage() {
  // TODO: change to redirect('/app/gigs') when route migration is complete
  redirect('/dashboard/gigs')
}
