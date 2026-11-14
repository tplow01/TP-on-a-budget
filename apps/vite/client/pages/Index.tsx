import { useMemo, useState } from "react"
import { useBudget } from "../hooks/useBudget"
import { useAuth } from "../hooks/useAuth"
import { supabase } from "../lib/supabase"
import { clearLocalBudget, createSupabaseStore } from "../lib/storage"
import { AuthScreen } from "../components/budget/AuthScreen"
import { MfaChallenge } from "../components/budget/MfaChallenge"
import { ProfileSheet } from "../components/budget/ProfileSheet"
import { summarize } from "../lib/budget"
import { isOAuthReturn } from "../lib/plaid"
import { UserRound } from "lucide-react"
import { useBankLive } from "../hooks/useBankLive"
import { useTrackerData } from "../hooks/useTrackerData"
import { actualByCategory, incomeTxns, monthKey } from "../lib/transactions"
import { totalOf } from "../lib/networth"
import { BoardHeader } from "../components/budget/BoardHeader"
import { TabBar, type TabId } from "../components/budget/TabBar"
import { TotalTab } from "../components/tracker/TotalTab"
import { SpendTab } from "../components/tracker/SpendTab"
import { IncomeTab } from "../components/tracker/IncomeTab"

const TITLES: Record<TabId, string> = { total: "My total", spend: "Spending", income: "Income" }

export default function Index() {
  const auth = useAuth()
  const userId = auth.session?.user.id ?? null
  const store = useMemo(() => (supabase && userId ? createSupabaseStore(supabase, userId) : null), [userId])
  const { state, actions, status } = useBudget(store)
  useBankLive(userId, actions.setTotalBalance)
  const [tab, setTab] = useState<TabId>("total")
  // Back from an OAuth bank login? Re-open the Profile sheet so Plaid Link can finish.
  const [profileOpen, setProfileOpen] = useState(isOAuthReturn)
  const email = auth.session?.user.email ?? null

  const data = useTrackerData(userId)
  const month = monthKey(new Date())
  const total = useMemo(() => totalOf(data.accounts, data.manual).total, [data.accounts, data.manual])
  const net = useMemo(() => {
    const list = data.txs ?? []
    const inTotal = incomeTxns(list, month).reduce((s, i) => s + i.amount, 0)
    const outTotal = Object.values(actualByCategory(list, month, data.overrides)).reduce((x, y) => x + y, 0)
    return inTotal - outTotal
  }, [data.txs, data.overrides, month])

  const summary = useMemo(() => summarize(state), [state])

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

  if (auth.configured && !auth.session) {
    return <AuthScreen />
  }

  if (auth.needsMfa) {
    return (
      <MfaChallenge
        onVerified={() => void auth.refreshAal()}
        onSignOut={() => {
          void auth.signOut().then(() => window.location.reload())
        }}
      />
    )
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
        {tab === "total" ? (
          <header className="flex items-center justify-between gap-ds-sm px-ds-md pb-ds-sm pt-[calc(env(safe-area-inset-top)+16px)]">
            <p className="font-label text-label font-bold uppercase text-muted-foreground">My money</p>
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              aria-label="Profile and settings"
              className="flex size-12 shrink-0 items-center justify-center rounded-full border-4 border-foreground bg-card font-heading text-[20px] font-extrabold uppercase text-foreground transition-[scale] duration-150 active:scale-90"
            >
              {email ? email[0] : <UserRound className="size-6" strokeWidth={2.5} />}
            </button>
          </header>
        ) : (
          <BoardHeader key="compact" total={total} net={net} monthLabel={new Date().toLocaleDateString(undefined, { month: "short" })} profileInitial={email ? email[0] : null} onOpenProfile={() => setProfileOpen(true)} compactTitle={TITLES[tab]} />
        )}
        <div className="flex-1 px-ds-md pb-[170px] data-[compact=true]:pt-ds-lg" data-compact={tab !== "total"}>
          {tab === "total" ? <TotalTab data={data} state={state} actions={actions} onOpenProfile={() => setProfileOpen(true)} /> : null}
          {tab === "spend" ? <SpendTab data={data} state={state} actions={actions} onOpenProfile={() => setProfileOpen(true)} /> : null}
          {tab === "income" ? <IncomeTab data={data} state={state} actions={actions} onOpenProfile={() => setProfileOpen(true)} /> : null}
        </div>
        <TabBar tab={tab} onChange={go} />
        <ProfileSheet
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          configured={auth.configured}
          email={email}
          status={status}
          updatedAt={state.updatedAt}
          onSignIn={() => setProfileOpen(false)}
          onSignOut={() => void signOut()}
          onRetry={actions.retrySync}
          onReset={actions.resetAll}
          onBankTotal={actions.setTotalBalance}
          mfaEnabled={auth.mfaEnabled}
          mfaVerified={auth.mfaVerified}
          onMfaChanged={() => void auth.refreshAal()}
          onDeleted={() => void signOut()}
          state={state}
          summary={summary}
          actions={actions}
        />
      </div>
    </main>
  )
}
