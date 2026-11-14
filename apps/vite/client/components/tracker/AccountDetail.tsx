import { motion } from "framer-motion"
import { X } from "lucide-react"
import type { BankAccount } from "../../lib/plaid"
import type { ManualAccount, Snapshot } from "../../lib/networth"
import { signedBalance } from "../../lib/networth"
import type { Txn } from "../../lib/transactions"
import { fmt2 } from "../../lib/budget"
import { LineChart } from "./LineChart"

interface Props {
  account: BankAccount | ManualAccount
  txs: Txn[]
  snapshots: Snapshot[]
  onClose: () => void
}

const SHEET = {
  initial: { y: "100%" },
  animate: { y: 0 },
  exit: { y: "100%" },
  transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] as const },
}

export function AccountDetail({ account, txs, snapshots, onClose }: Props) {
  const isBank = "account_id" in account
  const id = isBank ? account.account_id : account.id
  const type = isBank ? account.type : account.type === "investment" ? "investment" : account.type === "credit" ? "credit" : "other"
  const balance = isBank ? signedBalance(account.type, account.current, account.available) : signedBalance(type, account.balance, null)
  const series = snapshots
    .filter((s) => s.account_id === id)
    .sort((a, b) => a.day.localeCompare(b.day))
    .map((s) => ({ day: s.day, total: signedBalance(s.type, s.current, s.available) }))
  const rows = isBank ? txs.filter((t) => t.account_id === id).sort((a, b) => b.date.localeCompare(a.date)) : []

  return (
    <div className="fixed inset-0 z-50">
      <motion.div className="absolute inset-0 bg-foreground/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={onClose} />
      <motion.div {...SHEET} className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[480px]">
        <div role="dialog" aria-modal="true" aria-label={account.name} className="max-h-[85vh] overflow-y-auto border-x-4 border-t-4 border-foreground bg-background pb-[max(env(safe-area-inset-bottom),34px)]">
          <div className="flex items-center justify-between gap-ds-sm border-b-4 border-foreground bg-card px-ds-md py-ds-md">
            <h2 className="min-w-0 truncate font-heading text-heading font-extrabold uppercase">{account.name}</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="flex size-12 shrink-0 items-center justify-center rounded-md border-2 border-foreground bg-card active:scale-90">
              <X className="size-5" strokeWidth={3} />
            </button>
          </div>
          <div className="space-y-ds-md p-ds-md">
            <p className="font-display text-[40px] font-black leading-none tabular-nums">{fmt2(balance)}</p>
            <LineChart points={series} />
            <section className="border-4 border-foreground bg-card shadow-[4px_4px_0_0_var(--foreground)]">
              <div className="flex items-center justify-between gap-ds-sm border-b-4 border-foreground bg-secondary px-ds-md py-ds-sm text-secondary-foreground">
                <h3 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]">Transactions</h3>
              </div>
              {isBank && rows.length > 0 ? (
                <ul className="divide-y-2 divide-foreground/15">
                  {rows.map((t, index) => (
                    <li key={t.transaction_id} data-index={index} className="flex items-center justify-between gap-ds-sm px-ds-md py-ds-sm">
                      <div className="min-w-0">
                        <p className="truncate font-body text-body">{t.merchant_name ?? t.name ?? "Transaction"}</p>
                        <p className="font-caption text-caption text-muted-foreground">{t.date}</p>
                      </div>
                      <span className="shrink-0 font-caption text-body tabular-nums data-[inflow=true]:text-success" data-inflow={t.amount < 0}>{t.amount < 0 ? "+" : "-"}{fmt2(Math.abs(t.amount))}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="p-ds-md font-caption text-caption text-muted-foreground">{isBank ? "No transactions yet" : "No transactions for manual accounts"}</p>
              )}
            </section>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
