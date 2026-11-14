import { Info } from "lucide-react"
import { fmt, pct, type BudgetState, type Summary } from "../../lib/budget"
import type { BudgetActions } from "../../hooks/useBudget"
import { NumberInput, Toggle } from "../budget/fields"

interface Props {
  state: BudgetState
  summary: Summary
  actions: BudgetActions
}

export function TaxEstimateSection({ state, summary, actions }: Props) {
  const inc = state.income
  const b = summary.income
  const diff = inc.overrideMonthly - b.estimatedNetMonthly

  return (
    <section className="border-4 border-foreground bg-card">
      <div className="m-ds-xs flex items-center gap-ds-sm border-2 border-foreground bg-[hsl(24.4_48.7%_36.7%)] px-ds-md py-ds-sm text-primary-foreground">
        <h3 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]">Tax estimate</h3>
      </div>

      <div className="grid grid-cols-2 gap-ds-md p-ds-md">
        <label className="ds-field col-span-2">
          <span className="ds-field-label uppercase">Gross annual salary</span>
          <NumberInput value={inc.grossAnnual} onChange={(v) => actions.updateIncome({ grossAnnual: v })} prefix="$" suffix="/yr" />
        </label>
        <label className="ds-field">
          <span className="ds-field-label uppercase">401(k)</span>
          <NumberInput value={inc.retirementPct} onChange={(v) => actions.updateIncome({ retirementPct: v })} suffix="%" />
        </label>
        <label className="ds-field">
          <span className="ds-field-label uppercase">State tax</span>
          <NumberInput value={inc.stateTaxPct} onChange={(v) => actions.updateIncome({ stateTaxPct: v })} suffix="%" />
        </label>
        <label className="ds-field">
          <span className="ds-field-label uppercase">Pre-tax deductions</span>
          <NumberInput value={inc.preTaxDeductionsMonthly} onChange={(v) => actions.updateIncome({ preTaxDeductionsMonthly: v })} prefix="$" suffix="/mo" />
        </label>
        <label className="ds-field">
          <span className="ds-field-label uppercase">Post-tax deductions</span>
          <NumberInput value={inc.postTaxDeductionsMonthly} onChange={(v) => actions.updateIncome({ postTaxDeductionsMonthly: v })} prefix="$" suffix="/mo" />
        </label>
      </div>

      <dl className="mx-ds-md mb-ds-md border-t-2 border-foreground pt-ds-sm">
        <div className="flex justify-between py-1">
          <dt className="font-body text-body">Gross monthly</dt>
          <dd className="font-caption text-[15px]">{fmt(b.grossMonthly)}</dd>
        </div>
        <div className="flex justify-between py-1">
          <dt className="font-body text-body">401(k) contribution</dt>
          <dd className="font-caption text-[15px]">−{fmt(b.retirementMonthly)}</dd>
        </div>
        <div className="flex justify-between py-1">
          <dt className="font-body text-body">Pre-tax deductions</dt>
          <dd className="font-caption text-[15px]">−{fmt(b.preTaxMonthly)}</dd>
        </div>
        <div className="flex justify-between py-1">
          <dt className="font-body text-body">Federal income tax</dt>
          <dd className="font-caption text-[15px]">−{fmt(b.federalMonthly)}</dd>
        </div>
        <div className="flex justify-between py-1">
          <dt className="font-body text-body">Social Security & Medicare</dt>
          <dd className="font-caption text-[15px]">−{fmt(b.ficaMonthly)}</dd>
        </div>
        <div className="flex justify-between py-1">
          <dt className="font-body text-body">State & local tax</dt>
          <dd className="font-caption text-[15px]">−{fmt(b.stateMonthly)}</dd>
        </div>
        <div className="flex justify-between py-1">
          <dt className="font-body text-body">Post-tax deductions</dt>
          <dd className="font-caption text-[15px]">−{fmt(b.postTaxMonthly)}</dd>
        </div>
        <div className="mt-ds-sm flex items-baseline justify-between border-t-4 border-double border-foreground pt-ds-sm">
          <dt className="font-label text-label font-bold uppercase">Estimated take-home</dt>
          <dd className="font-display text-[28px] font-black">{fmt(b.estimatedNetMonthly)}</dd>
        </div>
        <p className="mt-ds-xs text-right font-caption text-caption text-muted-foreground">Effective tax rate {pct(b.effectiveTaxRate)}</p>
      </dl>

      <div className="flex items-center gap-ds-md border-t-2 border-foreground p-ds-md">
        <div className="flex-1">
          <h3 className="font-label text-label font-bold uppercase">Use my real payslip</h3>
          <p className="font-body text-[14px] leading-snug text-muted-foreground">Once you know your actual net pay, override the estimate.</p>
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
        <div className="border-t-2 border-foreground p-ds-md">
          <label className="ds-field">
            <span className="ds-field-label uppercase">Monthly net pay</span>
            <NumberInput value={inc.overrideMonthly} onChange={(v) => actions.updateIncome({ overrideMonthly: v })} prefix="$" suffix="/mo" />
          </label>
          <p className="mt-ds-sm font-caption text-caption text-muted-foreground">
            {diff >= 0 ? "+" : "−"}
            {fmt(Math.abs(diff))} vs. estimate — the budget now uses this figure.
          </p>
        </div>
      ) : null}

      <div className="m-ds-md flex gap-ds-sm rounded-md border-2 border-dashed border-foreground p-ds-md">
        <Info className="mt-0.5 size-4 shrink-0" strokeWidth={2.5} />
        <p className="font-body text-[14px] leading-snug">
          Estimate uses 2025 US federal brackets for a single filer with the standard deduction, FICA, and a flat state rate. It's a planning guide, not tax advice.
        </p>
      </div>
    </section>
  )
}
