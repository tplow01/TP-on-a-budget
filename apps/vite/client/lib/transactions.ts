import { supabase } from "./supabase"
import type { CategoryId } from "./budget"

/** A bank transaction synced by the plaid Edge Function. Positive amount = money out. */
export interface Txn {
  transaction_id: string
  account_id: string
  date: string
  name: string | null
  merchant_name: string | null
  amount: number
  pfc_primary: string | null
  pfc_detailed: string | null
  pending: boolean
}

/** Plaid personal-finance categories → budget categories. null = not spending (income, transfers). */
const PRIMARY_MAP: Record<string, CategoryId | null> = {
  INCOME: null,
  TRANSFER_IN: null,
  TRANSFER_OUT: null,
  RENT_AND_UTILITIES: "fixed",
  LOAN_PAYMENTS: "fixed",
  BANK_FEES: "fixed",
  GOVERNMENT_AND_NON_PROFIT: "fixed",
  FOOD_AND_DRINK: "food",
  MEDICAL: "health",
  PERSONAL_CARE: "health",
  ENTERTAINMENT: "lifestyle",
  TRAVEL: "lifestyle",
  TRANSPORTATION: "lifestyle",
  GENERAL_MERCHANDISE: "lifestyle",
  GENERAL_SERVICES: "lifestyle",
  HOME_IMPROVEMENT: "lifestyle",
}

export function categoryOf(t: Pick<Txn, "pfc_primary" | "pfc_detailed">): CategoryId | null {
  // Paying off a card isn't new spending — the card purchases already count.
  if (t.pfc_detailed === "LOAN_PAYMENTS_CREDIT_CARD_PAYMENT") return null
  const p = t.pfc_primary ?? "OTHER"
  return p in PRIMARY_MAP ? PRIMARY_MAP[p] : "buffer"
}

export const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`

/** Transactions on or after `since` (YYYY-MM-DD). Empty when signed out or not synced yet. */
export async function readTransactions(since: string): Promise<Txn[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from("transactions")
    .select("transaction_id, account_id, date, name, merchant_name, amount, pfc_primary, pfc_detailed, pending")
    .gte("date", since)
    .order("date", { ascending: false })
    .limit(5000)
  if (error) return []
  return (data ?? []) as Txn[]
}

/** Fired after bank data changes so Overview widgets reload. */
export const BANK_UPDATED_EVENT = "budget:bank-updated"

/* ------------------------------------------------------------------ */
/* Matching bank payments to bills                                     */
/* ------------------------------------------------------------------ */

const STOP_WORDS = new Set(["the", "and", "for", "bill", "bills", "payment", "monthly", "yearly", "weekly", "my", "inc", "llc", "com"])
const words = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w))

const LOOKBACK_DAYS: Record<string, number> = { weekly: 3, fortnightly: 6 }

/**
 * The bank payment that covers this bill's `due` date, if any.
 * Matches when the merchant/description shares a word with the bill name
 * and the amount is within 25% (or $2), dated from a few days before the due date up to today.
 * Tip: name bills after the company you pay (e.g. "Geico", "Comcast") for the best matches.
 */
export function findPayment(item: { name: string; amount: number; frequency: string }, due: Date, txs: Txn[]): Txn | null {
  const keys = words(item.name)
  if (!keys.length || !(item.amount > 0)) return null
  const day = 86400000
  const from = due.getTime() - (LOOKBACK_DAYS[item.frequency] ?? 10) * day
  const to = Math.min(due.getTime() + 5 * day, Date.now())
  const tolerance = Math.max(2, item.amount * 0.25)
  let best: Txn | null = null
  for (const t of txs) {
    const amt = Number(t.amount)
    if (!(amt > 0) || Math.abs(amt - item.amount) > tolerance) continue
    const when = new Date(`${t.date}T12:00:00`).getTime()
    if (when < from || when > to) continue
    const hay = words(`${t.merchant_name ?? ""} ${t.name ?? ""}`)
    if (!hay.some((w) => keys.some((k) => w.startsWith(k) || k.startsWith(w)))) continue
    if (!best || Math.abs(amt - item.amount) < Math.abs(Number(best.amount) - item.amount)) best = t
  }
  return best
}
