/**
 * Core budget model.
 *
 * Everything here is pure (no React, no storage) so it can be reused by a
 * server, tests, or a future data integration. Swap the defaults in
 * `createDefaultState()` for real data when you hook up live sources.
 */

export const CURRENCY = "USD"
export const LOCALE = "en-US"

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type Frequency = "weekly" | "fortnightly" | "monthly" | "quarterly" | "yearly"

/** How often your paycheck lands. Semimonthly = the 15th and the last day of the month. */
export type PayFrequency = "weekly" | "fortnightly" | "semimonthly" | "monthly"

export type CategoryId = "fixed" | "food" | "lifestyle" | "health" | "buffer"

export interface BudgetItem {
  id: string
  name: string
  amount: number
  frequency: Frequency
  category: CategoryId
  /** Switched-off items stay in the list but don't count toward totals. */
  enabled: boolean
  /** Any past or future due date (YYYY-MM-DD); later ones are worked out from the frequency. */
  dueDate?: string
}

export interface IncomeSettings {
  grossAnnual: number
  /** 401(k) contribution as a % of gross salary (pre-tax). */
  retirementPct: number
  /** Flat state + local income tax estimate, %. */
  stateTaxPct: number
  /** Health insurance, HSA, FSA etc. — reduces taxable income. */
  preTaxDeductionsMonthly: number
  /** Union dues, Roth, garnishments etc. */
  postTaxDeductionsMonthly: number
  /** When true, use the real payslip figure instead of the estimate. */
  overrideEnabled: boolean
  overrideMonthly: number
  payFrequency: PayFrequency
  /** Any past or upcoming payday (YYYY-MM-DD); not used for semimonthly. */
  nextPayday: string
}

export interface Goals {
  savingsName: string
  savingsTarget: number
  savingsSaved: number
  savingsMonthly: number
  /** Emergency fund target expressed as months of spending. */
  emergencyMonths: number
  emergencySaved: number
  emergencyMonthly: number
}

export interface WhatIf {
  /** % cut per category, 0–100. */
  cuts: Record<CategoryId, number>
  /** % change to take-home pay, e.g. -10 or +5. */
  incomeChange: number
}

export interface BudgetState {
  version: 1
  income: IncomeSettings
  items: BudgetItem[]
  goals: Goals
  whatIf: WhatIf
  /** Total money across all accounts — shown as "My money". */
  totalBalance: number
  updatedAt: string
}

/* ------------------------------------------------------------------ */
/* Frequencies & categories                                            */
/* ------------------------------------------------------------------ */

export const FREQUENCY_FACTOR: Record<Frequency, number> = {
  weekly: 52 / 12,
  fortnightly: 26 / 12,
  monthly: 1,
  quarterly: 1 / 3,
  yearly: 1 / 12,
}

export const FREQUENCY_LABEL: Record<Frequency, string> = {
  weekly: "Weekly",
  fortnightly: "Fortnightly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
}

export const FREQUENCIES: Frequency[] = ["weekly", "fortnightly", "monthly", "quarterly", "yearly"]

export interface CategoryMeta {
  id: CategoryId
  name: string
  tagline: string
  /** Property-group colour band classes (full literal strings for Tailwind). */
  band: string
  bandText: string
}

export const CATEGORIES: CategoryMeta[] = [
  { id: "fixed", name: "Fixed bills", tagline: "Rent, utilities, insurance", band: "bg-secondary", bandText: "text-secondary-foreground" },
  { id: "food", name: "Food", tagline: "Groceries, lunches, takeaway", band: "bg-accent", bandText: "text-accent-foreground" },
  { id: "lifestyle", name: "Lifestyle", tagline: "Going out, transport, subscriptions, trips", band: "bg-[hsl(325.9_63.3%_52%)]", bandText: "text-primary-foreground" },
  { id: "health", name: "Health & wellness", tagline: "Gym, dental, prescriptions", band: "bg-success", bandText: "text-success-foreground" },
  { id: "buffer", name: "Buffer", tagline: "A cushion for the unexpected", band: "bg-warning", bandText: "text-warning-foreground" },
]

export const categoryById = (id: CategoryId) => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0]

export const SAVINGS_BAND = "bg-primary"
export const EMERGENCY_BAND = "bg-[hsl(206.2_71.2%_74.1%)]"
export const LEFTOVER_BAND = "bg-card"

/* ------------------------------------------------------------------ */
/* Income estimate (2025 US federal, single filer, standard deduction) */
/* ------------------------------------------------------------------ */

