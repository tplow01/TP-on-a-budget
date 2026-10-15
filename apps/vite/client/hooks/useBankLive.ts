import { useEffect, useRef } from "react"
import { supabase } from "../lib/supabase"
import { cashTotal, readSavedAccounts, refreshAccounts } from "../lib/plaid"
import { BANK_UPDATED_EVENT } from "../lib/transactions"

const AUTO_REFRESH_KEY = "plaid:lastAutoRefresh"
const AUTO_REFRESH_MS = 15 * 60 * 1000

/**
 * Keeps the app in step with the bank:
 * 1. Plaid webhook → Edge Function syncs → Supabase Realtime pushes the change here instantly.
 * 2. On open (at most every 15 min) it also asks for a refresh, in case a webhook was missed.
 * Updates My money from checking + savings and tells Overview widgets to reload.
 */
export function useBankLive(userId: string | null, onTotal: (total: number) => void) {
  const onTotalRef = useRef(onTotal)
  onTotalRef.current = onTotal

  useEffect(() => {
    const client = supabase
    if (!client || !userId) return
    let timer: number | undefined

    const changed = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(async () => {
        const accounts = await readSavedAccounts()
        if (accounts.some((a) => a.type === "depository")) onTotalRef.current(cashTotal(accounts))
        window.dispatchEvent(new Event(BANK_UPDATED_EVENT))
      }, 800)
    }

    const channel = client
      .channel(`bank-live-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bank_accounts", filter: `user_id=eq.${userId}` }, changed)
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${userId}` }, changed)
      .subscribe()

    let last = 0
    try {
      last = Number(localStorage.getItem(AUTO_REFRESH_KEY) ?? 0)
    } catch {
      /* ignore */
    }
    if (Date.now() - last > AUTO_REFRESH_MS) {
      void readSavedAccounts().then((accounts) => {
        if (!accounts.length) return
        try {
          localStorage.setItem(AUTO_REFRESH_KEY, String(Date.now()))
        } catch {
          /* ignore */
        }
        refreshAccounts().then(changed).catch(() => undefined)
      })
    }

    return () => {
      window.clearTimeout(timer)
      void client.removeChannel(channel)
    }
  }, [userId])
}
