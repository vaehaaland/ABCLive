import { describe, it, expect, vi, beforeEach } from 'vitest'

const insertMock = vi.fn().mockResolvedValue({ data: null, error: null })

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({ insert: insertMock }),
  }),
}))

const { createGigAddedNotification, createMentionNotifications } =
  await import('@/app/actions/notifications')

beforeEach(() => {
  insertMock.mockClear()
})

describe('createGigAddedNotification', () => {
  it('inserts notification when profileId differs from actorId', async () => {
    await createGigAddedNotification('gig-1', 'user-2', 'user-1')
    expect(insertMock).toHaveBeenCalledOnce()
    expect(insertMock).toHaveBeenCalledWith({
      user_id: 'user-2',
      actor_id: 'user-1',
      type: 'gig_added',
      gig_id: 'gig-1',
    })
  })

  it('does NOT insert when profileId equals actorId (self-assign)', async () => {
    await createGigAddedNotification('gig-1', 'user-1', 'user-1')
    expect(insertMock).not.toHaveBeenCalled()
  })
})

describe('createMentionNotifications', () => {
  it('inserts for all mentioned users except the actor', async () => {
    await createMentionNotifications('comment-1', 'gig-1', ['u1', 'u2', 'u3'], 'u2')
    expect(insertMock).toHaveBeenCalledOnce()
    const rows = insertMock.mock.calls[0][0] as Array<{ user_id: string }>
    expect(rows).toHaveLength(2)
    expect(rows.map((r) => r.user_id)).toEqual(['u1', 'u3'])
  })

  it('includes correct fields in each notification row', async () => {
    await createMentionNotifications('c1', 'g1', ['u2'], 'u1')
    const row = insertMock.mock.calls[0][0][0]
    expect(row).toMatchObject({
      user_id: 'u2',
      actor_id: 'u1',
      type: 'comment_mention',
      gig_id: 'g1',
      comment_id: 'c1',
    })
  })

  it('does not insert when all mentioned users are the actor', async () => {
    await createMentionNotifications('c1', 'g1', ['u1'], 'u1')
    expect(insertMock).not.toHaveBeenCalled()
  })

  it('does not insert when mentionedUserIds is empty', async () => {
    await createMentionNotifications('c1', 'g1', [], 'u1')
    expect(insertMock).not.toHaveBeenCalled()
  })
})
