import type { SupabaseClient } from "@supabase/supabase-js"
import { normalizeState, type BudgetState } from "./budget"

/**
 * Remote persistence adapter. `useBudget(store)` loads from and saves to this.
 * Pass `null` to run local-only. A device cache in localStorage is always kept
 * so the app opens instantly and works offline.
 */
export interface BudgetStore {
  load(): Promise<BudgetState | null>
  save(state: BudgetState): Promise<void>
  clear(): Promise<void>
}

/* ------------------------------------------------------------------ */
/* Device cache (localStorage)                                         */
/* ------------------------------------------------------------------ */

const KEY = "budgetopoly:v1"
const LEGACY_BALANCE_KEY = "budget:balance"

export function readLocalBudget(): BudgetState | null {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Migrate the balance that used to be stored on its own.
    if (parsed && typeof parsed === "object" && typeof parsed.totalBalance !== "number") {
      const legacy = parseFloat(window.localStorage.getItem(LEGACY_BALANCE_KEY) ?? "")
      if (Number.isFinite(legacy)) parsed.totalBalance = legacy
    }
    return normalizeState(parsed)
  } catch {
    return null
  }
}

export function writeLocalBudget(state: BudgetState) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* storage full or unavailable — ignore */
  }
}

export function clearLocalBudget() {
  try {
    window.localStorage.removeItem(KEY)
    window.localStorage.removeItem(LEGACY_BALANCE_KEY)
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------ */
/* Supabase                                                            */
/* ------------------------------------------------------------------ */

/** One row per user in `public.budgets` (see apps/vite/supabase/schema.sql). */
export function createSupabaseStore(client: SupabaseClient, userId: string): BudgetStore {
  return {
    async load() {
      const { data, error } = await client.from("budgets").select("data, updated_at").eq("user_id", userId).maybeSingle()
      if (error) throw error
      if (!data) return null
      return normalizeState({ ...(data.data as object), updatedAt: data.updated_at })
    },
    async save(state) {
      const { error } = await client
        .from("budgets")
        .upsert({ user_id: userId, data: state, updated_at: state.updatedAt }, { onConflict: "user_id" })
      if (error) throw error
    },
    async clear() {
      const { error } = await client.from("budgets").delete().eq("user_id", userId)
      if (error) throw error
    },
  }
}
