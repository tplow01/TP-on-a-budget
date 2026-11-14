# Tracker Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the four-tab budget planner with a three-tab money tracker (Total, Spending, Income) in the existing Monopoly skin, backed by linked-bank data plus a new daily balance-snapshot table.

**Architecture:** Pure analytics functions live in `client/lib/` and are unit-tested with vitest. One `useTransactions(90)` call at the page level feeds three tab components under `client/components/tracker/`. The Supabase Edge Function gains a snapshot upsert and an `investments` product; two SQL migrations add `balance_snapshots` and `manual_accounts`.

**Tech Stack:** Vite + React 18, Tailwind v4 with the compiled DESIGN.md tokens, framer-motion (already present), Supabase JS, Deno Edge Function, vitest (new dev dep in `apps/vite`).

**Spec:** `docs/superpowers/specs/2026-11-13-tracker-redesign-design.md`

## Global Constraints

- Keep the Monopoly skin: cards are `border-4 border-foreground bg-card shadow-[4px_4px_0_0_var(--foreground)]`; band headers are `border-b-4 border-foreground` with a band color; labels `font-label uppercase tracking-[0.06em]`; numbers `font-caption` (Space Mono); headlines `font-display font-black`.
- Band colors: red (`bg-primary`) = Total; blue (`bg-secondary`) = out; green (`bg-success`) = in; teal `bg-[hsl(199_60%_45%)]` = projection; yellow (`bg-warning`) = notices.
- Selected state via `aria-selected` / `aria-pressed` / `aria-expanded` with Tailwind variants, never swapped base classes (AGENTS.md).
- No new chart library; inline SVG only.
- Credit-card payments and own-account transfers stay excluded from spend and income (`categoryOf` returns null; `isIncome` false).
- Calendar-month framing everywhere; history capped at 90 days of transactions.
- Run `pnpm --filter @vibe/app-vite typecheck && pnpm --filter @vibe/app-vite build:client` before every commit that touches `client/`.
- Commit after each task with a conventional message and the trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

## Review Focus

1. Month with zero transactions for a lens (e.g. Recurring tab with no repeats): every tab renders an empty-state line, never an empty card or NaN. (Task 6 test.)
2. Same-days comparison when last month has fewer days than today's date (Mar 31 vs Feb): `sameDaysCompare` clamps and never throws. (Task 3 test.)
3. Net worth day series with gaps: a day with no snapshot carries the previous value forward, and a day before any snapshot is omitted, not zero. (Task 2 test.)
4. Credit and loan balances subtract from total; investment and depository add. Manual `credit` type also subtracts. (Task 2 test.)
5. Recurring detection must not flag two same-amount charges one day apart as recurring. (Task 4 test.)

---

### Task 1: Test harness + SQL migrations + Edge Function snapshot

**Files:**
- Modify: `apps/vite/package.json` (add `vitest` devDependency, script `"test": "vitest run"`)
- Create: `apps/vite/vitest.config.ts`
- Create: `apps/vite/supabase/migrations/20261113000000_balance_snapshots.sql`
- Create: `apps/vite/supabase/migrations/20261113000100_manual_accounts.sql`
- Modify: `apps/vite/supabase/functions/plaid/index.ts:45-65` (`syncItem`), `:226` (products)

**Interfaces:**
- Produces: table `public.balance_snapshots(user_id uuid, account_id text, day date, current numeric, available numeric, type text, primary key (account_id, day))`, RLS select to authenticated where `auth.uid() = user_id`.
- Produces: table `public.manual_accounts(id uuid pk default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade, name text not null, type text not null check (type in ('cash','investment','credit','other')), balance numeric not null default 0, updated_at timestamptz not null default now())`, RLS select/insert/update/delete own.

- [ ] **Step 1: Add vitest**

Run: `pnpm --filter @vibe/app-vite add -D vitest@^2`
Create `apps/vite/vitest.config.ts` with `export default { test: { include: ["client/**/*.test.ts"] } }`. Add `"test": "vitest run"` to scripts.

- [ ] **Step 2: Write the two migrations** following the policy style in `20261109010000_transaction_categories.sql` (drop policy if exists, then create).

- [ ] **Step 3: Snapshot in `syncItem`**

