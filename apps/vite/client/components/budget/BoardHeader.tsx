import { useEffect, useState } from "react"
import { fmt, fmt2, type Summary } from "../../lib/budget"

type Period = "daily" | "weekly" | "monthly" | "yearly"

/** Multiply a monthly figure by this to get the period figure. */
const PERIOD_FACTOR: Record<Period, number> = {
  daily: 12 / 365,
  weekly: 12 / 52,
  monthly: 1,
  yearly: 12,
}

const PERIOD_UNIT: Record<Period, string> = {
  daily: "per day",
  weekly: "per week",
  monthly: "per month",
  yearly: "per year",
}

const PERIOD_KEY = "budget:period"

function loadPeriod(): Period {
  try {
    const p = localStorage.getItem(PERIOD_KEY)
    if (p === "daily" || p === "weekly" || p === "monthly" || p === "yearly") return p
  } catch {
    /* ignore */
  }
  return "monthly"
}

export function BoardHeader({ summary }: { summary: Summary }) {
  const [period, setPeriod] = useState<Period>(loadPeriod)

  useEffect(() => {
    try {
      localStorage.setItem(PERIOD_KEY, period)
    } catch {
      /* ignore */
    }
  }, [period])

  const f = PERIOD_FACTOR[period]
  const money = period === "daily" ? fmt2 : fmt
  const balance = summary.leftover * f
  const negative = balance < 0

  return (
    <header className="px-ds-md pb-ds-lg pt-ds-3xl" data-oid="759ade2458" data-oid-component-root="true" data-oid-callsite-deletable="true" data-oid-callsite-single="true">
      {/* Period selector — board-tile style */}
      <div role="tablist" aria-label="Time period" className="grid grid-cols-4 gap-ds-sm" data-oid="4cb748da71">
        <button type="button" role="tab" aria-selected={period === "daily"} onClick={() => setPeriod("daily")} className="group flex min-h-[60px] flex-col border-4 border-foreground bg-muted text-muted-foreground transition-transform aria-selected:-translate-y-1 aria-selected:bg-card aria-selected:text-foreground aria-selected:shadow-[4px_4px_0_0_var(--foreground)]" data-oid="4a10a052a8">
          <span aria-hidden="true" className="h-2 w-full border-b-2 border-foreground bg-[hsl(24.4_48.7%_36.7%)] transition-all group-aria-selected:h-4" data-oid="27dfafb867" />
          <span className="flex flex-1 items-center justify-center font-label text-label font-extrabold uppercase" data-oid="7ec100093f">Day</span>
        </button>
        <button type="button" role="tab" aria-selected={period === "weekly"} onClick={() => setPeriod("weekly")} className="group flex min-h-[60px] flex-col border-4 border-foreground bg-muted text-muted-foreground transition-transform aria-selected:-translate-y-1 aria-selected:bg-card aria-selected:text-foreground aria-selected:shadow-[4px_4px_0_0_var(--foreground)]" data-oid="990c64263d">
          <span aria-hidden="true" className="h-2 w-full border-b-2 border-foreground bg-[hsl(206.2_71.2%_74.1%)] transition-all group-aria-selected:h-4" data-oid="4999840ec5" />
          <span className="flex flex-1 items-center justify-center font-label text-label font-extrabold uppercase" data-oid="284275e705">Week</span>
        </button>
        <button type="button" role="tab" aria-selected={period === "monthly"} onClick={() => setPeriod("monthly")} className="group flex min-h-[60px] flex-col border-4 border-foreground bg-muted text-muted-foreground transition-transform aria-selected:-translate-y-1 aria-selected:bg-card aria-selected:text-foreground aria-selected:shadow-[4px_4px_0_0_var(--foreground)]" data-oid="ccf48b9f3a">
          <span aria-hidden="true" className="h-2 w-full border-b-2 border-foreground bg-[hsl(325.9_63.3%_52%)] transition-all group-aria-selected:h-4" data-oid="3e6fb2ef9d" />
          <span className="flex flex-1 items-center justify-center font-label text-label font-extrabold uppercase" data-oid="aa023363cd">Month</span>
        </button>
        <button type="button" role="tab" aria-selected={period === "yearly"} onClick={() => setPeriod("yearly")} className="group flex min-h-[60px] flex-col border-4 border-foreground bg-muted text-muted-foreground transition-transform aria-selected:-translate-y-1 aria-selected:bg-card aria-selected:text-foreground aria-selected:shadow-[4px_4px_0_0_var(--foreground)]" data-oid="e81f613c4b">
          <span aria-hidden="true" className="h-2 w-full border-b-2 border-foreground bg-accent transition-all group-aria-selected:h-4" data-oid="714e1cc9c5" />
          <span className="flex flex-1 items-center justify-center font-label text-label font-extrabold uppercase" data-oid="d1863fa7c3">Year</span>
        </button>
      </div>

      {/* Bento grid of deed-style cards */}
      <div className="mt-ds-md grid grid-cols-2 gap-ds-sm" data-oid="4fb2b4bed5">
        {/* Balance */}
        <section
          data-negative={negative}
          className="col-span-2 border-4 border-foreground bg-card text-foreground shadow-[6px_6px_0_0_var(--foreground)] data-[negative=true]:bg-primary data-[negative=true]:text-primary-foreground" data-oid="ebabdccfd1"
        >
          <div className="m-ds-xs border-2 border-foreground bg-primary px-ds-md py-ds-sm text-center text-primary-foreground" data-oid="2c06a0f263">
            <p className="font-caption text-caption uppercase" data-oid="2cc1294260">{PERIOD_UNIT[period]}</p>
            <h1 className="font-heading text-heading font-extrabold uppercase" data-oid="0922fd97e8">{negative ? "Over budget" : "My money"}</h1>
          </div>
          <div className="px-ds-md pb-ds-md pt-ds-sm text-center" data-oid="d2c4073244">
            <p className="font-display text-[56px] font-black leading-none tracking-[-0.03em]" data-oid="f600cf3475" data-oid-text-editable="false" data-oid-text-source="expression:854f1aec1488|expression:03dd8aed9a56">
              {negative ? "−" : ""}
              {money(Math.abs(balance))}
            </p>
            <p className="mt-ds-xs font-caption text-caption opacity-70" data-oid="c7464b19f9">Balance after spending and savings</p>
          </div>
        </section>

        {/* Spend */}
        <section className="col-span-2 border-4 border-foreground bg-card shadow-[4px_4px_0_0_var(--foreground)]" data-oid="2e535c3c1c">
          <div className="m-ds-xs flex items-center justify-between gap-ds-sm border-2 border-foreground bg-secondary px-ds-md py-ds-sm text-secondary-foreground" data-oid="c157fcaacb">
            <h2 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="9da68664ee">Spend</h2>
            <p className="font-caption text-caption uppercase" data-oid="ab027918e5">{PERIOD_UNIT[period]}</p>
          </div>
          <p className="px-ds-md pb-ds-sm pt-ds-xs text-center font-caption text-[32px] font-bold leading-tight" data-oid="d7850e6621">{money(summary.totalSpending * f)}</p>
        </section>

        {/* Earn */}
        <section className="border-4 border-foreground bg-card shadow-[4px_4px_0_0_var(--foreground)]" data-oid="e6a99c9875">
          <div className="m-ds-xs border-2 border-foreground bg-success px-ds-sm py-ds-xs text-center text-success-foreground" data-oid="5947a33ed8">
            <h2 className="font-label text-label font-extrabold uppercase" data-oid="cdc55153f7">Earn</h2>
          </div>
          <p className="px-ds-sm pb-ds-sm pt-ds-xs text-center font-caption text-[20px] font-bold leading-tight" data-oid="a71186188d">{money(summary.takeHome * f)}</p>
        </section>

        {/* Save */}
        <section className="border-4 border-foreground bg-card shadow-[4px_4px_0_0_var(--foreground)]" data-oid="420ae51d2a">
          <div className="m-ds-xs border-2 border-foreground bg-warning px-ds-sm py-ds-xs text-center text-warning-foreground" data-oid="f6609d5973">
            <h2 className="font-label text-label font-extrabold uppercase" data-oid="8f3c4804af">Save</h2>
          </div>
          <p className="px-ds-sm pb-ds-sm pt-ds-xs text-center font-caption text-[20px] font-bold leading-tight" data-oid="520946138e">{money(summary.totalSaving * f)}</p>
        </section>
      </div>
    </header>
  )
}
