import { useMemo } from "react"
import { CalendarDays } from "lucide-react"
import { cn } from "@vibe/ui"
import { categoryById, fmt, fmt2, payCycles, type BudgetState, type Summary } from "../../lib/budget"
import type { TabId } from "./TabBar"
import { findPayment, type Txn } from "../../lib/transactions"

interface Props {
  state: BudgetState
  summary: Summary
  onNavigate: (t: TabId) => void
  /** Recent bank transactions, used to tick off bills that are already paid. */
  txs: Txn[]
}

const day = (d: Date) => d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })

/** Bills grouped by payday: what's due before each paycheck, and whether it's covered. */
export function PayCycleCard({ state, summary, txs, onNavigate }: Props) {
  const { cycles, undated } = useMemo(
    () => payCycles(state, summary.takeHome, 3, new Date(), (item, date) => Boolean(findPayment(item, date, txs))),
    [state, summary.takeHome, txs],
  )

  return (
    <section className="border-4 border-foreground bg-card shadow-[4px_4px_0_0_var(--foreground)]" data-oid="63cfcb25e1" data-oid-component-root="true" data-oid-callsite-deletable="true" data-oid-callsite-single="true" data-oid-text-editable="false" data-oid-text-source="element:div|expression:2966042820f8|expression:c98e58ef4873">
      <div className="flex items-center gap-ds-sm border-b-4 border-foreground bg-primary px-ds-md py-ds-sm text-primary-foreground" data-oid="99981dbca8">
        <CalendarDays className="size-5" strokeWidth={2.5} data-oid="f7cb9880df" />
        <h2 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="5537157470">Pay cycles</h2>
      </div>

      {cycles.length === 0 ? (
        <div className="space-y-ds-sm p-ds-md" data-oid="9a1a3f56d7">
          <p className="font-body text-[14px] leading-snug text-muted-foreground" data-oid="ba9d69ad20">Set your payday to see which bills each paycheck has to cover.</p>
          <button type="button" onClick={() => onNavigate("income")} className="ds-button ds-button-primary min-h-[52px] w-full border-2 border-foreground" data-oid="0e164df397">
            Set payday
          </button>
        </div>
      ) : (
        <ol data-oid="f9d2fad0fa">
          {cycles.map((c, index) => (
            <li key={c.start.toISOString()} data-index={index} className="border-t-4 border-foreground first:border-t-0" data-oid="271fbc6b23" data-oid-shared="true" data-oid-instance-targetable="true" data-oid-text-editable="false" data-oid-text-source="element:div|expression:90623995e864|element:div">
              <div className="flex items-center gap-ds-sm bg-background px-ds-md py-ds-sm" data-oid="98b019ed09" data-oid-shared="true" data-oid-instance-targetable="true">
                <span
                  data-now={c.isNow}
                  className="flex size-11 shrink-0 items-center justify-center border-2 border-foreground bg-primary font-heading text-[14px] font-black uppercase text-primary-foreground data-[now=true]:bg-card data-[now=true]:text-foreground" data-oid="e73c069dc1" data-oid-shared="true" data-oid-instance-targetable="true"
                >
                  {c.isNow ? "Now" : "GO"}
                </span>
                <div className="min-w-0 flex-1" data-oid="f1bfdd3738" data-oid-shared="true" data-oid-instance-targetable="true">
                  <p className="truncate font-label text-[14px] font-extrabold uppercase tracking-[0.04em]" data-oid="7078fa2cb1" data-oid-shared="true" data-oid-instance-targetable="true">{c.isNow ? "Before next payday" : `Payday · ${day(c.start)}`}</p>
                  <p className="font-caption text-caption text-muted-foreground" data-oid="9801eb1a2b" data-oid-shared="true" data-oid-instance-targetable="true">
                    {c.isNow ? `From My money · until ${day(c.end)}` : `Collect ${fmt(c.funds)} · until ${day(c.end)}`}
                  </p>
                </div>
              </div>

              {c.bills.length === 0 ? (
                <p className="px-ds-md py-ds-sm font-caption text-caption text-muted-foreground" data-oid="5f1bdeb87c" data-oid-shared="true">No dated bills in this cycle.</p>
              ) : (
                <ul className="divide-y-2 divide-foreground/10" data-oid="2e84e730be" data-oid-shared="true" data-oid-text-editable="false" data-oid-text-source="expression:1b6e1d13cd31|expression:0c0a622388a7">
                  {c.bills.slice(0, 5).map((b, i) => (
                    <li key={`${b.item.id}-${b.date.getTime()}`} data-index={i} data-paid={b.paid} className="group/bill flex min-h-[44px] items-center gap-ds-sm px-ds-md data-[paid=true]:bg-background" data-oid="ed38305907" data-oid-shared="true" data-oid-text-editable="false" data-oid-text-source="element:span|element:p|expression:eb2ecffe1193|element:p|element:p">
                      <span aria-hidden="true" className={cn("size-3 shrink-0 border-2 border-foreground", categoryById(b.item.category).band)} data-oid="46c8231e0d" data-oid-shared="true" data-oid-classname-dynamic="true" />
                      <p className="min-w-0 flex-1 truncate font-body text-[14px] group-data-[paid=true]/bill:text-muted-foreground group-data-[paid=true]/bill:line-through" data-oid="f92897dbdc" data-oid-shared="true">{b.item.name || "Unnamed cost"}</p>
                      {b.paid ? <span className="shrink-0 rounded-sm border-2 border-foreground bg-success px-1 font-caption text-[10px] uppercase text-success-foreground" data-oid="be6747759f" data-oid-shared="true">Paid</span> : null}
                      <p className="shrink-0 font-caption text-caption text-muted-foreground" data-oid="61f1a4b9bb" data-oid-shared="true">{b.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>
                      <p className="w-20 shrink-0 text-right font-caption text-[14px] font-bold" data-oid="4c7dd26a24" data-oid-shared="true">{fmt2(b.item.amount)}</p>
                    </li>
                  ))}
                  {c.bills.length > 5 ? <li className="px-ds-md py-ds-xs font-caption text-caption text-muted-foreground" data-oid="2aa11af2f7" data-oid-shared="true" data-oid-text-editable="false" data-oid-text-source="text|expression:0e2f06ed7e5d|text">+{c.bills.length - 5} more</li> : null}
                </ul>
              )}

              <div className="flex items-center justify-between gap-ds-sm border-t-2 border-dashed border-foreground px-ds-md py-ds-sm" data-oid="b1d979a1a5" data-oid-shared="true" data-oid-instance-targetable="true">
                <p className="font-caption text-caption uppercase text-muted-foreground" data-oid="6e8ede59cc" data-oid-shared="true" data-oid-instance-targetable="true" data-oid-text-editable="false" data-oid-text-source="text|expression:a21dc9a6e9dd">Bills {fmt2(c.billsTotal)}</p>
                <p
                  data-short={c.remaining < 0}
                  className="rounded-sm border-2 border-foreground bg-success px-ds-sm font-label text-[12px] font-extrabold uppercase tracking-[0.04em] text-success-foreground data-[short=true]:bg-primary data-[short=true]:text-primary-foreground" data-oid="e1f886e83f" data-oid-shared="true" data-oid-instance-targetable="true"
                >
                  {c.remaining < 0 ? `Short by ${fmt(-c.remaining)}` : `Covered · ${fmt(c.remaining)} spare`}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}

      {cycles.length > 0 && undated > 0 ? (
        <button type="button" onClick={() => onNavigate("spend")} className="block w-full border-t-2 border-foreground px-ds-md py-ds-sm text-left font-caption text-caption text-muted-foreground underline" data-oid="716652963f" data-oid-text-editable="false" data-oid-text-source="expression:dadb4a6e6eff|expression:65220908aa45|text">
          {undated} {undated === 1 ? "bill has" : "bills have"} no due date and aren't shown. Add dates on Spend.
        </button>
      ) : null}
    </section>
  )
}
