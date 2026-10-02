import { CircleHelp, Landmark, PiggyBank, Receipt } from "lucide-react"
import { TycoonIcon } from "./TycoonIcon"

export type TabId = "board" | "income" | "spend" | "goals" | "whatif"

export function TabBar({ tab, onChange }: { tab: TabId; onChange: (t: TabId) => void }) {
  return (
    <nav
      role="tablist"
      aria-label="Budget sections"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto grid w-full max-w-[480px] grid-cols-5 border-t-4 border-foreground bg-card sm:border-x-4" data-oid="e0e0043e49" data-oid-component-root="true" data-oid-callsite-deletable="true" data-oid-callsite-single="true"
    >
      <button type="button" role="tab" aria-selected={tab === "board"} onClick={() => onChange("board")} className="group relative flex min-h-[72px] flex-col items-center gap-1.5 transition-[background-color,color,scale] duration-200 active:scale-95 border-r-2 border-foreground bg-muted pb-[calc(env(safe-area-inset-bottom)+18px)] text-muted-foreground aria-selected:bg-card aria-selected:text-foreground" data-oid="d7042af9c2">
        <span aria-hidden="true" className="h-4 w-full border-b-2 border-foreground bg-primary" data-oid="f4bb71d4eb" />
        <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-4 w-7 -translate-x-1/2 -translate-y-[260%] rounded-t-md border-2 border-foreground bg-primary opacity-0 transition-all duration-[180ms] ease-in group-aria-selected:-translate-y-1/2 group-aria-selected:duration-[460ms] group-aria-selected:ease-[cubic-bezier(0.25,1.12,0.4,1)] group-aria-selected:opacity-100" data-oid="e80fe46f36" />
        <TycoonIcon className="size-7" strokeWidth={2} />
        <span className="font-label text-[12px] font-bold uppercase tracking-[0.06em]" data-oid="1dcba6bfd8">Overview</span>
      </button>
      <button type="button" role="tab" aria-selected={tab === "income"} onClick={() => onChange("income")} className="group relative flex min-h-[72px] flex-col items-center gap-1.5 transition-[background-color,color,scale] duration-200 active:scale-95 border-r-2 border-foreground bg-muted pb-[calc(env(safe-area-inset-bottom)+18px)] text-muted-foreground aria-selected:bg-card aria-selected:text-foreground" data-oid="b2060e1b1a">
        <span aria-hidden="true" className="h-4 w-full border-b-2 border-foreground bg-[hsl(24.4_48.7%_36.7%)]" data-oid="ada6b5bd26" />
        <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-4 w-7 -translate-x-1/2 -translate-y-[260%] rounded-t-md border-2 border-foreground bg-primary opacity-0 transition-all duration-[180ms] ease-in group-aria-selected:-translate-y-1/2 group-aria-selected:duration-[460ms] group-aria-selected:ease-[cubic-bezier(0.25,1.12,0.4,1)] group-aria-selected:opacity-100" data-oid="7cb230ae1b" />
        <Landmark className="size-7" strokeWidth={2.5} data-oid="5748d2febd" />
        <span className="font-label text-[12px] font-bold uppercase tracking-[0.06em]" data-oid="29174a90a1">Income</span>
      </button>
      <button type="button" role="tab" aria-selected={tab === "spend"} onClick={() => onChange("spend")} className="group relative flex min-h-[72px] flex-col items-center gap-1.5 transition-[background-color,color,scale] duration-200 active:scale-95 border-r-2 border-foreground bg-muted pb-[calc(env(safe-area-inset-bottom)+18px)] text-muted-foreground aria-selected:bg-card aria-selected:text-foreground" data-oid="ac88090ed7">
        <span aria-hidden="true" className="h-4 w-full border-b-2 border-foreground bg-secondary" data-oid="5f52e588e2" />
        <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-4 w-7 -translate-x-1/2 -translate-y-[260%] rounded-t-md border-2 border-foreground bg-primary opacity-0 transition-all duration-[180ms] ease-in group-aria-selected:-translate-y-1/2 group-aria-selected:duration-[460ms] group-aria-selected:ease-[cubic-bezier(0.25,1.12,0.4,1)] group-aria-selected:opacity-100" data-oid="4121b0eac3" />
        <Receipt className="size-7" strokeWidth={2.5} data-oid="41935b4842" />
        <span className="font-label text-[12px] font-bold uppercase tracking-[0.06em]" data-oid="0f2e00e884">Spend</span>
      </button>
      <button type="button" role="tab" aria-selected={tab === "goals"} onClick={() => onChange("goals")} className="group relative flex min-h-[72px] flex-col items-center gap-1.5 transition-[background-color,color,scale] duration-200 active:scale-95 border-r-2 border-foreground bg-muted pb-[calc(env(safe-area-inset-bottom)+18px)] text-muted-foreground aria-selected:bg-card aria-selected:text-foreground" data-oid="1a40254ce2">
        <span aria-hidden="true" className="h-4 w-full border-b-2 border-foreground bg-success" data-oid="d06d844673" />
        <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-4 w-7 -translate-x-1/2 -translate-y-[260%] rounded-t-md border-2 border-foreground bg-primary opacity-0 transition-all duration-[180ms] ease-in group-aria-selected:-translate-y-1/2 group-aria-selected:duration-[460ms] group-aria-selected:ease-[cubic-bezier(0.25,1.12,0.4,1)] group-aria-selected:opacity-100" data-oid="e02675eca1" />
        <PiggyBank className="size-7" strokeWidth={2.5} data-oid="f07dc3b484" />
        <span className="font-label text-[12px] font-bold uppercase tracking-[0.06em]" data-oid="2f29379017">Goals</span>
      </button>
      <button type="button" role="tab" aria-selected={tab === "whatif"} onClick={() => onChange("whatif")} className="group relative flex min-h-[72px] flex-col items-center gap-1.5 transition-[background-color,color,scale] duration-200 active:scale-95 bg-muted pb-[calc(env(safe-area-inset-bottom)+18px)] text-muted-foreground aria-selected:bg-card aria-selected:text-foreground" data-oid="47a05b3a7f">
        <span aria-hidden="true" className="h-4 w-full border-b-2 border-foreground bg-accent" data-oid="05619b4a6c" />
        <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-4 w-7 -translate-x-1/2 -translate-y-[260%] rounded-t-md border-2 border-foreground bg-primary opacity-0 transition-all duration-[180ms] ease-in group-aria-selected:-translate-y-1/2 group-aria-selected:duration-[460ms] group-aria-selected:ease-[cubic-bezier(0.25,1.12,0.4,1)] group-aria-selected:opacity-100" data-oid="9fa72fdfa7" />
        <CircleHelp className="size-7" strokeWidth={2.5} data-oid="8dc8f7f8e7" />
        <span className="font-label text-[12px] font-bold uppercase tracking-[0.06em]" data-oid="5f23c33612">What if</span>
      </button>
    </nav>
  )
}
