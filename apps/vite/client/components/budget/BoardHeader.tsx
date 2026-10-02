import { useEffect, useState } from "react"
import { Check, Pencil } from "lucide-react"
import { fmt, fmt2, type Summary } from "../../lib/budget"
import { NumberInput } from "./fields"

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
const BALANCE_KEY = "budget:balance"

function loadPeriod(): Period {
  try {
    const p = localStorage.getItem(PERIOD_KEY)
    if (p === "daily" || p === "weekly" || p === "monthly" || p === "yearly") return p
  } catch {
    /* ignore */
  }
  return "monthly"
}

function loadBalance(): number {
  try {
    const v = parseFloat(localStorage.getItem(BALANCE_KEY) ?? "")
    if (Number.isFinite(v)) return v
  } catch {
    /* ignore */
  }
  return 12500
}

export function BoardHeader({ summary }: { summary: Summary }) {
  const [period, setPeriod] = useState<Period>(loadPeriod)
  const [balance, setBalance] = useState<number>(loadBalance)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(PERIOD_KEY, period)
    } catch {
      /* ignore */
    }
  }, [period])

  useEffect(() => {
    try {
      localStorage.setItem(BALANCE_KEY, String(balance))
    } catch {
      /* ignore */
    }
  }, [balance])

  const f = PERIOD_FACTOR[period]
  const money = period === "daily" ? fmt2 : fmt
  const leftover = summary.leftover * f

  return (
    <header className="space-y-ds-md px-ds-md pb-ds-lg pt-ds-3xl" data-oid="48eb0b28ad" data-oid-component-root="true" data-oid-callsite-deletable="true" data-oid-callsite-single="true">
      {/* Total money */}
      <section className="border-4 border-foreground bg-card text-foreground" data-oid="5a8c1df47e">
        <div className="m-ds-xs border-2 border-foreground bg-primary px-ds-md py-ds-sm text-center text-primary-foreground" data-oid="06af9d7faf">
          <p className="font-caption text-caption uppercase" data-oid="98de086207">Total balance</p>
          <h1 className="font-heading text-heading font-extrabold uppercase" data-oid="b4738789e2">My money</h1>
        </div>
        <div className="px-ds-md pb-ds-md pt-ds-sm text-center" data-oid="cce8735145" data-oid-text-editable="false" data-oid-text-source="expression:539760e52a96|element:p">
          {editing ? (
            <div className="flex items-center gap-ds-sm" data-oid="91d12409ae">
              <NumberInput value={balance} onChange={setBalance} prefix="$" ariaLabel="Total money" className="flex-1" />
              <button type="button" onClick={() => setEditing(false)} aria-label="Save total" className="ds-button ds-button-primary min-h-[56px] border-2 border-foreground" data-oid="261e00a219">
                <Check className="size-5" strokeWidth={3} data-oid="ec16abb32e" />
                Done
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setEditing(true)} className="inline-flex min-h-[56px] items-center gap-ds-sm font-display text-[56px] font-black leading-none tracking-[-0.03em]" data-oid="f508977d75" data-oid-text-editable="false">
              {fmt(balance)}
              <Pencil className="size-5 text-muted-foreground" strokeWidth={2.5} data-oid="8029fd7385" />
            </button>
          )}
          <p className="mt-ds-xs font-caption text-caption text-muted-foreground" data-oid="ab8695b162">Everything you have across accounts · tap to update</p>
        </div>
      </section>

      {/* Period selector — board tiles, hotel marks the active one */}
      <div role="tablist" aria-label="Time period" className="grid grid-cols-4 gap-ds-sm pt-ds-xs" data-oid="88b925b448">
        <button type="button" role="tab" aria-selected={period === "daily"} onClick={() => setPeriod("daily")} className="group relative flex min-h-[60px] flex-col border-4 border-foreground bg-muted text-muted-foreground aria-selected:bg-card aria-selected:text-foreground" data-oid="27539fc936">
          <span aria-hidden="true" className="h-4 w-full border-b-2 border-foreground bg-[hsl(24.4_48.7%_36.7%)]" data-oid="0231cbcdd4" />
          <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 hidden h-4 w-7 -translate-x-1/2 -translate-y-1/2 rounded-t-md border-2 border-foreground bg-primary group-aria-selected:block" data-oid="5947a33ed8" />
          <span className="flex flex-1 items-center justify-center font-label text-label font-extrabold uppercase" data-oid="e3ab30f1c6">Day</span>
        </button>
        <button type="button" role="tab" aria-selected={period === "weekly"} onClick={() => setPeriod("weekly")} className="group relative flex min-h-[60px] flex-col border-4 border-foreground bg-muted text-muted-foreground aria-selected:bg-card aria-selected:text-foreground" data-oid="7dbfb22a29">
          <span aria-hidden="true" className="h-4 w-full border-b-2 border-foreground bg-[hsl(206.2_71.2%_74.1%)]" data-oid="878a9f6e6e" />
          <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 hidden h-4 w-7 -translate-x-1/2 -translate-y-1/2 rounded-t-md border-2 border-foreground bg-primary group-aria-selected:block" data-oid="b287cdc82c" />
          <span className="flex flex-1 items-center justify-center font-label text-label font-extrabold uppercase" data-oid="4762e6b750">Week</span>
        </button>
        <button type="button" role="tab" aria-selected={period === "monthly"} onClick={() => setPeriod("monthly")} className="group relative flex min-h-[60px] flex-col border-4 border-foreground bg-muted text-muted-foreground aria-selected:bg-card aria-selected:text-foreground" data-oid="b3194f17e8">
          <span aria-hidden="true" className="h-4 w-full border-b-2 border-foreground bg-[hsl(325.9_63.3%_52%)]" data-oid="d40e4f1b91" />
          <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 hidden h-4 w-7 -translate-x-1/2 -translate-y-1/2 rounded-t-md border-2 border-foreground bg-primary group-aria-selected:block" data-oid="1bc8a05291" />
          <span className="flex flex-1 items-center justify-center font-label text-label font-extrabold uppercase" data-oid="520946138e">Month</span>
        </button>
        <button type="button" role="tab" aria-selected={period === "yearly"} onClick={() => setPeriod("yearly")} className="group relative flex min-h-[60px] flex-col border-4 border-foreground bg-muted text-muted-foreground aria-selected:bg-card aria-selected:text-foreground" data-oid="264bba7b68">
          <span aria-hidden="true" className="h-4 w-full border-b-2 border-foreground bg-accent" data-oid="2e2a861c8b" />
          <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 hidden h-4 w-7 -translate-x-1/2 -translate-y-1/2 rounded-t-md border-2 border-foreground bg-primary group-aria-selected:block" data-oid="7c1cb436a9" />
          <span className="flex flex-1 items-center justify-center font-label text-label font-extrabold uppercase" data-oid="2f1fc387e9">Year</span>
        </button>
      </div>

      {/* Period bento */}
      <div className="grid grid-cols-2 gap-ds-sm" data-oid="1aaaaf5c77">
        <section className="col-span-2 border-4 border-foreground bg-card" data-oid="4102746e4f">
          <div className="m-ds-xs flex items-center justify-between gap-ds-sm border-2 border-foreground bg-secondary px-ds-md py-ds-sm text-secondary-foreground" data-oid="4d9763f108">
            <h2 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="828d570b79">Spend</h2>
            <p className="font-caption text-caption uppercase" data-oid="5234bc3fa4">{PERIOD_UNIT[period]}</p>
          </div>
          <p className="px-ds-md pb-ds-sm pt-ds-xs text-center font-caption text-[32px] font-bold leading-tight" data-oid="c76017d058">{money(summary.totalSpending * f)}</p>
        </section>

        <section className="border-4 border-foreground bg-card" data-oid="3d929704eb">
          <div className="m-ds-xs border-2 border-foreground bg-success px-ds-sm py-ds-xs text-center text-success-foreground" data-oid="ccbbbb0298">
            <h2 className="font-label text-label font-extrabold uppercase" data-oid="9e9f5a8e96">Earn</h2>
          </div>
          <p className="px-ds-sm pb-ds-sm pt-ds-xs text-center font-caption text-[20px] font-bold leading-tight" data-oid="7f3da1ddfa">{money(summary.takeHome * f)}</p>
        </section>

        <section className="border-4 border-foreground bg-card" data-oid="fbbcb3611a">
          <div className="m-ds-xs border-2 border-foreground bg-warning px-ds-sm py-ds-xs text-center text-warning-foreground" data-oid="57b26943bd">
            <h2 className="font-label text-label font-extrabold uppercase" data-oid="9f635d95e8">Save</h2>
          </div>
          <p className="px-ds-sm pb-ds-sm pt-ds-xs text-center font-caption text-[20px] font-bold leading-tight" data-oid="c1febfe4c4">{money(summary.totalSaving * f)}</p>
        </section>

        <section data-negative={leftover < 0} className="col-span-2 flex items-center justify-between gap-ds-sm border-4 border-foreground bg-card px-ds-md py-ds-sm data-[negative=true]:bg-primary data-[negative=true]:text-primary-foreground" data-oid="34544a1d96">
          <h2 className="font-label text-label font-extrabold uppercase" data-oid="b9c7513a70">{leftover < 0 ? "Over budget" : "Left over"}</h2>
          <p className="font-caption text-[20px] font-bold leading-tight" data-oid="01a20ee0aa" data-oid-text-editable="false" data-oid-text-source="expression:10fc05582f95|expression:ca0cc105110e">
            {leftover < 0 ? "−" : ""}
            {money(Math.abs(leftover))}
          </p>
        </section>
      </div>
    </header>
  )
}
