import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isTransientExpoError, sendExpoPush } from '@/lib/push/expo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BATCH_LIMIT = 50

type OutboxEvent = {
  id: string
  profile_id: string
  title: string
  body: string
  payload: Record<string, unknown>
  attempt_count: number
}

type PushToken = {
  id: string
  expo_push_token: string
}

function getRetryDate(attemptCount: number): string {
  const delaySeconds = Math.min(60 * (2 ** attemptCount), 60 * 60)
  return new Date(Date.now() + delaySeconds * 1000).toISOString()
}

function assertJobSecret(request: Request): boolean {
  const configured = process.env.PUSH_JOB_SECRET
  if (!configured) return false

  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim() === configured
  }

  return request.headers.get('x-job-secret') === configured
}

export async function POST(request: Request) {
  if (!assertJobSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized job request' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date().toISOString()

  const { data: outboxEvents, error: outboxError } = await admin
    .from('notification_outbox')
    .select('id, profile_id, title, body, payload, attempt_count')
    .in('status', ['pending', 'retry'])
    .lte('next_retry_at', now)
    .order('created_at', { ascending: true })
    .limit(BATCH_LIMIT)

  if (outboxError) {
    return NextResponse.json({ error: outboxError.message }, { status: 500 })
  }

  const events = (outboxEvents ?? []) as OutboxEvent[]
  const result = { processed: 0, sent: 0, failed: 0, retried: 0 }

  for (const event of events) {
    result.processed += 1

    const { data: claimedRows, error: claimError } = await admin
      .from('notification_outbox')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', event.id)
      .in('status', ['pending', 'retry'])
      .select('id')

    if (claimError || !claimedRows?.length) {
      continue
    }

    const { data: tokens, error: tokensError } = await admin
      .from('mobile_push_tokens')
      .select('id, expo_push_token')
      .eq('profile_id', event.profile_id)
      .eq('is_active', true)

    if (tokensError) {
      await admin
        .from('notification_outbox')
        .update({
          status: 'retry',
          attempt_count: event.attempt_count + 1,
          next_retry_at: getRetryDate(event.attempt_count + 1),
          last_error: tokensError.message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', event.id)
      result.retried += 1
      continue
    }

    const activeTokens = (tokens ?? []) as PushToken[]

    if (!activeTokens.length) {
      await admin
        .from('notification_outbox')
        .update({
          status: 'failed',
          attempt_count: event.attempt_count + 1,
          last_error: 'No active push token for profile',
          updated_at: new Date().toISOString(),
        })
        .eq('id', event.id)
      result.failed += 1
      continue
    }

    try {
      const expoResponse = await sendExpoPush(
        activeTokens.map((token) => ({
          to: token.expo_push_token,
          title: event.title,
          body: event.body,
          data: event.payload,
        })),
      )

      let hadOk = false
      let hadTransientError = false
      const lastErrors: string[] = []

      for (let i = 0; i < activeTokens.length; i += 1) {
        const token = activeTokens[i]
        const ticket = expoResponse.data[i]
        const errorCode = ticket?.details?.error
        const status = ticket?.status === 'ok' ? 'ok' : 'error'

        if (status === 'ok') {
          hadOk = true
        } else {
          lastErrors.push(ticket?.message ?? errorCode ?? 'Unknown Expo error')
          if (isTransientExpoError(errorCode)) {
            hadTransientError = true
          }
          if (errorCode === 'DeviceNotRegistered') {
            await admin
              .from('mobile_push_tokens')
              .update({ is_active: false, updated_at: new Date().toISOString() })
              .eq('id', token.id)
          }
        }

        await admin.from('notification_push_attempts').insert({
          outbox_id: event.id,
          token_id: token.id,
          expo_ticket_id: ticket?.id ?? null,
          status,
          error_code: errorCode ?? null,
          error_message: ticket?.message ?? null,
          response: ticket ?? null,
        })
      }

      if (hadOk) {
        await admin
          .from('notification_outbox')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            last_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', event.id)
        result.sent += 1
      } else if (hadTransientError) {
        await admin
          .from('notification_outbox')
          .update({
            status: 'retry',
            attempt_count: event.attempt_count + 1,
            next_retry_at: getRetryDate(event.attempt_count + 1),
            last_error: lastErrors.join('; ').slice(0, 2000),
            updated_at: new Date().toISOString(),
          })
          .eq('id', event.id)
        result.retried += 1
      } else {
        await admin
          .from('notification_outbox')
          .update({
            status: 'failed',
            attempt_count: event.attempt_count + 1,
            last_error: lastErrors.join('; ').slice(0, 2000),
            updated_at: new Date().toISOString(),
          })
          .eq('id', event.id)
        result.failed += 1
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected push worker error'
      await admin
        .from('notification_outbox')
        .update({
          status: 'retry',
          attempt_count: event.attempt_count + 1,
          next_retry_at: getRetryDate(event.attempt_count + 1),
          last_error: message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', event.id)
      result.retried += 1
    }
  }

  return NextResponse.json({ ok: true, ...result })
}
