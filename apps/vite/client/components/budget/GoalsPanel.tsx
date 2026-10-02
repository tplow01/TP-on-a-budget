import { ShieldCheck, Target } from "lucide-react"
import { EMERGENCY_BAND, SAVINGS_BAND, etaLabel, fmt, monthsTo, pct, type BudgetState, type Summary } from "../../lib/budget"
import type { BudgetActions } from "../../hooks/useBudget"
import { NumberInput, ProgressBar } from "./fields"

interface Props {
  state: BudgetState
  summary: Summary
  actions: BudgetActions
}

export function GoalsPanel({ state, summary, actions }: Props) {
  const g = state.goals
  const savingsProgress = g.savingsTarget > 0 ? g.savingsSaved / g.savingsTarget : 0
  const savingsEta = etaLabel(monthsTo(g.savingsTarget - g.savingsSaved, g.savingsMonthly))
  const emergencyTarget = summary.totalSpending * g.emergencyMonths
  const emergencyProgress = emergencyTarget > 0 ? g.emergencySaved / emergencyTarget : 0
  const emergencyEta = etaLabel(monthsTo(emergencyTarget - g.emergencySaved, g.emergencyMonthly))

  return (
    <div className="space-y-ds-lg" data-oid="4ee23bd0e6" data-oid-component-root="true" data-oid-callsite-deletable="true" data-oid-callsite-single="true">
      <section className="border-b-4 border-foreground pb-ds-sm" data-oid="1bdde0bf6b">
        <h2 className="font-heading text-heading font-extrabold uppercase" data-oid="9eb2f474a0">Saving on purpose</h2>
        <p className="font-body text-[14px] leading-snug text-muted-foreground" data-oid="09eb88cb83" data-oid-text-editable="false" data-oid-text-source="expression:d6a26362f657|text|expression:37e744d27859|text">
          {fmt(summary.totalSaving)}/mo set aside — {pct(summary.savingsRate)} of take-home. Paid first, before the leftover.
        </p>
      </section>

      {/* Savings goal */}
      <section className="border-4 border-foreground bg-card shadow-[6px_6px_0_0_var(--foreground)]" data-oid="e3f9a755a3">
        <div className="flex items-center gap-ds-sm border-b-4 border-foreground bg-primary px-ds-md py-ds-sm text-primary-foreground" data-oid="8cb01feb43">
          <Target className="size-5" strokeWidth={2.5} data-oid="02a1910857" />
          <h3 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="3c2ef310de">Savings goal</h3>
        </div>
        <div className="space-y-ds-md p-ds-md" data-oid="a53141faa8">
          <label className="ds-field" data-oid="b5315dca85">
            <span className="ds-field-label uppercase" data-oid="07d01540b0">Saving for</span>
            <input
              type="text"
              value={g.savingsName}
              onChange={(e) => actions.updateGoals({ savingsName: e.target.value })}
              className="min-h-[44px] rounded-md border-2 border-foreground bg-card px-ds-sm font-label text-[15px] font-bold uppercase outline-none focus:ring-2 focus:ring-ring" data-oid="af990eebf0"
            />
          </label>
          <div className="grid grid-cols-2 gap-ds-md" data-oid="13107c9956">
            <label className="ds-field" data-oid="c1ea0e3976">
              <span className="ds-field-label uppercase" data-oid="31f5c1b5be">Target</span>
              <NumberInput value={g.savingsTarget} onChange={(v) => actions.updateGoals({ savingsTarget: v })} prefix="$" />
            </label>
            <label className="ds-field" data-oid="66e6a09027">
              <span className="ds-field-label uppercase" data-oid="a1a2edf9ea">Saved so far</span>
              <NumberInput value={g.savingsSaved} onChange={(v) => actions.updateGoals({ savingsSaved: v })} prefix="$" />
            </label>
            <label className="ds-field col-span-2" data-oid="6e0551cf8c">
              <span className="ds-field-label uppercase" data-oid="7c2f47c4c0">Monthly contribution</span>
              <NumberInput value={g.savingsMonthly} onChange={(v) => actions.updateGoals({ savingsMonthly: v })} prefix="$" suffix="/mo" />
            </label>
          </div>
          <ProgressBar value={savingsProgress} band={SAVINGS_BAND} />
          <div className="flex justify-between" data-oid="c49eceba21">
            <p className="font-label text-label font-bold uppercase" data-oid="e081d83b96" data-oid-text-editable="false" data-oid-text-source="expression:13a1453ad9ff|text">{pct(Math.min(1, savingsProgress))} there</p>
            <p className="font-caption text-caption text-muted-foreground" data-oid="8c5c4b08d2">{savingsEta}</p>
          </div>
        </div>
      </section>

      {/* Emergency fund */}
      <section className="border-4 border-foreground bg-card shadow-[6px_6px_0_0_var(--foreground)]" data-oid="bfdaadb4a8">
        <div className="flex items-center gap-ds-sm border-b-4 border-foreground bg-[hsl(206.2_71.2%_74.1%)] px-ds-md py-ds-sm text-foreground" data-oid="c90390d424">
          <ShieldCheck className="size-5" strokeWidth={2.5} data-oid="23329f0d31" />
          <div data-oid="2001c74558">
            <p className="font-caption text-[10px] uppercase" data-oid="1e6d9e6886">Safety net</p>
            <h3 className="font-label text-[15px] font-extrabold uppercase leading-none tracking-[0.06em]" data-oid="d944915750">Emergency fund</h3>
          </div>
        </div>
        <div className="space-y-ds-md p-ds-md" data-oid="9faea2b6ab">
          <div data-oid="8c29de4897">
            <p className="ds-field-label uppercase" data-oid="9f517faf50">Months of spending to cover</p>
            <div className="mt-ds-xs grid grid-cols-4 gap-ds-sm" data-oid="813f0b73be">
              <button type="button" aria-pressed={g.emergencyMonths === 3} onClick={() => actions.updateGoals({ emergencyMonths: 3 })} className="min-h-[44px] rounded-md border-2 border-foreground bg-card font-label text-[15px] font-extrabold aria-pressed:bg-foreground aria-pressed:text-card" data-oid="6ba426562c">
                3
              </button>
              <button type="button" aria-pressed={g.emergencyMonths === 6} onClick={() => actions.updateGoals({ emergencyMonths: 6 })} className="min-h-[44px] rounded-md border-2 border-foreground bg-card font-label text-[15px] font-extrabold aria-pressed:bg-foreground aria-pressed:text-card" data-oid="5eae323a7e">
                6
              </button>
              <button type="button" aria-pressed={g.emergencyMonths === 9} onClick={() => actions.updateGoals({ emergencyMonths: 9 })} className="min-h-[44px] rounded-md border-2 border-foreground bg-card font-label text-[15px] font-extrabold aria-pressed:bg-foreground aria-pressed:text-card" data-oid="342738c92b">
                9
              </button>
              <button type="button" aria-pressed={g.emergencyMonths === 12} onClick={() => actions.updateGoals({ emergencyMonths: 12 })} className="min-h-[44px] rounded-md border-2 border-foreground bg-card font-label text-[15px] font-extrabold aria-pressed:bg-foreground aria-pressed:text-card" data-oid="373fd991b7">
                12
              </button>
            </div>
          </div>
          <div className="flex items-baseline justify-between rounded-md border-2 border-dashed border-foreground px-ds-md py-ds-sm" data-oid="62d77fbc4e">
            <p className="font-label text-label font-bold uppercase" data-oid="a6cd7647ae">Target</p>
            <p className="font-display text-[28px] font-black" data-oid="f112c7150d">{fmt(emergencyTarget)}</p>
          </div>
          <div className="grid grid-cols-2 gap-ds-md" data-oid="770d33e7ba">
            <label className="ds-field" data-oid="fd865b7765">
              <span className="ds-field-label uppercase" data-oid="cd26c00234">Saved so far</span>
              <NumberInput value={g.emergencySaved} onChange={(v) => actions.updateGoals({ emergencySaved: v })} prefix="$" />
            </label>
            <label className="ds-field" data-oid="4d9e89769e">
              <span className="ds-field-label uppercase" data-oid="0b12fb153c">Monthly</span>
              <NumberInput value={g.emergencyMonthly} onChange={(v) => actions.updateGoals({ emergencyMonthly: v })} prefix="$" suffix="/mo" />
            </label>
          </div>
          <ProgressBar value={emergencyProgress} band={EMERGENCY_BAND} />
          <div className="flex justify-between" data-oid="1baeeba18f">
            <p className="font-label text-label font-bold uppercase" data-oid="06ab1c6f91" data-oid-text-editable="false" data-oid-text-source="expression:4d5efa5460c2|text">{pct(Math.min(1, emergencyProgress))} covered</p>
            <p className="font-caption text-caption text-muted-foreground" data-oid="f6cae8c48e">{emergencyEta}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
