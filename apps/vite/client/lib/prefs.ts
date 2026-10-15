import { CATEGORIES, FREQUENCIES, type CategoryId, type Frequency } from "./budget"

/** Remembers the last category and frequency you used so new costs start there. */
const KEY = "budget:lastUsed"

export interface LastUsed {
  category: CategoryId
  frequency: Frequency
}

const DEFAULTS: LastUsed = { category: "fixed", frequency: "monthly" }

export function getLastUsed(): LastUsed {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<LastUsed>
    return {
      category: CATEGORIES.some((c) => c.id === raw.category) ? (raw.category as CategoryId) : DEFAULTS.category,
      frequency: FREQUENCIES.includes(raw.frequency as Frequency) ? (raw.frequency as Frequency) : DEFAULTS.frequency,
    }
  } catch {
    return DEFAULTS
  }
}

export function rememberUsed(patch: Partial<LastUsed>) {
  try {
    const next = { ...getLastUsed() }
    if (patch.category) next.category = patch.category
    if (patch.frequency) next.frequency = patch.frequency
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
}
