'use client'

import { Button } from '@/components/ui/button'

export default function PrintReportButton() {
  return (
    <Button type="button" variant="secondary" size="sm" onClick={() => window.print()}>
      Skriv ut / PDF
    </Button>
  )
}
