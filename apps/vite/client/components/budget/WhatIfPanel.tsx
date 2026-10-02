import { Check, RotateCcw } from "lucide-react"
import { cn } from "@vibe/ui"
import { CATEGORIES, fmt, isScenarioActive, type BudgetState, type Summary } from "../../lib/budget"
import type { BudgetActions } from "../../hooks/useBudget"

interface Props {
  state: BudgetState
  summary: Summary
  scenario: Summary
  actions: BudgetActions
}

export function WhatIfPanel({ state, summary, scenario, actions }: Props) {
  const w = state.whatIf
  const active = isScenarioActive(w)
  const delta = scenario.leftover - summary.leftover
  const hasCuts = Object.values(w.cuts).some((c) => c > 0)

  return (
    <div className="space-y-ds-lg" data-oid="8bd057d892" data-oid-component-root="true" data-oid-callsite-deletable="true" data-oid-callsite-single="true">
      {/* Scenario intro */}
      <section className="relative overflow-hidden border-4 border-foreground bg-accent p-ds-lg text-accent-foreground shadow-[6px_6px_0_0_var(--foreground)]" data-oid="6c5eb148b7">
        <span aria-hidden="true" className="pointer-events-none absolute -right-2 -top-6 font-display text-[160px] font-black leading-none text-card/40" data-oid="ae8768fefd">?</span>
        <p className="font-caption text-caption uppercase" data-oid="326ddb0f2b">Scenarios</p>
        <h2 className="relative font-display text-[40px] font-black uppercase leading-none tracking-[-0.02em]" data-oid="bc0755747f">What if?</h2>
        <p className="relative mt-ds-sm max-w-[80%] font-body text-body" data-oid="0dc524c29e">Drag the sliders to test a scenario. Nothing changes in your budget until you apply it.</p>
      </section>

      {/* Result */}
      <section className="grid grid-cols-2 border-4 border-foreground bg-card shadow-[4px_4px_0_0_var(--foreground)]" data-oid="5bdd1d18ab">
        <div className="border-r-2 border-foreground p-ds-md" data-oid="4480d573c6">
          <p className="font-caption text-caption uppercase text-muted-foreground" data-oid="b316fe80fc">Today</p>
          <p className="font-display text-[28px] font-black leading-tight" data-oid="627f295222">{fmt(summary.leftover)}</p>
          <p className="font-caption text-caption text-muted-foreground" data-oid="b8d45217f6">left over / mo</p>
        </div>
        <div data-active={active} className="p-ds-md data-[active=true]:bg-background" data-oid="6d8df826cb">
          <p className="font-caption text-caption uppercase text-muted-foreground" data-oid="5519898240">Scenario</p>
          <p className="font-display text-[28px] font-black leading-tight" data-oid="95709383d6">{fmt(scenario.leftover)}</p>
          <p className="font-caption text-caption text-muted-foreground" data-oid="4fde5b8497">left over / mo</p>
        </div>
        <div className="col-span-2 border-t-4 border-foreground px-ds-md py-ds-sm" data-oid="ac0c53bbe9">
          <p className="font-label text-label font-bold uppercase" data-oid="48ff18ca67" data-oid-text-editable="false" data-oid-text-source="expression:ab5ded895e8c|expression:8bf87c446153|text|expression:ab5ded895e8c|expression:f985908f40bd|text">
            {delta >= 0 ? "+" : "−"}
            {fmt(Math.abs(delta))} a month · {delta >= 0 ? "+" : "−"}
            {fmt(Math.abs(delta * 12))} a year
          </p>
        </div>
      </section>

      {/* Sliders */}
      <section className="border-4 border-foreground bg-card shadow-[4px_4px_0_0_var(--foreground)]" data-oid="bff971b7f8">
        <div className="border-b-4 border-foreground px-ds-md py-ds-sm" data-oid="461594b1d4">
          <h3 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="e0278ce7c7">Adjust the scenario</h3>
        </div>

        <div className="border-b-2 border-foreground/15 p-ds-md" data-oid="063fe066c8">
          <div className="flex items-baseline justify-between" data-oid="c0709ca495">
            <label htmlFor="income-change" className="font-label text-label font-bold uppercase" data-oid="3c690607ee">Take-home pay changes</label>
            <output className="font-caption text-[15px]" data-oid="697477da8f" data-oid-text-editable="false" data-oid-text-source="expression:214a91a477d3|expression:d4889723dd97|text">
              {w.incomeChange > 0 ? "+" : ""}
              {w.incomeChange}%
            </output>
          </div>
          <input id="income-change" type="range" min={-30} max={30} step={1} value={w.incomeChange} onChange={(e) => actions.setIncomeChange(Number(e.target.value))} className="mt-ds-sm h-8 w-full accent-foreground" data-oid="b5f90dc424" />
          <p className="font-caption text-caption text-muted-foreground" data-oid="cc129441c4" data-oid-text-editable="false" data-oid-text-source="expression:c73bb8f85842|text|expression:0b04ea8b74e8">{fmt(summary.takeHome)} → {fmt(scenario.takeHome)}</p>
        </div>

        <ul className="divide-y-2 divide-foreground/15" data-oid="8fe04b2dce">
          {CATEGORIES.map((cat, index) => {
            const cut = w.cuts[cat.id]
            const base = summary.byCategory[cat.id]
            return (
              <li key={cat.id} data-index={index} className="p-ds-md" data-oid="3c4a9a6dfd" data-oid-shared="true" data-oid-instance-targetable="true">
                <div className="flex items-center justify-between gap-ds-sm" data-oid="989ee8367c" data-oid-shared="true" data-oid-instance-targetable="true">
                  <div className="flex items-center gap-ds-sm" data-oid="715bd08c30" data-oid-shared="true" data-oid-instance-targetable="true">
                    <span aria-hidden="true" className={cn("size-4 border-2 border-foreground", cat.band)} data-oid="bbe2e468ed" data-oid-shared="true" data-oid-instance-targetable="true" data-oid-classname-dynamic="true" />
                    <label htmlFor={`cut-${cat.id}`} className="font-label text-label font-bold uppercase" data-oid="85d19e8f6d" data-oid-shared="true" data-oid-instance-targetable="true" data-oid-text-editable="false" data-oid-text-source="text|expression:7008571c544e">Cut {cat.name}</label>
                  </div>
                  <output className="font-caption text-[15px]" data-oid="f2e1b12d78" data-oid-shared="true" data-oid-instance-targetable="true" data-oid-text-editable="false" data-oid-text-source="expression:06e45e384318|text">{cut}%</output>
                </div>
                <input id={`cut-${cat.id}`} type="range" min={0} max={100} step={5} value={cut} onChange={(e) => actions.setCut(cat.id, Number(e.target.value))} className="mt-ds-sm h-8 w-full accent-foreground" data-oid="95c73741f2" data-oid-shared="true" data-oid-instance-targetable="true" />
                <p className="font-caption text-caption text-muted-foreground" data-oid="0cde5e6c01" data-oid-shared="true" data-oid-instance-targetable="true" data-oid-text-editable="false" data-oid-text-source="expression:da9784b25e08|text|expression:c1e2ecbcd8da|text|expression:f87667ba526d|text">
                  {fmt(base)} → {fmt(scenario.byCategory[cat.id])} · frees {fmt(base - scenario.byCategory[cat.id])}/mo
                </p>
              </li>
            )
          })}
        </ul>
      </section>

      <div className="grid grid-cols-2 gap-ds-md" data-oid="1becff2194">
        <button type="button" disabled={!active} onClick={actions.resetWhatIf} className="ds-button min-h-[48px] border-2 border-foreground bg-card" data-oid="434f3ff993">
          <RotateCcw className="size-4" strokeWidth={2.5} data-oid="114b527ac4" />
          Reset scenario
        </button>
        <button type="button" disabled={!hasCuts} onClick={actions.applyWhatIf} className="ds-button ds-button-primary min-h-[48px] border-2 border-foreground" data-oid="d93128e4e8">
          <Check className="size-4" strokeWidth={3} data-oid="18a2a59941" />
          Apply cuts
        </button>
      </div>
      <p className="font-caption text-caption text-muted-foreground" data-oid="d863186c45">Applying scales each item in the cut categories. Income changes stay hypothetical — update your salary on the Income tab.</p>
    </div>
  )
}