After the `bank_accounts` upsert, build `snaps = rows.map(r => ({ user_id, account_id: r.account_id, day: new Date().toISOString().slice(0,10), current: r.current, available: r.available, type: r.type }))` and `admin.from("balance_snapshots").upsert(snaps, { onConflict: "account_id,day" })`. Throw on error.

- [ ] **Step 4: Add investments product**

Change `products: ["transactions"]` to `products: ["transactions"], optional_products: ["investments"]` in the `create_link_token` body.

- [ ] **Step 5: Verify**

Run: `pnpm --filter @vibe/app-vite test` → "No test files found" exit 0 is acceptable here. Run `deno check apps/vite/supabase/functions/plaid/index.ts` if deno is installed; otherwise skip and note it.

- [ ] **Step 6: Commit** `feat: balance snapshots, manual accounts tables, vitest harness`

---

### Task 2: Net worth analytics (`lib/networth.ts`)

**Files:**
- Create: `apps/vite/client/lib/networth.ts`
- Create: `apps/vite/client/lib/networth.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface Snapshot { account_id: string; day: string; current: number | null; available: number | null; type: string }
  export interface ManualAccount { id: string; name: string; type: "cash"|"investment"|"credit"|"other"; balance: number; updated_at: string }
  export type Bucket = "cash" | "investments" | "credit"
  export function bucketOf(type: string): Bucket          // depository→cash, investment/brokerage→investments, credit/loan→credit, else cash
  export function signedBalance(type: string, current: number | null, available: number | null): number  // depository uses available ?? current; credit/loan negative
  export function totalOf(accounts: BankAccount[], manual: ManualAccount[]): { total: number; byBucket: Record<Bucket, number> }
  export function daySeries(snaps: Snapshot[], manualTotal: number, today?: Date): Array<{ day: string; total: number }>  // one entry per day from first snapshot day to today, carry-forward
  export function monthDelta(series: Array<{day:string;total:number}>, today?: Date): number | null   // today total minus first entry of this calendar month; null if none
  export async function readSnapshots(sinceIso: string): Promise<Snapshot[]>
  export async function readManualAccounts(): Promise<ManualAccount[]>
  export async function upsertManualAccount(a: Omit<ManualAccount,"updated_at"> & { id?: string }): Promise<void>
  export async function deleteManualAccount(id: string): Promise<void>
  ```
- Consumes: `BankAccount` from `lib/plaid.ts`, `supabase` from `lib/supabase.ts`.

- [ ] **Step 1: Write failing tests** in `networth.test.ts`:
  - `signedBalance("credit", 424, null) === -424`; `signedBalance("depository", 9612.1, 9534.54) === 9534.54`; `signedBalance("investment", 15200, null) === 15200`.
  - `totalOf` with one depository (9534.54), one investment (15200), one credit (424) and a manual credit of 100 → `total === 24210.54`, `byBucket.credit === -524`.
  - `daySeries` with snapshots on day 1 and day 3 of a 4-day window → 4 entries, day 2 equals day 1, day 4 equals day 3; manualTotal added to every day; an account that first appears on day 3 is not back-filled to 0 on days 1-2 but the series still starts on day 1.
  - `monthDelta` returns null when the series has no entry in the current month.
- [ ] **Step 2: Run** `pnpm --filter @vibe/app-vite test` → FAIL (module missing).
- [ ] **Step 3: Implement** the functions above. `readSnapshots` selects from `balance_snapshots` with `.gte("day", sinceIso)`.
- [ ] **Step 4: Run tests** → PASS.
- [ ] **Step 5: Commit** `feat: net worth analytics`

---

### Task 3: Spending/income analytics (`lib/insights.ts`)

