import type { Metadata } from 'next'
import ICloudSettingsPageClient from './ICloudSettingsPageClient'

export const metadata: Metadata = {
  title: 'iCloud Kalender',
}

export default function ICloudSettingsPage() {
  return <ICloudSettingsPageClient />
}
