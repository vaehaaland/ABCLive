'use client'

import { useState } from 'react'
import { EquipmentCard, type EnrichedEquipment } from './EquipmentCard'

type Props = {
  equipment: EnrichedEquipment[]
  categories: string[]
}

export function EquipmentGrid({ equipment, categories }: Props) {
  const [activeTab, setActiveTab] = useState<string>('all')

  const tabs = ['all', ...categories]

  const filtered =
    activeTab === 'all'
      ? equipment
      : equipment.filter((e) => (e.category ?? '') === activeTab)

  // Group by category
  const grouped = filtered.reduce<Record<string, EnrichedEquipment[]>>((acc, item) => {
    const cat = item.category ?? 'Uncategorised'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  const groupKeys = Object.keys(grouped).sort()

  return (
    <div className="flex flex-col gap-8">
      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              activeTab === tab
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface-high text-muted-foreground hover:text-foreground hover:bg-surface-highest',
            ].join(' ')}
          >
            {tab === 'all' ? 'All Gear' : tab}
          </button>
        ))}
      </div>

      {/* Sections */}
      {groupKeys.length === 0 ? (
        <p className="text-muted-foreground text-sm">Ingen utstyr funnet.</p>
      ) : (
        groupKeys.map((cat) => (
          <section key={cat}>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="type-title">{cat}</h2>
              <span className="type-label text-muted-foreground">{grouped[cat].length} items</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {grouped[cat].map((item) => (
                <EquipmentCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}