**Files:**
- Create: `apps/vite/client/lib/insights.ts`
- Create: `apps/vite/client/lib/insights.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export function merchantKey(t: Pick<Txn,"merchant_name"|"name">): string          // merchant_name ?? name, trimmed, title-cased, digits/#-suffixes stripped
  export interface MerchantAgg { key: string; total: number; count: number; category: CategoryId | null; last: string }
  export function spendByCategory(txs: Txn[], month: string, overrides?: CategoryOverrides): Array<{ category: CategoryId; total: number; merchants: MerchantAgg[] }> // sorted total desc, merchants desc
  export function spendByMerchant(txs: Txn[], month: string, overrides?: CategoryOverrides): MerchantAgg[]
  export function sameDaysCompare(txs: Txn[], today: Date, pick: (t: Txn) => number): { thisMonth: number; lastMonthToDate: number; delta: number }
  export function incomeBySource(txs: Txn[], month: string): Array<{ source: string; kind: "payroll"|"peer"|"other"; total: number; entries: IncomeEntry[] }>
  export function incomePattern(txs: Txn[], days?: number): { count: number; avgGapDays: number | null; avgAmount: number; last: IncomeEntry | null }  // over last `days` (default 90)
  ```
- Consumes: `Txn`, `CategoryOverrides`, `categoryOf`, `isIncome`, `incomeTxns`, `IncomeEntry`, `monthKey` from `lib/transactions.ts`; `CategoryId` from `lib/budget.ts`.

- [ ] **Step 1: Write failing tests**:
  - `merchantKey({merchant_name:null,name:"TRADER JOE'S #123"}) === "Trader Joe's"`.
  - `spendByCategory` groups three food txns under `food` with two merchants, ignores a `LOAN_PAYMENTS_CREDIT_CARD_PAYMENT` txn, respects an override moving one txn to `lifestyle`.
  - `sameDaysCompare` with today = 2028-03-31 and a txn on 2028-02-28: `lastMonthToDate` includes it and the call does not throw.
  - `incomeBySource` puts `pfc_primary:"INCOME"` under `payroll`, a Zelle inflow under `peer`.
  - `incomePattern` with deposits on day 0, 14, 29 → `count 3`, `avgGapDays 14.5`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.** `sameDaysCompare`: last-month window is the 1st through `min(today.getDate(), daysInLastMonth)`.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat: spending and income analytics`

---

### Task 4: Recurring detection (`lib/recurring.ts`)

**Files:**
- Create: `apps/vite/client/lib/recurring.ts`
- Create: `apps/vite/client/lib/recurring.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface RecurringGroup { key: string; cadence: "weekly" | "monthly"; avgAmount: number; count: number; last: string; nextExpected: string; txns: Txn[] }
  export function detectRecurring(txs: Txn[], overrides?: CategoryOverrides): { recurring: RecurringGroup[]; oneOff: Txn[] }
  ```
  Rules (spec): same `merchantKey`, ≥2 spend txns, every amount within ±15% of the group mean, consecutive gaps all within 6–8 days (weekly) or 25–35 days (monthly). `nextExpected = last + 7 or +30 days`. `oneOff` = spend txns not in any group, newest first.
- Consumes: `merchantKey` from Task 3; `categoryOf` from `lib/transactions.ts`.

- [ ] **Step 1: Write failing tests**: Netflix 15.49 on Oct 10 and Nov 9 → one monthly group with `nextExpected "2026-12-09"`; two 40.00 charges one day apart → not recurring; a group with amounts 50 and 70 → not recurring; a credit-card-payment txn never appears in `oneOff`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat: recurring charge detection`

---

### Task 5: Shell — three tabs, shared data, Settings additions

**Files:**
- Modify: `apps/vite/client/components/budget/TabBar.tsx` (replace four cells with three: `total`, `spend`, `income`; keep the hotel token and strip pattern; bands red/blue/green; icons `TycoonIcon`, `Receipt`, `Landmark`)
- Modify: `apps/vite/client/pages/Index.tsx` (tab ids, `useTransactions(90)` once, pass `txs`, `overrides`, `accounts`, `manual`, `snapshots` down; drop `BoardHeader` full mode on Total; keep compact mode with title for the other two)
- Modify: `apps/vite/client/components/budget/ProfileSheet.tsx` (add `<ManualAccountsSection />` after `BankSection`; add `<TaxEstimateSection />` holding the salary inputs and take-home table from the old `IncomePanel`)
- Create: `apps/vite/client/components/tracker/ManualAccountsSection.tsx`
- Create: `apps/vite/client/components/tracker/TaxEstimateSection.tsx`
- Create: `apps/vite/client/hooks/useTrackerData.ts`
- Delete: `BoardOverview.tsx`, `SpendingBoard.tsx`, `GoalsPanel.tsx`, `IncomePanel.tsx`, `PayCycleCard.tsx`, `SpendInsights.tsx`

