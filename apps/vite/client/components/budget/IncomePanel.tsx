import { Info } from "lucide-react"
import { fmt, pct, type BudgetState, type Summary } from "../../lib/budget"
import type { BudgetActions } from "../../hooks/useBudget"
import { NumberInput, Toggle } from "./fields"

interface Props {
  state: BudgetState
  summary: Summary
  actions: BudgetActions
}

export function IncomePanel({ state, summary, actions }: Props) {
  const inc = state.income
  const b = summary.income
  const diff = inc.overrideMonthly - b.estimatedNetMonthly

  return (
    <div className="space-y-ds-lg" data-oid="9b050a48a2" data-oid-component-root="true" data-oid-callsite-deletable="true" data-oid-callsite-single="true">
      {/* Salary */}
      <section className="border-4 border-foreground bg-card shadow-[6px_6px_0_0_var(--foreground)]" data-oid="2b3bf4c3f2">
        <div className="m-ds-sm border-2 border-foreground bg-[hsl(24.4_48.7%_36.7%)] px-ds-md py-ds-sm text-center text-primary-foreground" data-oid="e1e98239ab">
          <p className="font-caption text-caption uppercase" data-oid="d207126a2e">Income</p>
          <h2 className="font-heading text-heading font-extrabold uppercase" data-oid="7a43581af7">Your salary</h2>
        </div>

        <div className="grid grid-cols-2 gap-ds-md p-ds-md" data-oid="883af3d16f">
          <label className="ds-field col-span-2" data-oid="49e701b9b1">
            <span className="ds-field-label uppercase" data-oid="a25e3845ea">Gross annual salary</span>
            <NumberInput value={inc.grossAnnual} onChange={(v) => actions.updateIncome({ grossAnnual: v })} prefix="$" suffix="/yr" />
          </label>
          <label className="ds-field" data-oid="b1df405c90">
            <span className="ds-field-label uppercase" data-oid="dae9b1f940">401(k)</span>
            <NumberInput value={inc.retirementPct} onChange={(v) => actions.updateIncome({ retirementPct: v })} suffix="%" />
          </label>
          <label className="ds-field" data-oid="0d9b5830c3">
            <span className="ds-field-label uppercase" data-oid="47f8a8c591">State tax</span>
            <NumberInput value={inc.stateTaxPct} onChange={(v) => actions.updateIncome({ stateTaxPct: v })} suffix="%" />
          </label>
          <label className="ds-field" data-oid="daba385ae7">
            <span className="ds-field-label uppercase" data-oid="a9bdeb142e">Pre-tax deductions</span>
            <NumberInput value={inc.preTaxDeductionsMonthly} onChange={(v) => actions.updateIncome({ preTaxDeductionsMonthly: v })} prefix="$" suffix="/mo" />
          </label>
          <label className="ds-field" data-oid="23cc2a30de">
            <span className="ds-field-label uppercase" data-oid="ad4c6399f1">Post-tax deductions</span>
            <NumberInput value={inc.postTaxDeductionsMonthly} onChange={(v) => actions.updateIncome({ postTaxDeductionsMonthly: v })} prefix="$" suffix="/mo" />
          </label>
        </div>

        {/* Take-home breakdown */}
        <dl className="mx-ds-md mb-ds-md border-t-2 border-foreground pt-ds-sm" data-oid="a7e8fdbbff">
          <div className="flex justify-between py-1" data-oid="eff2fd67e4">
            <dt className="font-body text-body" data-oid="8e23edcd4f">Gross monthly</dt>
            <dd className="font-caption text-[15px]" data-oid="7eb7aabb98">{fmt(b.grossMonthly)}</dd>
          </div>
          <div className="flex justify-between py-1" data-oid="e6af8040e6">
            <dt className="font-body text-body" data-oid="c2fe962c34">401(k) contribution</dt>
            <dd className="font-caption text-[15px]" data-oid="ffff2646db" data-oid-text-editable="false" data-oid-text-source="text|expression:e898672b9d84">−{fmt(b.retirementMonthly)}</dd>
          </div>
          <div className="flex justify-between py-1" data-oid="32a9a84ca1">
            <dt className="font-body text-body" data-oid="4bea1f3d73">Pre-tax deductions</dt>
            <dd className="font-caption text-[15px]" data-oid="96da6e7d6d" data-oid-text-editable="false" data-oid-text-source="text|expression:afb38fcbf627">−{fmt(b.preTaxMonthly)}</dd>
          </div>
          <div className="flex justify-between py-1" data-oid="9a3ba5892f">
            <dt className="font-body text-body" data-oid="74d4ca18a8">Federal income tax</dt>
            <dd className="font-caption text-[15px]" data-oid="0bb5019f87" data-oid-text-editable="false" data-oid-text-source="text|expression:fc51572b6a0f">−{fmt(b.federalMonthly)}</dd>
          </div>
          <div className="flex justify-between py-1" data-oid="5a1824bffc">
            <dt className="font-body text-body" data-oid="c0c97cbaba">Social Security & Medicare</dt>
            <dd className="font-caption text-[15px]" data-oid="667882973e" data-oid-text-editable="false" data-oid-text-source="text|expression:d705ca5c76f2">−{fmt(b.ficaMonthly)}</dd>
          </div>
          <div className="flex justify-between py-1" data-oid="93baff396c">
            <dt className="font-body text-body" data-oid="cfdcf3f0a5">State & local tax</dt>
            <dd className="font-caption text-[15px]" data-oid="f9662a744c" data-oid-text-editable="false" data-oid-text-source="text|expression:c4a3713dc099">−{fmt(b.stateMonthly)}</dd>
          </div>
          <div className="flex justify-between py-1" data-oid="460fd4f3e0">
            <dt className="font-body text-body" data-oid="4be5957059">Post-tax deductions</dt>
            <dd className="font-caption text-[15px]" data-oid="06aa59aa9d" data-oid-text-editable="false" data-oid-text-source="text|expression:1add281b2004">−{fmt(b.postTaxMonthly)}</dd>
          </div>
          <div className="mt-ds-sm flex items-baseline justify-between border-t-4 border-double border-foreground pt-ds-sm" data-oid="76bdfd5744">
            <dt className="font-label text-label font-bold uppercase" data-oid="7c8d95833b">Estimated take-home</dt>
            <dd className="font-display text-[28px] font-black" data-oid="37b2686ea6">{fmt(b.estimatedNetMonthly)}</dd>
          </div>
          <p className="mt-ds-xs text-right font-caption text-caption text-muted-foreground" data-oid="db5c0edf1e" data-oid-text-editable="false" data-oid-text-source="text|expression:e208882eba8a">Effective tax rate {pct(b.effectiveTaxRate)}</p>
        </dl>
      </section>

      {/* Payslip override */}
      <section className="border-4 border-foreground bg-card shadow-[4px_4px_0_0_var(--foreground)]" data-oid="d0f63a7331" data-oid-text-editable="false" data-oid-text-source="element:div|expression:13274ca6c32a">
        <div className="flex items-center gap-ds-md p-ds-md" data-oid="ff3be437d7">
          <div className="flex-1" data-oid="9060910176">
            <h3 className="font-label text-label font-bold uppercase" data-oid="1a4e9cf0e1">Use my real payslip</h3>
            <p className="font-body text-[14px] leading-snug text-muted-foreground" data-oid="dfcde9ee4d">Once you know your actual net pay, override the estimate.</p>
          </div>
          <Toggle
            checked={inc.overrideEnabled}
            label="Use payslip figure"
            onChange={(v) =>
              actions.updateIncome({
                overrideEnabled: v,
                overrideMonthly: v && inc.overrideMonthly === 0 ? Math.round(b.estimatedNetMonthly) : inc.overrideMonthly,
              })
            }
          />
        </div>
        {inc.overrideEnabled ? (
          <div className="border-t-2 border-foreground p-ds-md" data-oid="841c67a937">
            <label className="ds-field" data-oid="a1a1c08f19">
              <span className="ds-field-label uppercase" data-oid="94a9b2fbbe">Monthly net pay</span>
              <NumberInput value={inc.overrideMonthly} onChange={(v) => actions.updateIncome({ overrideMonthly: v })} prefix="$" suffix="/mo" />
            </label>
            <p className="mt-ds-sm font-caption text-caption text-muted-foreground" data-oid="9d25b713e4" data-oid-text-editable="false" data-oid-text-source="expression:29ce00e4ece4|expression:1598d01cf25d|text">
              {diff >= 0 ? "+" : "−"}
              {fmt(Math.abs(diff))} vs. estimate — the budget now uses this figure.
            </p>
          </div>
        ) : null}
      </section>

      <div className="flex gap-ds-sm rounded-md border-2 border-dashed border-foreground p-ds-md" data-oid="41ddf5479b">
        <Info className="mt-0.5 size-4 shrink-0" strokeWidth={2.5} data-oid="45a16fea6e" />
        <p className="font-body text-[14px] leading-snug" data-oid="c58ea7368f">
          Estimate uses 2025 US federal brackets for a single filer with the standard deduction, FICA, and a flat state rate. It's a planning guide, not tax advice.
        </p>
      </div>
    </div>
  )
}
