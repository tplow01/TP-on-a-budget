import { useEffect, useMemo, useState } from "react"
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
import { localBudgetStore, type BudgetStore } from "../lib/storage"

const touch = (s: BudgetState): BudgetState => ({ ...s, updatedAt: new Date().toISOString() })

export function useBudget(store: BudgetStore = localBudgetStore) {
  const [state, setState] = useState<BudgetState>(() => store.load() ?? createDefaultState())

  useEffect(() => {
    store.save(state)
  }, [state, store])

  const actions = useMemo(
    () => ({
      updateIncome: (patch: Partial<IncomeSettings>) =>
        setState((s) => touch({ ...s, income: { ...s.income, ...patch } })),
      updateItem: (id: string, patch: Partial<BudgetItem>) =>
        setState((s) => touch({ ...s, items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),
      addItem: (category: CategoryId) =>
        setState((s) =>
          touch({
            ...s,
            items: [...s.items, { id: makeId(), name: "", amount: 0, frequency: "monthly", category, enabled: true }],
          }),
        ),
      removeItem: (id: string) => setState((s) => touch({ ...s, items: s.items.filter((i) => i.id !== id) })),
      updateGoals: (patch: Partial<Goals>) => setState((s) => touch({ ...s, goals: { ...s.goals, ...patch } })),
      setCut: (category: CategoryId, value: number) =>
        setState((s) => ({ ...s, whatIf: { ...s.whatIf, cuts: { ...s.whatIf.cuts, [category]: value } } })),
      setIncomeChange: (value: number) => setState((s) => ({ ...s, whatIf: { ...s.whatIf, incomeChange: value } })),
      resetWhatIf: () => setState((s) => ({ ...s, whatIf: { cuts: emptyCuts(), incomeChange: 0 } })),
      /** Bake the category cuts into real item amounts, then clear the scenario. */
      applyWhatIf: () =>
        setState((s) =>
          touch({
            ...s,
            items: s.items.map((i) => {
              const cut = s.whatIf.cuts[i.category] ?? 0
              return cut > 0 ? { ...i, amount: Math.round(i.amount * (1 - cut / 100) * 100) / 100 } : i
            }),
            whatIf: { cuts: emptyCuts(), incomeChange: 0 },
          }),
        ),
      resetAll: () => {
        store.clear()
        setState(createDefaultState())
      },
    }),
    [store],
  )

  return { state, actions }
}

export type BudgetActions = ReturnType<typeof useBudget>["actions"]
