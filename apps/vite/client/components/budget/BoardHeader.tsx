import { fmt } from "../../lib/budget"

export function BoardHeader({ monthlySpend }: { monthlySpend: number }) {
  return (
    <header className="px-ds-md pb-ds-md pt-ds-3xl" data-oid="ee590e2219" data-oid-component-root="true" data-oid-callsite-deletable="true" data-oid-callsite-single="true">
      <h1 className="font-display text-[40px] font-black uppercase leading-none tracking-[-0.02em] text-foreground" data-oid="f38deeab91">My money</h1>
      <div className="mt-ds-md flex items-center justify-between gap-ds-sm border-4 border-foreground bg-card px-ds-md py-ds-sm shadow-[4px_4px_0_0_var(--foreground)]" data-oid="67988d8cf1">
        <p className="font-label text-label font-bold uppercase text-foreground" data-oid="d8497a8b61">Monthly spend</p>
        <p className="font-caption text-[24px] font-bold leading-none text-foreground" data-oid="8994ed0f7b">{fmt(monthlySpend)}</p>
      </div>
    </header>
  )
}
