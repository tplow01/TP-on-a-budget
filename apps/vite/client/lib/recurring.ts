import { merchantKey } from "./insights"
import { categoryOf, type CategoryOverrides, type Txn } from "./transactions"

export interface RecurringGroup {
  key: string
  cadence: "weekly" | "monthly"
  avgAmount: number
  count: number
  last: string
  nextExpected: string
  txns: Txn[]
}

const DAY = 86400000
const dayNum = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / DAY
const addDays = (iso: string, n: number) => new Date((dayNum(iso) + n) * DAY).toISOString().slice(0, 10)

export function detectRecurring(txs: Txn[], overrides?: CategoryOverrides, now: Date = new Date()): { recurring: RecurringGroup[]; oneOff: Txn[] } {
  const byKey = new Map<string, Txn[]>()
  for (const t of txs) {
    if (!(Number(t.amount) > 0) || categoryOf(t, overrides) === null) continue
    const key = merchantKey(t)
    const list = byKey.get(key)
    if (list) list.push(t)
    else byKey.set(key, [t])
  }

  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
  const recurring: RecurringGroup[] = []
  const oneOff: Txn[] = []
  for (const [key, list] of byKey) {
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date))
    const amounts = sorted.map((t) => Number(t.amount))
    const mean = amounts.reduce((s, a) => s + a, 0) / amounts.length
    let cadence: "weekly" | "monthly" | null = null
    if (sorted.length >= 2 && amounts.every((a) => Math.abs(a - mean) <= mean * 0.15)) {
      const gaps = sorted.slice(1).map((t, i) => dayNum(t.date) - dayNum(sorted[i].date))
      if (gaps.every((g) => g >= 6 && g <= 8)) cadence = "weekly"
      else if (gaps.every((g) => g >= 25 && g <= 35)) cadence = "monthly"
    }
    if (!cadence) {
      oneOff.push(...sorted)
      continue
    }
    const last = sorted[sorted.length - 1].date
    const nextExpected = addDays(last, cadence === "weekly" ? 7 : 30)
    if (dayNum(nextExpected) < dayNum(todayIso) - 7) {
      oneOff.push(...sorted)
      continue
    }
    recurring.push({
      key,
      cadence,
      avgAmount: mean,
      count: sorted.length,
      last,
      nextExpected,
      txns: sorted,
    })
  }
  recurring.sort((a, b) => b.avgAmount - a.avgAmount)
  oneOff.sort((a, b) => b.date.localeCompare(a.date))
  return { recurring, oneOff }
}
