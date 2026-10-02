import { CircleHelp, Landmark, LayoutGrid, PiggyBank, Receipt } from "lucide-react"

export type TabId = "board" | "income" | "spend" | "goals" | "whatif"

export function TabBar({ tab, onChange }: { tab: TabId; onChange: (t: TabId) => void }) {
  return (
    <nav
      role="tablist"
      aria-label="Budget sections"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto grid w-full max-w-[480px] grid-cols-5 border-t-4 border-foreground bg-card pb-[calc(env(safe-area-inset-bottom)+18px)] sm:border-x-4" data-oid="e0e0043e49" data-oid-component-root="true" data-oid-callsite-deletable="true" data-oid-callsite-single="true"
    >
      <button type="button" role="tab" aria-selected={tab === "board"} onClick={() => onChange("board")} className="flex min-h-[72px] flex-col items-center gap-1.5 border-r-2 border-foreground pb-ds-xs group bg-muted text-muted-foreground aria-selected:bg-card aria-selected:text-foreground" data-oid="d7042af9c2">
        <span aria-hidden="true" className="h-2 w-full border-b-2 border-foreground transition-all group-aria-selected:h-4 bg-primary" data-oid="f4bb71d4eb" />
        <LayoutGrid className="mt-1.5 size-7" strokeWidth={2.5} data-oid="e80fe46f36" />
        <span className="font-label text-[12px] font-bold uppercase tracking-[0.06em]" data-oid="9718462bb0">Overview</span>
      </button>
      <button type="button" role="tab" aria-selected={tab === "income"} onClick={() => onChange("income")} className="flex min-h-[72px] flex-col items-center gap-1.5 border-r-2 border-foreground pb-ds-xs group bg-muted text-muted-foreground aria-selected:bg-card aria-selected:text-foreground" data-oid="b24d133b95">
        <span aria-hidden="true" className="h-2 w-full border-b-2 border-foreground transition-all group-aria-selected:h-4 bg-[hsl(24.4_48.7%_36.7%)]" data-oid="63c5789615" />
        <Landmark className="mt-1.5 size-7" strokeWidth={2.5} data-oid="ada6b5bd26" />
        <span className="font-label text-[12px] font-bold uppercase tracking-[0.06em]" data-oid="7cb230ae1b">Income</span>
      </button>
      <button type="button" role="tab" aria-selected={tab === "spend"} onClick={() => onChange("spend")} className="flex min-h-[72px] flex-col items-center gap-1.5 border-r-2 border-foreground pb-ds-xs group bg-muted text-muted-foreground aria-selected:bg-card aria-selected:text-foreground" data-oid="b9c0c6ad17">
        <span aria-hidden="true" className="h-2 w-full border-b-2 border-foreground transition-all group-aria-selected:h-4 bg-secondary" data-oid="5a944db779" />
        <Receipt className="mt-1.5 size-7" strokeWidth={2.5} data-oid="098915f30e" />
        <span className="font-label text-[12px] font-bold uppercase tracking-[0.06em]" data-oid="5f52e588e2">Spend</span>
      </button>
      <button type="button" role="tab" aria-selected={tab === "goals"} onClick={() => onChange("goals")} className="flex min-h-[72px] flex-col items-center gap-1.5 border-r-2 border-foreground pb-ds-xs group bg-muted text-muted-foreground aria-selected:bg-card aria-selected:text-foreground" data-oid="e187e8e739">
        <span aria-hidden="true" className="h-2 w-full border-b-2 border-foreground transition-all group-aria-selected:h-4 bg-success" data-oid="0f2e00e884" />
        <PiggyBank className="mt-1.5 size-7" strokeWidth={2.5} data-oid="f7c76a385c" />
        <span className="font-label text-[12px] font-bold uppercase tracking-[0.06em]" data-oid="a29db5daf5">Goals</span>
      </button>
      <button type="button" role="tab" aria-selected={tab === "whatif"} onClick={() => onChange("whatif")} className="flex min-h-[72px] flex-col items-center gap-1.5 pb-ds-xs group bg-muted text-muted-foreground aria-selected:bg-card aria-selected:text-foreground" data-oid="e8d7c2c6de">
        <span aria-hidden="true" className="h-2 w-full border-b-2 border-foreground transition-all group-aria-selected:h-4 bg-accent" data-oid="f07dc3b484" />
        <CircleHelp className="mt-1.5 size-7" strokeWidth={2.5} data-oid="2f29379017" />
        <span className="font-label text-[12px] font-bold uppercase tracking-[0.06em]" data-oid="d4d52503c3">What if</span>
      </button>
    </nav>
  )
}
