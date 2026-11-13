import { supabase } from "./supabase"
import { emptyCuts, type CategoryId } from "./budget"

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
  RENT_AND_UTILITIES: "variable", // overridden to "fixed" for rent/mortgage itself, see DETAIL_MAP
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

/** Only rent/mortgage itself is a fixed amount every time — PG&E, water, wifi,
 * phone etc. are billed under the same Plaid primary category but the amount
 * changes month to month, so they belong in "variable" instead. */
const DETAIL_MAP: Record<string, CategoryId> = {
  RENT_AND_UTILITIES_RENT: "fixed",
  RENT_AND_UTILITIES_MORTGAGE: "fixed",
}

/** Plaid files Zelle/Venmo/Cash App/PayPal payments under the generic
 * TRANSFER_IN/TRANSFER_OUT categories it also uses for moving your own money
 * between your own accounts — it can't tell the two apart. We can, roughly,
 * by looking for the app's name in the description. */
const PEER_APPS = ["venmo", "zelle", "cash app", "cashapp", "paypal"]
export function peerApp(t: Pick<Txn, "name" | "merchant_name">): string | null {
  const hay = `${t.merchant_name ?? ""} ${t.name ?? ""}`.toLowerCase()
  return PEER_APPS.find((app) => hay.includes(app)) ?? null
}

/** Per-transaction category the user picked by hand, overriding the automatic
 * guess below — keyed by transaction_id. */
export type CategoryOverrides = Record<string, CategoryId>

export function categoryOf(t: Pick<Txn, "transaction_id" | "pfc_primary" | "pfc_detailed" | "name" | "merchant_name">, overrides?: CategoryOverrides): CategoryId | null {
  if (overrides?.[t.transaction_id]) return overrides[t.transaction_id]
  // Paying off a card isn't new spending — the card purchases already count.
  if (t.pfc_detailed === "LOAN_PAYMENTS_CREDIT_CARD_PAYMENT") return null
  if (t.pfc_detailed && t.pfc_detailed in DETAIL_MAP) return DETAIL_MAP[t.pfc_detailed]
  const p = t.pfc_primary ?? "OTHER"
  // Sending someone money via Venmo/Zelle etc. is real spending even though
  // Plaid calls it a transfer — we just don't know what it was for until the
  // user tells us, so it starts in its own category rather than "buffer".
  if (p === "TRANSFER_OUT" && peerApp(t)) return "transfers"
  return p in PRIMARY_MAP ? PRIMARY_MAP[p] : "buffer"
}

/** Read this user's saved category overrides, keyed by transaction_id. */
export async function readCategoryOverrides(): Promise<CategoryOverrides> {
  if (!supabase) return {}
  const { data, error } = await supabase.from("transaction_categories").select("transaction_id, category")
  if (error) return {}
  return Object.fromEntries((data ?? []).map((r) => [r.transaction_id, r.category as CategoryId]))
}

/** Save (or clear, with category null) the user's manual category for one transaction. */
export async function setCategoryOverride(transactionId: string, category: CategoryId | null): Promise<void> {
  if (!supabase) return
  if (category === null) {
    await supabase.from("transaction_categories").delete().eq("transaction_id", transactionId)
    return
  }
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return
  await supabase.from("transaction_categories").upsert({ transaction_id: transactionId, user_id: auth.user.id, category }, { onConflict: "transaction_id" })
}

export interface IncomeEntry {
  transaction_id: string
  date: string
  source: string
  amount: number
}

/** Money coming in that's actually yours to spend: paychecks (Plaid INCOME)
 * and peer payments received via Zelle/Venmo/etc. Excludes plain transfers
 * between your own linked accounts, which Plaid also reports as inflows. */
export function isIncome(t: Pick<Txn, "amount" | "pfc_primary" | "name" | "merchant_name">): boolean {
  if (!(Number(t.amount) < 0)) return false
  if (t.pfc_primary === "INCOME") return true
  return Boolean(peerApp(t))
}

const titleCase = (s: string) => s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase())

/** Who paid you — the merchant/employer name, or the P2P app when that's all Plaid gives us. */
function incomeSource(t: Pick<Txn, "name" | "merchant_name">): string {
  const named = t.merchant_name ?? t.name
  if (named) return named
  const app = peerApp(t)
  return app ? titleCase(app) : "Deposit"
}

/** Real income transactions in one calendar month, newest first. */
export function incomeTxns(txs: Txn[], month: string): IncomeEntry[] {
  return txs
    .filter((t) => t.date.slice(0, 7) === month && isIncome(t))
    .map((t) => ({ transaction_id: t.transaction_id, date: t.date, source: incomeSource(t), amount: -Number(t.amount) }))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

export const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`

/** Real spend per category for one calendar month, from actual bank transactions. */
export function actualByCategory(txs: Txn[], month: string, overrides?: CategoryOverrides): Record<CategoryId, number> {
  const out = emptyCuts()
  for (const t of txs) {
    const amt = Number(t.amount)
    if (!(amt > 0) || t.date.slice(0, 7) !== month) continue
    const cat = categoryOf(t, overrides)
    if (cat) out[cat] += amt
  }
  return out
}

export interface MonthPace {
  /** Real income and spend so far this month. */
  incomeSoFar: number
  spendSoFar: number
  /** Both extrapolated to a full month at today's daily rate. */
  projectedIncome: number
  projectedSpend: number
  projectedLeftover: number
}

/** "At this rate" — this month's real income/spend so far, extrapolated to a
 * full month at the same daily pace. Pass `now` only in tests. */
export function monthPace(txs: Txn[], overrides?: CategoryOverrides, now = new Date()): MonthPace {
  const month = monthKey(now)
  const day = now.getDate()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const incomeSoFar = incomeTxns(txs, month).reduce((s, i) => s + i.amount, 0)
  const spendSoFar = Object.values(actualByCategory(txs, month, overrides)).reduce((a, b) => a + b, 0)
  const scale = daysInMonth / day
  const projectedIncome = incomeSoFar * scale
  const projectedSpend = spendSoFar * scale
  return { incomeSoFar, spendSoFar, projectedIncome, projectedSpend, projectedLeftover: projectedIncome - projectedSpend }
}

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
