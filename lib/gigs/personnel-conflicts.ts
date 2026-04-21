type ConflictInput = {
  profile_id: string
  gigs:
    | { id: string; name: string; start_date: string; end_date: string }
    | { id: string; name: string; start_date: string; end_date: string }[]
}

export function buildConflictMap(
  conflicts: ConflictInput[],
  gigStartDate: string,
  gigEndDate: string,
): Map<string, string> {
  const conflictMap = new Map<string, string>()
  conflicts.forEach((c) => {
    const gigs = Array.isArray(c.gigs) ? c.gigs : [c.gigs]
    gigs.forEach((g) => {
      if (g.start_date <= gigEndDate && g.end_date >= gigStartDate) {
        conflictMap.set(c.profile_id, g.name)
      }
    })
  })
  return conflictMap
}
