const WEEKDAYS = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn']

export default function CalendarLoading() {
  const weekRows = Array.from({ length: 6 })

  return (
    <div className="-mx-4 -mt-8 flex flex-col animate-pulse">
      <div className="sticky top-14 z-30 border-b border-border bg-surface/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-3 px-6 py-3">
          <div className="h-7 w-44 rounded-lg bg-muted/70" />

          <div className="h-8 w-20 rounded-lg bg-muted/70" />
          <div className="h-8 w-16 rounded-lg bg-muted/70" />
          <div className="h-8 w-20 rounded-lg bg-muted/70" />

          <div className="ml-2 flex items-center gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <div className="size-2 rounded-full bg-muted/80" />
                <div className="h-3 w-14 rounded bg-muted/70" />
              </div>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="h-3 w-16 rounded bg-muted/70" />
            <div className="h-9 w-56 rounded-xl bg-muted/70" />
            <div className="h-9 w-24 rounded-xl bg-muted/70" />
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1200px] px-6 pb-8 pt-5">
        <div className="overflow-hidden rounded-xl border border-border bg-surface-container">
          <div className="grid grid-cols-7 border-b border-border bg-surface-low/40">
            {WEEKDAYS.map((day) => (
              <div key={day} className="px-2 py-2 text-center">
                <div className="mx-auto h-3 w-8 rounded bg-muted/70" />
              </div>
            ))}
          </div>

          {weekRows.map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="relative grid min-h-[124px] grid-cols-7 border-b border-border last:border-b-0"
            >
              {Array.from({ length: 7 }).map((__, colIndex) => {
                const showOnePill = (rowIndex + colIndex) % 3 === 0
                const showTwoPills = (rowIndex + colIndex) % 7 === 0

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className="border-r border-border px-1 pt-1.5 last:border-r-0"
                  >
                    <div className="mx-auto size-[26px] rounded-full bg-muted/70" />

                    <div className="mt-2 space-y-1.5 px-1">
                      {showOnePill && (
                        <div className="h-[22px] w-full rounded-md bg-muted/70" />
                      )}
                      {showTwoPills && (
                        <div className="h-[22px] w-4/5 rounded-md bg-muted/60" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
