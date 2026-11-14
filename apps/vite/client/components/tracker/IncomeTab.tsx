import type { BudgetActions } from "../../hooks/useBudget"
import type { TrackerData } from "../../hooks/useTrackerData"
import type { BudgetState } from "../../lib/budget"

interface Props {
  data: TrackerData
  state: BudgetState
  actions: BudgetActions
  onOpenProfile: () => void
}

export function IncomeTab(_props: Props) {
  return (
    <div className="rounded-md border-2 border-dashed border-foreground p-ds-md">
      <p className="font-label text-label font-bold uppercase">Income</p>
    </div>
  )
}