const STANDARD_DEDUCTION = 15000
const RETIREMENT_LIMIT = 23500
const SS_WAGE_BASE = 176100
const FEDERAL_BRACKETS: Array<[number, number]> = [
  [11925, 0.1],
  [48475, 0.12],
  [103350, 0.22],
  [197300, 0.24],
  [250525, 0.32],
  [626350, 0.35],
  [Infinity, 0.37],
]

function federalTax(taxable: number) {
  let tax = 0
  let prev = 0
  for (const [cap, rate] of FEDERAL_BRACKETS) {
    if (taxable > prev) tax += (Math.min(taxable, cap) - prev) * rate
    prev = cap
  }
  return tax
}

export interface IncomeBreakdown {
  grossMonthly: number
  retirementMonthly: number
  preTaxMonthly: number
  federalMonthly: number
  ficaMonthly: number
  stateMonthly: number
  postTaxMonthly: number
  estimatedNetMonthly: number
  effectiveTaxRate: number
}

export function estimateIncome(inc: IncomeSettings): IncomeBreakdown {
  const gross = Math.max(0, inc.grossAnnual)
  const retirement = Math.min(gross * (Math.max(0, inc.retirementPct) / 100), RETIREMENT_LIMIT)
  const preTax = Math.max(0, inc.preTaxDeductionsMonthly) * 12
  const postTax = Math.max(0, inc.postTaxDeductionsMonthly) * 12

  const federal = federalTax(Math.max(0, gross - retirement - preTax - STANDARD_DEDUCTION))
  const ficaBase = Math.max(0, gross - preTax)
  const fica = Math.min(ficaBase, SS_WAGE_BASE) * 0.062 + ficaBase * 0.0145 + Math.max(0, ficaBase - 200000) * 0.009
  const state = Math.max(0, gross - retirement - preTax) * (Math.max(0, inc.stateTaxPct) / 100)

  const net = gross - retirement - preTax - federal - fica - state - postTax
  return {
    grossMonthly: gross / 12,
    retirementMonthly: retirement / 12,
    preTaxMonthly: preTax / 12,
    federalMonthly: federal / 12,
    ficaMonthly: fica / 12,
    stateMonthly: state / 12,
    postTaxMonthly: postTax / 12,
    estimatedNetMonthly: Math.max(0, net / 12),
    effectiveTaxRate: gross > 0 ? (federal + fica + state) / gross : 0,
  }
}

/* ------------------------------------------------------------------ */
/* Summary                                                             */
/* ------------------------------------------------------------------ */

export const monthlyOf = (item: Pick<BudgetItem, "amount" | "frequency">) =>
  Math.max(0, item.amount) * FREQUENCY_FACTOR[item.frequency]

export interface Summary {
  income: IncomeBreakdown
  takeHome: number
  byCategory: Record<CategoryId, number>
  totalSpending: number
  savings: number
  emergency: number
  totalSaving: number
  leftover: number
  savingsRate: number
}

export function summarize(state: BudgetState, scenario?: WhatIf): Summary {
  const income = estimateIncome(state.income)
  let takeHome = state.income.overrideEnabled ? Math.max(0, state.income.overrideMonthly) : income.estimatedNetMonthly
  if (scenario) takeHome *= 1 + scenario.incomeChange / 100

  const byCategory: Record<CategoryId, number> = { fixed: 0, food: 0, lifestyle: 0, health: 0, buffer: 0 }
  for (const item of state.items) {
    if (!item.enabled) continue
    const cut = scenario ? (scenario.cuts[item.category] ?? 0) / 100 : 0
    byCategory[item.category] += monthlyOf(item) * (1 - cut)
  }
  const totalSpending = Object.values(byCategory).reduce((a, b) => a + b, 0)
  const savings = Math.max(0, state.goals.savingsMonthly)
  const emergency = Math.max(0, state.goals.emergencyMonthly)
  const totalSaving = savings + emergency
  return {
    income,
    takeHome,
    byCategory,
    totalSpending,
    savings,
    emergency,
    totalSaving,
    leftover: takeHome - totalSpending - totalSaving,
    savingsRate: takeHome > 0 ? totalSaving / takeHome : 0,
  }
}

export const isScenarioActive = (w: WhatIf) => w.incomeChange !== 0 || Object.values(w.cuts).some((c) => c > 0)

export const emptyCuts = (): Record<CategoryId, number> => ({ fixed: 0, food: 0, lifestyle: 0, health: 0, buffer: 0 })

/** Months until `remaining` is covered at `monthly`. 0 = done, null = never. */
export function monthsTo(remaining: number, monthly: number): number | null {
  if (remaining <= 0) return 0
  if (monthly <= 0) return null
  return Math.ceil(remaining / monthly)
}