**Interfaces:**
- Produces: `export type TabId = "total" | "spend" | "income"` in `TabBar.tsx`.
- Produces: `useTrackerData(): { txs: Txn[] | null; overrides: CategoryOverrides; accounts: BankAccount[]; manual: ManualAccount[]; snapshots: Snapshot[]; reload(): void }` — reads all five, re-reads on `BANK_UPDATED_EVENT`.
- Produces three placeholder components (replaced in Tasks 6–8) at `components/tracker/TotalTab.tsx`, `SpendTab.tsx`, `IncomeTab.tsx`, each `({ data }: { data: ReturnType<typeof useTrackerData>; state: BudgetState; actions: BudgetActions })` rendering a single dashed notice card with the tab name.
- Consumes: Tasks 2–4 exports.

- [ ] **Step 1: TabBar** three cells, hotel token preserved. `Index.tsx` wires `useTrackerData` and the three tabs; `TITLES = { total: "My total", spend: "Spending", income: "Income" }`.
- [ ] **Step 2: ManualAccountsSection**: list of manual accounts (name, type select, `NumberInput` balance, delete), "Add manual account" dashed button, saves via `upsertManualAccount`, dispatches `BANK_UPDATED_EVENT`. Yellow band "Manual accounts" with caption "For balances your bank can't share. Linked accounts stay the main source."
- [ ] **Step 3: TaxEstimateSection**: move the "Your salary" grid, take-home `<dl>`, and payslip toggle from the old `IncomePanel` verbatim; brown band. Delete the listed files and fix imports.
- [ ] **Step 4: Verify** typecheck + build pass; dev server shows three tabs, hotel slides, each tab shows its placeholder card, Settings shows the new sections.
- [ ] **Step 5: Commit** `refactor: three-tab tracker shell, manual accounts, tax estimate in settings`

---

### Task 6: Total tab

**Files:**
- Create/replace: `apps/vite/client/components/tracker/TotalTab.tsx`
- Create: `apps/vite/client/components/tracker/LineChart.tsx`
- Create: `apps/vite/client/components/tracker/AccountDetail.tsx`

**Interfaces:**
- Produces: `LineChart({ points: Array<{day:string; total:number}>, className?: string })` inline SVG polyline, 2px `currentColor` stroke, last point marked with a `var(--primary)` dot, baseline label of first and last day in `font-caption text-[10px]`.
- Produces: `AccountDetail({ account: BankAccount | ManualAccount; txs: Txn[]; snapshots: Snapshot[]; onClose(): void })` rendered as a bottom sheet using the same `SHEET` motion as `ProfileSheet`.
- Consumes: Task 2 functions; `monthPace` from `lib/transactions.ts`; `fmt`, `fmt2` from `lib/budget.ts`.

- [ ] **Step 1: Hero card** red band "My total" + right caption today's date; body: `CountUp` display 56px of `totalOf().total`; line "`▲ +$X this month`" using `monthDelta` (red text when negative, caption "no history yet" when null); `LineChart` of `daySeries`.
- [ ] **Step 2: +/− card**: two tiles (green "In", blue "Out") from `incomeTxns` total and `actualByCategory` total for `monthKey(now)`, and a full-width "Net" tile.
- [ ] **Step 3: "Where it sits" card**: three groups Cash / Investments / Credit using `bucketOf`, rows show name, `institution · subtype ···mask`, balance via `signedBalance`; manual rows get a yellow `manual` pill; tapping a row opens `AccountDetail`. Empty bucket rows are omitted; empty everything → single dashed card with "Link a bank" button calling `onOpenProfile`.
- [ ] **Step 4: At this rate card** (teal band): "Projected month-end total" = total + `monthPace(txs).projectedLeftover`; caption from the spec about early-month noise.
- [ ] **Step 5: Verify** typecheck + build; browser: no console errors, chart draws with ≥2 snapshots, empty state with none.
- [ ] **Step 6: Commit** `feat: Total tab with net worth, in/out, breakdown, projection`

---

### Task 7: Spending tab

