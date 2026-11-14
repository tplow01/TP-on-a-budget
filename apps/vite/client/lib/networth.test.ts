import { describe, expect, it } from "vitest"
import type { BankAccount } from "./plaid"
import { daySeries, monthDelta, signedBalance, totalOf, type ManualAccount, type Snapshot } from "./networth"

const acct = (type: string, current: number | null, available: number | null = null): BankAccount => ({
  account_id: type + current, item_id: "i", institution: null, name: type, mask: null, type, subtype: null, current, available, updated_at: "",
})

describe("signedBalance", () => {
  it("signs by account type", () => {
    expect(signedBalance("credit", 424, null)).toBe(-424)
    expect(signedBalance("depository", 9612.1, 9534.54)).toBe(9534.54)
    expect(signedBalance("investment", 15200, null)).toBe(15200)
  })
})

describe("totalOf", () => {
  it("sums buckets with manual accounts", () => {
    const manual: ManualAccount[] = [{ id: "m1", name: "Card", type: "credit", balance: 100, updated_at: "" }]
    const r = totalOf([acct("depository", 9612.1, 9534.54), acct("investment", 15200), acct("credit", 424)], manual)
    expect(r.total).toBeCloseTo(24210.54, 2)
    expect(r.byBucket.credit).toBeCloseTo(-524, 2)
  })
})

describe("daySeries", () => {
  const today = new Date(2026, 10, 4) // Nov 4
  const snap = (account_id: string, day: string, current: number): Snapshot => ({ account_id, day, current, available: null, type: "depository" })
  it("carries forward and does not back-fill", () => {
    const s = daySeries([snap("a", "2026-11-01", 100), snap("a", "2026-11-03", 150), snap("b", "2026-11-03", 50)], 10, today)
    expect(s.map((d) => d.day)).toEqual(["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04"])
    expect(s.map((d) => d.total)).toEqual([110, 110, 210, 210])
  })
})

describe("daySeries future snapshots", () => {
  it("counts a snapshot dated tomorrow as today", () => {
    const today = new Date(2026, 10, 4)
    const s = daySeries([{ account_id: "a", day: "2026-11-03", current: 100, available: null, type: "depository" }, { account_id: "a", day: "2026-11-05", current: 300, available: null, type: "depository" }], 0, today)
    expect(s[s.length - 1]).toEqual({ day: "2026-11-04", total: 300 })
  })
})

describe("monthDelta", () => {
  it("is null with no entry this month", () => {
    expect(monthDelta([{ day: "2026-10-30", total: 5 }], new Date(2026, 10, 4))).toBeNull()
  })
  it("diffs against first entry of month", () => {
    expect(monthDelta([{ day: "2026-10-30", total: 5 }, { day: "2026-11-01", total: 10 }, { day: "2026-11-04", total: 25 }], new Date(2026, 10, 4))).toBe(15)
  })
})
