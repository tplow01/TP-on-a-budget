import { normalizeState, type BudgetState } from "./budget"

/**
 * Persistence adapter. The app only talks to this interface, so to hook in a
 * real backend (Supabase, your own API, Plaid sync…) implement `BudgetStore`
 * and pass it to `useBudget(myStore)`.
 */
export interface BudgetStore {
  load(): BudgetState | null
  save(state: BudgetState): void
  clear(): void
}

const KEY = "budgetopoly:v1"

export const localBudgetStore: BudgetStore = {
  load() {
    try {
      const raw = window.localStorage.getItem(KEY)
      return raw ? normalizeState(JSON.parse(raw)) : null
    } catch {
      return null
    }
  },
  save(state) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* storage full or unavailable — ignore */
    }
  },
  clear() {
    try {
      window.localStorage.removeItem(KEY)
    } catch {
      /* ignore */
    }
  },
}
