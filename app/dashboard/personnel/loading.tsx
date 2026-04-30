function PersonnelCardSkeleton() {
  return (
    <div className="flex flex-col rounded-xl overflow-hidden bg-surface-container">
      <div className="h-[5px] bg-surface-high" />

      <div className="p-4 flex flex-col gap-3 min-h-[256px]">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-surface-high" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-36 max-w-full rounded bg-surface-high" />
            <div className="h-3 w-24 rounded bg-surface-high" />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="h-3 w-20 rounded bg-surface-high" />
          <div className="h-6 w-28 rounded-full bg-surface-high" />
        </div>

        <div className="space-y-1.5">
          <div className="h-3 w-28 rounded bg-surface-high" />
          <div className="flex flex-wrap gap-1">
            <div className="h-5 w-16 rounded-full bg-surface-high" />
            <div className="h-5 w-20 rounded-full bg-surface-high" />
            <div className="h-5 w-14 rounded-full bg-surface-high" />
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex items-end justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <div className="size-2 rounded-full bg-surface-high" />
            <div className="h-3 w-20 rounded bg-surface-high" />
          </div>

          <div>
            <div className="flex gap-[3px] mb-[3px]">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={`label-${i}`} className="h-2 w-[18px] rounded bg-surface-high" />
              ))}
            </div>
            <div className="flex gap-[3px]">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={`slot-${i}`} className="h-[6px] w-[18px] rounded-sm bg-surface-high" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PersonnelLoading() {
  return (
    <>
      <div className="border-b border-border bg-surface-low -mx-4 -mt-8">
        <div className="px-6 flex gap-0 animate-pulse" aria-hidden>
          <div className="px-4 py-2.5">
            <div className="h-4 w-14 rounded bg-surface-high" />
          </div>
          <div className="px-4 py-2.5">
            <div className="h-4 w-16 rounded bg-surface-high" />
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-8 w-full animate-pulse">
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="space-y-2">
            <div className="h-8 w-28 rounded bg-surface-high" />
            <div className="h-4 w-72 max-w-[65vw] rounded bg-surface-high" />
          </div>
          <div className="h-10 w-36 rounded-md bg-surface-high" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PersonnelCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </>
  )
}
