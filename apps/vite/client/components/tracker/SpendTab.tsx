import { useState } from "react"
import type { BudgetActions } from "../../hooks/useBudget"
import type { TrackerData } from "../../hooks/useTrackerData"
import { categoryById, fmt, fmt2, type BudgetState, type CategoryId } from "../../lib/budget"
import { merchantKey, sameDaysCompare, spendByCategory, spendByMerchant } from "../../lib/insights"
import { detectRecurring } from "../../lib/recurring"
import { BANK_UPDATED_EVENT, categoryOf, monthKey, monthPace, setCategoryOverride, type Txn } from "../../lib/transactions"
import { DailySpend } from "../budget/DailySpend"
import { ProgressBar } from "../budget/fields"
import { LensTiles } from "./LensTiles"
import { TxnRow } from "./TxnRow"

interface Props {
  data: TrackerData
  state: BudgetState
  actions: BudgetActions
  onOpenProfile: () => void
}

type Lens = "category" | "merchant" | "recurring"

const LENSES: Array<{ id: Lens; label: string; band: string }> = [
  { id: "category", label: "Category", band: "bg-secondary" },
  { id: "merchant", label: "Merchant", band: "bg-accent" },
  { id: "recurring", label: "Recurring", band: "bg-success" },
]

const shortDate = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })

const EMPTY = <p className="px-ds-md py-ds-md font-body text-[14px] text-muted-foreground">Nothing here yet this month.</p>

