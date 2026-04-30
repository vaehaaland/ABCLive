export default function GigsLoading() {
  const cards = Array.from({ length: 6 })

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 animate-pulse">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="h-9 w-44 rounded-xl bg-muted/70" />
        <div className="h-9 w-32 rounded-xl bg-muted/70" />

        <div className="flex-1 min-w-[200px] max-w-xs">
          <div className="h-10 w-full rounded-xl bg-muted/70" />
        </div>

        <div className="h-10 w-32 rounded-xl bg-muted/70" />
        <div className="h-10 w-40 rounded-xl bg-muted/70" />

        <div className="h-10 w-28 rounded-xl bg-muted/70" />
        <div className="h-10 w-32 rounded-xl bg-muted/70" />

        <div className="flex rounded-lg bg-surface-high p-[3px] gap-0.5">
          <div className="size-7 rounded-[7px] bg-muted/70" />
          <div className="size-7 rounded-[7px] bg-muted/70" />
        </div>
      </div>

      <div className="flex items-center gap-3 mb-1">
        <div className="h-4 w-20 rounded bg-muted/70" />
        <div className="h-5 w-8 rounded-full bg-muted/70" />
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-border bg-surface-container px-3.5 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2 flex-1">
                <div className="h-5 w-3/4 rounded bg-muted/70" />
                <div className="h-3.5 w-1/2 rounded bg-muted/70" />
              </div>
              <div className="h-5 w-16 rounded-full bg-muted/70" />
            </div>

            <div className="mt-4 flex gap-2">
              <div className="h-5 w-20 rounded-full bg-muted/70" />
              <div className="h-5 w-24 rounded-full bg-muted/70" />
              <div className="h-5 w-16 rounded-full bg-muted/70" />
            </div>

            <div className="mt-4 space-y-2">
              <div className="h-3.5 w-2/3 rounded bg-muted/70" />
              <div className="h-3.5 w-1/2 rounded bg-muted/70" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
