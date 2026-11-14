import { useCallback, useEffect, useState } from "react"
import { useTransactions } from "./useTransactions"
import { BANK_UPDATED_EVENT, readCategoryOverrides, type CategoryOverrides } from "../lib/transactions"
import { readSavedAccounts, type BankAccount } from "../lib/plaid"
import { readManualAccounts, readSnapshots, type ManualAccount, type Snapshot } from "../lib/networth"

const SNAPSHOT_DAYS = 90

function isoDaysAgo(days: number) {
  const d = new Date(Date.now() - days * 86400000)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/** One shared read of everything the three tabs need; re-reads whenever bank data changes. */
export function useTrackerData(userId: string | null) {
  const txs = useTransactions(90, userId)
  const [overrides, setOverrides] = useState<CategoryOverrides>({})
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [manual, setManual] = useState<ManualAccount[]>([])
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const reload = useCallback(() => window.dispatchEvent(new Event(BANK_UPDATED_EVENT)), [])

  useEffect(() => {
    let live = true
    if (!userId) {
      setOverrides({})
      setAccounts([])
      setManual([])
      setSnapshots([])
      return
    }
    const load = () => {
      void readCategoryOverrides().then((v) => live && setOverrides(v))
      void readSavedAccounts().then((v) => live && setAccounts(v))
      void readManualAccounts().then((v) => live && setManual(v))
      void readSnapshots(isoDaysAgo(SNAPSHOT_DAYS)).then((v) => live && setSnapshots(v))
    }
    load()
    window.addEventListener(BANK_UPDATED_EVENT, load)
    return () => {
      live = false
      window.removeEventListener(BANK_UPDATED_EVENT, load)
    }
  }, [userId])

  return { txs, overrides, accounts, manual, snapshots, reload }
}

export type TrackerData = ReturnType<typeof useTrackerData>
