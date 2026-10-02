import { useCallback, useEffect, useState } from "react"
import { usePlaidLink } from "react-plaid-link"
import { Landmark, Plus, RefreshCw, Unlink } from "lucide-react"
import { fmt2 } from "../../lib/budget"
import {
  cashTotal,
  createLinkToken,
  disconnectItem,
  exchangePublicToken,
  readSavedAccounts,
  refreshAccounts,
  type BankAccount,
} from "../../lib/plaid"

export function BankSection({ onTotal }: { onTotal: (total: number) => void }) {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const apply = useCallback(
    (list: BankAccount[]) => {
      setAccounts(list)
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
  }, [])

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (publicToken, metadata) => {
      setLinkToken(null)
      void run("Linking", async () => {
        const { accounts } = await exchangePublicToken(publicToken, metadata.institution?.name ?? null)
        apply(accounts)
      })
    },
    onExit: (err) => {
      setLinkToken(null)
      if (err) setError(err.display_message || err.error_message)
    },
  })

  // Open Plaid as soon as the link token has loaded.
  useEffect(() => {
    if (linkToken && ready) open()
  }, [linkToken, ready, open])

  const connect = () =>
    run("Opening", async () => {
      const { link_token } = await createLinkToken()
      setLinkToken(link_token)
    })

  const banks = Array.from(new Map(accounts.map((a) => [a.item_id, a.institution ?? "Bank"])).entries())

  return (
    <section className="border-4 border-foreground bg-card" data-oid="0c14f092b8" data-oid-component-root="true" data-oid-callsite-deletable="true" data-oid-callsite-single="true">
      <div className="m-ds-xs flex items-center gap-ds-sm border-2 border-foreground bg-success px-ds-md py-ds-sm text-success-foreground" data-oid="46f7a59570">
        <Landmark className="size-5" strokeWidth={2.5} data-oid="1013e606a7" />
        <h3 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="92f3f2fa3b">Bank accounts</h3>
      </div>

      <div className="space-y-ds-md p-ds-md" data-oid="a782c93308" data-oid-text-editable="false" data-oid-text-source="expression:2bb85b711c5d|expression:7d15867658ff|element:button|expression:e9858012fa7e|expression:72c51f5cbf8a">
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

        <button type="button" disabled={busy !== null} onClick={() => void connect()} className="ds-button ds-button-primary min-h-[56px] w-full border-2 border-foreground" data-oid="62e7e6f7a6" data-oid-text-editable="false">
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
