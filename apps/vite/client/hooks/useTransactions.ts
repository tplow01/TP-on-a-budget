import { useEffect, useState } from "react"
import { BANK_UPDATED_EVENT, readTransactions, type Txn } from "../lib/transactions"

/** Transactions from the last `days` days; reloads whenever bank data changes. null while loading. */
export function useTransactions(days = 45) {
  const [txs, setTxs] = useState<Txn[] | null>(null)
  useEffect(() => {
    const load = () => {
      const since = new Date(Date.now() - days * 86400000)
      const iso = `${since.getFullYear()}-${String(since.getMonth() + 1).padStart(2, "0")}-${String(since.getDate()).padStart(2, "0")}`
      void readTransactions(iso).then(setTxs)
    }
    load()
    window.addEventListener(BANK_UPDATED_EVENT, load)
    return () => window.removeEventListener(BANK_UPDATED_EVENT, load)
  }, [days])
  return txs
}
