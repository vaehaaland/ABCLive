'use client'

import { useEffect } from 'react'

export default function AppLoading() {
  useEffect(() => {
    document.title = 'ABC Live'
  }, [])

  return null
}
