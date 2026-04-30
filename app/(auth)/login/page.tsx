import type { Metadata } from 'next'
import LoginPageClient from './LoginPageClient'

export const metadata: Metadata = {
  title: 'Logg inn',
}

export default function LoginPage() {
  return <LoginPageClient />
}
