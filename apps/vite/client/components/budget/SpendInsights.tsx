import { useEffect, useMemo, useState } from "react"
import { Landmark, Minus, TrendingDown, TrendingUp } from "lucide-react"
import { cn } from "@vibe/ui"
import { CATEGORIES, fmt, type CategoryId, type Summary } from "../../lib/budget"
import { BANK_UPDATED_EVENT, categoryOf, monthKey, readTransactions, type Txn } from "../../lib/transactions"
import { CountUp } from "./CountUp"

interface Props {
  summary: Summary
  hasAccounts: boolean
  onOpenProfile: () => void
}

const zero = (): Record<CategoryId, number> => ({ fixed: 0, food: 0, lifestyle: 0, health: 0, buffer: 0 })

/** 6-month trend for one category; the last point is this month so far. */
function Sparkline({ values }: { values: number[] }) {
  const w = 64
  const h = 24
  const max = Math.max(...values, 1)
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 3 - (v / max) * (h - 6)] as const)
  const [lx, ly] = pts[pts.length - 1]
  return (
    <svg viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className="h-6 w-16 shrink-0 overflow-visible text-foreground" data-oid="03a4bb5057" data-oid-component-root="true" data-oid-callsite-deletable="true" data-oid-callsite-editable="true">
      <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r={3} fill="var(--primary)" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  )
}

