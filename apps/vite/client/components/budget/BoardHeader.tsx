import { fmt } from "../../lib/budget"

export function BoardHeader({ monthlySpend }: { monthlySpend: number }) {
  return (
    <header className="px-ds-md pb-ds-md pt-ds-3xl" data-oid="ee590e2219" data-oid-component-root="true" data-oid-callsite-deletable="true" data-oid-callsite-single="true">
      <h1 className="font-heading text-heading font-extrabold uppercase text-foreground" data-oid="f38deeab91">My money</h1>
      <p className="mt-ds-xs font-body text-body text-muted-foreground" data-oid="67988d8cf1">
        Monthly spend <span className="font-caption text-[17px] font-bold text-foreground" data-oid="3767a7681e">{fmt(monthlySpend)}</span>
      </p>
    </header>
  )
}
