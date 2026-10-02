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
    // Surface the function's own error message when there is one.
    const ctx = (error as { context?: Response }).context
    if (ctx && typeof ctx.json === "function") {
      const body = await ctx.json().catch(() => null)
      if (body?.error) throw new Error(body.error)
    }
    throw new Error(
      error.message.includes("Failed to send") ? "Bank connection isn't deployed yet — deploy the plaid Edge Function." : error.message,
    )
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

/** Cash across checking + savings — what "My money" is set to. */
export const cashTotal = (accounts: BankAccount[]) =>
  Math.round(accounts.filter((a) => a.type === "depository").reduce((s, a) => s + (a.current ?? 0), 0) * 100) / 100
