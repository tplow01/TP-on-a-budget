# Tracker redesign — design

Date: 2026-11-13. Status: awaiting approval.

## Intent

Turn the app from a budget *planner* into a money *tracker* with three roles, in priority order: **My total** (net worth and where it sits), **Spending** (where money went), **Income** (where money came from). Linked bank data is the source of truth. Keep the Monopoly skin: mint board, 4px black rules, hard offset shadows, property-band card headers, Montserrat caps, Space Mono numbers, and the hotel token that slides onto the active tab.

## Goals

- Open the app and see one number: total across all holdings, with a trend line and the +/− versus the start of the month.
- See spending for the calendar month: headline, +/− versus the same days last month, then a breakdown by **Category → Merchant → Recurring/one-off**.
- See income for the calendar month: headline, +/− versus last month, then a breakdown by source.
- A small "at this rate" projection on Total and Spending.
- History starts when the data starts and grows from there. No backfill promises.

## Non-goals

- Planned bills, category budgets, savings goals, pay-cycle grouping, and "safe to spend" as primary surfaces. They leave the navigation. The pure model in `lib/budget.ts` stays in the repo for now but nothing renders it except the tax estimate in Settings.
- Individual stock positions. Investments appear as account balances only.
- Pay-schedule configuration. Income is observed from deposits, never scheduled.
- Figma mockups. Build directly in code.

## Anti-goals

- Manual entry as the main path. Manual accounts exist, behind Settings, for balances Plaid cannot reach.
- A long single scrolling home. Each tab answers one question.
- Dropping the skin. If a familiar pattern cannot be drawn in the board-game language, adapt the pattern, not the skin.

## Constraints

- Frontend-only Vite app plus one Supabase Edge Function (`plaid`). No new servers.
- Plaid currently requests `products: ["transactions"]` and pulls 90 days. Investment account balances come through `/accounts/get` only if the linked item exposes them; Robinhood-style brokerages need the `investments` product added to the link token. Builder: add `"investments"` to `products` for new links; existing items keep working for cash accounts.
- Balance history does not exist yet. See "Snapshots" below.
- Mobile-first, 480px max, matching the current shell in `pages/Index.tsx`.

## Approaches considered

- **A. Three tabs: Total, Spending, Income** — picked. One role per tab, identical rhythm (headline → +/− → breakdown). Raw transaction feed lives inside Spending and Income. Settings behind the profile button.
- **B. One scrolling Home with drill-ins** — rejected. Monopoly cards are tall; income would sit far down the page.
- **C. Keep the five-tab remake and promote Total** — rejected. Keeps planning surfaces the user wants to recede.

## Decided design

### Shell

- `TabBar` becomes three cells: **Total** (red band, TycoonIcon), **Spending** (blue band, Receipt), **Income** (green band, Landmark). Hotel token animation unchanged.
- `BoardHeader` compact mode is kept for Spending and Income (title + "My total" readout). Full header is replaced by the Total screen's own hero.
- Profile sheet keeps: account, MFA, bank linking, **manual accounts (new, secondary)**, sync status, income tax estimate (moved here from the old Income tab), data reset/delete, legal links.

### Total tab

1. **Hero card**, red band "My total": display number = cash + investments − credit/loan balances across linked and manual accounts. Below it, +/− versus the first snapshot of this calendar month, and a sparkline/line of daily net worth since data began (90-day cap on the chart's x-axis, grows to that).
2. **+/− card**: "In this month" and "Out this month" tiles (green/blue bands) and the net, from transactions.
3. **Breakdown card**, "Where it sits": grouped rows **Cash / Investments / Credit**, each row = account name, institution, mask, balance. Tap a row → account detail (balance history + that account's transactions, newest first).
4. **At this rate card** (teal band): projected month-end total = current total + projected leftover from `monthPace`.
5. Empty state when no account is linked: one card with "Link a bank" CTA.

### Spending tab

1. **Headline card**, blue band "Spent · November": total spent so far, +/− versus the same days last month (reuse the same-days logic from `SpendInsights`), 12-day-style "x days left" caption.
2. **Daily spend** calendar (existing `DailySpend`) directly under the headline, unchanged.
3. **Breakdown card** with three board-tile tabs (same visual as the old Day/Week/Month/Year tiles):
   - **Category**: seven existing categories, each a row with band swatch, amount, share bar. Expand a row → merchants inside it, ranked.
   - **Merchant**: flat ranked list of merchants this month, amount and count, with a tiny 6-month sparkline per merchant when history allows.
   - **Recurring**: two groups. *Recurring* = merchants seen ≥2 times with amounts within ±15% and a gap of 6–8 or 25–35 days; show cadence and next expected date. *One-off* = everything else, newest first.
4. Tapping any merchant or transaction opens the existing expand-to-recategorize control.
5. **At this rate** line inside the headline card: "On pace for $X this month."

### Income tab

1. **Headline card**, green band "Earned · November": total in, +/− versus last month, and "last deposit Nov 10 · Acme".
2. **Breakdown card** by source: employer payroll, Zelle/Venmo/Cash App/PayPal, other deposits. Each row expands to its deposits.
3. **Pattern card**: observed cadence ("3 deposits in 60 days · about every 15 days · avg $2,980"). No schedule input.
4. Income tax estimate and payslip override move to Settings; the takeaway number may be shown here as a muted "expected ≈ $4,878/mo" caption only when the user has set it.

### Data

- **Snapshots (new).** Table `balance_snapshots(user_id uuid, account_id text, day date, current numeric, available numeric, type text, primary key (account_id, day))`, RLS select-own. The Edge Function writes one row per account per sync (upsert on `(account_id, day)`) inside `syncAccounts`. Client reads the last 90 days and sums per day by type to draw the net-worth line. Days with no snapshot carry the previous value forward.
- **Manual accounts (new, secondary).** Table `manual_accounts(id uuid pk, user_id, name, type in ('cash','investment','credit','other'), balance numeric, updated_at)`, RLS all-own. Edited in Settings. Included in the total and in the "Where it sits" breakdown with a "manual" pill. They are not snapshotted; the client appends today's manual total to each day of the chart.
- **Transactions.** Unchanged. One shared `useTransactions(90)` at the page level passed down, replacing the three independent fetches noted in `docs/2026-11-12-ux-stress-test-findings.md`.
- **Recurring detection** is pure client logic in `lib/transactions.ts`, tested with a few assertions in the same standalone style as the earlier stress test.

### Copy and visuals

- All numbers in Space Mono; headlines in Montserrat Black; labels uppercase Montserrat Bold with 6% tracking.
- Red band = Total/alert only; green = in; blue = out; teal = projection; yellow = notices. The month heat-map keeps the existing red tint.
- Empty and loading states use the existing dashed-border notice card.

## Left to the builder

- Exact chart implementation (inline SVG polyline, same as the current sparkline). No chart library.
- Expand/collapse and tab state: local component state, `aria-selected` / `aria-expanded` attributes per `AGENTS.md`.
- Order of merchants within a category (by amount desc).
- Whether to keep `lib/budget.ts` sample data and CSV export reachable (suggest: CSV stays in Settings; sample budget button is removed).

## Verification

- `pnpm --filter @vibe/app-vite typecheck` and `build:client` pass.
- Dev server: three tabs render with no console errors, hotel token animates on tab change, Total empty state shows without a bank, and with the sample transactions each breakdown lens renders.
- Standalone assertions for recurring detection, same-days comparison, and net-worth day summation.
