import { useState } from "react"
import { Landmark } from "lucide-react"
import { CATEGORIES, fmt2, type CategoryId } from "../../lib/budget"
import type { BankAccount } from "../../lib/plaid"
import type { Txn } from "../../lib/transactions"

interface Props {
  t: Txn
  account?: BankAccount
  category: CategoryId | null
  onRecategorise: (id: string, c: CategoryId) => void
}

/** A transaction line that expands to show its account and a "Move to" category picker. */
export function TxnRow({ t, account, category, onRecategorise }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-ds-sm px-ds-md py-ds-sm text-left"
      >
        <div className="min-w-0">
          <p className="truncate font-body text-[14px]">{t.merchant_name || t.name || "Unknown merchant"}</p>
          <p className="font-caption text-caption text-muted-foreground">
            {new Date(`${t.date}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            {t.pending ? " · Pending" : ""}
          </p>
        </div>
        <p className="shrink-0 font-label text-[14px] font-bold">{fmt2(Number(t.amount))}</p>
      </button>
      {open ? (
        <div className="space-y-ds-xs border-t-2 border-dashed border-foreground/30 px-ds-md py-ds-sm">
          <div className="flex items-center gap-ds-xs font-caption text-caption text-muted-foreground">
            <Landmark className="size-3.5" strokeWidth={2.5} />
            {account ? (account.institution ? `${account.institution} · ${account.name}` : account.name) : "Account unavailable"}
            {account?.mask ? ` ···${account.mask}` : ""}
          </div>
          {t.name && t.merchant_name && t.name !== t.merchant_name ? (
            <p className="font-caption text-caption text-muted-foreground">Bank description: {t.name}</p>
          ) : null}
          {t.pfc_detailed ? (
            <p className="font-caption text-caption text-muted-foreground">Bank category: {t.pfc_detailed.replaceAll("_", " ").toLowerCase()}</p>
          ) : null}
          <label className="ds-field">
            <span className="ds-field-label uppercase">Move to</span>
            <select
              value={category ?? ""}
              onChange={(e) => onRecategorise(t.transaction_id, e.target.value as CategoryId)}
              className="min-h-[48px] w-full rounded-md border-2 border-foreground bg-card px-ds-sm font-caption text-[15px]"
            >
              {category ? null : <option value="" disabled>Not spending</option>}
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
    </li>
  )
}
