import { supabase } from "./supabase"

export interface BankAccount {
  account_id: string
  item_id: string
  institution: string | null
  name: string
  mask: string | null
  type: string
  subtype: string | null
  current: number | null
  available: number | null
  updated_at: string
}

async function call<T>(action: string, extra: Record<string, unknown> = {}): Promise<T> {
  if (!supabase) throw new Error("Cloud sync isn't set up.")
  const { data, error } = await supabase.functions.invoke("plaid", { body: { action, ...extra } })
  if (error) {
    const ctx = (error as { context?: unknown }).context
    if (ctx instanceof Response) {
      const status = ctx.status
      const text = await ctx.text().catch(() => "")
      let msg = text
      try {
        const b = JSON.parse(text)
        msg = b.error ?? b.message ?? b.msg ?? text
      } catch {
        /* plain text */
      }
      if (status === 404)
        throw new Error("The plaid function wasn't found (404). Deploy it: supabase functions deploy plaid --no-verify-jwt")
      if (status === 401)
        throw new Error(`Not authorised (401): ${msg || "no details"}. If it says "Invalid JWT", redeploy with --no-verify-jwt, then sign out and back in.`)
      throw new Error(`Bank function error (${status}): ${msg || "no details — check Supabase → Edge Functions → plaid → Logs"}`)
    }
    if (error.name === "FunctionsFetchError" || error.message.includes("Failed to send"))
      throw new Error("Couldn't reach the plaid function. It's probably not deployed yet: supabase functions deploy plaid --no-verify-jwt")
    throw new Error(error.message)
  }
  return data as T
}

export const createLinkToken = () => call<{ link_token: string }>("create_link_token")
export const exchangePublicToken = (public_token: string, institution: string | null) =>
  call<{ accounts: BankAccount[] }>("exchange", { public_token, institution })
export const refreshAccounts = () => call<{ accounts: BankAccount[] }>("refresh")
export const disconnectItem = (item_id: string) => call<{ accounts: BankAccount[] }>("disconnect", { item_id })

/** Saved account list (readable thanks to RLS), no Plaid call. */
export async function readSavedAccounts(): Promise<BankAccount[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from("bank_accounts").select("*").order("institution")
  if (error) return []
  return (data ?? []) as BankAccount[]
}

/* OAuth banks (Chase, Wells Fargo, BofA…) send the user away to their own site
 * and back to PLAID_REDIRECT_URI with ?oauth_state_id=…. Link has to be re-opened
 * with the SAME link token, so we keep it across the redirect. */
const LINK_TOKEN_KEY = "plaid:linkToken"

export function saveLinkToken(token: string) {
  try {
    localStorage.setItem(LINK_TOKEN_KEY, token)
  } catch {
    /* ignore */
  }
}

export function loadLinkToken(): string | null {
  try {
    return localStorage.getItem(LINK_TOKEN_KEY)
  } catch {
    return null
  }
}

export function clearLinkToken() {
  try {
    localStorage.removeItem(LINK_TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

export const isOAuthReturn = () => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("oauth_state_id")

/** Drop ?oauth_state_id from the address bar once Link is done with it. */
export function clearOAuthParams() {
  if (!isOAuthReturn()) return
  window.history.replaceState(null, "", window.location.pathname + window.location.hash)
}

/** Cash across checking + savings — what "My money" is set to. */
export const cashTotal = (accounts: BankAccount[]) =>
  Math.round(accounts.filter((a) => a.type === "depository").reduce((s, a) => s + (a.current ?? 0), 0) * 100) / 100
