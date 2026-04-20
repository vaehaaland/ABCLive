'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function CopyPublicReportLinkButton({ publicPath }: { publicPath: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (typeof window === 'undefined') return

    const absoluteUrl = new URL(publicPath, window.location.origin).toString()
    await navigator.clipboard.writeText(absoluteUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button type="button" variant="secondary" size="sm" onClick={handleCopy}>
      {copied ? 'Kopiert' : 'Kopier lenke'}
    </Button>
  )
}
