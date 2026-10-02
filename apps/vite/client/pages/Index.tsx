import { useMemo, useState } from "react"
import { useBudget } from "../hooks/useBudget"
import { isScenarioActive, summarize } from "../lib/budget"
import { BoardHeader } from "../components/budget/BoardHeader"
import { BoardOverview } from "../components/budget/BoardOverview"
import { GoalsPanel } from "../components/budget/GoalsPanel"
import { IncomePanel } from "../components/budget/IncomePanel"
import { SpendingBoard } from "../components/budget/SpendingBoard"
import { TabBar, type TabId } from "../components/budget/TabBar"
import { WhatIfPanel } from "../components/budget/WhatIfPanel"

export default function Index() {
  const { state, actions } = useBudget()
  const [tab, setTab] = useState<TabId>("board")
  const summary = useMemo(() => summarize(state), [state])
  const scenario = useMemo(() => summarize(state, state.whatIf), [state])
  const scenarioActive = isScenarioActive(state.whatIf)

  const go = (t: TabId) => {
    setTab(t)
    window.scrollTo({ top: 0 })
  }

  return (
    <main className="relative min-h-screen bg-background text-foreground" data-oid="542ebac72f" data-oid-component-root="true" data-oid-callsite-deletable="true" data-oid-callsite-single="true">
      {/* board-line grid + vignette atmosphere */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,color-mix(in_srgb,var(--foreground)_6%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--foreground)_6%,transparent)_1px,transparent_1px)] bg-[size:36px_36px]" data-oid="dd464f7ebc" />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,transparent_40%,color-mix(in_srgb,var(--muted-foreground)_25%,transparent)_100%)]" data-oid="ff3770c16b" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-background/70 sm:border-x-4 sm:border-foreground" data-oid="521d31b0ed">
        <BoardHeader />
        <div className="flex-1 px-ds-md pb-[140px]" data-oid="3b731a21a4" data-oid-text-editable="false" data-oid-text-source="expression:96fc6a06199a|expression:ddb668d99f8e|expression:845f94a604ae|expression:0b339fb54855|expression:2096696fd22d">
          {tab === "board" ? <BoardOverview state={state} summary={summary} scenario={scenarioActive ? scenario : null} onNavigate={go} onReset={actions.resetAll} /> : null}
          {tab === "income" ? <IncomePanel state={state} summary={summary} actions={actions} /> : null}
          {tab === "spend" ? <SpendingBoard state={state} summary={summary} actions={actions} /> : null}
          {tab === "goals" ? <GoalsPanel state={state} summary={summary} actions={actions} /> : null}
          {tab === "whatif" ? <WhatIfPanel state={state} summary={summary} scenario={scenario} actions={actions} /> : null}
        </div>
        <TabBar tab={tab} onChange={go} />
      </div>
    </main>
  )
}
