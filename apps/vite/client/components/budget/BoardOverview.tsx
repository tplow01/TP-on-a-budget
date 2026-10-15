import { useEffect, useMemo, useState } from "react"
import { CalendarClock, CircleHelp, Landmark } from "lucide-react"
import { cn } from "@vibe/ui"
import { readSavedAccounts, type BankAccount } from "../../lib/plaid"
import { BANK_UPDATED_EVENT, findPayment } from "../../lib/transactions"
import { useTransactions } from "../../hooks/useTransactions"
import { PayCycleCard } from "./PayCycleCard"
import { SpendInsights } from "./SpendInsights"
import {
  CATEGORIES,
  EMERGENCY_BAND,
  LEFTOVER_BAND,
  SAVINGS_BAND,
  categoryById,
  daysUntil,
  dueLabel,
  fmt,
  fmt2,
  pct,
  upcomingDueDate,
  type BudgetState,
  type Summary,
} from "../../lib/budget"
import { ProgressBar } from "./fields"
import type { TabId } from "./TabBar"

interface Props {
  state: BudgetState
  summary: Summary
  scenario: Summary | null
  onNavigate: (t: TabId) => void
  onOpenProfile: () => void
}

export function BoardOverview({ state, summary, scenario, onNavigate, onOpenProfile }: Props) {
  const segments = [
    ...CATEGORIES.map((c) => ({ key: c.id, label: c.name, value: summary.byCategory[c.id], band: c.band })),
    { key: "savings", label: state.goals.savingsName || "Savings goal", value: summary.savings, band: SAVINGS_BAND },
    { key: "emergency", label: "Emergency fund", value: summary.emergency, band: EMERGENCY_BAND },
    { key: "leftover", label: "Left over", value: Math.max(0, summary.leftover), band: LEFTOVER_BAND },
  ]
  const base = Math.max(summary.takeHome, summary.totalSpending + summary.totalSaving, 1)
  const emergencyTarget = summary.totalSpending * state.goals.emergencyMonths

  const [accounts, setAccounts] = useState<BankAccount[]>([])
  useEffect(() => {
    const load = () => void readSavedAccounts().then(setAccounts)
    load()
    window.addEventListener(BANK_UPDATED_EVENT, load)
    return () => window.removeEventListener(BANK_UPDATED_EVENT, load)
  }, [])

  const txs = useTransactions(45)
  const dueSoon = useMemo(() => {
    const today = new Date()
    return state.items
      .filter((i) => i.enabled)
      .map((i) => {
        const next = upcomingDueDate(i, today)
        return next ? { item: i, next, days: daysUntil(next, today), paid: findPayment(i, next, txs ?? []) } : null
      })
      .filter((x): x is NonNullable<typeof x> => x !== null && x.days <= 14)
      .sort((a, b) => Number(Boolean(a.paid)) - Number(Boolean(b.paid)) || a.days - b.days)
  }, [state.items, txs])
  const dueTotal = dueSoon.reduce((s, d) => s + (d.paid ? 0 : d.item.amount), 0)
  const lastSynced = accounts.reduce((m, a) => (a.updated_at > m ? a.updated_at : m), "")

  return (
    <div className="space-y-ds-lg" data-oid="19e527facb" data-oid-component-root="true" data-oid-callsite-deletable="true" data-oid-callsite-single="true" data-oid-text-editable="false">
      {scenario ? (
        <button
          type="button"
          onClick={() => onNavigate("whatif")}
          className="flex w-full items-center gap-ds-sm border-4 border-foreground bg-accent p-ds-md text-left text-accent-foreground shadow-[4px_4px_0_0_var(--foreground)]" data-oid="e79f580d5b"
        >
          <CircleHelp className="size-8 shrink-0" strokeWidth={2.5} data-oid="79366ebbfe" />
          <span className="font-body text-body" data-oid="89e4a3d22e">
            Scenario active: you'd have <strong className="font-label font-extrabold" data-oid="80665a0766">{fmt(scenario.leftover)}</strong> left over instead.
          </span>
        </button>
      ) : null}

      {/* Where the money goes */}
      <section className="border-4 border-foreground bg-card shadow-[4px_4px_0_0_var(--foreground)]" data-oid="69a667d17b">
        <div className="border-b-4 border-foreground px-ds-md py-ds-sm" data-oid="baa30e9435">
          <h2 className="font-heading text-heading font-extrabold uppercase" data-oid="ce285da30a">Where it goes</h2>
          <p className="font-caption text-caption text-muted-foreground" data-oid="d422d92347">Every bill normalised to a monthly figure</p>
        </div>
        <div className="p-ds-md" data-oid="4d31ab5d98">
          <div className="flex h-8 w-full overflow-hidden border-2 border-foreground bg-background" data-oid="13c2f8de1f">
            {segments
              .filter((s) => s.value > 0)
              .map((s, index) => (
                <div key={s.key} title={s.label} className={cn("h-full border-r-2 border-foreground last:border-r-0", s.band)} style={{ width: `${(s.value / base) * 100}%` }} data-index={index} data-oid="a12253996e" data-oid-shared="true" data-oid-instance-targetable="true" data-oid-style-dynamic="width" data-oid-classname-dynamic="true" />
              ))}
          </div>
          <ul className="mt-ds-md divide-y-2 divide-foreground/10" data-oid="340f6a6735">
            {segments.map((s, index) => (
              <li key={s.key} data-index={index} className="flex items-center gap-ds-sm py-ds-sm" data-oid="668cb0ce5e" data-oid-shared="true" data-oid-instance-targetable="true">
                <span aria-hidden="true" className={cn("size-4 shrink-0 border-2 border-foreground", s.band)} data-oid="9a8d7a12de" data-oid-shared="true" data-oid-instance-targetable="true" data-oid-classname-dynamic="true" />
                <span className="flex-1 truncate font-body text-body" data-oid="b4022ead60" data-oid-shared="true" data-oid-instance-targetable="true">{s.label}</span>
                <span className="font-caption text-caption text-muted-foreground" data-oid="f76c37cdbb" data-oid-shared="true" data-oid-instance-targetable="true">{summary.takeHome > 0 ? pct(s.value / summary.takeHome) : "—"}</span>
                <span className="w-20 text-right font-label text-[15px] font-extrabold" data-oid="cd477ea201" data-oid-shared="true" data-oid-instance-targetable="true">{fmt(s.value)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Due soon */}
      <section className="border-4 border-foreground bg-card shadow-[4px_4px_0_0_var(--foreground)]" data-oid="6c8326eb6f" data-oid-text-editable="false" data-oid-text-source="element:div|expression:e4c8c423a4dd">
        <div className="flex items-center justify-between gap-ds-sm border-b-4 border-foreground bg-accent px-ds-md py-ds-sm text-accent-foreground" data-oid="acb59d6ba7">
          <div className="flex items-center gap-ds-sm" data-oid="72fad6a4cf">
            <CalendarClock className="size-5" strokeWidth={2.5} data-oid="5d73ce58c7" />
            <h2 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="8b961f834f">Due soon</h2>
          </div>
          <p className="font-caption text-[15px] font-bold" data-oid="336e4178aa">{fmt2(dueTotal)}</p>
        </div>
        {dueSoon.length === 0 ? (
          <button type="button" onClick={() => onNavigate("spend")} className="block w-full px-ds-md py-ds-md text-left font-body text-[14px] leading-snug text-muted-foreground" data-oid="ab977d8dba">
            Nothing due in the next 14 days. Add due dates to your bills on the Spend tab.
          </button>
        ) : (
          <ul className="divide-y-2 divide-foreground/15" data-oid="9928c1d0fe">
            {dueSoon.map((d, index) => (
              <li key={d.item.id} data-index={index} data-urgent={d.days <= 2} data-paid={Boolean(d.paid)} className="group/due flex min-h-[56px] items-center gap-ds-sm px-ds-md py-ds-sm data-[paid=true]:bg-background" data-oid="77182f3d5d" data-oid-shared="true" data-oid-instance-targetable="true">
                <span aria-hidden="true" className={cn("size-4 shrink-0 border-2 border-foreground", categoryById(d.item.category).band)} data-oid="cd76ab44e8" data-oid-shared="true" data-oid-instance-targetable="true" data-oid-classname-dynamic="true" />
                <div className="min-w-0 flex-1" data-oid="934f11aef7" data-oid-shared="true" data-oid-instance-targetable="true">
                  <p className="truncate font-label text-[14px] font-bold uppercase tracking-[0.04em] group-data-[paid=true]/due:text-muted-foreground group-data-[paid=true]/due:line-through" data-oid-shared="true" data-oid-instance-targetable="true" data-oid="286e203420">{d.item.name || "Unnamed cost"}</p>
                  <p className="font-caption text-caption text-muted-foreground" data-oid="6fa01dcd92" data-oid-shared="true" data-oid-instance-targetable="true">
                    {d.next.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                  </p>
                </div>
                <span data-urgent={d.days <= 2 && !d.paid} data-paid={Boolean(d.paid)} className="shrink-0 rounded-sm border-2 border-foreground bg-background px-1.5 font-caption text-[11px] uppercase data-[urgent=true]:bg-primary data-[urgent=true]:text-primary-foreground data-[paid=true]:bg-success data-[paid=true]:text-success-foreground" data-oid="7d5b6223a6" data-oid-shared="true" data-oid-instance-targetable="true">{d.paid ? "Paid ✓" : dueLabel(d.days)}</span>
                <span className="w-20 shrink-0 text-right font-caption text-[15px] font-bold" data-oid="156a59b48a" data-oid-shared="true" data-oid-instance-targetable="true">{fmt2(d.item.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <PayCycleCard state={state} summary={summary} txs={txs ?? []} onNavigate={onNavigate} />

      <SpendInsights summary={summary} hasAccounts={accounts.length > 0} onOpenProfile={onOpenProfile} />

      {/* Per-account balances */}
      {accounts.length > 0 ? (
        <section className="border-4 border-foreground bg-card shadow-[4px_4px_0_0_var(--foreground)]" data-oid="7dcd6f6cd6" data-oid-text-editable="false" data-oid-text-source="element:div|expression:7aded290beaf|element:ul">
          <div className="flex items-center gap-ds-sm border-b-4 border-foreground bg-success px-ds-md py-ds-sm text-success-foreground" data-oid="a34aa59772">
            <Landmark className="size-5" strokeWidth={2.5} data-oid="0668e55fa3" />
            <h2 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="bf79e27b38">Accounts</h2>
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-sm border-2 border-foreground bg-card px-1.5 font-caption text-[11px] uppercase text-foreground" data-oid="134390bd10">
              <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-success" data-oid="369566a3ef" />
              Live
            </span>
          </div>
          {lastSynced ? (
            <p className="border-b-2 border-foreground px-ds-md py-ds-xs font-caption text-caption text-muted-foreground" data-oid="33f0debd34" data-oid-text-editable="false" data-oid-text-source="text|expression:d0e0103843bf">
              Updates when your bank posts a payment · last synced {new Date(lastSynced).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </p>
          ) : null}
          <ul className="divide-y-2 divide-foreground/15" data-oid="413968c242">
            {accounts.map((a, index) => (
              <li key={a.account_id} data-index={index} className="flex min-h-[56px] items-center justify-between gap-ds-sm px-ds-md py-ds-sm" data-oid="5f62009759" data-oid-shared="true" data-oid-instance-targetable="true">
                <div className="min-w-0" data-oid="2469f6a57c" data-oid-shared="true" data-oid-instance-targetable="true">
                  <p className="truncate font-body text-[15px]" data-oid="8606060f28" data-oid-shared="true" data-oid-instance-targetable="true">{a.name}</p>
                  <p className="font-caption text-caption text-muted-foreground" data-oid="00ed9bf3ab" data-oid-shared="true" data-oid-instance-targetable="true" data-oid-text-editable="false" data-oid-text-source="expression:11c9ac0ee4ee|text|expression:488191a1de0b|expression:2de59a963564">
                    {a.institution ?? "Bank"} · {a.subtype ?? a.type}
                    {a.mask ? ` ···${a.mask}` : ""}
                  </p>
                </div>
                <p data-credit={a.type === "credit" || a.type === "loan"} className="shrink-0 font-caption text-[15px] font-bold data-[credit=true]:text-primary" data-oid="223b777ae8" data-oid-shared="true" data-oid-instance-targetable="true">
                  {a.current == null ? "—" : fmt2(a.type === "credit" || a.type === "loan" ? -a.current : a.current)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Goals snapshot */}
      <section className="grid grid-cols-2 gap-ds-md" data-oid="20c4c1de07">
        <button type="button" onClick={() => onNavigate("goals")} className="border-4 border-foreground bg-card text-left shadow-[4px_4px_0_0_var(--foreground)]" data-oid="01d2e69362">
          <span aria-hidden="true" className="block h-5 border-b-4 border-foreground bg-primary" data-oid="510006d552" />
          <span className="block p-ds-sm" data-oid="1df9e6a520">
            <span className="block truncate font-label text-label font-bold uppercase" data-oid="dbb1bc281f">{state.goals.savingsName || "Savings"}</span>
            <span className="mt-ds-xs block font-caption text-caption text-muted-foreground" data-oid="ab6fec42d6" data-oid-text-editable="false" data-oid-text-source="expression:3e6f0ff613f9|text|expression:239f3cae0b38">{fmt(state.goals.savingsSaved)} of {fmt(state.goals.savingsTarget)}</span>
            <span className="mt-ds-sm block" data-oid="e2684d3daf">
              <ProgressBar value={state.goals.savingsTarget > 0 ? state.goals.savingsSaved / state.goals.savingsTarget : 0} band={SAVINGS_BAND} />
            </span>
          </span>
        </button>
        <button type="button" onClick={() => onNavigate("goals")} className="border-4 border-foreground bg-card text-left shadow-[4px_4px_0_0_var(--foreground)]" data-oid="97ccec47b7">
          <span aria-hidden="true" className="block h-5 border-b-4 border-foreground bg-[hsl(206.2_71.2%_74.1%)]" data-oid="890f2d2959" />
          <span className="block p-ds-sm" data-oid="9069b54f22">
            <span className="block font-label text-label font-bold uppercase" data-oid="e945317641">Emergency</span>
            <span className="mt-ds-xs block font-caption text-caption text-muted-foreground" data-oid="da5e2fe095" data-oid-text-editable="false" data-oid-text-source="expression:7e9d8a656632|text|expression:de85d5a1e34b">{fmt(state.goals.emergencySaved)} of {fmt(emergencyTarget)}</span>
            <span className="mt-ds-sm block" data-oid="8b7793e837">
              <ProgressBar value={emergencyTarget > 0 ? state.goals.emergencySaved / emergencyTarget : 0} band={EMERGENCY_BAND} />
            </span>
          </span>
        </button>
      </section>

      <div className="flex items-center justify-between gap-ds-sm border-t-2 border-dashed border-foreground pt-ds-md" data-oid="51056a4244">
        <p className="font-caption text-caption text-muted-foreground" data-oid="af29f0ebb7" data-oid-text-editable="false" data-oid-text-source="text|expression:36beac470406">
          Last updated · {new Date(state.updatedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
        </p>
      </div>
    </div>
  )
}
