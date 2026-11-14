import { describe, expect, it } from "vitest"
import type { Txn } from "./transactions"
import { incomeBySource, incomePattern, merchantKey, sameDaysCompare, spendByCategory, spendByMerchant } from "./insights"

let n = 0
const tx = (o: Partial<Txn>): Txn => ({
  transaction_id: `t${n++}`,
  account_id: "a",
  date: "2028-03-10",
  name: null,
  merchant_name: null,
  amount: 10,
  pfc_primary: null,
  pfc_detailed: null,
  pending: false,
  ...o,
})
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

describe("merchantKey", () => {
  it("title-cases and strips store numbers", () => {
    expect(merchantKey({ merchant_name: null, name: "TRADER JOE'S #123" })).toBe("Trader Joe's")
  })
  it("falls back to name when merchant_name is an empty string", () => {
    expect(merchantKey({ merchant_name: "", name: "Blue Bottle" })).toBe("Blue Bottle")
  })
  it("keeps short all-caps brand tokens upper-case", () => {
    expect(merchantKey({ merchant_name: "CVS", name: null })).toBe("CVS")
    expect(merchantKey({ merchant_name: null, name: "AT&T" })).toBe("AT&T")
  })
})

describe("displayName", () => {
  it("is the most frequent trimmed raw name for the merchant", () => {
    const txs = [
      tx({ pfc_primary: "FOOD_AND_DRINK", merchant_name: null, name: "CHIPOTLE 1234" }),
      tx({ pfc_primary: "FOOD_AND_DRINK", merchant_name: " Chipotle ", name: "x" }),
      tx({ pfc_primary: "FOOD_AND_DRINK", merchant_name: "Chipotle", name: "y" }),
    ]
    const m = spendByCategory(txs, "2028-03")[0].merchants[0]
    expect(m.key).toBe("Chipotle")
    expect(m.displayName).toBe("Chipotle")
    expect(spendByMerchant(txs, "2028-03")[0].displayName).toBe("Chipotle")
  })
})

describe("spendByCategory", () => {
  const food = { pfc_primary: "FOOD_AND_DRINK" }
  const txs = [
    tx({ ...food, merchant_name: "Chipotle", amount: 12 }),
    tx({ ...food, merchant_name: "Chipotle", amount: 8 }),
    tx({ ...food, merchant_name: "Safeway", amount: 50 }),
    tx({ pfc_primary: "LOAN_PAYMENTS", pfc_detailed: "LOAN_PAYMENTS_CREDIT_CARD_PAYMENT", name: "Card pay", amount: 500 }),
  ]
  it("groups by category and ignores card payments", () => {
    const r = spendByCategory(txs, "2028-03")
    expect(r).toHaveLength(1)
    expect(r[0].category).toBe("food")
    expect(r[0].total).toBe(70)
    expect(r[0].merchants.map((m) => m.key)).toEqual(["Safeway", "Chipotle"])
    expect(r[0].merchants[1].count).toBe(2)
  })
  it("respects overrides", () => {
    const r = spendByCategory(txs, "2028-03", { [txs[2].transaction_id]: "lifestyle" })
    expect(r.map((c) => c.category).sort()).toEqual(["food", "lifestyle"])
    expect(r.find((c) => c.category === "lifestyle")!.total).toBe(50)
  })
})

describe("sameDaysCompare", () => {
  it("includes Feb 28 when today is Mar 31 and does not throw", () => {
    const txs = [tx({ date: "2028-02-28", amount: 40 }), tx({ date: "2028-03-02", amount: 15 })]
    const r = sameDaysCompare(txs, new Date(2028, 2, 31), (t) => t.amount)
    expect(r.lastMonthToDate).toBe(40)
    expect(r.thisMonth).toBe(15)
    expect(r.delta).toBe(-25)
  })
})

describe("incomeBySource", () => {
  it("separates payroll and peer", () => {
    const txs = [
      tx({ amount: -2000, pfc_primary: "INCOME", name: "ACME PAYROLL" }),
      tx({ amount: -30, pfc_primary: "TRANSFER_IN", name: "Zelle from Bob" }),
    ]
    const r = incomeBySource(txs, "2028-03")
    expect(r.find((s) => s.kind === "payroll")!.total).toBe(2000)
    expect(r.find((s) => s.kind === "peer")!.total).toBe(30)
  })
})

describe("incomePattern", () => {
  it("computes count and mean gap", () => {
    const now = new Date(2028, 5, 30)
    const day = (k: number) => iso(new Date(2028, 5, 30 - 29 + k))
    const txs = [0, 14, 29].map((k) => tx({ date: day(k), amount: -1000, pfc_primary: "INCOME", name: "ACME" }))
    const r = incomePattern(txs, 90, now)
    expect(r.count).toBe(3)
    expect(r.avgGapDays).toBe(14.5)
    expect(r.avgAmount).toBe(1000)
    expect(r.last!.date).toBe(day(29))
  })
})
