import { CircleHelp, RotateCcw } from "lucide-react"
import { cn } from "@vibe/ui"
import {
  CATEGORIES,
  EMERGENCY_BAND,
  LEFTOVER_BAND,
  SAVINGS_BAND,
  fmt,
  pct,
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
  onReset: () => void
}

export function BoardOverview({ state, summary, scenario, onNavigate, onReset }: Props) {
  const negative = summary.leftover < 0
  const segments = [
    ...CATEGORIES.map((c) => ({ key: c.id, label: c.name, value: summary.byCategory[c.id], band: c.band })),
    { key: "savings", label: state.goals.savingsName || "Savings goal", value: summary.savings, band: SAVINGS_BAND },
    { key: "emergency", label: "Emergency fund", value: summary.emergency, band: EMERGENCY_BAND },
    { key: "leftover", label: "Left over", value: Math.max(0, summary.leftover), band: LEFTOVER_BAND },
  ]
  const base = Math.max(summary.takeHome, summary.totalSpending + summary.totalSaving, 1)
  const emergencyTarget = summary.totalSpending * state.goals.emergencyMonths

  return (
    <div className="space-y-ds-lg" data-oid="19e527facb" data-oid-component-root="true" data-oid-callsite-deletable="true" data-oid-callsite-single="true" data-oid-text-editable="false" data-oid-text-source="element:section|expression:78eabde89dfb|element:section|element:section|element:div">
      {/* Headline: money left over */}
      <section
        data-negative={negative}
        className="relative overflow-hidden border-4 border-foreground bg-card text-foreground shadow-[6px_6px_0_0_var(--foreground)] data-[negative=true]:bg-primary data-[negative=true]:text-primary-foreground" data-oid="89070701bd"
      >
        <div className="p-ds-lg" data-oid="8eb2897545" data-oid-text-editable="false" data-oid-text-source="expression:c38878ed5826|element:p|element:p">
          {negative ? (
            <p className="font-label text-label font-bold uppercase" data-oid="11e1768883">Over budget by</p>
          ) : (
            <p className="font-label text-label font-bold uppercase" data-oid="61140c198d">Left over this month</p>
          )}
          <p className="mt-ds-xs font-display text-[64px] font-black leading-none tracking-[-0.03em]" data-oid="1189e6a415">{fmt(Math.abs(summary.leftover))}</p>
          <p className="mt-ds-sm font-body text-body" data-oid="e7001dc511" data-oid-text-editable="false" data-oid-text-source="text|expression:c73bb8f85842|text">Left over after spending and savings, from {fmt(summary.takeHome)} take-home.</p>
        </div>
        <dl className="grid grid-cols-3 border-t-4 border-foreground" data-oid="3401cad661">
          <div className="border-r-2 border-foreground px-ds-sm py-ds-sm" data-oid="972720da8a">
            <dt className="font-caption text-caption uppercase opacity-70" data-oid="1022c2c985">Take-home</dt>
            <dd className="font-label text-[15px] font-extrabold" data-oid="ae42e0d56a">{fmt(summary.takeHome)}</dd>
          </div>
          <div className="border-r-2 border-foreground px-ds-sm py-ds-sm" data-oid="ceed3f8b56">
            <dt className="font-caption text-caption uppercase opacity-70" data-oid="6d1cee3e62">Spending</dt>
            <dd className="font-label text-[15px] font-extrabold" data-oid="176a0c06e7">{fmt(summary.totalSpending)}</dd>
          </div>
          <div className="px-ds-sm py-ds-sm" data-oid="927b93208a">
            <dt className="font-caption text-caption uppercase opacity-70" data-oid="62bd2e7e67">Saving</dt>
            <dd className="font-label text-[15px] font-extrabold" data-oid="a42046e89a">{fmt(summary.totalSaving)}</dd>
          </div>
        </dl>
      </section>

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
                <span className="font-caption text-caption text-muted-foreground" data-oid="f76c37cdbb" data-oid-shared="true" data-oid-instance-targetable="true">{pct(s.value / Math.max(summary.takeHome, 1))}</span>
                <span className="w-20 text-right font-label text-[15px] font-extrabold" data-oid="cd477ea201" data-oid-shared="true" data-oid-instance-targetable="true">{fmt(s.value)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Goals snapshot */}
      <section className="grid grid-cols-2 gap-ds-md" data-oid="20c4c1de07">
        <button type="button" onClick={() => onNavigate("goals")} className="border-4 border-foreground bg-card text-left shadow-[4px_4px_0_0_var(--foreground)]" data-oid="01d2e69362">
          <span aria-hidden="true" className="block h-5 border-b-4 border-foreground bg-primary" data-oid="9928c1d0fe" />
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
          Saved on this device · {new Date(state.updatedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
        </p>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Reset everything to the sample budget?")) onReset()
          }}
          className="ds-button min-h-[40px] border-2 border-foreground bg-card" data-oid="bf2366cb7b"
        >
          <RotateCcw className="size-4" strokeWidth={2.5} data-oid="bb14c62c64" />
          Reset
        </button>
      </div>
    </div>
  )
}
