import type { Metadata } from 'next'
import ImportICloudPageClient from './ImportICloudPageClient'

export const metadata: Metadata = {
  title: 'Importer frå iCloud',
}

export default function ImportICloudPage() {
  return <ImportICloudPageClient />
}
