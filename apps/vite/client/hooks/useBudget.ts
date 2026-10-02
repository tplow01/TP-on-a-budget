import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  createDefaultState,
  emptyCuts,
  makeId,
  type BudgetItem,
  type BudgetState,
  type CategoryId,
  type Goals,
  type IncomeSettings,
} from "../lib/budget"
import { clearLocalBudget, readLocalBudget, writeLocalBudget, type BudgetStore } from "../lib/storage"

/** local = no cloud store · loading = first fetch · saving/synced = cloud ok · offline/error = cloud failed */
export type SyncStatus = "local" | "loading" | "saving" | "synced" | "offline" | "error"

const SAVE_DELAY_MS = 600
const touch = (s: BudgetState): BudgetState => ({ ...s, updatedAt: new Date().toISOString() })
const time = (s: BudgetState) => Date.parse(s.updatedAt) || 0

export function useBudget(store: BudgetStore | null) {
  const cached = useRef(readLocalBudget())
  const [state, setState] = useState<BudgetState>(() => cached.current ?? createDefaultState())
  const [status, setStatus] = useState<SyncStatus>(store ? "loading" : "local")
  const [ready, setReady] = useState(!store)

  const stateRef = useRef(state)
  stateRef.current = state
  /** True until the user edits anything on a device with no cached budget. */
  const pristine = useRef(cached.current === null)
  /** Skip the next cloud save (state just came from the cloud). */
  const skipSave = useRef(false)
  const saveTimer = useRef<number | undefined>(undefined)

  const update = useCallback((fn: (s: BudgetState) => BudgetState) => {
    pristine.current = false
    setState(fn)
  }, [])

  const applyRemote = useCallback((remote: BudgetState) => {
    skipSave.current = true
    setState(remote)
  }, [])

  /* Initial cloud load + conflict resolution (newest updatedAt wins). */
  const loadFromCloud = useCallback(async () => {
    if (!store) return
    setStatus("loading")
    try {
      const remote = await store.load()
      const local = stateRef.current
      if (!remote) {
        await store.save(local) // first sign-in: upload this device's budget
      } else if (pristine.current || time(remote) >= time(local)) {
        applyRemote(remote)
      } else {
        await store.save(local)
      }
      setReady(true)
      setStatus("synced")
    } catch {
      // Don't save until we've seen the cloud copy, or we could overwrite it.
      setReady(false)
      setStatus("error")
    }
  }, [store, applyRemote])

  useEffect(() => {
    if (!store) {
      setReady(true)
      setStatus("local")
      return
    }
    setReady(false)
    void loadFromCloud()
  }, [store, loadFromCloud])

  /* Save: device cache immediately, cloud debounced. */
  const pushToCloud = useCallback(async () => {
    if (!store) return
    setStatus("saving")
    try {
      await store.save(stateRef.current)
      setStatus("synced")
    } catch {
      setStatus(navigator.onLine ? "error" : "offline")
    }
  }, [store])

  useEffect(() => {
    writeLocalBudget(state)
    if (!store || !ready) return
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => void pushToCloud(), SAVE_DELAY_MS)
    return () => window.clearTimeout(saveTimer.current)
  }, [state, store, ready, pushToCloud])

  /* Pick up edits from other devices when this tab comes back into focus, and retry when back online. */
  useEffect(() => {
    if (!store) return
    const refresh = async () => {
      if (document.visibilityState !== "visible") return
      if (!ready) return void loadFromCloud()
      try {
        const remote = await store.load()
        if (remote && time(remote) > time(stateRef.current)) applyRemote(remote)
      } catch {
        /* keep working from the cache */
      }
    }
    const online = () => (ready ? void pushToCloud() : void loadFromCloud())
    document.addEventListener("visibilitychange", refresh)
    window.addEventListener("focus", refresh)
    window.addEventListener("online", online)
    return () => {
      document.removeEventListener("visibilitychange", refresh)
      window.removeEventListener("focus", refresh)
      window.removeEventListener("online", online)
    }
  }, [store, ready, loadFromCloud, pushToCloud, applyRemote])

  const actions = useMemo(
    () => ({
      updateIncome: (patch: Partial<IncomeSettings>) => update((s) => touch({ ...s, income: { ...s.income, ...patch } })),
      updateItem: (id: string, patch: Partial<BudgetItem>) =>
        update((s) => touch({ ...s, items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),
      addItem: (category: CategoryId) =>
        update((s) =>
          touch({
            ...s,
            items: [...s.items, { id: makeId(), name: "", amount: 0, frequency: "monthly", category, enabled: true }],
          }),
        ),
      removeItem: (id: string) => update((s) => touch({ ...s, items: s.items.filter((i) => i.id !== id) })),
      updateGoals: (patch: Partial<Goals>) => update((s) => touch({ ...s, goals: { ...s.goals, ...patch } })),
      setTotalBalance: (value: number) => update((s) => touch({ ...s, totalBalance: value })),
      setCut: (category: CategoryId, value: number) =>
        update((s) => touch({ ...s, whatIf: { ...s.whatIf, cuts: { ...s.whatIf.cuts, [category]: value } } })),
      setIncomeChange: (value: number) => update((s) => touch({ ...s, whatIf: { ...s.whatIf, incomeChange: value } })),
      resetWhatIf: () => update((s) => touch({ ...s, whatIf: { cuts: emptyCuts(), incomeChange: 0 } })),
      /** Bake the category cuts into real item amounts, then clear the scenario. */
      applyWhatIf: () =>
        update((s) =>
          touch({
            ...s,
            items: s.items.map((i) => {
              const cut = s.whatIf.cuts[i.category] ?? 0
              return cut > 0 ? { ...i, amount: Math.round(i.amount * (1 - cut / 100) * 100) / 100 } : i
            }),
            whatIf: { cuts: emptyCuts(), incomeChange: 0 },
          }),
        ),
      /** Resets to the sample budget everywhere (the reset syncs to other devices). */
      resetAll: () => {
        clearLocalBudget()
        update(() => createDefaultState())
      },
      retrySync: () => void (ready ? pushToCloud() : loadFromCloud()),
    }),
    [update, ready, pushToCloud, loadFromCloud],
  )

  return { state, actions, status }
}

export type BudgetActions = ReturnType<typeof useBudget>["actions"]