export function SpendTab({ data }: Props) {
  const { txs, overrides, accounts } = data
  const [lens, setLens] = useState<Lens>("category")
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [openMerchant, setOpenMerchant] = useState<string | null>(null)

  if (txs === null) {
    return (
      <div className="rounded-md border-2 border-dashed border-foreground p-ds-md">
        <p className="font-body text-[14px] text-muted-foreground">Loading transactions…</p>
      </div>
    )
  }

  const now = new Date()
  const month = monthKey(now)
  const monthName = now.toLocaleDateString(undefined, { month: "long" })
  const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate()
  const compare = sameDaysCompare(txs, now, (t) => (categoryOf(t, overrides) && Number(t.amount) > 0 ? Number(t.amount) : 0))
  const projected = monthPace(txs, overrides).projectedSpend
  const accountById = new Map(accounts.map((a) => [a.account_id, a]))

  const byCategory = spendByCategory(txs, month, overrides)
  const byMerchant = spendByMerchant(txs, month, overrides)
  const monthTotal = byCategory.reduce((s, c) => s + c.total, 0)
  const { recurring, oneOff } = detectRecurring(txs, overrides)
  const oneOffMonth = oneOff.filter((t) => t.date.slice(0, 7) === month)

  const recategorise = (id: string, c: CategoryId) => {
    void setCategoryOverride(id, c).then(() => window.dispatchEvent(new Event(BANK_UPDATED_EVENT))).catch(() => {})
  }
  const rowsFor = (key: string, category: CategoryId | null): Txn[] =>
    txs.filter((t) => t.date.slice(0, 7) === month && Number(t.amount) > 0 && merchantKey(t) === key && (category === null ? categoryOf(t, overrides) !== null : categoryOf(t, overrides) === category))

  return (
    <div className="space-y-ds-md">
      <section className="border-4 border-foreground bg-card shadow-[4px_4px_0_0_var(--foreground)]">
        <div className="flex items-center justify-between gap-ds-sm border-b-4 border-foreground bg-secondary px-ds-md py-ds-sm text-secondary-foreground">
          <h2 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]">Spent · {monthName}</h2>
          <span className="font-caption text-caption">{daysLeft} days left</span>
        </div>
        <div className="space-y-ds-sm p-ds-md">
          <p className="font-display text-[44px] font-black leading-none">{fmt(compare.thisMonth)}</p>
          {Math.abs(compare.delta) < 1 ? (
            <p className="font-caption text-caption font-bold">Same as last month</p>
          ) : compare.delta > 0 ? (
            <p className="font-caption text-caption font-bold text-primary">{fmt(Math.abs(compare.delta))} more than this time last month</p>
          ) : (
            <p className="font-caption text-caption font-bold text-success">{fmt(Math.abs(compare.delta))} less than this time last month</p>
          )}
          <p className="font-caption text-caption text-muted-foreground">On pace for {fmt(projected)} this month</p>
        </div>
      </section>

      <DailySpend txs={txs} overrides={overrides} />

      <section className="space-y-ds-md border-4 border-foreground bg-card p-ds-md shadow-[4px_4px_0_0_var(--foreground)]">
        <LensTiles options={LENSES} value={lens} onChange={setLens} />

        {lens === "category" ? (
          byCategory.length === 0 ? (
            EMPTY
          ) : (
            <ul className="divide-y-2 divide-foreground/10">
              {byCategory.map((c, i) => {
                const meta = categoryById(c.category)
                const open = openKey === c.category
                return (
                  <li key={c.category}>
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => {
                        setOpenKey(open ? null : c.category)
                        setOpenMerchant(null)
                      }}
                      className="flex w-full items-center gap-ds-sm px-ds-xs py-ds-sm text-left"
                    >
                      <span aria-hidden="true" className={`size-4 shrink-0 border-2 border-foreground ${meta.band}`} />
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="font-label text-[14px] font-bold uppercase tracking-[0.04em]">{meta.name}</p>
                        <ProgressBar value={monthTotal > 0 ? c.total / monthTotal : 0} band={meta.band} />
                      </div>
                      <p className="shrink-0 font-caption text-[15px] font-bold">{fmt(c.total)}</p>
                    </button>
                    {open ? (
                      <ul className="border-l-4 border-foreground/20 pl-ds-sm">
                        {c.merchants.map((m, j) => {
                          const mk = `${c.category}:${m.key}`
                          const mOpen = openMerchant === mk
                          return (
                            <li key={mk}>
                              <button
                                type="button"
                                aria-expanded={mOpen}
                                onClick={() => setOpenMerchant(mOpen ? null : mk)}
                                className="flex w-full items-center justify-between gap-ds-sm px-ds-xs py-ds-xs text-left"
                              >
                                <span className="min-w-0 truncate font-body text-[14px]">{m.key}</span>
                                <span className="shrink-0 font-caption text-[14px] font-bold">{fmt2(m.total)}</span>
                              </button>
                              {mOpen ? (
                                <ul className="divide-y-2 divide-foreground/10">
                                  {rowsFor(m.key, c.category).map((t, k) => (
                                    <TxnRow key={t.transaction_id} t={t} account={accountById.get(t.account_id)} category={categoryOf(t, overrides)} onRecategorise={recategorise} />
                                  ))}
                                </ul>
                              ) : null}
                            </li>
                          )
                        })}
                      </ul>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )
        ) : null}

        {lens === "merchant" ? (
          byMerchant.length === 0 ? (
            EMPTY
          ) : (
            <ul className="divide-y-2 divide-foreground/10">
              {byMerchant.map((m, i) => {
                const open = openKey === m.key
                return (
                  <li key={m.key}>
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenKey(open ? null : m.key)}
                      className="flex w-full items-center justify-between gap-ds-sm px-ds-xs py-ds-sm text-left"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-label text-[14px] font-bold uppercase tracking-[0.04em]">{m.key}</p>
                        <p className="font-caption text-caption text-muted-foreground">
                          {m.count}× · last {shortDate(m.last)}
                        </p>
                      </div>
                      <p className="shrink-0 font-caption text-[15px] font-bold">{fmt(m.total)}</p>
                    </button>
                    {open ? (
                      <ul className="divide-y-2 divide-foreground/10">
                        {rowsFor(m.key, null).map((t, k) => (
                          <TxnRow key={t.transaction_id} t={t} account={accountById.get(t.account_id)} category={categoryOf(t, overrides)} onRecategorise={recategorise} />
                        ))}
                      </ul>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )
        ) : null}

        {lens === "recurring" ? (
          recurring.length === 0 && oneOffMonth.length === 0 ? (
            EMPTY
          ) : (
            <div className="space-y-ds-md">
              {recurring.length > 0 ? (
                <div>
                  <p className="font-caption text-caption uppercase text-muted-foreground">Recurring</p>
                  <ul className="divide-y-2 divide-foreground/10">
                    {recurring.map((g, i) => (
                      <li key={g.key} className="flex items-center justify-between gap-ds-sm px-ds-xs py-ds-sm">
                        <div className="min-w-0">
                          <p className="truncate font-label text-[14px] font-bold uppercase tracking-[0.04em]">{g.key}</p>
                          <p className="font-caption text-caption text-muted-foreground">next {shortDate(g.nextExpected)}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-ds-xs">
                          <span className="rounded-sm border-2 border-foreground bg-background px-1.5 font-caption text-[11px] uppercase">{g.cadence}</span>
                          <span className="font-caption text-[15px] font-bold">{fmt2(g.avgAmount)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {oneOffMonth.length > 0 ? (
                <div>
                  <p className="font-caption text-caption uppercase text-muted-foreground">One-off</p>
                  <ul className="divide-y-2 divide-foreground/10">
                    {oneOffMonth.map((t, i) => (
                      <TxnRow key={t.transaction_id} t={t} account={accountById.get(t.account_id)} category={categoryOf(t, overrides)} onRecategorise={recategorise} />
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )
        ) : null}
      </section>
    </div>
  )
}
