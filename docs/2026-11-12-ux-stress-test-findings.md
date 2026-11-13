# UX stress-test findings — 2026-11-12

Covers the Nov 2026 pass: What If removal, Goals real-pace projection ("At this
rate"), and the Daily spend calendar (Day/Week/Month) on Overview.

## How this was tested

The live dev server requires magic-link auth with no credentials available in
this environment, so a full click-through wasn't possible. Instead, the core
logic was verified with a standalone test harness (29 assertions) covering:

- Month-pace scaling (income/spend extrapolated to month-end)
- Leap-day handling (Feb 29, 2028) and day-1-of-month edge cases
- 42-cell month-grid correctness across four different anchor months
- Sunday-start week boundaries
- Forward/backward navigation guards against the 90-day fetch window
- Rent-vs-utilities and Venmo/Zelle categorization
- Category override precedence

All 29 assertions passed. This confirms correctness of the underlying math,
not look-and-feel — the UI itself should still be checked by hand once deployed.

## Recommended follow-ups (not yet built)

1. **False "zero-spend" days at the edge of the 90-day window.** Navigating
   Month view back ~3 months can land on a month where the early days predate
   the fetch window. Those show as "$0," indistinguishable from a genuine
   zero-spend day. Worth a distinct "no data" treatment once this edge is
   actually hit in practice.

2. **Redundant transaction fetches on Overview.** `DailySpend` (90 days), the
   due-soon/income logic (45 days), and `SpendInsights` (6 months) each query
   `transactions` independently. Not incorrect, just wasteful — worth
   consolidating into one shared fetch if load lag becomes noticeable.

3. **Early-month "At this rate" noise.** One large purchase on day 2 gets
   multiplied roughly 15x by day 15, so the real-pace ETA can swing wildly
   until more of the month has passed. A trailing 3-month average (once
   enough history exists) would be steadier than pure day-of-month
   extrapolation.

4. **Month-view heat color uses the app's red/primary brand color** for
   high-spend days, which reads as "alert" even on a normal — if heavy — day.
   A calmer, dedicated heatmap color might read better.

5. **Day/Week/Month only shows spend, not net cash flow.** If seeing income
   alongside spend per day (not just the monthly total on Goals) would be
   useful, that's a natural next iteration.

None of these are bugs — they're the kind of rough edge that only becomes
obviously annoying after a few weeks of real use.
