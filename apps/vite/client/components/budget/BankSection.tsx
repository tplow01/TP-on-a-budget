import { useCallback, useEffect, useState } from "react"
import { usePlaidLink } from "react-plaid-link"
import { Landmark, Plus, RefreshCw, Unlink } from "lucide-react"
import { fmt2 } from "../../lib/budget"
import { Link } from "react-router-dom"
import { supabase } from "../../lib/supabase"
import { BANK_UPDATED_EVENT } from "../../lib/transactions"
import { success } from "../../lib/haptics"

const reloadOnBankUpdate = (set: (a: BankAccount[]) => void) => {
  const load = () => void readSavedAccounts().then(set)
  window.addEventListener(BANK_UPDATED_EVENT, load)
  return () => window.removeEventListener(BANK_UPDATED_EVENT, load)
}
import {
  cashTotal,
  clearLinkToken,
  clearOAuthParams,
  createLinkToken,
  isOAuthReturn,
  loadLinkToken,
  saveLinkToken,
  disconnectItem,
  exchangePublicToken,
  readSavedAccounts,
  refreshAccounts,
  type BankAccount,
} from "../../lib/plaid"

export function BankSection({ onTotal, mfaReady }: { onTotal: (total: number) => void; mfaReady: boolean }) {
  const [consentOpen, setConsentOpen] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  // Coming back from an OAuth bank: resume Link with the token we stored before leaving.
  const [oauthReturn] = useState(isOAuthReturn)
  const [linkToken, setLinkToken] = useState<string | null>(() => (oauthReturn ? loadLinkToken() : null))
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const apply = useCallback(
    (list: BankAccount[]) => {
      setAccounts(list)
      window.dispatchEvent(new Event(BANK_UPDATED_EVENT))
      if (list.some((a) => a.type === "depository")) onTotal(cashTotal(list))
    },
    [onTotal],
  )

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
    }
  }

  useEffect(() => {
    void readSavedAccounts().then(setAccounts)
    if (oauthReturn && !loadLinkToken()) {
      clearOAuthParams()
      setError("The bank sign-in expired. Tap Connect bank to try again.")
    }
  }, [oauthReturn])

  // Live updates pushed from the bank (via useBankLive) refresh this list too.
  useEffect(() => reloadOnBankUpdate(setAccounts), [])

  const { open, ready } = usePlaidLink({
    token: linkToken,
    receivedRedirectUri: oauthReturn && linkToken ? window.location.href : undefined,
    onSuccess: (publicToken, metadata) => {
      setLinkToken(null)
      clearLinkToken()
      clearOAuthParams()
      void run("Linking", async () => {
        const { accounts } = await exchangePublicToken(publicToken, metadata.institution?.name ?? null)
        apply(accounts)
        success()
      })
    },
    onExit: (err) => {
      setLinkToken(null)
      clearLinkToken()
      clearOAuthParams()
      if (err) setError(err.display_message || err.error_message)
    },
  })

  // Open Plaid as soon as the link token has loaded.
  useEffect(() => {
    if (linkToken && ready) open()
  }, [linkToken, ready, open])

  const openLink = async () => {
    const { link_token } = await createLinkToken()
    saveLinkToken(link_token)
    setLinkToken(link_token)
  }

  /** Consent is asked once and stored on the account with a timestamp. */
  const connect = () =>
    run("Opening", async () => {
      const { data } = await supabase!.auth.getUser()
      if (!data.user?.user_metadata?.plaid_consent_at) {
        setConsentOpen(true)
        return
      }
      await openLink()
    })

  const agreeAndConnect = () =>
    run("Opening", async () => {
      const { error } = await supabase!.auth.updateUser({ data: { plaid_consent_at: new Date().toISOString(), plaid_consent_version: "2026-10-15" } })
      if (error) throw error
      setConsentOpen(false)
      await openLink()
    })


  const banks = Array.from(new Map(accounts.map((a) => [a.item_id, a.institution ?? "Bank"])).entries())

  return (
    <section className="border-4 border-foreground bg-card" data-oid="0c14f092b8" data-oid-component-root="true" data-oid-callsite-deletable="true" data-oid-callsite-single="true">
      <div className="m-ds-xs flex items-center gap-ds-sm border-2 border-foreground bg-success px-ds-md py-ds-sm text-success-foreground" data-oid="46f7a59570">
        <Landmark className="size-5" strokeWidth={2.5} data-oid="1013e606a7" />
        <h3 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="92f3f2fa3b">Bank accounts</h3>
      </div>

      <div className="space-y-ds-md p-ds-md" data-oid="a782c93308" data-oid-text-editable="false" data-oid-text-source="expression:22524e85f18e|expression:3bad8c11a5a3|expression:9345748c6d61|expression:a3358cfbca28|element:button|expression:65cc46b2018f|expression:9cb002c7b845">
        {accounts.length === 0 ? (
          <p className="font-body text-[14px] leading-snug text-muted-foreground" data-oid="53c177c8a0">
            Link a bank to fill in My money automatically from your checking and savings balances.
          </p>
        ) : (
          banks.map(([itemId, institution]) => (
            <div key={itemId} className="border-2 border-foreground" data-oid="2f8e671fa8" data-oid-shared="true" data-oid-instance-targetable="true">
              <div className="flex items-center justify-between gap-ds-sm border-b-2 border-foreground bg-background px-ds-sm py-ds-xs" data-oid="ff1d901f2b" data-oid-shared="true" data-oid-instance-targetable="true">
                <h4 className="truncate font-label text-label font-extrabold uppercase" data-oid="782f745668" data-oid-shared="true" data-oid-instance-targetable="true">{institution}</h4>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => {
                    if (window.confirm(`Disconnect ${institution}?`))
                      void run("Disconnecting", async () => apply((await disconnectItem(itemId)).accounts))
                  }}
                  aria-label={`Disconnect ${institution}`}
                  className="flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-primary hover:text-primary-foreground" data-oid="4d97ade7dd" data-oid-shared="true" data-oid-instance-targetable="true"
                >
                  <Unlink className="size-4" strokeWidth={2.5} data-oid="29f254b504" data-oid-shared="true" data-oid-instance-targetable="true" />
                </button>
              </div>
              <ul className="divide-y-2 divide-foreground/15" data-oid="f99963cde8" data-oid-shared="true" data-oid-instance-targetable="true">
                {accounts
                  .filter((a) => a.item_id === itemId)
                  .map((a, index) => (
                    <li key={a.account_id} data-index={index} className="flex min-h-[52px] items-center justify-between gap-ds-sm px-ds-sm" data-oid="3f026dae71" data-oid-shared="true">
                      <div className="min-w-0" data-oid="f2ce96e0dd" data-oid-shared="true">
                        <p className="truncate font-body text-[15px]" data-oid="5ec8e0ea69" data-oid-shared="true">{a.name}</p>
                        <p className="font-caption text-caption text-muted-foreground" data-oid="8ad4e2f0f2" data-oid-shared="true" data-oid-text-editable="false" data-oid-text-source="expression:488191a1de0b|expression:2de59a963564">
                          {a.subtype ?? a.type}
                          {a.mask ? ` ···${a.mask}` : ""}
                        </p>
                      </div>
                      <p className="shrink-0 font-caption text-[15px] font-bold" data-oid="9adf72711e" data-oid-shared="true">{a.current == null ? "—" : fmt2(a.current)}</p>
                    </li>
                  ))}
              </ul>
            </div>
          ))
        )}

        {accounts.length > 0 ? (
          <p className="font-caption text-caption text-muted-foreground" data-oid="4612470860" data-oid-text-editable="false" data-oid-text-source="text|expression:4bd3c7ae7011|text">
            Checking + savings total {fmt2(cashTotal(accounts))} — used as My money.
          </p>
        ) : null}

        {!mfaReady ? (
          <p className="border-2 border-foreground bg-warning px-ds-sm py-ds-xs font-body text-[14px] leading-snug text-warning-foreground" data-oid="373417fbb1">
            Turn on two-step verification above before connecting a bank. It keeps your bank data safe if your email is ever compromised.
          </p>
        ) : null}

        {consentOpen ? (
          <div className="space-y-ds-sm border-2 border-foreground bg-background p-ds-sm" data-oid="e72f1d938c">
            <h4 className="font-label text-label font-extrabold uppercase" data-oid="ef4c562038">Before you connect</h4>
            <ul className="list-disc space-y-ds-xs pl-ds-lg font-body text-[14px] leading-snug" data-oid="11e74cb19e">
              <li data-oid="0dc150b128">We use Plaid to connect to your bank. Your bank login goes to Plaid and your bank, never to this app.</li>
              <li data-oid="711ed2d625">We'll store account names, the last 4 digits, balances and transactions to show your budget.</li>
              <li data-oid="8502ed2d88">We don't sell or share it. Disconnect any time to delete it.</li>
            </ul>
            <label className="flex min-h-[44px] items-start gap-ds-sm font-body text-[14px] leading-snug" data-oid="c20839ccd1">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 size-6 shrink-0 accent-[var(--primary)]" data-oid="c86528639a" />
              <span data-oid="1ca4c7b2fd">
                I agree to the{" "}
                <Link to="/privacy" className="font-bold underline" data-oid="7e70fd3bf3">Privacy Policy</Link>{" "}
                and{" "}
                <a href="https://plaid.com/legal/#end-user-privacy-policy" target="_blank" rel="noreferrer" className="font-bold underline" data-oid="bbc3fffe2d">Plaid End User Privacy Policy</a>, and allow this app to collect and store this data.
              </span>
            </label>
            <div className="grid grid-cols-2 gap-ds-sm" data-oid="69e3421ae8">
              <button type="button" onClick={() => setConsentOpen(false)} className="ds-button min-h-[52px] border-2 border-foreground bg-card" data-oid="3b2466db42">Cancel</button>
              <button type="button" disabled={!agreed || busy !== null} onClick={() => void agreeAndConnect()} className="ds-button ds-button-primary min-h-[52px] border-2 border-foreground" data-oid="513f2c522d">Agree</button>
            </div>
          </div>
        ) : null}

        <button type="button" disabled={busy !== null || !mfaReady || consentOpen} onClick={() => void connect()} className="ds-button ds-button-primary min-h-[56px] w-full border-2 border-foreground" data-oid="62e7e6f7a6" data-oid-text-editable="false">
          <Plus className="size-5" strokeWidth={3} data-oid="35aa63c22c" />
          {busy === "Opening" || busy === "Linking" ? `${busy}…` : accounts.length ? "Connect another bank" : "Connect bank"}
        </button>
        {accounts.length > 0 ? (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void run("Refreshing", async () => apply((await refreshAccounts()).accounts))}
            className="ds-button ds-button-secondary min-h-[56px] w-full border-2 border-foreground" data-oid="f2751337b2" data-oid-text-editable="false"
          >
            <RefreshCw className="size-5" strokeWidth={2.5} data-oid="2de3e1c623" />
            {busy === "Refreshing" ? "Refreshing…" : "Refresh balances"}
          </button>
        ) : null}

        {error ? <p className="border-2 border-foreground bg-primary px-ds-sm py-ds-xs font-body text-[14px] text-primary-foreground" data-oid="5fe26bb5ad">{error}</p> : null}
      </div>
    </section>
  )
}