**Files:**
- Create/replace: `apps/vite/client/components/tracker/SpendTab.tsx`
- Create: `apps/vite/client/components/tracker/LensTiles.tsx`
- Create: `apps/vite/client/components/tracker/TxnRow.tsx`
- Reuse: `components/budget/DailySpend.tsx` (change it to accept `txs` and `overrides` props instead of fetching)

**Interfaces:**
- Produces: `LensTiles<T extends string>({ options: Array<{id:T;label:string;band:string}>; value: T; onChange(v:T): void })` — the board-tile tablist pattern from the old period selector (role=tablist, `aria-selected`, hotel marker).
- Produces: `TxnRow({ t: Txn; account?: BankAccount; category: CategoryId | null; onRecategorise(id: string, c: CategoryId): void })` — the expand-to-recategorise row from the old `SpendingBoard`, extracted verbatim.
- Consumes: Tasks 3–4.

- [ ] **Step 1: Headline card** blue band "Spent · {Month}" right "{n} days left"; display total; +/− line from `sameDaysCompare` ("$120 more than this time last month", green when less); caption "On pace for {fmt(monthPace.projectedSpend)}".
- [ ] **Step 2: `DailySpend`** under it, now prop-driven.
- [ ] **Step 3: Breakdown card** with `LensTiles` Category / Merchant / Recurring:
  - Category: rows with swatch, name, share bar (`ProgressBar` with the category band), amount; `aria-expanded` toggle reveals merchants (`MerchantAgg`) and, under each merchant, its `TxnRow`s.
  - Merchant: ranked `spendByMerchant` rows, "{count}×" caption, expand → `TxnRow`s.
  - Recurring: group "Recurring" rows (key, cadence pill, avg, "next {date}") then "One-off" `TxnRow`s. Empty lens → one line "Nothing here yet this month." Write a vitest test `SpendTab.empty.test.ts` is **not** required; instead assert in Task 7 Step 5 manually.
- [ ] **Step 4: Verify** typecheck + build; browser: each lens renders with data and with an empty month (temporarily filter `txs` to `[]` to check), hotel marker moves between tiles.
- [ ] **Step 5: Commit** `feat: Spending tab with category, merchant, recurring lenses`

---

### Task 8: Income tab

**Files:**
- Create/replace: `apps/vite/client/components/tracker/IncomeTab.tsx`

**Interfaces:**
- Consumes: `incomeBySource`, `incomePattern`, `sameDaysCompare` (Task 3); `summarize` from `lib/budget.ts` for the optional expected caption.

- [ ] **Step 1: Headline card** green band "Earned · {Month}"; display total; +/− vs last month to date; caption "Last deposit {date} · {source}". If `state.income.grossAnnual > 0 || overrideEnabled`, muted caption "Expected ≈ {fmt(summary.takeHome)}/mo".
- [ ] **Step 2: Breakdown card** "Where it came from": rows per source with kind pill (Payroll green / Peer teal / Other muted), total, `aria-expanded` → deposits list.
- [ ] **Step 3: Pattern card** (brown band "Pattern"): "{count} deposits in 90 days · about every {avgGapDays} days · avg {fmt(avgAmount)}". Empty → "No deposits seen yet."
- [ ] **Step 4: Verify** typecheck + build; browser.
- [ ] **Step 5: Commit** `feat: Income tab with sources and pattern`

---

### Task 9: Cleanup and verification

**Files:**
- Modify: `apps/vite/client/components/budget/BoardHeader.tsx` (remove the full-mode branch and period selector; keep compact)
- Modify: `apps/vite/client/lib/budget.ts` (remove `createSampleState` if unreferenced; keep CSV export reachable from Settings "Data" section)
- Modify: `docs/2026-11-12-ux-stress-test-findings.md` (append a dated note: shared fetch resolved; What-If/Goals removed)

- [ ] **Step 1:** Remove dead code and unused exports; `pnpm --filter @vibe/app-vite typecheck` must pass with no unused-import errors.
- [ ] **Step 2:** `pnpm --filter @vibe/app-vite test && pnpm --filter @vibe/app-vite build:client` → PASS.
- [ ] **Step 3:** Dev server smoke: three tabs, hotel animation, Settings sections, zero console errors.
- [ ] **Step 4: Commit** `chore: remove planner surfaces, finalize tracker`
