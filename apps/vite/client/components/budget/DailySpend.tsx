import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Receipt } from "lucide-react"
import { cn } from "@vibe/ui"
import { categoryById, fmt, fmt2, type CategoryId } from "../../lib/budget"
import { categoryOf, type CategoryOverrides, type Txn } from "../../lib/transactions"

type View = "day" | "week" | "month"

const DAYS_FETCHED = 90
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const startOfWeek = (d: Date) => {
  const s = startOfDay(d)
  s.setDate(s.getDate() - s.getDay())
  return s
}
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)

/** Real spend for one date, its category breakdown, and the transactions themselves. */
function spendOn(txs: Txn[], date: Date, overrides: CategoryOverrides) {
  const key = iso(date)
  const rows = txs.filter((t) => t.date === key)
  const spends = rows
    .map((t) => ({ t, amt: Number(t.amount), cat: categoryOf(t, overrides) }))
    .filter((r) => r.amt > 0 && r.cat)
  const total = spends.reduce((s, r) => s + r.amt, 0)
  return { total, spends }
}

export function DailySpend({ txs, overrides }: { txs: Txn[]; overrides: CategoryOverrides }) {
  const [view, setView] = useState<View>("day")
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()))

  const today = startOfDay(new Date())
  const minDate = startOfDay(new Date(Date.now() - DAYS_FETCHED * 86400000))

  const step = (dir: 1 | -1) => {
    const d = new Date(anchor)
    if (view === "day") d.setDate(d.getDate() + dir)
    else if (view === "week") d.setDate(d.getDate() + dir * 7)
    else d.setMonth(d.getMonth() + dir)
    setAnchor(startOfDay(d))
  }

  const periodStart = view === "day" ? anchor : view === "week" ? startOfWeek(anchor) : startOfMonth(anchor)
  const canGoBack = periodStart > minDate
  const canGoForward = view === "day" ? anchor < today : view === "week" ? startOfWeek(today) > startOfWeek(anchor) : startOfMonth(today) > startOfMonth(anchor)

  const goToDay = (d: Date) => {
    setAnchor(startOfDay(d))
    setView("day")
  }

  const dayData = useMemo(() => spendOn(txs, anchor, overrides), [txs, anchor, overrides])

  const weekDays = useMemo(() => {
    const start = startOfWeek(anchor)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      return { date: d, ...spendOn(txs, d, overrides) }
    })
  }, [txs, anchor, overrides])
  const weekTotal = weekDays.reduce((s, d) => s + d.total, 0)
  const weekMax = Math.max(...weekDays.map((d) => d.total), 1)

  const monthCells = useMemo(() => {
    const first = startOfMonth(anchor)
    const gridStart = startOfWeek(first)
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart)
      d.setDate(d.getDate() + i)
      const { total } = spendOn(txs, d, overrides)
      return { date: d, total, inMonth: d.getMonth() === anchor.getMonth() }
    })
  }, [txs, anchor, overrides])
  const monthTotal = monthCells.filter((c) => c.inMonth).reduce((s, c) => s + c.total, 0)
  const monthMax = Math.max(...monthCells.map((c) => c.total), 1)

  const periodLabel =
    view === "day"
      ? anchor.getTime() === today.getTime()
        ? "Today"
        : anchor.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
      : view === "week"
        ? `${startOfWeek(anchor).toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${new Date(startOfWeek(anchor).getTime() + 6 * 86400000).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
        : anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" })

  if (txs === null) return null
  if (txs.length === 0) return null

  return (
    <section className="border-4 border-foreground bg-card shadow-[4px_4px_0_0_var(--foreground)]" data-oid="d1234a0001" data-oid-component-root="true" data-oid-callsite-deletable="true" data-oid-callsite-single="true">
      <div className="flex items-center justify-between gap-ds-sm border-b-4 border-foreground px-ds-md py-ds-sm" data-oid="d1234a0002">
        <h2 className="font-heading text-heading font-extrabold uppercase" data-oid="d1234a0003">Daily spend</h2>
        <div className="flex gap-1 rounded-sm border-2 border-foreground p-0.5" data-oid="d1234a0004">
          {(["day", "week", "month"] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className="rounded-sm px-2 py-1 font-label text-[11px] font-bold uppercase tracking-[0.04em] text-muted-foreground aria-pressed:bg-foreground aria-pressed:text-background"
              data-oid="d1234a0005"
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-ds-sm px-ds-md pt-ds-sm" data-oid="d1234a0006">
        <button type="button" aria-label="Previous" disabled={!canGoBack} onClick={() => step(-1)} className="flex size-10 items-center justify-center rounded-md text-foreground disabled:opacity-30" data-oid="d1234a0007">
          <ChevronLeft className="size-5" strokeWidth={2.5} data-oid="d1234a0008" />
        </button>
        <div className="text-center" data-oid="d1234a0009">
          <p className="font-label text-[14px] font-extrabold uppercase tracking-[0.04em]" data-oid="d1234a0010">{periodLabel}</p>
          {anchor.getTime() !== today.getTime() || view !== "day" ? (
            <button type="button" onClick={() => goToDay(today)} className="font-caption text-caption text-muted-foreground underline" data-oid="d1234a0011">
              Jump to today
            </button>
          ) : null}
        </div>
        <button type="button" aria-label="Next" disabled={!canGoForward} onClick={() => step(1)} className="flex size-10 items-center justify-center rounded-md text-foreground disabled:opacity-30" data-oid="d1234a0012">
          <ChevronRight className="size-5" strokeWidth={2.5} data-oid="d1234a0013" />
        </button>
      </div>

      {view === "day" ? (
        <div className="p-ds-md" data-oid="d1234a0014">
          <p className="font-display text-[34px] font-black leading-none" data-oid="d1234a0015">{fmt2(dayData.total)}</p>
          {dayData.spends.length === 0 ? (
            <p className="mt-ds-sm font-body text-[14px] text-muted-foreground" data-oid="d1234a0016">Nothing spent this day.</p>
          ) : (
            <ul className="mt-ds-sm divide-y-2 divide-foreground/10" data-oid="d1234a0017">
              {dayData.spends.map(({ t, amt, cat }) => (
                <li key={t.transaction_id} className="flex items-center gap-ds-sm py-ds-xs" data-oid="d1234a0018" data-oid-shared="true">
                  <span aria-hidden="true" className={cn("size-3 shrink-0 border-2 border-foreground", categoryById(cat as CategoryId).band)} data-oid="d1234a0019" data-oid-shared="true" data-oid-classname-dynamic="true" />
                  <p className="min-w-0 flex-1 truncate font-body text-[14px]" data-oid="d1234a0020" data-oid-shared="true">{t.merchant_name || t.name || "Unknown merchant"}</p>
                  <p className="shrink-0 font-caption text-[14px] font-bold" data-oid="d1234a0021" data-oid-shared="true">{fmt2(amt)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {view === "week" ? (
        <div className="p-ds-md" data-oid="d1234a0022">
          <p className="font-display text-[28px] font-black leading-none" data-oid="d1234a0023">{fmt2(weekTotal)}</p>
          <div className="mt-ds-md flex items-end justify-between gap-ds-xs" data-oid="d1234a0024">
            {weekDays.map((d, i) => (
              <button key={i} type="button" onClick={() => goToDay(d.date)} className="flex flex-1 flex-col items-center gap-ds-xs" data-oid="d1234a0025" data-oid-shared="true">
                <div className="flex h-20 w-full flex-col justify-end overflow-hidden rounded-sm border-2 border-foreground bg-background" data-oid="d1234a0026" data-oid-shared="true">
                  <div data-today={d.date.getTime() === today.getTime()} className="w-full bg-secondary data-[today=true]:bg-primary" style={{ height: `${Math.max(4, (d.total / weekMax) * 100)}%` }} data-oid="d1234a0027" data-oid-shared="true" data-oid-style-dynamic="height" />
                </div>
                <p className="font-caption text-[10px] uppercase text-muted-foreground" data-oid="d1234a0028" data-oid-shared="true">{d.date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2)}</p>
                <p className="font-caption text-[11px] font-bold" data-oid="d1234a0029" data-oid-shared="true">{d.total > 0 ? fmt(d.total) : "—"}</p>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {view === "month" ? (
        <div className="p-ds-md" data-oid="d1234a0030">
          <p className="font-display text-[28px] font-black leading-none" data-oid="d1234a0031">{fmt2(monthTotal)}</p>
          <div className="mt-ds-md grid grid-cols-7 gap-1" data-oid="d1234a0032">
            {["S", "M", "T", "W", "T", "F", "S"].map((w, i) => (
              <p key={i} className="text-center font-caption text-[10px] uppercase text-muted-foreground" data-oid="d1234a0033" data-oid-shared="true">{w}</p>
            ))}
            {monthCells.map((c, i) => {
              const intensity = c.total / monthMax
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => goToDay(c.date)}
                  data-in-month={c.inMonth}
                  data-today={c.date.getTime() === today.getTime()}
                  className="flex aspect-square flex-col items-center justify-center rounded-sm border-2 border-foreground/20 font-caption text-[11px] data-[in-month=false]:opacity-30 data-[today=true]:border-foreground"
                  style={{ backgroundColor: c.total > 0 ? `color-mix(in srgb, var(--primary) ${Math.round(15 + intensity * 70)}%, var(--card))` : undefined }}
                  data-oid="d1234a0034"
                  data-oid-shared="true"
                >
                  <span className="font-bold" data-oid="d1234a0035" data-oid-shared="true">{c.date.getDate()}</span>
                  {c.total > 0 ? <span className="text-[9px]" data-oid="d1234a0036" data-oid-shared="true">{fmt(c.total)}</span> : null}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      <p className="flex items-center gap-1.5 border-t-2 border-dashed border-foreground px-ds-md py-ds-sm font-caption text-caption text-muted-foreground" data-oid="d1234a0037">
        <Receipt className="size-3.5" strokeWidth={2.5} data-oid="d1234a0038" />
        Only covers the last {DAYS_FETCHED} days of bank history.
      </p>
    </section>
  )
}
