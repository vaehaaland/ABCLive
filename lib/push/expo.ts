export type ExpoPushMessage = {
  to: string
  title: string
  body: string
  data?: Record<string, unknown>
}

export type ExpoTicket = {
  status: 'ok' | 'error'
  id?: string
  message?: string
  details?: {
    error?: string
  }
}

export type ExpoPushResponse = {
  data: ExpoTicket[]
  errors?: Array<Record<string, unknown>>
}

export async function sendExpoPush(messages: ExpoPushMessage[]): Promise<ExpoPushResponse> {
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  })

  if (!response.ok) {
    throw new Error(`Expo push send failed with ${response.status}`)
  }

  return await response.json() as ExpoPushResponse
}

export function isTransientExpoError(errorCode: string | undefined): boolean {
  return (
    errorCode === 'ExpoServerError'
    || errorCode === 'MessageRateExceeded'
    || errorCode === 'TOO_MANY_REQUESTS'
    || errorCode === 'PUSH_TOO_MANY_EXPERIENCE_IDS'
  )
}
