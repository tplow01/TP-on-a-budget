import { describe, expect, it } from "vitest"
import type { Txn } from "./transactions"
import { detectRecurring } from "./recurring"

let n = 0
const tx = (o: Partial<Txn>): Txn => ({
  transaction_id: `t${n++}`,
  account_id: "a",
  date: "2026-10-10",
  name: null,
  merchant_name: null,
  amount: 10,
  pfc_primary: null,
  pfc_detailed: null,
  pending: false,
  ...o,
})
const NOW = new Date(2026, 10, 13)
const food = { pfc_primary: "FOOD_AND_DRINK" }

describe("detectRecurring", () => {
  it("detects a monthly charge and projects next date", () => {
    const txs = [
      tx({ ...food, merchant_name: "Netflix", amount: 15.49, date: "2026-11-09" }),
      tx({ ...food, merchant_name: "Netflix", amount: 15.49, date: "2026-10-10" }),
    ]
    const r = detectRecurring(txs, undefined, NOW)
    expect(r.recurring).toHaveLength(1)
    expect(r.recurring[0].cadence).toBe("monthly")
    expect(r.recurring[0].key).toBe("Netflix")
    expect(r.recurring[0].last).toBe("2026-11-09")
    expect(r.recurring[0].nextExpected).toBe("2026-12-09")
    expect(r.recurring[0].txns.map((t) => t.date)).toEqual(["2026-10-10", "2026-11-09"])
    expect(r.oneOff).toHaveLength(0)
  })
  it("does not treat charges one day apart as recurring", () => {
    const txs = [
      tx({ ...food, merchant_name: "Shop", amount: 40, date: "2026-10-10" }),
      tx({ ...food, merchant_name: "Shop", amount: 40, date: "2026-10-11" }),
    ]
    const r = detectRecurring(txs, undefined, NOW)
    expect(r.recurring).toHaveLength(0)
    expect(r.oneOff).toHaveLength(2)
  })
  it("rejects groups whose amounts vary too much", () => {
    const txs = [
      tx({ ...food, merchant_name: "Utility", amount: 50, date: "2026-09-10" }),
      tx({ ...food, merchant_name: "Utility", amount: 70, date: "2026-10-10" }),
    ]
    expect(detectRecurring(txs, undefined, NOW).recurring).toHaveLength(0)
  })
  it("detects weekly cadence", () => {
    const txs = [
      tx({ ...food, merchant_name: "Gym", amount: 5, date: "2026-11-01" }),
      tx({ ...food, merchant_name: "Gym", amount: 5, date: "2026-11-08" }),
    ]
    const r = detectRecurring(txs, undefined, NOW)
    expect(r.recurring[0].cadence).toBe("weekly")
    expect(r.recurring[0].nextExpected).toBe("2026-11-15")
  })
  it("excludes card payments and sorts oneOff newest first", () => {
    const txs = [
      tx({ pfc_primary: "LOAN_PAYMENTS", pfc_detailed: "LOAN_PAYMENTS_CREDIT_CARD_PAYMENT", name: "Card pay", amount: 500 }),
      tx({ ...food, merchant_name: "A", date: "2026-10-01" }),
      tx({ ...food, merchant_name: "B", date: "2026-10-05" }),
    ]
    const r = detectRecurring(txs, undefined, NOW)
    expect(r.oneOff.map((t) => t.merchant_name)).toEqual(["B", "A"])
  })
  it("drops a monthly group whose last charge was 60 days ago", () => {
    const txs = [
      tx({ ...food, merchant_name: "OldGym", amount: 20, date: "2026-08-14" }),
      tx({ ...food, merchant_name: "OldGym", amount: 20, date: "2026-09-14" }),
    ]
    const r = detectRecurring(txs, undefined, NOW)
    expect(r.recurring).toHaveLength(0)
    expect(r.oneOff).toHaveLength(2)
  })
  const pair = (merchant: string, gap: number, a1 = 100, a2 = 100) => {
    const d2 = new Date(Date.UTC(2026, 10, 9))
    const d1 = new Date(d2.getTime() - gap * 86400000)
    return [
      tx({ ...food, merchant_name: merchant, amount: a1, date: d1.toISOString().slice(0, 10) }),
      tx({ ...food, merchant_name: merchant, amount: a2, date: d2.toISOString().slice(0, 10) }),
    ]
  }
  it.each([5, 9])("does not treat a %i-day gap as weekly", (gap) => {
    expect(detectRecurring(pair("Gap", gap), undefined, NOW).recurring).toHaveLength(0)
  })
  it.each([24, 36])("does not treat a %i-day gap as monthly", (gap) => {
    expect(detectRecurring(pair("Gap", gap), undefined, NOW).recurring).toHaveLength(0)
  })
  it("accepts amounts at exactly +/-15% of the mean", () => {
    // mean 100, deviations exactly 15
    expect(detectRecurring(pair("Edge", 30, 85, 115), undefined, NOW).recurring).toHaveLength(1)
  })
  it("excludes a recurring credit-card-payment merchant from both lists", () => {
    const card = { pfc_primary: "LOAN_PAYMENTS", pfc_detailed: "LOAN_PAYMENTS_CREDIT_CARD_PAYMENT" }
    const txs = [
      tx({ ...card, merchant_name: "Visa Payment", amount: 300, date: "2026-10-10" }),
      tx({ ...card, merchant_name: "Visa Payment", amount: 300, date: "2026-11-09" }),
    ]
    const r = detectRecurring(txs, undefined, NOW)
    expect(r.recurring).toHaveLength(0)
    expect(r.oneOff).toHaveLength(0)
  })
})
