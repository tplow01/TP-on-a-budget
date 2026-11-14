import { useEffect, useState } from "react"
import { BANK_UPDATED_EVENT, readTransactions, type Txn } from "../lib/transactions"

/** Transactions from the last `days` days; reloads whenever bank data changes or the user signs in. null while loading. */
export function useTransactions(days = 45, userId: string | null = null) {
  // Tag the data with its owner so one user's rows are never returned for another user.
  const [state, setState] = useState<{ uid: string | null; txs: Txn[] | null }>({ uid: userId, txs: null })
  useEffect(() => {
    if (!userId) {
      setState({ uid: null, txs: [] })
      return
    }
    setState((s) => (s.uid === userId ? s : { uid: userId, txs: null }))
    let live = true
    const load = () => {
      const since = new Date(Date.now() - days * 86400000)
      const iso = `${since.getFullYear()}-${String(since.getMonth() + 1).padStart(2, "0")}-${String(since.getDate()).padStart(2, "0")}`
      void readTransactions(iso).then((v) => live && setState({ uid: userId, txs: v }))
    }
    load()
    window.addEventListener(BANK_UPDATED_EVENT, load)
    return () => {
      live = false
      window.removeEventListener(BANK_UPDATED_EVENT, load)
    }
  }, [days, userId])
  return state.uid === userId ? state.txs : null
}
