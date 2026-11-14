interface Props<T extends string> {
  options: Array<{ id: T; label: string; band: string }>
  value: T
  onChange: (v: T) => void
}

/** Board-tile tablist: the hotel marker drops onto the active tile. */
export function LensTiles<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <div role="tablist" aria-label="Breakdown lens" className="grid gap-ds-sm" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className="group relative flex min-h-[60px] flex-col border-4 border-foreground bg-muted text-muted-foreground transition-[background-color,color,scale] duration-200 active:scale-95 aria-selected:bg-card aria-selected:text-foreground"
        >
          <span aria-hidden="true" className={`h-4 w-full border-b-2 border-foreground ${o.band}`} />
          <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-4 w-7 -translate-x-1/2 -translate-y-[260%] rounded-t-md border-2 border-foreground bg-primary opacity-0 transition-all duration-[180ms] ease-in group-aria-selected:-translate-y-1/2 group-aria-selected:duration-[460ms] group-aria-selected:ease-[cubic-bezier(0.25,1.12,0.4,1)] group-aria-selected:opacity-100" />
          <span className="flex flex-1 items-center justify-center font-label text-label font-extrabold uppercase">{o.label}</span>
        </button>
      ))}
    </div>
  )
}
