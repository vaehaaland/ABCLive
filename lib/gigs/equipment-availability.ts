type AllocationInput = {
  equipment_id: string
  quantity_needed: number
  gigs:
    | { start_date: string; end_date: string; deleted_at?: string | null }
    | { start_date: string; end_date: string; deleted_at?: string | null }[]
}

export function buildAllocatedMap(
  allocations: AllocationInput[],
  gigStartDate: string,
  gigEndDate: string,
): Map<string, number> {
  const allocatedMap = new Map<string, number>()
  allocations.forEach((a) => {
    const gigs = Array.isArray(a.gigs) ? a.gigs : [a.gigs]
    gigs.forEach((g) => {
      if (g.deleted_at) return
      if (g.start_date <= gigEndDate && g.end_date >= gigStartDate) {
        allocatedMap.set(a.equipment_id, (allocatedMap.get(a.equipment_id) ?? 0) + a.quantity_needed)
      }
    })
  })
  return allocatedMap
}

export function computeAvailability<T extends { id: string; quantity: number }>(
  equipment: T[],
  allocatedMap: Map<string, number>,
): Array<T & { available: number }> {
  return equipment.map((eq) => ({
    ...eq,
    available: eq.quantity - (allocatedMap.get(eq.id) ?? 0),
  }))
}
