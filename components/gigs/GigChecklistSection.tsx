'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Check, Minus, Plus, Trash2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  setChecklistItemState,
  updateChecklistItemComment,
  addChecklistItem,
  removeChecklistItem,
  initChecklistFromTemplate,
} from '@/app/actions/checklist'
import type { GigChecklistItem } from '@/types/database'
import { getDisplayName } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { nb } from 'date-fns/locale'

type ItemState = 'unchecked' | 'checked' | 'na'

function getItemState(item: GigChecklistItem): ItemState {
  if (item.is_checked) return 'checked'
  if (item.is_na) return 'na'
  return 'unchecked'
}

interface ChecklistItemRowProps {
  item: GigChecklistItem & {
    checker: { id: string; full_name: string | null; nickname: string | null } | null
  }
  isAdmin: boolean
  gigId: string
  onOptimisticUpdate: (id: string, patch: Partial<GigChecklistItem>) => void
  onRemove: (id: string) => void
}

function ChecklistItemRow({ item, isAdmin, gigId, onOptimisticUpdate, onRemove }: ChecklistItemRowProps) {
  const [isPending, startTransition] = useTransition()
  const [showComment, setShowComment] = useState(!!item.comment)
  const [commentDraft, setCommentDraft] = useState(item.comment ?? '')
  const [savingComment, setSavingComment] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const state = getItemState(item)

  function cycleState() {
    const next: ItemState = state === 'unchecked' ? 'checked' : state === 'checked' ? 'na' : 'unchecked'
    onOptimisticUpdate(item.id, {
      is_checked: next === 'checked',
      is_na: next === 'na',
    })
    startTransition(async () => {
      try {
        await setChecklistItemState(item.id, gigId, next)
      } catch {
        toast.error('Kunne ikkje oppdatere status')
        onOptimisticUpdate(item.id, { is_checked: item.is_checked, is_na: item.is_na })
      }
    })
  }

  async function saveComment() {
    setSavingComment(true)
    try {
      await updateChecklistItemComment(item.id, gigId, commentDraft.trim() || null)
      onOptimisticUpdate(item.id, { comment: commentDraft.trim() || null })
      if (!commentDraft.trim()) setShowComment(false)
    } catch {
      toast.error('Kunne ikkje lagre kommentar')
    } finally {
      setSavingComment(false)
    }
  }

  function handleDelete() {
    onRemove(item.id)
    startTransition(async () => {
      try {
        await removeChecklistItem(item.id, gigId)
      } catch (e) {
        toast.error('Kunne ikkje slette punkt')
      }
    })
  }

  const stateIcon =
    state === 'checked' ? (
      <Check className="h-3.5 w-3.5" />
    ) : state === 'na' ? (
      <Minus className="h-3.5 w-3.5" />
    ) : null

  const stateColor =
    state === 'checked'
      ? 'bg-green-600 border-green-600 text-white'
      : state === 'na'
      ? 'bg-muted border-border text-muted-foreground'
      : 'border-border hover:border-primary/50'

  return (
    <div className={`flex flex-col gap-1.5 py-2.5 border-b border-border/50 last:border-0 ${isPending ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={cycleState}
          disabled={isPending}
          title={state === 'unchecked' ? 'Merk som huka av' : state === 'checked' ? 'Merk som N/A' : 'Tilbakestill'}
          className={`mt-0.5 h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center transition-all ${stateColor}`}
        >
          {stateIcon}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span className={`text-sm leading-5 ${state === 'na' ? 'line-through text-muted-foreground' : state === 'checked' ? 'text-muted-foreground' : ''}`}>
              {item.title}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => {
                  setShowComment(v => !v)
                  if (!showComment) setTimeout(() => {}, 0)
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
                title={showComment ? 'Skjul kommentar' : 'Legg til kommentar'}
              >
                {item.comment ? (
                  showComment ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <span className="text-xs opacity-50 hover:opacity-100">Kommentar</span>
                )}
              </button>
              {isAdmin && (
                confirmDelete ? (
                  <span className="flex items-center gap-1">
                    <button onClick={handleDelete} className="text-xs text-destructive font-medium">Slett</button>
                    <button onClick={() => setConfirmDelete(false)} className="text-xs text-muted-foreground">Avbryt</button>
                  </span>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="text-muted-foreground/40 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )
              )}
            </div>
          </div>

          {state === 'checked' && item.checker && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Huka av av {getDisplayName(item.checker, 'ukjend')}
              {item.checked_at && ` · ${formatDistanceToNow(new Date(item.checked_at), { addSuffix: true, locale: nb })}`}
            </p>
          )}

          {item.comment && !showComment && (
            <p className="text-xs text-muted-foreground mt-0.5 italic truncate">{item.comment}</p>
          )}

          {showComment && (
            <div className="mt-1.5 flex gap-2">
              <Textarea
                value={commentDraft}
                onChange={e => setCommentDraft(e.target.value)}
                placeholder="Legg til ein merknad…"
                className="min-h-[52px] text-xs resize-none"
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveComment() }}
              />
              <div className="flex flex-col gap-1">
                <Button
                  size="sm"
                  onClick={saveComment}
                  disabled={savingComment || commentDraft === (item.comment ?? '')}
                >
                  {savingComment ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Lagre'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setCommentDraft(item.comment ?? ''); setShowComment(false) }}
                >
                  Avbryt
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

type ChecklistItemWithChecker = GigChecklistItem & {
  checker: { id: string; full_name: string | null; nickname: string | null } | null
}

interface GigChecklistSectionProps {
  gigId: string
  isAdmin: boolean
  initialItems: ChecklistItemWithChecker[]
  hasTemplate: boolean
}

export default function GigChecklistSection({
  gigId,
  isAdmin,
  initialItems,
  hasTemplate,
}: GigChecklistSectionProps) {
  const [items, setItems] = useState<ChecklistItemWithChecker[]>(initialItems)
  const [newTitle, setNewTitle] = useState('')
  const [addingItem, setAddingItem] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const [isPending, startTransition] = useTransition()

  const checkedCount = items.filter(i => i.is_checked).length
  const naCount = items.filter(i => i.is_na).length
  const totalCount = items.length

  function optimisticUpdate(id: string, patch: Partial<GigChecklistItem>) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i))
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function handleAddItem() {
    if (!newTitle.trim()) return
    setAddingItem(true)
    try {
      const inserted = await addChecklistItem(gigId, newTitle.trim())
      setNewTitle('')
      setShowAddForm(false)
      setItems(prev => [...prev, { ...inserted, checker: null }])
    } catch {
      toast.error('Kunne ikkje leggje til punkt')
    } finally {
      setAddingItem(false)
    }
  }

  async function handleInitFromTemplate() {
    setInitializing(true)
    try {
      await initChecklistFromTemplate(gigId)
      toast.success('Sjekkliste initialisert frå mal')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Kunne ikkje initialisere sjekkliste')
    } finally {
      setInitializing(false)
    }
  }

  const progressPercent = totalCount > 0
    ? Math.round(((checkedCount + naCount) / totalCount) * 100)
    : 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Sjekkliste</CardTitle>
          {totalCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {checkedCount + naCount}/{totalCount}
            </span>
          )}
        </div>
        {isAdmin && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowAddForm(v => !v)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Legg til
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-0">
        {totalCount > 0 && (
          <div className="mb-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-green-600 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <p className="text-sm text-muted-foreground text-center">Ingen sjekklistepunkt enno.</p>
            {isAdmin && hasTemplate && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleInitFromTemplate}
                disabled={initializing}
              >
                {initializing && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                Initialiser frå standardmal
              </Button>
            )}
          </div>
        ) : (
          items.map(item => (
            <ChecklistItemRow
              key={item.id}
              item={item}
              isAdmin={isAdmin}
              gigId={gigId}
              onOptimisticUpdate={optimisticUpdate}
              onRemove={removeItem}
            />
          ))
        )}

        {isAdmin && showAddForm && (
          <div className="mt-3 flex gap-2 pt-2 border-t border-border">
            <Input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Nytt punkt…"
              className="text-sm"
              onKeyDown={e => { if (e.key === 'Enter') handleAddItem() }}
              autoFocus
            />
            <Button size="sm" onClick={handleAddItem} disabled={addingItem || !newTitle.trim()}>
              {addingItem ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Legg til'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowAddForm(false); setNewTitle('') }}>
              Avbryt
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
