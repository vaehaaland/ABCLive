export default function GigDetailLoading() {
  return (
    <div className="grid grid-cols-1 gap-6 max-w-5xl lg:grid-cols-2 animate-pulse">
      <div className="flex flex-col gap-6">
        {/* GigDetailPage: header/status/actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-8 w-72 rounded-lg bg-muted" />
            <div className="h-4 w-56 rounded bg-muted" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-20 rounded-full bg-muted" />
            <div className="h-8 w-24 rounded-md bg-muted" />
          </div>
        </div>

        {/* GigDetailPage: personell/utstyr (same breakpoints as detail page) */}
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface-container p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="h-5 w-28 rounded bg-muted" />
              <div className="h-8 w-24 rounded-md bg-muted" />
            </div>
            <div className="h-40 space-y-3">
              <div className="h-7 w-full rounded bg-muted" />
              <div className="h-7 w-11/12 rounded bg-muted" />
              <div className="h-7 w-10/12 rounded bg-muted" />
              <div className="h-7 w-9/12 rounded bg-muted" />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface-container p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="h-5 w-20 rounded bg-muted" />
              <div className="h-8 w-24 rounded-md bg-muted" />
            </div>
            <div className="h-40 space-y-3">
              <div className="h-8 w-full rounded bg-muted" />
              <div className="h-8 w-5/6 rounded bg-muted" />
              <div className="h-8 w-4/5 rounded bg-muted" />
            </div>
          </div>
        </div>

        {/* GigDetailPage: filer */}
        <div className="rounded-xl border border-border bg-surface-container p-4">
          <div className="mb-4 h-5 w-16 rounded bg-muted" />
          <div className="h-28 space-y-3">
            <div className="h-10 w-full rounded bg-muted" />
            <div className="h-10 w-11/12 rounded bg-muted" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start">
        {/* GigDetailPage: sjekkliste */}
        <div className="rounded-xl border border-border bg-surface-container p-4">
          <div className="mb-4 h-5 w-24 rounded bg-muted" />
          <div className="h-36 space-y-3">
            <div className="h-4 w-full rounded-full bg-muted" />
            <div className="h-6 w-full rounded bg-muted" />
            <div className="h-6 w-11/12 rounded bg-muted" />
            <div className="h-6 w-10/12 rounded bg-muted" />
          </div>
        </div>

        {/* GigDetailPage: kommentarfelt */}
        <div className="rounded-xl border border-border bg-surface-container p-4">
          <div className="mb-4 h-5 w-28 rounded bg-muted" />
          <div className="h-64 space-y-4">
            <div className="h-16 w-full rounded bg-muted" />
            <div className="h-16 w-full rounded bg-muted" />
            <div className="h-16 w-11/12 rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  )
}
