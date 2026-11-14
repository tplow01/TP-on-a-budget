import { useEffect, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { BANK_UPDATED_EVENT } from "../../lib/transactions"
import { deleteManualAccount, readManualAccounts, upsertManualAccount, type ManualAccount } from "../../lib/networth"
import { NumberInput } from "../budget/fields"

type ManualType = ManualAccount["type"]

export function ManualAccountsSection() {
  const [accounts, setAccounts] = useState<ManualAccount[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    const load = () => void readManualAccounts().then((a) => live && setAccounts(a))
    load()
    window.addEventListener(BANK_UPDATED_EVENT, load)
    return () => {
      live = false
      window.removeEventListener(BANK_UPDATED_EVENT, load)
    }
  }, [])

  const notify = () => window.dispatchEvent(new Event(BANK_UPDATED_EVENT))

  const save = async (a: ManualAccount, patch: Partial<Pick<ManualAccount, "name" | "type" | "balance">>) => {
    const next = { ...a, ...patch }
    setAccounts((list) => list.map((x) => (x.id === a.id ? next : x)))
    setError(null)
    try {
      await upsertManualAccount({ id: a.id, name: next.name, type: next.type, balance: next.balance })
      notify()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const remove = async (id: string) => {
    setError(null)
    try {
      await deleteManualAccount(id)
      notify()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const add = async () => {
    setError(null)
    try {
      await upsertManualAccount({ name: "New account", type: "cash", balance: 0 })
      notify()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <section className="border-4 border-foreground bg-card">
      <div className="m-ds-xs border-2 border-foreground bg-warning px-ds-md py-ds-sm text-warning-foreground">
        <h3 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]">Manual accounts</h3>
        <p className="font-caption text-caption">For balances your bank can't share. Linked accounts stay the main source.</p>
      </div>
      <div className="space-y-ds-sm p-ds-md">
        {accounts.map((a, index) => (
          <div key={a.id} data-index={index} className="space-y-ds-sm border-2 border-foreground p-ds-sm">
            <div className="flex items-center gap-ds-sm">
              <input
                type="text"
                aria-label="Account name"
                defaultValue={a.name}
                onBlur={(e) => {
                  const v = e.target.value.trim()
                  if (v && v !== a.name) void save(a, { name: v })
                }}
                className="min-h-[48px] min-w-0 flex-1 rounded-md border-2 border-foreground bg-card px-ds-sm font-body text-[16px]"
              />
              <button type="button" onClick={() => void remove(a.id)} aria-label={`Delete ${a.name}`} className="flex size-12 shrink-0 items-center justify-center rounded-md border-2 border-foreground bg-card active:scale-90">
                <Trash2 className="size-5" strokeWidth={2.5} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-ds-sm">
              <select
                aria-label="Account type"
                value={a.type}
                onChange={(e) => void save(a, { type: e.target.value as ManualType })}
                className="min-h-[56px] w-full rounded-md border-2 border-foreground bg-card px-ds-sm font-caption text-[16px]"
              >
                <option value="cash">Cash</option>
                <option value="investment">Investment</option>
                <option value="credit">Credit</option>
                <option value="other">Other</option>
              </select>
              <NumberInput value={a.balance} onChange={(v) => void save(a, { balance: v })} prefix="$" ariaLabel="Balance" />
            </div>
          </div>
        ))}
        <button type="button" onClick={() => void add()} className="ds-button min-h-[56px] w-full border-2 border-dashed border-foreground bg-card">
          <Plus className="size-5" strokeWidth={2.5} />
          Add manual account
        </button>
        {error ? <p className="border-2 border-foreground bg-primary px-ds-sm py-ds-xs font-body text-[14px] text-primary-foreground">{error}</p> : null}
      </div>
    </section>
  )
}
