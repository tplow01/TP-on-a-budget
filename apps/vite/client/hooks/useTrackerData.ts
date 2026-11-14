import { useCallback, useEffect, useState } from "react"
import { useTransactions } from "./useTransactions"
import { BANK_UPDATED_EVENT, readCategoryOverrides, type CategoryOverrides } from "../lib/transactions"
import { readSavedAccounts, type BankAccount } from "../lib/plaid"
import { readManualAccounts, readSnapshots, type ManualAccount, type Snapshot } from "../lib/networth"

const SNAPSHOT_DAYS = 90

interface Bag {
  uid: string | null
  overrides: CategoryOverrides
  accounts: BankAccount[]
  manual: ManualAccount[]
  snapshots: Snapshot[]
  loaded: boolean
}
const EMPTY_BAG = { overrides: {} as CategoryOverrides, accounts: [] as BankAccount[], manual: [] as ManualAccount[], snapshots: [] as Snapshot[], loaded: false }

function isoDaysAgo(days: number) {
  const d = new Date(Date.now() - days * 86400000)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/** One shared read of everything the three tabs need; re-reads whenever bank data changes. */
export function useTrackerData(userId: string | null) {
  const txs = useTransactions(90, userId)
  // Owner-tagged so a previous user's lists are never shown under a new user.
  const [bag, setBag] = useState<Bag>({ uid: userId, ...EMPTY_BAG })
  const mine = bag.uid === userId ? bag : { uid: userId, ...EMPTY_BAG }
  const { overrides, accounts, manual, snapshots } = mine
  const loaded = !userId || mine.loaded
  const reload = useCallback(() => window.dispatchEvent(new Event(BANK_UPDATED_EVENT)), [])

  useEffect(() => {
    let live = true
    if (!userId) {
      setBag({ uid: null, ...EMPTY_BAG })
      return
    }
    setBag((b) => (b.uid === userId ? b : { uid: userId, ...EMPTY_BAG }))
    const load = () => {
      void Promise.all([
        readCategoryOverrides(),
        readSavedAccounts(),
        readManualAccounts(),
        readSnapshots(isoDaysAgo(SNAPSHOT_DAYS)),
      ]).then(([overrides, accounts, manual, snapshots]) => {
        if (live) setBag({ uid: userId, overrides, accounts, manual, snapshots, loaded: true })
      })
    }
    load()
    window.addEventListener(BANK_UPDATED_EVENT, load)
    return () => {
      live = false
      window.removeEventListener(BANK_UPDATED_EVENT, load)
    }
  }, [userId])

  return { txs, overrides, accounts, manual, snapshots, loaded, reload }
}

export type TrackerData = ReturnType<typeof useTrackerData>
