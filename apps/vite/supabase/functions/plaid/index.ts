// Supabase Edge Function: holds the Plaid keys and talks to Plaid for the app.
// Deploy:  supabase functions deploy plaid --no-verify-jwt
// Secrets: supabase secrets set PLAID_CLIENT_ID=... PLAID_SECRET=... PLAID_ENV=sandbox
// (The user's login is checked below, so the gateway JWT check isn't needed.)

import { createClient } from "npm:@supabase/supabase-js@2"

const PLAID_ENV = Deno.env.get("PLAID_ENV") ?? "sandbox"
const PLAID_BASE = PLAID_ENV === "production" ? "https://production.plaid.com" : "https://sandbox.plaid.com"
const PLAID_CLIENT_ID = Deno.env.get("PLAID_CLIENT_ID") ?? ""
const PLAID_SECRET = Deno.env.get("PLAID_SECRET") ?? ""
const PLAID_REDIRECT_URI = Deno.env.get("PLAID_REDIRECT_URI") // optional, for OAuth banks

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })

async function plaid<T = any>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(PLAID_BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: PLAID_CLIENT_ID, secret: PLAID_SECRET, ...body }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.display_message ?? data.error_message ?? `Plaid error on ${path}`)
  return data as T
}

/** Pull accounts + balances for one item from Plaid and store them. */
async function syncItem(userId: string, itemId: string, accessToken: string, institution: string | null) {
  const { accounts } = await plaid<{ accounts: any[] }>("/accounts/get", { access_token: accessToken })
  const rows = accounts.map((a) => ({
    account_id: a.account_id,
    user_id: userId,
    item_id: itemId,
    institution,
    name: a.official_name ?? a.name,
    mask: a.mask,
    type: a.type,
    subtype: a.subtype,
    current: a.balances?.current,
    available: a.balances?.available,
    updated_at: new Date().toISOString(),
  }))
  if (rows.length) {
    const { error } = await admin.from("bank_accounts").upsert(rows, { onConflict: "account_id" })
    if (error) throw error
  }
}

async function listAccounts(userId: string) {
  const { data, error } = await admin.from("bank_accounts").select("*").eq("user_id", userId).order("institution")
  if (error) throw error
  return data ?? []
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })

  try {
    if (!PLAID_CLIENT_ID || !PLAID_SECRET) return json({ error: "Plaid keys are not set. Run: supabase secrets set PLAID_CLIENT_ID=... PLAID_SECRET=..." }, 500)

    // Who is calling?
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "")
    const { data: auth, error: authError } = await admin.auth.getUser(jwt)
    if (authError || !auth.user) return json({ error: "Please sign in first." }, 401)
    const userId = auth.user.id

    const body = await req.json().catch(() => ({}))

    switch (body.action) {
      case "create_link_token": {
        const data = await plaid<{ link_token: string }>("/link/token/create", {
          user: { client_user_id: userId },
          client_name: "My Budget",
          products: ["transactions"],
          country_codes: ["US"],
          language: "en",
          ...(PLAID_REDIRECT_URI ? { redirect_uri: PLAID_REDIRECT_URI } : {}),
        })
        return json({ link_token: data.link_token })
      }

      case "exchange": {
        if (!body.public_token) return json({ error: "Missing public_token" }, 400)
        const { access_token, item_id } = await plaid<{ access_token: string; item_id: string }>("/item/public_token/exchange", {
          public_token: body.public_token,
        })
        const institution: string | null = body.institution ?? null
        const { error } = await admin.from("plaid_items").upsert({ item_id, user_id: userId, access_token, institution }, { onConflict: "item_id" })
        if (error) throw error
        await syncItem(userId, item_id, access_token, institution)
        return json({ accounts: await listAccounts(userId) })
      }

      case "refresh": {
        const { data: items, error } = await admin.from("plaid_items").select("item_id, access_token, institution").eq("user_id", userId)
        if (error) throw error
        for (const it of items ?? []) await syncItem(userId, it.item_id, it.access_token, it.institution)
        return json({ accounts: await listAccounts(userId) })
      }

      case "disconnect": {
        const { data: item } = await admin.from("plaid_items").select("access_token").eq("user_id", userId).eq("item_id", body.item_id).maybeSingle()
        if (item) {
          await plaid("/item/remove", { access_token: item.access_token }).catch(() => undefined)
          await admin.from("plaid_items").delete().eq("item_id", body.item_id).eq("user_id", userId) // cascades to bank_accounts
        }
        return json({ accounts: await listAccounts(userId) })
      }

      default:
        return json({ error: "Unknown action" }, 400)
    }
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500)
  }
})
