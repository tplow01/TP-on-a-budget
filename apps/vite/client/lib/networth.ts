import type { BankAccount } from "./plaid"
import { supabase } from "./supabase"

export interface Snapshot { account_id: string; day: string; current: number | null; available: number | null; type: string }
export interface ManualAccount { id: string; name: string; type: "cash" | "investment" | "credit" | "other"; balance: number; updated_at: string }
export type Bucket = "cash" | "investments" | "credit"

export function bucketOf(type: string): Bucket {
  if (type === "investment" || type === "brokerage") return "investments"
  if (type === "credit" || type === "loan") return "credit"
  return "cash"
}

export function signedBalance(type: string, current: number | null, available: number | null): number {
  if (type === "depository") return available ?? current ?? 0
  const v = current ?? 0
  return bucketOf(type) === "credit" ? -v : v
}

export function totalOf(accounts: BankAccount[], manual: ManualAccount[]): { total: number; byBucket: Record<Bucket, number> } {
  const byBucket: Record<Bucket, number> = { cash: 0, investments: 0, credit: 0 }
  for (const a of accounts) byBucket[bucketOf(a.type)] += signedBalance(a.type, a.current, a.available)
  for (const m of manual) {
    const t = m.type === "investment" ? "investment" : m.type === "credit" ? "credit" : "other"
    byBucket[bucketOf(t)] += signedBalance(t, m.balance, null)
  }
  return { total: byBucket.cash + byBucket.investments + byBucket.credit, byBucket }
}

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

export function daySeries(snaps: Snapshot[], manualTotal: number, today: Date = new Date()): Array<{ day: string; total: number }> {
  if (!snaps.length) return []
  const sorted = [...snaps].sort((a, b) => a.day.localeCompare(b.day))
  const [y, m, d] = sorted[0].day.split("-").map(Number)
  const end = iso(today)
  const latest = new Map<string, number>()
  const out: Array<{ day: string; total: number }> = []
  let i = 0
  for (let cur = new Date(y, m - 1, d); iso(cur) <= end; cur.setDate(cur.getDate() + 1)) {
    const day = iso(cur)
    while (i < sorted.length && sorted[i].day <= day) {
      const s = sorted[i++]
      latest.set(s.account_id, signedBalance(s.type, s.current, s.available))
    }
    let total = manualTotal
    for (const v of latest.values()) total += v
    out.push({ day, total })
  }
  return out
}

export function monthDelta(series: Array<{ day: string; total: number }>, today: Date = new Date()): number | null {
  const prefix = iso(today).slice(0, 7)
  const first = series.find((s) => s.day.startsWith(prefix))
  const last = series[series.length - 1]
  if (!first || !last) return null
  return last.total - first.total
}

export async function readSnapshots(sinceIso: string): Promise<Snapshot[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from("balance_snapshots")
    .select("account_id, day, current, available, type")
    .gte("day", sinceIso)
    .order("day", { ascending: true })
  if (error || !data) return []
  return data as Snapshot[]
}

export async function readManualAccounts(): Promise<ManualAccount[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from("manual_accounts").select("id, name, type, balance, updated_at")
  if (error || !data) return []
  return data.map((r) => ({ ...r, balance: Number(r.balance) })) as ManualAccount[]
}

export async function upsertManualAccount(a: Omit<ManualAccount, "updated_at" | "id"> & { id?: string }): Promise<void> {
  if (!supabase) return
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return
  const row = { ...a, user_id: auth.user.id, updated_at: new Date().toISOString() }
  await supabase.from("manual_accounts").upsert(row)
}

export async function deleteManualAccount(id: string): Promise<void> {
  if (!supabase) return
  await supabase.from("manual_accounts").delete().eq("id", id)
}
