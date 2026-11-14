import type { CategoryId } from "./budget"
import { categoryOf, incomeTxns, monthKey, peerApp, type CategoryOverrides, type IncomeEntry, type Txn } from "./transactions"

// All-caps brand tokens of up to four letters (CVS, AT&T) stay upper-case; "&" joins letters.
const BRAND_TOKEN = /^[A-Z]{1,4}(&[A-Z]{1,4})*$/
const titleCase = (s: string) =>
  s.replace(/\w\S*/g, (w) => (BRAND_TOKEN.test(w) ? w : w[0].toUpperCase() + w.slice(1).toLowerCase()))

/** Stable merchant label: merchant_name ?? name, title-cased, store numbers stripped. */
export function merchantKey(t: Pick<Txn, "merchant_name" | "name">): string {
  const raw = (t.merchant_name || t.name || "").trim()
  const cleaned = raw
    .replace(/\s*#\s*\d+.*$/, "")
    .replace(/\s+\d+$/, "")
    .trim()
  return titleCase(cleaned || raw) || "Unknown"
}

export interface MerchantAgg {
  key: string
  total: number
  count: number
  category: CategoryId | null
  last: string
  /** Most frequent raw merchant_name ?? name among this merchant's transactions, trimmed. */
  displayName: string
}

const rawName = (t: Pick<Txn, "merchant_name" | "name">) => (t.merchant_name || t.name || "").trim()

/** Tracks raw-name frequency per merchant and reports the most common one. */
function pickDisplay(counts: Map<string, number>, fallback: string): string {
  let best = ""
  let n = 0
  for (const [name, c] of counts) if (c > n && name) (best = name), (n = c)
  return best || fallback
}

function aggregate(txs: Txn[], month: string, overrides?: CategoryOverrides): MerchantAgg[] {
  const map = new Map<string, MerchantAgg>()
  const names = new Map<string, Map<string, number>>()
  for (const t of txs) {
    const amt = Number(t.amount)
    if (!(amt > 0) || t.date.slice(0, 7) !== month) continue
    const category = categoryOf(t, overrides)
    if (!category) continue
    const key = merchantKey(t)
    const nm = names.get(key) ?? new Map<string, number>()
    names.set(key, nm)
    nm.set(rawName(t), (nm.get(rawName(t)) ?? 0) + 1)
    const cur = map.get(key)
    if (cur) {
      cur.total += amt
      cur.count += 1
      if (t.date > cur.last) cur.last = t.date
    } else {
      map.set(key, { key, total: amt, count: 1, category, last: t.date, displayName: key })
    }
  }
  for (const [key, agg] of map) agg.displayName = pickDisplay(names.get(key)!, key)
  return [...map.values()].sort((a, b) => b.total - a.total)
}

export function spendByMerchant(txs: Txn[], month: string, overrides?: CategoryOverrides): MerchantAgg[] {
  return aggregate(txs, month, overrides)
}

export function spendByCategory(
  txs: Txn[],
  month: string,
  overrides?: CategoryOverrides,
): Array<{ category: CategoryId; total: number; merchants: MerchantAgg[] }> {
  // Aggregate per (category, merchant) so a merchant split across categories stays separate.
  const cats = new Map<CategoryId, Map<string, MerchantAgg>>()
  const names = new Map<MerchantAgg, Map<string, number>>()
  for (const t of txs) {
    const amt = Number(t.amount)
    if (!(amt > 0) || t.date.slice(0, 7) !== month) continue
    const category = categoryOf(t, overrides)
    if (!category) continue
    const key = merchantKey(t)
    const m = cats.get(category) ?? new Map<string, MerchantAgg>()
    cats.set(category, m)
    let cur = m.get(key)
    if (cur) {
      cur.total += amt
      cur.count += 1
      if (t.date > cur.last) cur.last = t.date
    } else {
      cur = { key, total: amt, count: 1, category, last: t.date, displayName: key }
      m.set(key, cur)
    }
    const nm = names.get(cur) ?? new Map<string, number>()
    names.set(cur, nm)
    nm.set(rawName(t), (nm.get(rawName(t)) ?? 0) + 1)
  }
  return [...cats.entries()]
    .map(([category, m]) => {
      for (const agg of m.values()) agg.displayName = pickDisplay(names.get(agg)!, agg.key)
      const merchants = [...m.values()].sort((a, b) => b.total - a.total)
      return { category, total: merchants.reduce((s, x) => s + x.total, 0), merchants }
    })
    .sort((a, b) => b.total - a.total)
}

/** This month through today vs. last month over the same number of days (capped at last month's length). */
export function sameDaysCompare(txs: Txn[], today: Date, pick: (t: Txn) => number): { thisMonth: number; lastMonthToDate: number; delta: number } {
  const thisKey = monthKey(today)
  const lastKey = monthKey(new Date(today.getFullYear(), today.getMonth() - 1, 1))
  const daysInLast = new Date(today.getFullYear(), today.getMonth(), 0).getDate()
  const thisCap = today.getDate()
  const lastCap = Math.min(thisCap, daysInLast)
  let thisMonth = 0
  let lastMonthToDate = 0
  for (const t of txs) {
    const day = Number(t.date.slice(8, 10))
    const mk = t.date.slice(0, 7)
    if (mk === thisKey && day <= thisCap) thisMonth += pick(t)
    else if (mk === lastKey && day <= lastCap) lastMonthToDate += pick(t)
  }
  return { thisMonth, lastMonthToDate, delta: thisMonth - lastMonthToDate }
}

export function incomeBySource(
  txs: Txn[],
  month: string,
): Array<{ source: string; kind: "payroll" | "peer" | "other"; total: number; entries: IncomeEntry[] }> {
  const byId = new Map(txs.map((t) => [t.transaction_id, t]))
  const groups = new Map<string, { source: string; kind: "payroll" | "peer" | "other"; total: number; entries: IncomeEntry[] }>()
  for (const e of incomeTxns(txs, month)) {
    const t = byId.get(e.transaction_id)
    const kind = t?.pfc_primary === "INCOME" ? "payroll" : t && peerApp(t) ? "peer" : "other"
    const id = `${kind}|${e.source}`
    const g = groups.get(id) ?? { source: e.source, kind, total: 0, entries: [] }
    groups.set(id, g)
    g.total += e.amount
    g.entries.push(e)
  }
  return [...groups.values()].sort((a, b) => b.total - a.total)
}

/** Deposit rhythm over the last `days` days. Pass `now` only in tests. */
export function incomePattern(
  txs: Txn[],
  days = 90,
  now = new Date(),
): { count: number; avgGapDays: number | null; avgAmount: number; last: IncomeEntry | null } {
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days)
  const months = new Set<string>()
  for (let d = new Date(cutoff); d <= now; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) months.add(monthKey(d))
  months.add(monthKey(now))
  const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, "0")}-${String(cutoff.getDate()).padStart(2, "0")}`
  const entries = [...months]
    .flatMap((m) => incomeTxns(txs, m))
    .filter((e) => e.date >= cutoffStr)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  if (!entries.length) return { count: 0, avgGapDays: null, avgAmount: 0, last: null }
  const ms = (s: string) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10))
  let avgGapDays: number | null = null
  if (entries.length >= 2) {
    avgGapDays = (ms(entries[entries.length - 1].date) - ms(entries[0].date)) / 86400000 / (entries.length - 1)
  }
  return {
    count: entries.length,
    avgGapDays,
    avgAmount: entries.reduce((s, e) => s + e.amount, 0) / entries.length,
    last: entries[entries.length - 1],
  }
}