export function etaLabel(months: number | null) {
  if (months === 0) return "Target reached"
  if (months === null) return "Add a monthly amount"
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return `${months} mo · ${d.toLocaleString(LOCALE, { month: "short", year: "numeric" })}`
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

const money0 = new Intl.NumberFormat(LOCALE, { style: "currency", currency: CURRENCY, maximumFractionDigits: 0 })
const money2 = new Intl.NumberFormat(LOCALE, { style: "currency", currency: CURRENCY, minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const fmt = (n: number) => money0.format(Math.round(n) || 0)
export const fmt2 = (n: number) => money2.format(n || 0)
export const pct = (n: number) => (Number.isFinite(n) ? `${Math.round(n * 100)}%` : "—")

/* ------------------------------------------------------------------ */
/* Due dates                                                           */
/* ------------------------------------------------------------------ */

const MONTH_STEP: Partial<Record<Frequency, number>> = { monthly: 1, quarterly: 3, yearly: 12 }
const DAY_STEP: Partial<Record<Frequency, number>> = { weekly: 7, fortnightly: 14 }

/** Strictly parse YYYY-MM-DD as a local date; returns null for anything malformed (e.g. 2026-02-31). */
export function parseDay(s: string | undefined | null): Date | null {
  if (!s) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return null
  const [y, mo, d] = [Number(m[1]), Number(m[2]) - 1, Number(m[3])]
  const date = new Date(y, mo, d)
  if (date.getFullYear() !== y || date.getMonth() !== mo || date.getDate() !== d) return null
  return date
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

/** Anchor + n months, keeping the anchor's day and clamping to month end (Jan 31 → Feb 28/29 → Mar 31). */
function addMonthsClamped(anchor: Date, n: number) {
  const y = anchor.getFullYear()
  const m = anchor.getMonth() + n
  const last = new Date(y, m + 1, 0).getDate()
  return new Date(y, m, Math.min(anchor.getDate(), last))
}

/** Next time this bill is due on or after `today`, or null if it has no valid due date. */
export function upcomingDueDate(item: Pick<BudgetItem, "dueDate" | "frequency">, today = new Date()): Date | null {
  const anchor = parseDay(item.dueDate)
  if (!anchor) return null
  const t = startOfDay(today)
  if (anchor >= t) return anchor
  const days = DAY_STEP[item.frequency]
  if (days) {
    const diff = Math.round((t.getTime() - anchor.getTime()) / 86400000)
    const k = Math.ceil(diff / days)
    return new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + k * days)
  }
  const months = MONTH_STEP[item.frequency] ?? 1
  // Always step from the original anchor so short months never drift the day.
  let k = Math.max(0, Math.floor(((t.getFullYear() - anchor.getFullYear()) * 12 + t.getMonth() - anchor.getMonth()) / months))
  let next = addMonthsClamped(anchor, k * months)
  while (next < t) next = addMonthsClamped(anchor, ++k * months)
  return next
}

export const daysUntil = (d: Date, today = new Date()) => Math.round((startOfDay(d).getTime() - startOfDay(today).getTime()) / 86400000)

export function dueLabel(days: number) {
  if (days === 0) return "Today"
  if (days === 1) return "Tomorrow"
  return `In ${days} days`
}

/* ------------------------------------------------------------------ */
/* Pay cycles                                                          */
/* ------------------------------------------------------------------ */

export const PAYS_PER_YEAR: Record<PayFrequency, number> = { weekly: 52, fortnightly: 26, semimonthly: 24, monthly: 12 }

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

function nextSemimonthly(t: Date): Date {
  const mid = new Date(t.getFullYear(), t.getMonth(), 15)
  if (mid >= t) return mid
  const end = new Date(t.getFullYear(), t.getMonth() + 1, 0)
  if (end >= t) return end
  return new Date(t.getFullYear(), t.getMonth() + 1, 15)
}

/** The next `count` paydays on or after today. Empty if no payday is set. */
export function upcomingPaydays(inc: IncomeSettings, count: number, today = new Date()): Date[] {
  const out: Date[] = []
  let cursor = startOfDay(today)
  if (inc.payFrequency === "semimonthly") {
    while (out.length < count) {
      const d = nextSemimonthly(cursor)
      out.push(d)
      cursor = addDays(d, 1)
    }
    return out
  }
  if (!parseDay(inc.nextPayday)) return out
  while (out.length < count) {
    const d = upcomingDueDate({ dueDate: inc.nextPayday, frequency: inc.payFrequency as Frequency }, cursor)
    if (!d) break
    out.push(d)
    cursor = addDays(d, 1)
  }
  return out
}

/** Every due date of `item` in [start, end). */
export function occurrencesBetween(item: Pick<BudgetItem, "dueDate" | "frequency">, start: Date, end: Date): Date[] {
  const out: Date[] = []
  let cursor = start
  for (let i = 0; i < 60; i++) {
    const d = upcomingDueDate(item, cursor)
    if (!d || d >= end) break
    out.push(d)
    cursor = addDays(d, 1)
  }
  return out
}

export interface PayCycle {
  start: Date
  end: Date
  /** The "now" window is paid from your balance; the rest from one paycheck. */
  isNow: boolean
  funds: number
  bills: Array<{ item: BudgetItem; date: Date; paid: boolean }>
  /** Unpaid bills only — paid ones have already left My money. */
  billsTotal: number
  remaining: number
}

/** Groups dated bills into the windows between paydays: now → payday 1 → payday 2 → … */
export function payCycles(state: BudgetState, takeHomeMonthly: number, count = 3, today = new Date(), isPaid?: (item: BudgetItem, date: Date) => boolean) {
  const paycheck = (takeHomeMonthly * 12) / PAYS_PER_YEAR[state.income.payFrequency]
  const enabled = state.items.filter((i) => i.enabled)
  const dated = enabled.filter((i) => parseDay(i.dueDate))
  const paydays = upcomingPaydays(state.income, count, today)
  const t = startOfDay(today)
  const bounds = [t, ...paydays]
  const cycles: PayCycle[] = []
  for (let k = 0; k < bounds.length - 1; k++) {
    const start = bounds[k]
    const end = bounds[k + 1]
    if (start.getTime() === end.getTime()) continue
    const bills = dated
      .flatMap((item) => occurrencesBetween(item, start, end).map((date) => ({ item, date, paid: isPaid?.(item, date) ?? false })))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
    const billsTotal = bills.reduce((s, b) => s + (b.paid ? 0 : Math.max(0, b.item.amount)), 0)
    const funds = k === 0 ? state.totalBalance : paycheck
    cycles.push({ start, end, isNow: k === 0, funds, bills, billsTotal, remaining: funds - billsTotal })
  }
  return { cycles, paycheck, undated: enabled.length - dated.length }
}

/* ------------------------------------------------------------------ */
/* Defaults                                                            */
/* ------------------------------------------------------------------ */

export const makeId = () => Math.random().toString(36).slice(2, 10)

const item = (category: CategoryId, name: string, amount: number, frequency: Frequency, enabled = true): BudgetItem => ({
  id: makeId(),
  name,
  amount,
  frequency,
  category,
  enabled,
})

/** New users start blank — every figure is theirs to fill in. */
export function createDefaultState(): BudgetState {
  return {
    version: 1,
    income: {
      grossAnnual: 0,
      retirementPct: 0,
      stateTaxPct: 0,
      preTaxDeductionsMonthly: 0,
      postTaxDeductionsMonthly: 0,
      overrideEnabled: false,
      overrideMonthly: 0,
      payFrequency: "fortnightly",
      nextPayday: "",
    },
    items: [],
    goals: {
      savingsName: "Savings goal",
      savingsTarget: 0,
      savingsSaved: 0,
      savingsMonthly: 0,
      emergencyMonths: 3,
      emergencySaved: 0,
      emergencyMonthly: 0,
    },
    whatIf: { cuts: emptyCuts(), incomeChange: 0 },
    totalBalance: 0,
    updatedAt: new Date().toISOString(),
  }
}

/** Example budget, handy for trying the app out. */
export function createSampleState(): BudgetState {
  return {
    version: 1,
    income: {
      grossAnnual: 85000,
      retirementPct: 6,
      stateTaxPct: 5,
      preTaxDeductionsMonthly: 180,
      postTaxDeductionsMonthly: 0,
      overrideEnabled: false,
      overrideMonthly: 0,
      payFrequency: "fortnightly",
      nextPayday: "",
    },
    items: [
      item("fixed", "Rent", 1800, "monthly"),
      item("fixed", "Utilities", 140, "monthly"),
      item("fixed", "Internet", 60, "monthly"),
      item("fixed", "Phone bill", 45, "monthly", false),
      item("fixed", "Car insurance", 1200, "yearly"),
      item("food", "Groceries", 110, "weekly"),
      item("food", "Work lunches", 40, "weekly"),
      item("food", "Takeaway", 30, "weekly"),
      item("lifestyle", "Going out", 60, "weekly"),
      item("lifestyle", "Transport", 35, "weekly"),
      item("lifestyle", "Streaming", 25, "monthly"),
      item("lifestyle", "Clothing", 600, "yearly"),
      item("lifestyle", "Holidays", 2400, "yearly"),
      item("health", "Gym", 55, "monthly"),
      item("health", "Dental", 300, "yearly"),
      item("health", "Prescriptions", 15, "monthly"),
      item("buffer", "Unexpected", 150, "monthly"),
      item("buffer", "Gifts", 500, "yearly"),
    ],
    goals: {
      savingsName: "House deposit",
      savingsTarget: 30000,
      savingsSaved: 6500,
      savingsMonthly: 400,
      emergencyMonths: 3,
      emergencySaved: 4000,
      emergencyMonthly: 250,
    },
    whatIf: { cuts: emptyCuts(), incomeChange: 0 },
    totalBalance: 12500,
    updatedAt: new Date().toISOString(),
  }
}

/** Merge possibly-partial persisted data onto defaults so old saves never crash. */
export function normalizeState(raw: unknown): BudgetState {
  const def = createDefaultState()
  if (!raw || typeof raw !== "object") return def
  const r = raw as Partial<BudgetState>
  return {
    ...def,
    ...r,
    version: 1,
    income: { ...def.income, ...(r.income ?? {}) },
    goals: { ...def.goals, ...(r.goals ?? {}) },
    whatIf: {
      incomeChange: r.whatIf?.incomeChange ?? 0,
      cuts: { ...emptyCuts(), ...(r.whatIf?.cuts ?? {}) },
    },
    items: Array.isArray(r.items) ? r.items : def.items,
    totalBalance: typeof r.totalBalance === "number" && Number.isFinite(r.totalBalance) ? r.totalBalance : def.totalBalance,
  }
}

/* ------------------------------------------------------------------ */
/* CSV export                                                          */
/* ------------------------------------------------------------------ */

const esc = (v: string | number) => {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(state: BudgetState): string {
  const s = summarize(state)
  const rows: Array<Array<string | number>> = [["Section", "Category", "Item", "Amount", "Frequency", "Monthly equivalent", "Active"]]

  for (const it of state.items) {
    rows.push(["Spending", categoryById(it.category).name, it.name, it.amount.toFixed(2), FREQUENCY_LABEL[it.frequency], monthlyOf(it).toFixed(2), it.enabled ? "Yes" : "No"])
  }
  rows.push([])
  rows.push(["Income", "Gross salary", "", state.income.grossAnnual.toFixed(2), "Yearly", s.income.grossMonthly.toFixed(2), ""])
  rows.push(["Income", "401(k)", `${state.income.retirementPct}%`, "", "Monthly", s.income.retirementMonthly.toFixed(2), ""])
  rows.push(["Income", "Federal tax (est.)", "", "", "Monthly", s.income.federalMonthly.toFixed(2), ""])
  rows.push(["Income", "FICA (est.)", "", "", "Monthly", s.income.ficaMonthly.toFixed(2), ""])
  rows.push(["Income", "State tax (est.)", `${state.income.stateTaxPct}%`, "", "Monthly", s.income.stateMonthly.toFixed(2), ""])
  rows.push(["Income", "Take-home", state.income.overrideEnabled ? "Payslip override" : "Estimated", "", "Monthly", s.takeHome.toFixed(2), ""])
  rows.push([])
  rows.push(["Goals", "Savings", state.goals.savingsName, state.goals.savingsTarget.toFixed(2), "Target", state.goals.savingsMonthly.toFixed(2), `Saved ${state.goals.savingsSaved}`])
  rows.push(["Goals", "Emergency fund", `${state.goals.emergencyMonths} months`, (s.totalSpending * state.goals.emergencyMonths).toFixed(2), "Target", state.goals.emergencyMonthly.toFixed(2), `Saved ${state.goals.emergencySaved}`])
  rows.push([])
  for (const c of CATEGORIES) rows.push(["Summary", c.name, "", "", "Monthly", s.byCategory[c.id].toFixed(2), ""])
  rows.push(["Summary", "Total spending", "", "", "Monthly", s.totalSpending.toFixed(2), ""])
  rows.push(["Summary", "Total saving", "", "", "Monthly", s.totalSaving.toFixed(2), ""])
  rows.push(["Summary", "Left over", "", "", "Monthly", s.leftover.toFixed(2), ""])

  return rows.map((r) => r.map(esc).join(",")).join("\n")
}

export function downloadCsv(state: BudgetState) {
  const blob = new Blob([toCsv(state)], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `budget-${new Date().toISOString().slice(0, 7)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
