import { useEffect, useRef, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { BANK_UPDATED_EVENT } from "../../lib/transactions"
import { deleteManualAccount, readManualAccounts, upsertManualAccount, type ManualAccount } from "../../lib/networth"
import { NumberInput } from "../budget/fields"

type ManualType = ManualAccount["type"]

export function ManualAccountsSection() {
  const [accounts, setAccounts] = useState<ManualAccount[]>([])
  const [error, setError] = useState<string | null>(null)

  // Edits in flight (debounce timers + pending upserts): never overwrite local state from a reload meanwhile.
  const timers = useRef(new Map<string, { h: ReturnType<typeof setTimeout>; row: ManualAccount }>())
  const inflight = useRef(0)

  useEffect(() => {
    let live = true
    const load = () => {
      if (timers.current.size > 0 || inflight.current > 0) return
      void readManualAccounts().then((a) => live && timers.current.size === 0 && inflight.current === 0 && setAccounts(a))
    }
    load()
    window.addEventListener(BANK_UPDATED_EVENT, load)
    return () => {
      live = false
      window.removeEventListener(BANK_UPDATED_EVENT, load)
    }
  }, [])
  useEffect(() => {
    const t = timers.current
    return () =>
      t.forEach(({ h, row }) => {
        clearTimeout(h)
        void upsertManualAccount({ id: row.id, name: row.name, type: row.type, balance: row.balance }).catch(() => {})
      })
  }, [])

  const notify = () => window.dispatchEvent(new Event(BANK_UPDATED_EVENT))

  const persist = async (a: ManualAccount) => {
    inflight.current += 1
    try {
      await upsertManualAccount({ id: a.id, name: a.name, type: a.type, balance: a.balance })
      inflight.current -= 1
      notify()
    } catch (e) {
      inflight.current -= 1
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  // Apply the edit locally at once; persist after a short pause so typing isn't interrupted.
  const save = (a: ManualAccount, patch: Partial<Pick<ManualAccount, "name" | "type" | "balance">>) => {
    const next = { ...a, ...patch }
    setAccounts((list) => list.map((x) => (x.id === a.id ? next : x)))
    setError(null)
    const old = timers.current.get(a.id)
    if (old) clearTimeout(old.h)
    const h = setTimeout(() => {
      timers.current.delete(a.id)
      void persist(next)
    }, 500)
    timers.current.set(a.id, { h, row: next })
  }

  const remove = async (id: string) => {
    const pending = timers.current.get(id)
    if (pending) clearTimeout(pending.h)
    timers.current.delete(id)
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
                  if (v && v !== a.name) save(a, { name: v })
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
                onChange={(e) => save(a, { type: e.target.value as ManualType })}
                className="min-h-[56px] w-full rounded-md border-2 border-foreground bg-card px-ds-sm font-caption text-[16px]"
              >
                <option value="cash">Cash</option>
                <option value="investment">Investment</option>
                <option value="credit">Credit</option>
                <option value="other">Other</option>
              </select>
              <NumberInput value={a.balance} onChange={(v) => save(a, { balance: v })} prefix="$" ariaLabel="Balance" />
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
