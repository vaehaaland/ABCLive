export default function AdminTicketsLoading() {
  const rows = Array.from({ length: 8 })

  return (
    <div className="flex animate-pulse flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="h-8 w-40 rounded-md bg-muted" />
          <div className="h-4 w-[30rem] max-w-full rounded bg-muted" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="h-9 w-40 rounded-md border border-input bg-muted" />
          <div className="h-4 w-14 rounded bg-muted" />
        </div>
      </div>

      <div className="rounded-md border">
        <div className="grid grid-cols-[minmax(0,2.5fr)_minmax(0,1.5fr)_minmax(0,1.8fr)_minmax(0,1.2fr)] border-b px-4 py-3">
          <div className="h-4 w-16 rounded bg-muted" />
          <div className="h-4 w-14 rounded bg-muted" />
          <div className="h-4 w-20 rounded bg-muted" />
          <div className="h-4 w-16 rounded bg-muted" />
        </div>

        <div>
          {rows.map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-[minmax(0,2.5fr)_minmax(0,1.5fr)_minmax(0,1.8fr)_minmax(0,1.2fr)] items-center gap-3 border-b px-4 py-4 last:border-b-0"
            >
              <div className="h-4 w-[85%] rounded bg-muted" />
              <div className="h-8 w-32 rounded-md bg-muted" />
              <div className="h-4 w-[70%] rounded bg-muted" />
              <div className="h-4 w-24 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-dashed p-4">
        <div className="h-4 w-40 rounded bg-muted" />
      </div>
    </div>
  )
}
