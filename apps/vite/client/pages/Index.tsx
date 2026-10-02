import { useMemo, useState } from "react"
import { useBudget } from "../hooks/useBudget"
import { useAuth } from "../hooks/useAuth"
import { supabase } from "../lib/supabase"
import { clearLocalBudget, createSupabaseStore } from "../lib/storage"
import { AuthScreen } from "../components/budget/AuthScreen"
import { ProfileSheet } from "../components/budget/ProfileSheet"
import { isScenarioActive, summarize } from "../lib/budget"
import { BoardHeader } from "../components/budget/BoardHeader"
import { BoardOverview } from "../components/budget/BoardOverview"
import { GoalsPanel } from "../components/budget/GoalsPanel"
import { IncomePanel } from "../components/budget/IncomePanel"
import { SpendingBoard } from "../components/budget/SpendingBoard"
import { TabBar, type TabId } from "../components/budget/TabBar"
import { WhatIfPanel } from "../components/budget/WhatIfPanel"

export default function Index() {
  const auth = useAuth()
  const userId = auth.session?.user.id ?? null
  const store = useMemo(() => (supabase && userId ? createSupabaseStore(supabase, userId) : null), [userId])
  const { state, actions, status } = useBudget(store)
  const [localOnly, setLocalOnly] = useState(() => {
    try {
      return window.localStorage.getItem("budget:localOnly") === "1"
    } catch {
      return false
    }
  })
  const setLocal = (v: boolean) => {
    setLocalOnly(v)
    try {
      if (v) window.localStorage.setItem("budget:localOnly", "1")
      else window.localStorage.removeItem("budget:localOnly")
    } catch {
      /* ignore */
    }
  }
  const [tab, setTab] = useState<TabId>("board")
  const [profileOpen, setProfileOpen] = useState(false)
  const email = auth.session?.user.email ?? null
  const summary = useMemo(() => summarize(state), [state])
  const scenario = useMemo(() => summarize(state, state.whatIf), [state])
  const scenarioActive = isScenarioActive(state.whatIf)

  const TITLES: Record<TabId, string> = { board: "Overview", income: "Income", spend: "Spending", goals: "Goals", whatif: "What if" }

  const go = (t: TabId) => {
    setTab(t)
    window.scrollTo({ top: 0 })
  }

  if (auth.configured && auth.loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background" data-oid="3f03b2ad40" data-oid-component-root="true" data-oid-callsite-deletable="true" data-oid-callsite-single="true">
        <p className="font-label text-label font-bold uppercase text-muted-foreground" data-oid="20fc72dc93">Loading…</p>
      </main>
    )
  }

  if (auth.configured && !auth.session && !localOnly) {
    return <AuthScreen onSkip={() => setLocal(true)} />
  }

  const signOut = async () => {
    await auth.signOut()
    clearLocalBudget() // don't leave this account's budget on a shared device
    window.location.reload()
  }

  return (
    <main className="relative min-h-screen bg-background text-foreground" data-oid="542ebac72f" data-oid-component-root="true" data-oid-callsite-deletable="true" data-oid-callsite-single="true">
      {/* board-line grid + vignette atmosphere */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,color-mix(in_srgb,var(--foreground)_6%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--foreground)_6%,transparent)_1px,transparent_1px)] bg-[size:36px_36px]" data-oid="dd464f7ebc" />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,transparent_40%,color-mix(in_srgb,var(--muted-foreground)_25%,transparent)_100%)]" data-oid="ff3770c16b" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-background/70 sm:border-x-4 sm:border-foreground" data-oid="521d31b0ed">
        <BoardHeader key={tab === "board" ? "full" : "compact"} summary={summary} balance={state.totalBalance} onBalanceChange={actions.setTotalBalance} profileInitial={email ? email[0] : null} onOpenProfile={() => setProfileOpen(true)} compactTitle={tab === "board" ? undefined : TITLES[tab]} />
        <div className="flex-1 px-ds-md pb-[160px] data-[compact=true]:pt-ds-lg" data-compact={tab !== "board"} data-oid="3b731a21a4" data-oid-text-editable="false" data-oid-text-source="expression:90231e444059|expression:ddb668d99f8e|expression:845f94a604ae|expression:0b339fb54855|expression:2096696fd22d">
          {tab === "board" ? <BoardOverview state={state} summary={summary} scenario={scenarioActive ? scenario : null} onNavigate={go} /> : null}

          {tab === "income" ? <IncomePanel state={state} summary={summary} actions={actions} /> : null}
          {tab === "spend" ? <SpendingBoard state={state} summary={summary} actions={actions} /> : null}
          {tab === "goals" ? <GoalsPanel state={state} summary={summary} actions={actions} /> : null}
          {tab === "whatif" ? <WhatIfPanel state={state} summary={summary} scenario={scenario} actions={actions} /> : null}
        </div>
        <TabBar tab={tab} onChange={go} />
        <ProfileSheet
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          configured={auth.configured}
          email={email}
          status={status}
          updatedAt={state.updatedAt}
          onSignIn={() => {
            setProfileOpen(false)
            setLocal(false)
          }}
          onSignOut={() => void signOut()}
          onRetry={actions.retrySync}
          onReset={actions.resetAll}
          onBankTotal={actions.setTotalBalance}
        />
      </div>
    </main>
  )
}
