import type { Metadata } from 'next'
import ForgotPasswordPageClient from './ForgotPasswordPageClient'

export const metadata: Metadata = {
  title: 'Tilbakestill passord',
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordPageClient />
}
