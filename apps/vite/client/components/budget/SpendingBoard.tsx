import { Plus, Trash2 } from "lucide-react"
import { cn } from "@vibe/ui"
import { CATEGORIES, FREQUENCIES, FREQUENCY_LABEL, fmt, monthlyOf, type BudgetState, type Frequency, type Summary } from "../../lib/budget"
import type { BudgetActions } from "../../hooks/useBudget"
import { NumberInput, Toggle } from "./fields"

interface Props {
  state: BudgetState
  summary: Summary
  actions: BudgetActions
}

export function SpendingBoard({ state, summary, actions }: Props) {
  const pausedCount = state.items.filter((i) => !i.enabled).length

  return (
    <div className="space-y-ds-lg" data-oid="72de7114ea" data-oid-component-root="true" data-oid-callsite-deletable="true" data-oid-callsite-single="true" data-oid-text-editable="false" data-oid-text-source="element:section|element:nav|expression:a62fdb05cce4">
      <section className="flex items-end justify-between border-b-4 border-foreground pb-ds-sm" data-oid="961d05f0cf">
        <div data-oid="ca64d619f5">
          <h2 className="font-heading text-heading font-extrabold uppercase" data-oid="5f8e3fdd9f">Spending by category</h2>
          <p className="font-caption text-caption text-muted-foreground" data-oid="b093783693" data-oid-text-editable="false" data-oid-text-source="expression:3e9a72a5540b|text">{pausedCount} paused · toggle off instead of deleting</p>
        </div>
        <p className="font-display text-[28px] font-black leading-none" data-oid="8d753d8329">{fmt(summary.totalSpending)}</p>
      </section>

      <nav aria-label="Jump to category" className="-mx-ds-md flex gap-ds-sm overflow-x-auto px-ds-md pb-ds-xs" data-oid="a71d08e309">
        {CATEGORIES.map((cat, index) => (
          <a
            key={cat.id}
            href={`#cat-${cat.id}`}
            data-index={index}
            className={cn("shrink-0 rounded-full border-2 border-foreground px-ds-md py-ds-xs font-label text-[12px] font-bold uppercase tracking-[0.06em]", cat.band, cat.bandText)} data-oid="273eeae834" data-oid-shared="true" data-oid-instance-targetable="true" data-oid-classname-dynamic="true"
          >
            {cat.name}
          </a>
        ))}
      </nav>

      {CATEGORIES.map((cat) => {
        const items = state.items.filter((i) => i.category === cat.id)
        return (
          <section key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-ds-md border-4 border-foreground bg-card shadow-[4px_4px_0_0_var(--foreground)]" data-oid="b7f978ab0c" data-oid-shared="true" data-oid-instance-targetable="true" data-oid-text-editable="false" data-oid-text-source="element:div|element:ul|expression:ebedf6e4fd88|element:button">
            <div className={cn("border-b-4 border-foreground px-ds-md py-ds-sm", cat.band, cat.bandText)} data-oid="b85fd2e939" data-oid-shared="true" data-oid-instance-targetable="true" data-oid-classname-dynamic="true">
              <div className="flex items-baseline justify-between gap-ds-sm" data-oid="4423a87d05" data-oid-shared="true" data-oid-instance-targetable="true">
                <h3 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="f9eee1ccd1" data-oid-shared="true" data-oid-instance-targetable="true">{cat.name}</h3>
                <p className="font-caption text-[15px]" data-oid="d815cf78d8" data-oid-shared="true" data-oid-instance-targetable="true" data-oid-text-editable="false" data-oid-text-source="expression:17821f6d7330|text">{fmt(summary.byCategory[cat.id])}/mo</p>
              </div>
              <p className="font-caption text-caption opacity-85" data-oid="43182c5709" data-oid-shared="true" data-oid-instance-targetable="true">{cat.tagline}</p>
            </div>

            <ul className="divide-y-2 divide-foreground/15" data-oid="3baa59ff07" data-oid-shared="true" data-oid-instance-targetable="true">
              {items.map((item, index) => (
                <li key={item.id} data-index={index} data-enabled={item.enabled} className="group/row space-y-ds-sm px-ds-md py-ds-md data-[enabled=false]:bg-muted/40" data-oid="a5a24a0327" data-oid-shared="true">
                  <div className="flex items-center gap-ds-sm" data-oid="d19443df9f" data-oid-shared="true" data-oid-text-editable="false">
                    <Toggle checked={item.enabled} onChange={(v) => actions.updateItem(item.id, { enabled: v })} label={`Count ${item.name || "item"} in budget`} />
                    <input
                      type="text"
                      value={item.name}
                      placeholder="Name this cost"
                      aria-label="Item name"
                      onChange={(e) => actions.updateItem(item.id, { name: e.target.value })}
                      className="min-h-[40px] w-full min-w-0 flex-1 border-b-2 border-transparent bg-transparent font-label text-[15px] font-bold uppercase tracking-[0.04em] outline-none placeholder:text-muted-foreground focus:border-foreground group-data-[enabled=false]/row:line-through group-data-[enabled=false]/row:opacity-60" data-oid="a17db43f36" data-oid-shared="true"
                    />
                    {!item.enabled ? <span className="shrink-0 rounded-sm border-2 border-foreground bg-warning px-1.5 font-caption text-[10px] uppercase" data-oid="539678f858" data-oid-shared="true">Paused</span> : null}
                    <button
                      type="button"
                      aria-label={`Delete ${item.name || "item"}`}
                      onClick={() => actions.removeItem(item.id)}
                      className="flex size-10 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-primary hover:text-primary-foreground" data-oid="ba5b991280" data-oid-shared="true"
                    >
                      <Trash2 className="size-4" strokeWidth={2.5} data-oid="c2cf7b304b" data-oid-shared="true" />
                    </button>
                  </div>
                  <div className="flex items-center gap-ds-sm group-data-[enabled=false]/row:opacity-50" data-oid="089088cd12" data-oid-shared="true">
                    <NumberInput value={item.amount} onChange={(v) => actions.updateItem(item.id, { amount: v })} prefix="$" ariaLabel="Amount" className="w-28 shrink-0" />
                    <select
                      aria-label="Billing frequency"
                      value={item.frequency}
                      onChange={(e) => actions.updateItem(item.id, { frequency: e.target.value as Frequency })}
                      className="min-h-[44px] min-w-0 flex-1 rounded-md border-2 border-foreground bg-card px-ds-sm font-caption text-[13px]" data-oid="6c0bc319be" data-oid-shared="true"
                    >
                      {FREQUENCIES.map((f) => (
                        <option key={f} value={f} data-oid="76a40d7def" data-oid-shared="true">
                          {FREQUENCY_LABEL[f]}
                        </option>
                      ))}
                    </select>
                    <output className="w-20 shrink-0 text-right font-label text-[14px] font-extrabold" data-oid="1b0d154c51" data-oid-shared="true" data-oid-text-editable="false" data-oid-text-source="expression:9db8a6f042ea|element:span">
                      {fmt(monthlyOf(item))}
                      <span className="block font-caption text-[10px] font-normal text-muted-foreground" data-oid="e7dda15a5d" data-oid-shared="true">per month</span>
                    </output>
                  </div>
                </li>
              ))}
            </ul>

            {items.length === 0 ? <p className="px-ds-md py-ds-md font-body text-body text-muted-foreground" data-oid="a66aa635e2" data-oid-shared="true">No costs here yet.</p> : null}

            <button
              type="button"
              onClick={() => actions.addItem(cat.id)}
              className="flex min-h-[48px] w-full items-center justify-center gap-ds-xs border-t-2 border-dashed border-foreground font-label text-label font-bold uppercase hover:bg-background" data-oid="9406a8ca00" data-oid-shared="true" data-oid-instance-targetable="true" data-oid-text-editable="false"
            >
              <Plus className="size-4" strokeWidth={3} data-oid="dcde074677" data-oid-shared="true" data-oid-instance-targetable="true" />
              Add to {cat.name}
            </button>
          </section>
        )
      })}
    </div>
  )
}
