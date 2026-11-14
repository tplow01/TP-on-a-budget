import { Landmark, Receipt } from "lucide-react"
import { TycoonIcon } from "./TycoonIcon"

export type TabId = "total" | "spend" | "income"

export function TabBar({ tab, onChange }: { tab: TabId; onChange: (t: TabId) => void }) {
  return (
    <nav
      role="tablist"
      aria-label="Budget sections"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto grid w-full max-w-[480px] grid-cols-3 border-t-4 border-foreground bg-card pb-[max(env(safe-area-inset-bottom),34px)] sm:border-x-4" data-oid="e0e0043e49" data-oid-component-root="true" data-oid-callsite-deletable="true" data-oid-callsite-single="true"
    >
      <button type="button" role="tab" aria-selected={tab === "total"} onClick={() => onChange("total")} className="group relative flex min-h-[80px] min-w-[44px] flex-col items-center gap-ds-xs transition-[background-color,color,scale] duration-200 active:scale-95 border-r-2 border-foreground bg-muted pb-ds-sm text-muted-foreground aria-selected:bg-card aria-selected:text-foreground" data-oid="d7042af9c2">
        <span aria-hidden="true" className="h-4 w-full border-b-2 border-foreground bg-primary" data-oid="f4bb71d4eb" />
        <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-4 w-7 -translate-x-1/2 -translate-y-[260%] rounded-t-md border-2 border-foreground bg-primary opacity-0 transition-all duration-[180ms] ease-in group-aria-selected:-translate-y-1/2 group-aria-selected:duration-[460ms] group-aria-selected:ease-[cubic-bezier(0.25,1.12,0.4,1)] group-aria-selected:opacity-100" data-oid="e80fe46f36" />
        <TycoonIcon className="size-7" strokeWidth={2} />
        <span className="font-label text-[13px] font-extrabold uppercase leading-none tracking-[0.02em]" data-oid="1dcba6bfd8">Total</span>
      </button>
      <button type="button" role="tab" aria-selected={tab === "spend"} onClick={() => onChange("spend")} className="group relative flex min-h-[80px] min-w-[44px] flex-col items-center gap-ds-xs transition-[background-color,color,scale] duration-200 active:scale-95 border-r-2 border-foreground bg-muted pb-ds-sm text-muted-foreground aria-selected:bg-card aria-selected:text-foreground" data-oid="ac88090ed7">
        <span aria-hidden="true" className="h-4 w-full border-b-2 border-foreground bg-secondary" data-oid="5f52e588e2" />
        <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-4 w-7 -translate-x-1/2 -translate-y-[260%] rounded-t-md border-2 border-foreground bg-primary opacity-0 transition-all duration-[180ms] ease-in group-aria-selected:-translate-y-1/2 group-aria-selected:duration-[460ms] group-aria-selected:ease-[cubic-bezier(0.25,1.12,0.4,1)] group-aria-selected:opacity-100" data-oid="4121b0eac3" />
        <Receipt className="size-7" strokeWidth={2.5} data-oid="41935b4842" />
        <span className="font-label text-[13px] font-extrabold uppercase leading-none tracking-[0.02em]" data-oid="0f2e00e884">Spend</span>
      </button>
      <button type="button" role="tab" aria-selected={tab === "income"} onClick={() => onChange("income")} className="group relative flex min-h-[80px] min-w-[44px] flex-col items-center gap-ds-xs transition-[background-color,color,scale] duration-200 active:scale-95 bg-muted pb-ds-sm text-muted-foreground aria-selected:bg-card aria-selected:text-foreground" data-oid="b2060e1b1a">
        <span aria-hidden="true" className="h-4 w-full border-b-2 border-foreground bg-success" data-oid="ada6b5bd26" />
        <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-4 w-7 -translate-x-1/2 -translate-y-[260%] rounded-t-md border-2 border-foreground bg-primary opacity-0 transition-all duration-[180ms] ease-in group-aria-selected:-translate-y-1/2 group-aria-selected:duration-[460ms] group-aria-selected:ease-[cubic-bezier(0.25,1.12,0.4,1)] group-aria-selected:opacity-100" data-oid="7cb230ae1b" />
        <Landmark className="size-7" strokeWidth={2.5} data-oid="5748d2febd" />
        <span className="font-label text-[13px] font-extrabold uppercase leading-none tracking-[0.02em]" data-oid="29174a90a1">Income</span>
      </button>
    </nav>
  )
}
