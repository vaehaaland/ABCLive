import type { Metadata } from 'next'
import ResetPasswordPageClient from './ResetPasswordPageClient'

export const metadata: Metadata = {
  title: 'Nytt passord',
}

export default function ResetPasswordPage() {
  return <ResetPasswordPageClient />
}
