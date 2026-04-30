'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, GripVertical, Loader2, Eye, EyeOff, Pencil, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  addTemplateItem,
  updateTemplateItem,
  deleteTemplateItem,
} from '@/app/actions/checklist'
import type { ChecklistTemplateItem } from '@/types/database'

interface TemplateItemRowProps {
  item: ChecklistTemplateItem
  onDelete: (id: string) => void
  onUpdate: (id: string, fields: Partial<ChecklistTemplateItem>) => void
}

function TemplateItemRow({ item, onDelete, onUpdate }: TemplateItemRowProps) {
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [titleDraft, setTitleDraft] = useState(item.title)
  const [descDraft, setDescDraft] = useState(item.description ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)

  function saveEdit() {
    if (!titleDraft.trim()) return
    startTransition(async () => {
      try {
        await updateTemplateItem(item.id, {
          title: titleDraft.trim(),
          description: descDraft.trim() || null,
        })
        onUpdate(item.id, { title: titleDraft.trim(), description: descDraft.trim() || null })
        setEditing(false)
      } catch {
        toast.error('Kunne ikkje oppdatere punkt')
      }
    })
  }

  function toggleActive() {
    startTransition(async () => {
      try {
        await updateTemplateItem(item.id, { is_active: !item.is_active })
        onUpdate(item.id, { is_active: !item.is_active })
      } catch {
        toast.error('Kunne ikkje endre status')
      }
    })
  }

  function handleDelete() {
    onDelete(item.id)
    startTransition(async () => {
      try {
        await deleteTemplateItem(item.id)
      } catch {
        toast.error('Kunne ikkje slette punkt')
      }
    })
  }

  return (
    <div className={`flex items-start gap-3 py-3 border-b border-border/50 last:border-0 ${isPending ? 'opacity-60' : ''}`}>
      <GripVertical className="h-4 w-4 mt-0.5 text-muted-foreground/40 shrink-0 cursor-grab" />

      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex flex-col gap-2">
            <Input
              value={titleDraft}
              onChange={e => setTitleDraft(e.target.value)}
              className="text-sm"
              autoFocus
            />
            <Textarea
              value={descDraft}
              onChange={e => setDescDraft(e.target.value)}
              placeholder="Beskriving (valfri)…"
              className="min-h-[52px] type-label resize-none"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={saveEdit} disabled={!titleDraft.trim()}>
                <Check className="h-3.5 w-3.5 mr-1" /> Lagre
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setTitleDraft(item.title); setDescDraft(item.description ?? '') }}>
                <X className="h-3.5 w-3.5 mr-1" /> Avbryt
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-sm ${!item.is_active ? 'line-through text-muted-foreground' : ''}`}>
                {item.title}
              </span>
              {!item.is_active && <Badge variant="secondary" className="type-label">Inaktiv</Badge>}
            </div>
            {item.description && (
              <p className="type-label text-muted-foreground mt-0.5">{item.description}</p>
            )}
          </>
        )}
      </div>

      {!editing && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="text-muted-foreground/50 hover:text-foreground transition-colors p-1"
            title="Rediger"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={toggleActive}
            className="text-muted-foreground/50 hover:text-foreground transition-colors p-1"
            title={item.is_active ? 'Deaktiver' : 'Aktiver'}
          >
            {item.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>
          {confirmDelete ? (
            <span className="flex items-center gap-1">
              <button onClick={handleDelete} className="type-label text-destructive px-1">Slett</button>
              <button onClick={() => setConfirmDelete(false)} className="type-label text-muted-foreground px-1">Avbryt</button>
            </span>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-muted-foreground/40 hover:text-destructive transition-colors p-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ChecklistTemplateManager({
  initialItems,
}: {
  initialItems: ChecklistTemplateItem[]
}) {
  const [items, setItems] = useState(initialItems)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [adding, setAdding] = useState(false)

  function handleUpdate(id: string, fields: Partial<ChecklistTemplateItem>) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...fields } : i))
  }

  function handleDelete(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function handleAdd() {
    if (!newTitle.trim()) return
    setAdding(true)
    try {
      await addTemplateItem(newTitle.trim(), newDesc.trim())
      setItems(prev => [...prev, {
        id: crypto.randomUUID(),
        title: newTitle.trim(),
        description: newDesc.trim() || null,
        order_index: prev.length,
        is_active: true,
        created_at: new Date().toISOString(),
      }])
      setNewTitle('')
      setNewDesc('')
      setShowAddForm(false)
      toast.success('Punkt lagt til i malen')
    } catch {
      toast.error('Kunne ikkje leggje til punkt')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">Ingen malpunkt enno.</p>
      ) : (
        <div>
          {items.map(item => (
            <TemplateItemRow
              key={item.id}
              item={item}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}

      {showAddForm ? (
        <div className="mt-4 flex flex-col gap-2 pt-3 border-t border-border">
          <Input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Tittel på punktet…"
            className="text-sm"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
          />
          <Textarea
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="Beskriving (valfri)…"
            className="min-h-[52px] type-label resize-none"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={adding || !newTitle.trim()}>
              {adding ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
              Legg til
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowAddForm(false); setNewTitle(''); setNewDesc('') }}>
              Avbryt
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="mt-4"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Legg til punkt
        </Button>
      )}
    </div>
  )
}

