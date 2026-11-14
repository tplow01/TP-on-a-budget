import { AnimatePresence } from "framer-motion"
import { useState } from "react"
import type { BudgetActions } from "../../hooks/useBudget"
import type { TrackerData } from "../../hooks/useTrackerData"
import { fmt, fmt2, type BudgetState } from "../../lib/budget"
import type { BankAccount } from "../../lib/plaid"
import { bucketOf, daySeries, monthDelta, signedBalance, totalOf, type Bucket, type ManualAccount } from "../../lib/networth"
import { actualByCategory, incomeTxns, monthKey, monthPace } from "../../lib/transactions"
import { CountUp } from "../budget/CountUp"
import { AccountDetail } from "./AccountDetail"
import { LineChart } from "./LineChart"

interface Props {
  data: TrackerData
  state: BudgetState
  actions: BudgetActions
  onOpenProfile: () => void
}

const manualType = (m: ManualAccount) => (m.type === "investment" ? "investment" : m.type === "credit" ? "credit" : "other")

const BUCKETS: Array<{ id: Bucket; label: string }> = [
  { id: "cash", label: "Cash" },
  { id: "investments", label: "Investments" },
  { id: "credit", label: "Credit" },
]

export function TotalTab({ data, onOpenProfile }: Props) {
  const { txs, overrides, accounts, manual, snapshots } = data
  const [open, setOpen] = useState<BankAccount | ManualAccount | null>(null)
  const now = new Date()
  const month = monthKey(now)

  const { total } = totalOf(accounts, manual)
  const manualTotal = totalOf([], manual).total
  const series = daySeries(snapshots, manualTotal)
  const delta = monthDelta(series)

  const list = txs ?? []
  const inTotal = incomeTxns(list, month).reduce((s, i) => s + i.amount, 0)
  const outTotal = Object.values(actualByCategory(list, month, overrides)).reduce((a, b) => a + b, 0)
  const net = inTotal - outTotal
  const projected = total + monthPace(list, overrides).projectedLeftover

  const empty = accounts.length === 0 && manual.length === 0

  const bankRows = (b: Bucket) => accounts.filter((a) => bucketOf(a.type) === b)
  const manualRows = (b: Bucket) => manual.filter((m) => bucketOf(manualType(m)) === b)

  return (
    <div className="space-y-ds-md">
      <section className="border-4 border-foreground bg-card shadow-[4px_4px_0_0_var(--foreground)]">
        <div className="flex items-center justify-between gap-ds-sm border-b-4 border-foreground bg-primary px-ds-md py-ds-sm text-primary-foreground">
          <h2 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]">My total</h2>
          <span className="font-caption text-caption">{now.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
        </div>
        <div className="space-y-ds-sm p-ds-md">
          <p className="font-display text-[56px] font-black leading-none">
            <CountUp value={total} format={fmt} />
          </p>
          {delta === null ? (
            <p className="font-caption text-caption text-muted-foreground">no history yet</p>
          ) : (
            <p data-negative={delta < 0} className="font-caption text-body data-[negative=true]:text-primary">
              {delta < 0 ? "▼ -" : "▲ +"}
              {fmt(Math.abs(delta))} this month
            </p>
          )}
          <LineChart points={series} />
        </div>
      </section>

      <section className="border-4 border-foreground bg-card shadow-[4px_4px_0_0_var(--foreground)]">
        <div className="grid grid-cols-2 gap-ds-sm p-ds-md">
          <div className="border-2 border-foreground bg-success p-ds-sm text-success-foreground">
            <p className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]">In</p>
            <p className="font-display text-[28px] font-black leading-tight">{fmt(inTotal)}</p>
          </div>
          <div className="border-2 border-foreground bg-secondary p-ds-sm text-secondary-foreground">
            <p className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]">Out</p>
            <p className="font-display text-[28px] font-black leading-tight">{fmt(outTotal)}</p>
          </div>
          <div className="col-span-2 flex items-center justify-between gap-ds-sm border-2 border-foreground bg-card p-ds-sm">
            <p className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]">Net</p>
            <p data-negative={net < 0} className="font-display text-[28px] font-black leading-tight data-[negative=true]:text-primary">{net < 0 ? "-" : "+"}{fmt(Math.abs(net))}</p>
          </div>
        </div>
      </section>

      {empty ? (
        <div className="space-y-ds-sm rounded-md border-2 border-dashed border-foreground p-ds-md">
          <p className="font-label text-label font-bold uppercase">Where it sits</p>
          <p className="font-caption text-caption text-muted-foreground">Nothing linked yet. Link a bank to see your balances here.</p>
          <button type="button" onClick={onOpenProfile} className="ds-button ds-button-primary min-h-[56px] w-full border-2 border-foreground">Link a bank</button>
        </div>
      ) : (
        <section className="border-4 border-foreground bg-card shadow-[4px_4px_0_0_var(--foreground)]">
          <div className="flex items-center justify-between gap-ds-sm border-b-4 border-foreground bg-secondary px-ds-md py-ds-sm text-secondary-foreground">
            <h3 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]">Where it sits</h3>
          </div>
          {BUCKETS.map((g) => {
            const banks = bankRows(g.id)
            const manuals = manualRows(g.id)
            if (banks.length + manuals.length === 0) return null
            const sum = totalOf(accounts, manual).byBucket[g.id]
            return (
              <div key={g.id} className="border-b-4 border-foreground last:border-b-0">
                <div className="flex items-center justify-between gap-ds-sm bg-muted px-ds-md py-ds-xs">
                  <h4 className="font-label text-[13px] font-extrabold uppercase tracking-[0.06em]">{g.label}</h4>
                  <span className="font-caption text-caption tabular-nums">{fmt(sum)}</span>
                </div>
                <ul className="divide-y-2 divide-foreground/15">
                  {banks.map((a, index) => (
                    <li key={a.account_id} data-index={index}>
                      <button type="button" onClick={() => setOpen(a)} className="flex min-h-[56px] w-full items-center justify-between gap-ds-sm px-ds-md py-ds-sm text-left active:bg-muted">
                        <div className="min-w-0">
                          <p className="truncate font-body text-body">{a.name}</p>
                          <p className="truncate font-caption text-caption text-muted-foreground">{[a.institution, a.subtype].filter(Boolean).join(" · ")}{a.mask ? ` ···${a.mask}` : ""}</p>
                        </div>
                        <span className="shrink-0 font-caption text-body tabular-nums">{fmt2(signedBalance(a.type, a.current, a.available))}</span>
                      </button>
                    </li>
                  ))}
                  {manuals.map((m, index) => (
                    <li key={m.id} data-index={index}>
                      <button type="button" onClick={() => setOpen(m)} className="flex min-h-[56px] w-full items-center justify-between gap-ds-sm px-ds-md py-ds-sm text-left active:bg-muted">
                        <div className="flex min-w-0 items-center gap-ds-sm">
                          <p className="truncate font-body text-body">{m.name}</p>
                          <span className="shrink-0 border-2 border-foreground bg-warning px-ds-xs font-label text-[11px] font-extrabold uppercase text-warning-foreground">manual</span>
                        </div>
                        <span className="shrink-0 font-caption text-body tabular-nums">{fmt2(signedBalance(manualType(m), m.balance, null))}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </section>
      )}

      <section className="border-4 border-foreground bg-card shadow-[4px_4px_0_0_var(--foreground)]">
        <div className="flex items-center justify-between gap-ds-sm border-b-4 border-foreground bg-[hsl(199_60%_45%)] px-ds-md py-ds-sm text-primary-foreground">
          <h3 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]">At this rate</h3>
        </div>
        <div className="space-y-ds-xs p-ds-md">
          <p className="font-label text-[13px] font-extrabold uppercase tracking-[0.06em]">Projected month-end total</p>
          <p className="font-display text-[36px] font-black leading-none">{fmt(projected)}</p>
          <p className="font-caption text-caption text-muted-foreground">Extrapolates this month's income and spending so far. Early in the month this is noisy.</p>
        </div>
      </section>

      <AnimatePresence>
        {open ? <AccountDetail key={"account_id" in open ? open.account_id : open.id} account={open} txs={list} snapshots={snapshots} onClose={() => setOpen(null)} /> : null}
      </AnimatePresence>
    </div>
  )
}
