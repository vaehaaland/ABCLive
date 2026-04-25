export default function GigDetailLoading() {
  return (
    <div className="grid grid-cols-1 gap-6 max-w-5xl lg:grid-cols-2 animate-pulse">
      {/* Left column */}
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2 flex-1">
            <div className="flex items-center gap-2">
              <div className="h-7 w-64 rounded-lg bg-muted" />
            </div>
            <div className="h-4 w-48 rounded bg-muted" />
          </div>
          <div className="h-6 w-20 rounded-full bg-muted shrink-0" />
        </div>

        {/* Personnel + Equipment cards */}
        <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-2">
          {[0, 1].map(i => (
            <div key={i} className="rounded-xl border border-border bg-surface-container p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 rounded bg-muted" />
                <div className="h-7 w-20 rounded-md bg-muted" />
              </div>
              {[0, 1, 2].map(j => (
                <div key={j} className="flex items-center gap-2.5 py-1">
                  <div className="h-7 w-7 rounded-full bg-muted shrink-0" />
                  <div className="h-4 w-32 rounded bg-muted" />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Checklist card */}
        <div className="rounded-xl border border-border bg-surface-container p-4 flex flex-col gap-3">
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="h-1.5 w-full rounded-full bg-muted" />
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 py-1">
              <div className="h-5 w-5 rounded border-2 border-muted shrink-0" />
              <div className="h-4 rounded bg-muted" style={{ width: `${55 + i * 10}%` }} />
            </div>
          ))}
        </div>

        {/* Files card */}
        <div className="rounded-xl border border-border bg-surface-container p-4 flex flex-col gap-3">
          <div className="h-4 w-16 rounded bg-muted" />
          {[0, 1].map(i => (
            <div key={i} className="flex items-center gap-2 py-1">
              <div className="h-8 w-8 rounded bg-muted shrink-0" />
              <div className="flex flex-col gap-1 flex-1">
                <div className="h-3.5 w-40 rounded bg-muted" />
                <div className="h-3 w-24 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right column — comments */}
      <div className="rounded-xl border border-border bg-surface-container p-4 flex flex-col gap-4">
        <div className="h-4 w-24 rounded bg-muted" />
        {[0, 1, 2].map(i => (
          <div key={i} className="flex gap-2.5">
            <div className="h-7 w-7 rounded-full bg-muted shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="h-3.5 w-28 rounded bg-muted" />
              <div className="h-4 rounded bg-muted w-full" />
              <div className="h-4 rounded bg-muted w-4/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
