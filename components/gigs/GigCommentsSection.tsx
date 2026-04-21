'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { nb } from 'date-fns/locale'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { createMentionNotifications } from '@/app/actions/notifications'
import type { GigCommentWithAuthor, CommentThread } from '@/types/database'

// ── Mention utilities ─────────────────────────────────────────────────────────

const MENTION_REGEX = /@\[([^\]]+)\]\(([a-f0-9-]{36})\)/g

function parseMentionIds(body: string): string[] {
  const ids: string[] = []
  let m: RegExpExecArray | null
  MENTION_REGEX.lastIndex = 0
  while ((m = MENTION_REGEX.exec(body)) !== null) ids.push(m[2])
  return [...new Set(ids)]
}

function renderCommentBody(body: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let last = 0
  MENTION_REGEX.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = MENTION_REGEX.exec(body)) !== null) {
    if (m.index > last) parts.push(body.slice(last, m.index))
    parts.push(
      <Link
        key={m.index}
        href={`/dashboard/personnel/${m[2]}`}
        className="text-primary font-medium hover:underline"
      >
        @{m[1]}
      </Link>
    )
    last = m.index + m[0].length
  }
  if (last < body.length) parts.push(body.slice(last))
  return parts
}

// ── CommentRow ────────────────────────────────────────────────────────────────

interface GigCommentsSectionProps {
  gigId: string
  currentUserId: string
  currentUserName: string | null
  currentUserAvatarUrl: string | null
  isAdmin: boolean
  initialComments: GigCommentWithAuthor[]
}

interface CommentRowProps {
  comment: GigCommentWithAuthor
  replyTargetName?: string | null
  currentUserId: string
  isAdmin: boolean
  onReply: () => void
  onDelete: () => void
  deletingId: string | null
}

