'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Equipment } from '@/types/database'

interface Props {
  equipment?: Equipment
}

export default function EquipmentForm({ equipment }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState(equipment?.name ?? '')
  const [category, setCategory] = useState(equipment?.category ?? '')
  const [description, setDescription] = useState(equipment?.description ?? '')
  const [quantity, setQuantity] = useState(equipment?.quantity ?? 1)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const payload = { name, category: category || null, description: description || null, quantity }

    let result
    if (equipment) {
      result = await supabase.from('equipment').update(payload).eq('id', equipment.id)
    } else {
      result = await supabase.from('equipment').insert(payload)
    }

    if (result.error) {
      setError(result.error.message)
      setLoading(false)
    } else {
      router.push('/dashboard/equipment')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="rounded-xl bg-surface-container p-6 flex flex-col gap-5">
        <div className="grid gap-2">
          <Label htmlFor="name">Namn *</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="category">Kategori</Label>
            <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="t.d. PA, Lys, Mikrofon…" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="quantity">Antal *</Label>
            <Input id="quantity" type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} required />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">Beskriving</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Lagrar…' : equipment ? 'Lagre endringer' : 'Legg til utstyr'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>Avbryt</Button>
      </div>
    </form>
  )
}