export function SpendInsights({ summary, hasAccounts, onOpenProfile }: Props) {
  const [txs, setTxs] = useState<Txn[] | null>(null)

  useEffect(() => {
    const load = () => {
      const now = new Date()
      const since = new Date(now.getFullYear(), now.getMonth() - 5, 1)
      void readTransactions(`${monthKey(since)}-01`).then(setTxs)
    }
    load()
    window.addEventListener(BANK_UPDATED_EVENT, load)
    return () => window.removeEventListener(BANK_UPDATED_EVENT, load)
  }, [])

  const data = useMemo(() => {
    const now = new Date()
    const months: string[] = []
    for (let i = 5; i >= 0; i--) months.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)))
    const byMonth: Record<string, Record<CategoryId, number>> = Object.fromEntries(months.map((m) => [m, zero()]))
    const lastToDate = zero()
    const day = now.getDate()
    for (const t of txs ?? []) {
      const amt = Number(t.amount)
      if (!(amt > 0)) continue
      const cat = categoryOf(t)
      if (!cat) continue
      const key = t.date.slice(0, 7)
      if (byMonth[key]) byMonth[key][cat] += amt
      if (key === months[4] && Number(t.date.slice(8, 10)) <= day) lastToDate[cat] += amt
    }
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    return {
      months,
      byMonth,
      current: byMonth[months[5]],
      lastToDate,
      pace: day / daysInMonth,
      monthName: now.toLocaleString(undefined, { month: "long" }),
    }
  }, [txs])

  const totalActual = Object.values(data.current).reduce((a, b) => a + b, 0)
  const overList = CATEGORIES.filter((c) => data.current[c.id] - summary.byCategory[c.id] > 0.5)
  const overTotal = overList.reduce((s, c) => s + data.current[c.id] - summary.byCategory[c.id], 0)

  return (
    <section className="border-4 border-foreground bg-card shadow-[4px_4px_0_0_var(--foreground)]" data-oid="5f31cef6ff" data-oid-component-root="true" data-oid-callsite-deletable="true" data-oid-callsite-single="true" data-oid-text-editable="false" data-oid-text-source="element:div|expression:5bc97f8376da">
      <div className="flex items-center justify-between gap-ds-sm border-b-4 border-foreground bg-secondary px-ds-md py-ds-sm text-secondary-foreground" data-oid="2cdad0a43b">
        <h2 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="5009e846f3">Actual vs plan</h2>
        <p className="font-caption text-caption uppercase" data-oid="be0ce411c9">{data.monthName}</p>
      </div>

      {txs === null ? (
        <p className="px-ds-md py-ds-md font-caption text-caption uppercase text-muted-foreground" data-oid="afdc4e1f2f">Loading transactions…</p>
      ) : txs.length === 0 ? (
        <div className="space-y-ds-sm p-ds-md" data-oid="bdcc9ef55d">
          <p className="font-body text-[14px] leading-snug text-muted-foreground" data-oid="828fea264d">
            {hasAccounts
              ? "Your bank is still sending transactions. Open Profile → Bank accounts and tap Refresh in a minute."
              : "Link a bank to compare what you actually spend with your plan, category by category, and against last month."}
          </p>
          <button type="button" onClick={onOpenProfile} className="ds-button ds-button-secondary min-h-[52px] w-full border-2 border-foreground" data-oid="0f67c0f001" data-oid-text-editable="false">
            <Landmark className="size-5" strokeWidth={2.5} data-oid="a29ef733c3" />
            {hasAccounts ? "Open bank accounts" : "Connect bank"}
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-end justify-between gap-ds-sm px-ds-md pt-ds-md" data-oid="3197d4334e">
            <div data-oid="a5c389197e">
              <p className="font-caption text-caption uppercase text-muted-foreground" data-oid="4601ce2593">Spent so far</p>
              <p className="font-display text-[34px] font-black leading-none tracking-[-0.02em]" data-oid="5cb0e259ea">
                <CountUp value={totalActual} format={fmt} />
              </p>
            </div>
            <p className="text-right font-caption text-caption text-muted-foreground" data-oid="aa5e36bcdd" data-oid-text-editable="false" data-oid-text-source="text|expression:afccad8378f5|text">of {fmt(summary.totalSpending)} planned</p>
          </div>
          {overList.length > 0 ? (
            <p className="mx-ds-md mt-ds-sm border-2 border-foreground bg-primary px-ds-sm py-ds-xs font-label text-[13px] font-extrabold uppercase tracking-[0.04em] text-primary-foreground" data-oid="a406be0721" data-oid-text-editable="false" data-oid-text-source="expression:5c30d6c67c4e|text|expression:cc576d452eee|text">
              {overList.length} over budget · pay {fmt(overTotal)} extra
            </p>
          ) : null}

          <ul className="mt-ds-sm divide-y-2 divide-foreground/15" data-oid="2032848987">
            {CATEGORIES.map((c, index) => {
              const actual = data.current[c.id]
              const planned = summary.byCategory[c.id]
              const over = actual - planned
              const status = over > 0.5 ? "over" : planned > 0 && actual > planned * data.pace * 1.1 ? "ahead" : "ok"
              const delta = actual - data.lastToDate[c.id]
              const fill = planned > 0 ? Math.min(1, actual / planned) : actual > 0 ? 1 : 0
              return (
                <li key={c.id} data-index={index} data-status={status} className="space-y-ds-xs px-ds-md py-ds-sm" data-oid="312e71b39c" data-oid-shared="true" data-oid-instance-targetable="true">
                  <div className="flex items-center gap-ds-sm" data-oid="00d59ea241" data-oid-shared="true" data-oid-instance-targetable="true">
                    <span aria-hidden="true" className={cn("size-4 shrink-0 border-2 border-foreground", c.band)} data-oid="25d5fbb858" data-oid-shared="true" data-oid-instance-targetable="true" data-oid-classname-dynamic="true" />
                    <p className="min-w-0 flex-1 truncate font-label text-[14px] font-bold uppercase tracking-[0.04em]" data-oid="d465af4b4d" data-oid-shared="true" data-oid-instance-targetable="true">{c.name}</p>
                    <Sparkline values={data.months.map((m) => data.byMonth[m][c.id])} />
                    <p className="w-[92px] shrink-0 text-right font-caption text-[13px]" data-oid="8441d551ce" data-oid-shared="true" data-oid-instance-targetable="true">
                      <strong className="font-bold" data-oid="47f774ce4c" data-oid-shared="true" data-oid-instance-targetable="true">{fmt(actual)}</strong>
                      <span className="text-muted-foreground" data-oid="9e6de6778a" data-oid-shared="true" data-oid-instance-targetable="true" data-oid-text-editable="false" data-oid-text-source="text|expression:e546049aec9e"> / {fmt(planned)}</span>
                    </p>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-sm border-2 border-foreground bg-background" data-oid="d893b0647f" data-oid-shared="true" data-oid-instance-targetable="true">
                    <div data-status={status} className="h-full bg-success transition-[width] duration-500 data-[status=ahead]:bg-warning data-[status=over]:bg-primary" style={{ width: `${fill * 100}%` }} data-oid="0bcb17b763" data-oid-shared="true" data-oid-instance-targetable="true" data-oid-style-dynamic="width" />
                  </div>
                  <div className="flex items-center justify-between gap-ds-sm" data-oid="881d3e6100" data-oid-shared="true" data-oid-instance-targetable="true">
                    <p className="inline-flex items-center gap-1 font-caption text-caption text-muted-foreground" data-oid="9f3e673866" data-oid-shared="true" data-oid-instance-targetable="true" data-oid-text-editable="false" data-oid-text-source="expression:7aaea8fd1175|expression:1a58ff012ac3">
                      {Math.abs(delta) < 1 ? <Minus className="size-3.5" strokeWidth={3} data-oid="789bd409b4" data-oid-shared="true" /> : delta > 0 ? <TrendingUp className="size-3.5" strokeWidth={3} data-oid="b175835bba" data-oid-shared="true" /> : <TrendingDown className="size-3.5" strokeWidth={3} data-oid="78bfee6a01" data-oid-shared="true" />}
                      {Math.abs(delta) < 1 ? "Same as last month" : `${fmt(Math.abs(delta))} ${delta > 0 ? "more" : "less"} than last month`}
                    </p>
                    <span data-status={status} className="shrink-0 rounded-sm border-2 border-foreground bg-success px-1.5 font-caption text-[11px] uppercase text-success-foreground data-[status=ahead]:bg-warning data-[status=ahead]:text-warning-foreground data-[status=over]:bg-primary data-[status=over]:text-primary-foreground" data-oid="f90315d2e3" data-oid-shared="true" data-oid-instance-targetable="true">
                      {status === "over" ? `Over by ${fmt(over)}` : status === "ahead" ? "Spending fast" : `${fmt(Math.max(0, planned - actual))} left`}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
          <p className="border-t-2 border-dashed border-foreground px-ds-md py-ds-sm font-caption text-caption text-muted-foreground" data-oid="71507b297b">
            “Last month” compares the same days so far. Card payments and transfers aren't counted.
          </p>
        </>
      )}
    </section>
  )
}
