import { useState } from "react"
import { ChevronDown } from "lucide-react"
import type { BudgetActions } from "../../hooks/useBudget"
import type { TrackerData } from "../../hooks/useTrackerData"
import { fmt, fmt2, summarize, type BudgetState } from "../../lib/budget"
import { incomeBySource, incomePattern, sameDaysCompare } from "../../lib/insights"
import { isIncome, monthKey } from "../../lib/transactions"
import { CountUp } from "../budget/CountUp"

interface Props {
  data: TrackerData
  state: BudgetState
  actions: BudgetActions
  onOpenProfile: () => void
}

const shortDate = (s: string) => new Date(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)).toLocaleDateString(undefined, { month: "short", day: "numeric" })

export function IncomeTab({ data, state }: Props) {
  const { txs } = data
  const [openSource, setOpenSource] = useState<string | null>(null)

  if (txs === null) {
    return (
      <div className="rounded-md border-2 border-dashed border-foreground p-ds-md">
        <p className="font-caption text-caption text-muted-foreground">Loading transactions…</p>
      </div>
    )
  }

  const now = new Date()
  const month = monthKey(now)
  const sources = incomeBySource(txs, month)
  const earned = sources.reduce((s, g) => s + g.total, 0)
  const cmp = sameDaysCompare(txs, now, (t) => (isIncome(t) ? -Number(t.amount) : 0))
  const pattern = incomePattern(txs, 90)
  const last = sources.flatMap((g) => g.entries).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))[0] ?? null
  const showExpected = state.income.grossAnnual > 0 || state.income.overrideEnabled
  const takeHome = summarize(state).takeHome

  return (
    <div className="space-y-ds-md">
      <section className="border-4 border-foreground bg-card shadow-[4px_4px_0_0_var(--foreground)]">
        <div className="flex items-center justify-between gap-ds-sm border-b-4 border-foreground bg-success px-ds-md py-ds-sm text-success-foreground">
          <h2 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]">Earned · {now.toLocaleDateString(undefined, { month: "long" })}</h2>
        </div>
        <div className="space-y-ds-sm p-ds-md">
          <p className="font-display text-[44px] font-black leading-none">
            <CountUp value={earned} format={fmt} />
          </p>
          {Math.abs(cmp.delta) < 1 ? (
            <p className="font-caption text-body text-muted-foreground">Same as last month</p>
          ) : cmp.delta > 0 ? (
            <p className="font-caption text-body text-success">{fmt(Math.abs(cmp.delta))} more than this time last month</p>
          ) : (
            <p className="font-caption text-body text-primary">{fmt(Math.abs(cmp.delta))} less than this time last month</p>
          )}
          <p className="font-caption text-caption text-muted-foreground">{last ? `Last deposit ${shortDate(last.date)} · ${last.source}` : "No deposits yet this month"}</p>
          {showExpected ? <p className="font-caption text-caption text-muted-foreground">Expected ≈ {fmt(takeHome)}/mo</p> : null}
        </div>
      </section>

      <section className="border-4 border-foreground bg-card shadow-[4px_4px_0_0_var(--foreground)]">
        <div className="flex items-center justify-between gap-ds-sm border-b-4 border-foreground bg-success px-ds-md py-ds-sm text-success-foreground">
          <h3 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]">Where it came from</h3>
        </div>
        {sources.length === 0 ? (
          <p className="p-ds-md font-body text-[14px] text-muted-foreground">No deposits yet this month.</p>
        ) : (
          <ul className="divide-y-2 divide-foreground/15">
            {sources.map((g, index) => {
              const id = `${g.kind}|${g.source}`
              const expanded = openSource === id
              return (
                <li key={id} data-index={index}>
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setOpenSource(expanded ? null : id)}
                    className="group flex min-h-[56px] w-full items-center justify-between gap-ds-sm px-ds-md py-ds-sm text-left active:bg-muted"
                  >
                    <div className="flex min-w-0 items-center gap-ds-sm">
                      <span
                        data-kind={g.kind}
                        className="shrink-0 rounded-sm border-2 border-foreground bg-background px-1.5 font-caption text-[11px] uppercase data-[kind=payroll]:bg-success data-[kind=payroll]:text-success-foreground data-[kind=peer]:bg-[hsl(199_60%_45%)] data-[kind=peer]:text-primary-foreground"
                      >
                        {g.kind}
                      </span>
                      <span className="truncate font-body text-body">{g.source}</span>
                    </div>
                    <span className="flex shrink-0 items-center gap-ds-xs font-caption text-[15px] font-bold text-success">
                      {fmt(g.total)}
                      <ChevronDown aria-hidden="true" className="size-4 shrink-0 transition-transform group-aria-expanded:rotate-180" strokeWidth={3} />
                    </span>
                  </button>
                  {expanded ? (
                    <ul className="divide-y-2 divide-foreground/10 bg-muted">
                      {g.entries.map((e, i) => (
                        <li key={e.transaction_id} data-index={i} className="flex items-center justify-between gap-ds-sm px-ds-md py-ds-xs">
                          <span className="font-caption text-caption text-muted-foreground">{shortDate(e.date)}</span>
                          <span className="font-caption text-caption tabular-nums">{fmt2(e.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="border-4 border-foreground bg-card shadow-[4px_4px_0_0_var(--foreground)]">
        <div className="flex items-center justify-between gap-ds-sm border-b-4 border-foreground bg-[hsl(24.4_48.7%_36.7%)] px-ds-md py-ds-sm text-primary-foreground">
          <h3 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]">Pattern</h3>
        </div>
        <div className="p-ds-md">
          {pattern.count === 0 ? (
            <p className="font-body text-[14px] text-muted-foreground">No deposits seen yet.</p>
          ) : (
            <p className="font-body text-[14px]">
              {pattern.count} deposits in 90 days
              {pattern.avgGapDays !== null ? ` · about every ${Math.max(1, Math.round(pattern.avgGapDays))} days` : ""} · avg {fmt(pattern.avgAmount)}
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
