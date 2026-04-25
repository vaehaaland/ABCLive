'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { TicketStatus } from '@/types/database'
import { createTicketCreatedNotification } from './notifications'

export async function createTicket(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikkje innlogga')

  const title = formData.get('title') as string
  const description = formData.get('description') as string

  if (!title?.trim()) throw new Error('Tittel er påkrevd')
  if (!description?.trim()) throw new Error('Beskrivelse er påkrevd')

  const admin = createAdminClient()

  // Find the superadmin user
  const { data: superadmin, error: superadminError } = await admin
    .from('profiles')
    .select('id')
    .eq('is_superadmin', true)
    .single()

  if (superadminError || !superadmin) {
    throw new Error('Kunne ikkje finne superadmin')
  }

  // Insert the ticket
  const { data: ticket, error: ticketError } = await admin
    .from('tickets')
    .insert({
      title: title.trim(),
      description: description.trim(),
      status: 'reported',
      created_by: user.id,
      assigned_to: superadmin.id,
    })
    .select()
    .single()

  if (ticketError) throw new Error('Kunne ikkje opprette ticket')

  // Create notification for superadmin
  await createTicketCreatedNotification(ticket.id, superadmin.id, user.id)

  return { success: true, ticket }
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikkje innlogga')

  // Check if user is superadmin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_superadmin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_superadmin) {
    throw new Error('Kun superadmin kan oppdatere tickets')
  }

  const admin = createAdminClient()

  const { data: ticket, error } = await admin
    .from('tickets')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', ticketId)
    .select()
    .single()

  if (error) throw new Error('Kunne ikkje oppdatere ticket')

  return { success: true, ticket }
}

export async function addTicketLog(ticketId: string, body: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikkje innlogga')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_superadmin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_superadmin) {
    throw new Error('Kun superadmin kan skrive logg for ticket')
  }

  if (!body?.trim()) {
    throw new Error('Logginnlegg kan ikkje vere tomt')
  }

  const admin = createAdminClient()

  const { data: log, error } = await admin
    .from('ticket_logs')
    .insert({
      ticket_id: ticketId,
      author_id: user.id,
      body: body.trim(),
    })
    .select()
    .single()

  if (error) throw new Error('Kunne ikkje lagre logginnlegget')

  return { success: true, log }
}