function CommentRow({
  comment,
  replyTargetName,
  currentUserId,
  isAdmin,
  onReply,
  onDelete,
  deletingId,
}: CommentRowProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const canDelete = isAdmin || comment.author_id === currentUserId
  const author = comment.profiles

  return (
    <div className="flex gap-2.5">
      <Avatar src={author.avatar_url} name={author.full_name} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-sm font-medium">{author.full_name ?? 'Ukjend'}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: nb })}
          </span>
        </div>
        {replyTargetName && (
          <p className="text-xs text-muted-foreground mb-0.5">Svarte til {replyTargetName}</p>
        )}
        <p className="text-sm mt-0.5 whitespace-pre-wrap break-words">
          {renderCommentBody(comment.body)}
        </p>
        <div className="flex gap-3 mt-1 items-center">
          {!confirmingDelete && (
            <button
              onClick={onReply}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Svar
            </button>
          )}
          {canDelete && (
            confirmingDelete ? (
              <span className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Slette kommentaren?</span>
                <button
                  onClick={() => { setConfirmingDelete(false); onDelete() }}
                  disabled={deletingId === comment.id}
                  className="text-xs text-destructive hover:text-destructive/80 font-medium transition-colors disabled:opacity-50"
                >
                  Ja
                </button>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Nei
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmingDelete(true)}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Slett
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

type MiniProfile = { id: string; full_name: string | null }

export default function GigCommentsSection({
  gigId,
  currentUserId,
  currentUserName,
  currentUserAvatarUrl,
  isAdmin,
  initialComments,
}: GigCommentsSectionProps) {
  const supabase = createClient()
  const [comments, setComments] = useState<GigCommentWithAuthor[]>(initialComments)
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [newCommentBody, setNewCommentBody] = useState('')
  const [replyBody, setReplyBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ── @mention state ──────────────────────────────────────────────────────────
  const [allProfiles, setAllProfiles] = useState<MiniProfile[]>([])
  const [mentionCandidates, setMentionCandidates] = useState<MiniProfile[]>([])
  const [mentionAnchor, setMentionAnchor] = useState<{ top: number; left: number } | null>(null)
  const [mentionActiveIdx, setMentionActiveIdx] = useState(0)
  const [activeSetter, setActiveSetter] = useState<((v: string) => void) | null>(null)
  const [activeBody, setActiveBodyRef] = useState<string>('')
  const mainTextareaRef = useRef<HTMLTextAreaElement>(null)
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null)
  const [activeTextarea, setActiveTextarea] = useState<'main' | 'reply'>('main')

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, full_name')
      .order('full_name')
      .then(({ data }) => setAllProfiles(data ?? []))
  }, [supabase])

  const closeMention = useCallback(() => {
    setMentionCandidates([])
    setMentionAnchor(null)
    setActiveSetter(null)
  }, [])

  function handleBodyChange(
    e: React.ChangeEvent<HTMLTextAreaElement>,
    setter: (v: string) => void,
    textarea: 'main' | 'reply',
  ) {
    const val = e.target.value
    setter(val)
    setActiveBodyRef(val)
    setActiveSetter(() => setter)
    setActiveTextarea(textarea)

    const pos = e.target.selectionStart ?? val.length
    const textBefore = val.slice(0, pos)
    const atMatch = textBefore.match(/@([^@\s]*)$/)

    if (atMatch) {
      const query = atMatch[1].toLowerCase()
      const filtered = allProfiles
        .filter(p => p.full_name?.toLowerCase().includes(query))
        .slice(0, 8)
      if (filtered.length > 0) {
        const rect = e.target.getBoundingClientRect()
        setMentionAnchor({ top: rect.bottom + 4, left: rect.left })
        setMentionCandidates(filtered)
        setMentionActiveIdx(0)
        return
      }
    }
    closeMention()
  }

  function insertMention(profile: MiniProfile, body: string, setter: (v: string) => void, taRef: React.RefObject<HTMLTextAreaElement | null>) {
    const ta = taRef.current
    if (!ta) return
    const pos = ta.selectionStart
    const textBefore = body.slice(0, pos)
    const replaced = textBefore.replace(/@([^@\s]*)$/, `@[${profile.full_name}](${profile.id}) `)
    const newBody = replaced + body.slice(pos)
    setter(newBody)
    setActiveBodyRef(newBody)
    closeMention()
    ta.focus()
  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    body: string,
    setter: (v: string) => void,
    taRef: React.RefObject<HTMLTextAreaElement | null>,
    onSubmit: () => void,
  ) {
    if (mentionCandidates.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setMentionActiveIdx(i => Math.min(i + 1, mentionCandidates.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setMentionActiveIdx(i => Math.max(i - 1, 0))
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        insertMention(mentionCandidates[mentionActiveIdx], body, setter, taRef)
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        closeMention()
        return
      }
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onSubmit()
  }

  // ── Comment/reply threads ───────────────────────────────────────────────────

  const threads = useMemo((): CommentThread[] => {
    const rootMap = new Map<string, CommentThread>()
    for (const c of comments) {
      if (c.root_id === null) rootMap.set(c.id, { ...c, replies: [] })
    }
    for (const c of comments) {
      if (c.root_id !== null) {
        const thread = rootMap.get(c.root_id)
        if (thread) thread.replies.push(c)
      }
    }
    return Array.from(rootMap.values())
  }, [comments])

  async function handlePostComment() {
    const body = newCommentBody.trim()
    if (!body || submitting) return
    setSubmitting(true)

    const { data: inserted, error } = await supabase
      .from('gig_comments')
      .insert({ gig_id: gigId, author_id: currentUserId, body })
      .select('*, profiles(id, full_name, avatar_url)')
      .single()

    if (error) {
      toast.error('Kunne ikkje poste kommentar')
    } else {
      setComments(prev => [...prev, inserted as GigCommentWithAuthor])
      setNewCommentBody('')
      const mentionIds = parseMentionIds(body)
      if (mentionIds.length > 0) {
        createMentionNotifications(
          (inserted as GigCommentWithAuthor).id,
          gigId,
          mentionIds,
          currentUserId,
        ).catch(() => {})
      }
    }
    setSubmitting(false)
  }

  async function handlePostReply() {
    const body = replyBody.trim()
    if (!body || submitting || !replyingToId) return
    setSubmitting(true)

    const { data: inserted, error } = await supabase
      .from('gig_comments')
      .insert({ gig_id: gigId, author_id: currentUserId, parent_id: replyingToId, body })
      .select('*, profiles(id, full_name, avatar_url)')
      .single()

    if (error) {
      toast.error('Kunne ikkje poste svar')
    } else {
      setComments(prev => [...prev, inserted as GigCommentWithAuthor])
      setReplyBody('')
      setReplyingToId(null)
      const mentionIds = parseMentionIds(body)
      if (mentionIds.length > 0) {
        createMentionNotifications(
          (inserted as GigCommentWithAuthor).id,
          gigId,
          mentionIds,
          currentUserId,
        ).catch(() => {})
      }
    }
    setSubmitting(false)
  }

  async function handleDelete(commentId: string) {
    setDeletingId(commentId)

    const { error } = await supabase
      .from('gig_comments')
      .delete()
      .eq('id', commentId)

    if (error) {
      toast.error('Kunne ikkje slette kommentar')
    } else {
      setComments(prev =>
        prev.filter(c => c.id !== commentId && c.root_id !== commentId && c.parent_id !== commentId)
      )
    }
    setDeletingId(null)
  }

  function handleSetReplying(commentId: string) {
    if (replyingToId === commentId) {
      setReplyingToId(null)
    } else {
      setReplyingToId(commentId)
      setReplyBody('')
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kommentarar</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {threads.length === 0 && (
            <p className="text-sm text-muted-foreground">Ingen kommentarar enno.</p>
          )}

          {threads.map(thread => {
            const isReplyingToRoot = replyingToId === thread.id
            const isReplyingToReply = thread.replies.some(r => r.id === replyingToId)
            const showReplyBox = isReplyingToRoot || isReplyingToReply

            return (
              <div key={thread.id} className="flex flex-col gap-2">
                <CommentRow
                  comment={thread}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  onReply={() => handleSetReplying(thread.id)}
                  onDelete={() => handleDelete(thread.id)}
                  deletingId={deletingId}
                />

                {(thread.replies.length > 0 || showReplyBox) && (
                  <div className="ml-9 flex flex-col gap-2 rounded-lg bg-surface-container-low pl-3 pr-2 py-2">
                    {thread.replies.map(reply => {
                      const replyTarget =
                        reply.parent_id !== thread.id
                          ? comments.find(c => c.id === reply.parent_id)
                          : null

                      return (
                        <CommentRow
                          key={reply.id}
                          comment={reply}
                          replyTargetName={replyTarget?.profiles?.full_name ?? null}
                          currentUserId={currentUserId}
                          isAdmin={isAdmin}
                          onReply={() => handleSetReplying(reply.id)}
                          onDelete={() => handleDelete(reply.id)}
                          deletingId={deletingId}
                        />
                      )
                    })}

                    {showReplyBox && (
                      <div className="flex gap-2 pt-1">
                        <div className="flex-1">
                          <Textarea
                            ref={replyTextareaRef}
                            placeholder="Skriv eit svar… (bruk @ for å nemne nokon)"
                            value={replyBody}
                            onChange={e => handleBodyChange(e, setReplyBody, 'reply')}
                            onKeyDown={e => handleKeyDown(e, replyBody, setReplyBody, replyTextareaRef, handlePostReply)}
                            className="min-h-[60px] text-sm resize-none"
                            autoFocus
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            onClick={handlePostReply}
                            disabled={submitting || !replyBody.trim()}
                          >
                            Send
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setReplyingToId(null)}
                          >
                            Avbryt
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          <div className="flex gap-2.5 pt-4 mt-2">
            <Avatar src={currentUserAvatarUrl} name={currentUserName} size="sm" className="mt-1 shrink-0" />
            <div className="flex-1 flex gap-2">
              <Textarea
                ref={mainTextareaRef}
                placeholder="Skriv ein kommentar… (bruk @ for å nemne nokon)"
                value={newCommentBody}
                onChange={e => handleBodyChange(e, setNewCommentBody, 'main')}
                onKeyDown={e => handleKeyDown(e, newCommentBody, setNewCommentBody, mainTextareaRef, handlePostComment)}
                className="min-h-[60px] text-sm resize-none"
              />
              <Button
                size="sm"
                onClick={handlePostComment}
                disabled={submitting || !newCommentBody.trim()}
                className="self-end"
              >
                Send
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* @mention floating dropdown */}
      {mentionAnchor && mentionCandidates.length > 0 && (
        <div
          style={{ position: 'fixed', top: mentionAnchor.top, left: mentionAnchor.left }}
          className="z-50 w-56 rounded-lg bg-popover ring-1 ring-foreground/10 shadow-xl overflow-hidden"
        >
          {(() => {
            const which = activeTextarea
            const bodyVal = activeBody
            const setterVal = activeSetter
            return mentionCandidates.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onMouseDown={e => {
                  e.preventDefault()
                  if (setterVal) {
                    const taRef = which === 'reply' ? replyTextareaRef : mainTextareaRef
                    insertMention(p, bodyVal, setterVal, taRef)
                  }
                }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${i === mentionActiveIdx ? 'bg-accent' : ''}`}
              >
                {p.full_name ?? p.id}
              </button>
            ))
          })()}
        </div>
      )}
    </>
  )
}
