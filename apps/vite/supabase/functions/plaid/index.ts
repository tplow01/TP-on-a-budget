// Supabase Edge Function: holds the Plaid keys and talks to Plaid for the app.
// Deploy:  supabase functions deploy plaid --no-verify-jwt
// Secrets: supabase secrets set PLAID_CLIENT_ID=... PLAID_SECRET=... PLAID_ENV=sandbox
// (The user's login is checked below, so the gateway JWT check isn't needed.)
// Production: supabase secrets set PLAID_SECRET=<production secret> PLAID_ENV=production
//             PLAID_REDIRECT_URI=https://<your-app-domain>/   ← must also be added under
//             Plaid Dashboard → Developers → API → Allowed redirect URIs (needed for OAuth banks).

import { createClient } from "npm:@supabase/supabase-js@2"

const PLAID_ENV = Deno.env.get("PLAID_ENV") ?? "sandbox"
const PLAID_BASE = PLAID_ENV === "production" ? "https://production.plaid.com" : "https://sandbox.plaid.com"
const PLAID_CLIENT_ID = Deno.env.get("PLAID_CLIENT_ID") ?? ""
const PLAID_SECRET = Deno.env.get("PLAID_SECRET") ?? ""
const PLAID_REDIRECT_URI = Deno.env.get("PLAID_REDIRECT_URI") // optional, for OAuth banks
// Plaid calls this when new transactions post. Defaults to this function's own URL.
const WEBHOOK_URL = Deno.env.get("PLAID_WEBHOOK_URL") ?? `${Deno.env.get("SUPABASE_URL")}/functions/v1/plaid`

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)

let cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
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
  if (!res.ok) {
    const err = new Error(data.display_message ?? data.error_message ?? `Plaid error on ${path}`) as Error & { code?: string }
    err.code = data.error_code
    throw err
  }
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

/** Pull new/changed/removed transactions since the saved cursor (Plaid /transactions/sync). */
async function syncTransactions(userId: string, itemId: string, accessToken: string, startCursor: string | null) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      let cursor: string | undefined = startCursor ?? undefined
      const changed: any[] = []
      const removed: string[] = []
      let hasMore = true
      while (hasMore) {
        const page = await plaid<any>("/transactions/sync", { access_token: accessToken, count: 500, ...(cursor ? { cursor } : {}) })
        changed.push(...page.added, ...page.modified)
        removed.push(...page.removed.map((r: any) => r.transaction_id))
        hasMore = page.has_more
        cursor = page.next_cursor
      }
      const rows = changed.map((t) => ({
        transaction_id: t.transaction_id,
        user_id: userId,
        item_id: itemId,
        account_id: t.account_id,
        date: t.date,
        name: t.name,
        merchant_name: t.merchant_name,
        amount: t.amount,
        iso_currency_code: t.iso_currency_code,
        pfc_primary: t.personal_finance_category?.primary ?? null,
        pfc_detailed: t.personal_finance_category?.detailed ?? null,
        pending: t.pending,
      }))
      for (let i = 0; i < rows.length; i += 500) {
        const { error } = await admin.from("transactions").upsert(rows.slice(i, i + 500), { onConflict: "transaction_id" })
        if (error) throw error
      }
      if (removed.length) await admin.from("transactions").delete().in("transaction_id", removed).eq("user_id", userId)
      await admin.from("plaid_items").update({ cursor }).eq("item_id", itemId)
      return
    } catch (e) {
      // Plaid asks us to restart pagination if data changed mid-sync.
      if (attempt === 0 && (e as { code?: string }).code === "TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION") continue
      throw e
    }
  }
}

async function listAccounts(userId: string) {
  const { data, error } = await admin.from("bank_accounts").select("*").eq("user_id", userId).order("institution")
  if (error) throw error
  return data ?? []
}

/* ---------------- Webhooks ---------------- */

const keyCache = new Map<string, CryptoKey>()
const b64url = (s: string) => {
  const b = s.replace(/-/g, "+").replace(/_/g, "/")
  return Uint8Array.from(atob(b.padEnd(Math.ceil(b.length / 4) * 4, "=")), (c) => c.charCodeAt(0))
}
const decodeJson = (s: string) => JSON.parse(new TextDecoder().decode(b64url(s)))

/** Verify the Plaid-Verification JWT: ES256 signature, issued < 5 min ago, body hash matches. */
async function verifyWebhook(raw: string, token: string | null): Promise<boolean> {
  try {
    if (!token) return false
    const [h, p, s] = token.split(".")
    const header = decodeJson(h)
    if (header.alg !== "ES256" || !header.kid) return false
    let key = keyCache.get(header.kid)
    if (!key) {
      const { key: jwk } = await plaid<{ key: any }>("/webhook_verification_key/get", { key_id: header.kid })
      if (jwk.expired_at) return false
      key = await crypto.subtle.importKey("jwk", { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y }, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"])
      keyCache.set(header.kid, key)
    }
    const ok = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, b64url(s), new TextEncoder().encode(`${h}.${p}`))
    if (!ok) return false
    const payload = decodeJson(p)
    if (Date.now() / 1000 - payload.iat > 300) return false
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw))
    const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("")
    return hex === payload.request_body_sha256
  } catch {
    return false
  }
}

