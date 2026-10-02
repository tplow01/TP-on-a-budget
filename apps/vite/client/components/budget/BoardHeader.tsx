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
  daily: "a day",
  weekly: "a week",
  monthly: "a month",
  yearly: "a year",
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
      <div role="tablist" aria-label="Time period" className="grid grid-cols-4 border-4 border-foreground bg-card" data-oid="001f17167c">
        <button type="button" role="tab" aria-selected={period === "daily"} onClick={() => setPeriod("daily")} className="min-h-[52px] border-r-2 border-foreground font-label text-label font-bold uppercase text-muted-foreground aria-selected:bg-foreground aria-selected:text-background" data-oid="a44ff17031">
          Day
        </button>
        <button type="button" role="tab" aria-selected={period === "weekly"} onClick={() => setPeriod("weekly")} className="min-h-[52px] border-r-2 border-foreground font-label text-label font-bold uppercase text-muted-foreground aria-selected:bg-foreground aria-selected:text-background" data-oid="97426db537">
          Week
        </button>
        <button type="button" role="tab" aria-selected={period === "monthly"} onClick={() => setPeriod("monthly")} className="min-h-[52px] border-r-2 border-foreground font-label text-label font-bold uppercase text-muted-foreground aria-selected:bg-foreground aria-selected:text-background" data-oid="206a6bbdac">
          Month
        </button>
        <button type="button" role="tab" aria-selected={period === "yearly"} onClick={() => setPeriod("yearly")} className="min-h-[52px] font-label text-label font-bold uppercase text-muted-foreground aria-selected:bg-foreground aria-selected:text-background" data-oid="ccf48b9f3a">
          Year
        </button>
      </div>

      <section
        data-negative={negative}
        className="mt-ds-md border-4 border-foreground bg-card text-foreground shadow-[6px_6px_0_0_var(--foreground)] data-[negative=true]:bg-primary data-[negative=true]:text-primary-foreground" data-oid="856cfb322d"
      >
        <div className="p-ds-lg" data-oid="3de8051488">
          <h1 className="font-label text-label font-bold uppercase" data-oid="38655250a9">{negative ? "My money · over budget" : "My money"}</h1>
          <p className="mt-ds-xs font-display text-[56px] font-black leading-none tracking-[-0.03em]" data-oid="9d60b6656e" data-oid-text-editable="false" data-oid-text-source="expression:854f1aec1488|expression:03dd8aed9a56">
            {negative ? "−" : ""}
            {money(Math.abs(balance))}
          </p>
          <p className="mt-ds-sm font-body text-body" data-oid="98de086207" data-oid-text-editable="false" data-oid-text-source="text|expression:6e08cc8009dd|text">Balance left {PERIOD_UNIT[period]} after spending and savings.</p>
        </div>

        <div className="flex items-center justify-between gap-ds-sm border-t-4 border-foreground bg-background px-ds-lg py-ds-md text-foreground" data-oid="cce8735145">
          <p className="font-label text-label font-bold uppercase" data-oid="00cfd8b46b" data-oid-text-editable="false" data-oid-text-source="text|expression:6e08cc8009dd">Spend {PERIOD_UNIT[period]}</p>
          <p className="font-caption text-[24px] font-bold leading-none" data-oid="6a208a89ca">{money(summary.totalSpending * f)}</p>
        </div>

        <dl className="grid grid-cols-2 border-t-4 border-foreground" data-oid="c59cbf6b9a">
          <div className="border-r-2 border-foreground px-ds-lg py-ds-sm" data-oid="d7cf5b0b69">
            <dt className="font-caption text-caption uppercase opacity-70" data-oid="f5397830f1">Earn</dt>
            <dd className="font-label text-[17px] font-extrabold" data-oid="c7464b19f9">{money(summary.takeHome * f)}</dd>
          </div>
          <div className="px-ds-lg py-ds-sm" data-oid="4077468799">
            <dt className="font-caption text-caption uppercase opacity-70" data-oid="64dd573b3a">Save</dt>
            <dd className="font-label text-[17px] font-extrabold" data-oid="dcf0a34011">{money(summary.totalSaving * f)}</dd>
          </div>
        </dl>
      </section>
    </header>
  )
}