/** New transactions posted (or balances changed) at the bank → sync this item. */
async function handleWebhook(raw: string, body: any, signature: string | null) {
  if (!(await verifyWebhook(raw, signature))) return json({ error: "Invalid webhook signature" }, 401)
  const { data: it } = await admin
    .from("plaid_items")
    .select("item_id, user_id, access_token, institution, cursor")
    .eq("item_id", body.item_id)
    .maybeSingle()
  if (!it) return json({ ok: true })
  const shouldSync =
    body.webhook_type === "TRANSACTIONS" || (body.webhook_type === "ITEM" && body.webhook_code === "NEW_ACCOUNTS_AVAILABLE")
  if (shouldSync) {
    await syncItem(it.user_id, it.item_id, it.access_token, it.institution)
    await syncTransactions(it.user_id, it.item_id, it.access_token, it.cursor)
  } else if (body.webhook_type === "ITEM") {
    console.warn("Plaid item webhook", body.item_id, body.webhook_code, body.error?.error_code ?? "")
  }
  return json({ ok: true })
}

Deno.serve(async (req) => {
  // Allow whatever headers the browser asks for (newer supabase-js sends extra ones).
  const requested = req.headers.get("Access-Control-Request-Headers")
  if (requested) cors = { ...cors, "Access-Control-Allow-Headers": requested }
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })
  // Open the function URL in a browser to check it's deployed.
  if (req.method === "GET") return json({ ok: true, plaidEnv: PLAID_ENV, keysSet: Boolean(PLAID_CLIENT_ID && PLAID_SECRET) })

  try {
    if (!PLAID_CLIENT_ID || !PLAID_SECRET) return json({ error: "Plaid keys are not set. Run: supabase secrets set PLAID_CLIENT_ID=... PLAID_SECRET=..." }, 500)

    const raw = await req.text()
    let body: any = {}
    try {
      body = raw ? JSON.parse(raw) : {}
    } catch {
      body = {}
    }

    // Plaid webhook (no user login — verified by signature instead).
    if (body.webhook_type) return await handleWebhook(raw, body, req.headers.get("Plaid-Verification"))

    // Who is calling?
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "")
    const { data: auth, error: authError } = await admin.auth.getUser(jwt)
    if (authError || !auth.user) return json({ error: "Please sign in first." }, 401)
    const userId = auth.user.id
    // Assurance level from the (already verified) JWT: aal2 = passed two-step verification this session.
    const aal: string = (() => {
      try {
        return decodeJson(jwt.split(".")[1]).aal ?? "aal1"
      } catch {
        return "aal1"
      }
    })()
    const hasMfa = (auth.user.factors ?? []).some((f: any) => f.status === "verified")
    const requireMfa = () => (aal === "aal2" ? null : json({ error: "Turn on two-step verification and sign in with your code before connecting a bank." }, 403))


    switch (body.action) {
      case "create_link_token": {
        const blocked = requireMfa()
        if (blocked) return blocked
        if (!auth.user.user_metadata?.plaid_consent_at) return json({ error: "Please agree to the data consent before connecting a bank." }, 403)
        const data = await plaid<{ link_token: string }>("/link/token/create", {
          user: { client_user_id: userId },
          client_name: "My Budget",
          products: ["transactions"],
          country_codes: ["US"],
          language: "en",
          transactions: { days_requested: 180 },
          webhook: WEBHOOK_URL,
          ...(PLAID_REDIRECT_URI ? { redirect_uri: PLAID_REDIRECT_URI } : {}),
        })
        return json({ link_token: data.link_token })
      }

      case "exchange": {
        const blockedExchange = requireMfa()
        if (blockedExchange) return blockedExchange
        if (!body.public_token) return json({ error: "Missing public_token" }, 400)
        const { access_token, item_id } = await plaid<{ access_token: string; item_id: string }>("/item/public_token/exchange", {
          public_token: body.public_token,
        })
        const institution: string | null = body.institution ?? null
        const { error } = await admin.from("plaid_items").upsert({ item_id, user_id: userId, access_token, institution }, { onConflict: "item_id" })
        if (error) throw error
        await syncItem(userId, item_id, access_token, institution)
        // Plaid may still be gathering history right after linking; Refresh picks up the rest.
        await syncTransactions(userId, item_id, access_token, null).catch((e) => console.error("transactions", e))
        return json({ accounts: await listAccounts(userId) })
      }

      case "refresh": {
        const { data: items, error } = await admin.from("plaid_items").select("item_id, access_token, institution, cursor").eq("user_id", userId)
        if (error) throw error
        for (const it of items ?? []) {
          // Make sure banks linked before webhooks existed also push updates.
          await plaid("/item/webhook/update", { access_token: it.access_token, webhook: WEBHOOK_URL }).catch(() => undefined)
          await syncItem(userId, it.item_id, it.access_token, it.institution)
          await syncTransactions(userId, it.item_id, it.access_token, it.cursor).catch((e) => console.error("transactions", e))
        }
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

      case "delete_account": {
        if (hasMfa && aal !== "aal2") return json({ error: "Sign in with your two-step code first." }, 403)
        const { data: items } = await admin.from("plaid_items").select("item_id, access_token").eq("user_id", userId)
        for (const it of items ?? []) await plaid("/item/remove", { access_token: it.access_token }).catch(() => undefined)
        // Deleting the user cascades to budgets, plaid_items, bank_accounts and transactions.
        const { error } = await admin.auth.admin.deleteUser(userId)
        if (error) throw error
        return json({ ok: true })
      }

      default:
        return json({ error: "Unknown action" }, 400)
    }
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500)
  }
})
