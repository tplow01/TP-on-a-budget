import { useState } from "react"
import { LogOut, ShieldCheck } from "lucide-react"
import { supabase } from "../../lib/supabase"
import { success } from "../../lib/haptics"

/** Shown after sign-in when the account has two-step verification on. */
export function MfaChallenge({ onVerified, onSignOut }: { onVerified: () => void; onSignOut: () => void }) {
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const verify = async () => {
    if (!supabase) return
    setBusy(true)
    setError(null)
    const { data: factors, error: listError } = await supabase.auth.mfa.listFactors()
    const factor = factors?.totp.find((f) => f.status === "verified")
    if (listError || !factor) {
      setBusy(false)
      return setError(listError?.message ?? "No authenticator found on this account.")
    }
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: code.trim() })
    setBusy(false)
    if (error) return setError("That code didn't work. Check the time on your phone and try the newest code.")
    success()
    onVerified()
  }

  return (
    <main className="min-h-screen bg-background text-foreground" data-oid="b3fb060dc2" data-oid-component-root="true" data-oid-callsite-deletable="true" data-oid-callsite-single="true">
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col justify-center px-ds-md pb-[56px] pt-[72px]" data-oid="79a5e7fba8">
        <section className="border-4 border-foreground bg-card shadow-[6px_6px_0_0_var(--foreground)]" data-oid="92de7b896b">
          <div className="m-ds-xs border-2 border-foreground bg-secondary px-ds-md py-ds-md text-center text-secondary-foreground" data-oid="a9de659377">
            <ShieldCheck className="mx-auto size-8" strokeWidth={2.5} data-oid="51572675b1" />
            <h1 className="mt-ds-xs font-heading text-heading font-extrabold uppercase" data-oid="87fe231a55">Two-step check</h1>
            <p className="font-caption text-caption uppercase" data-oid="70a8efcb45">Enter the code from your authenticator app</p>
          </div>
          <div className="space-y-ds-md p-ds-md" data-oid="fe0530e5c3" data-oid-text-editable="false" data-oid-text-source="element:label|element:button|expression:72c51f5cbf8a">
            <label className="ds-field" data-oid="3e3a6f3c51">
              <span className="ds-field-label uppercase" data-oid="5ea2418516">6-digit code</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="ds-input min-h-[56px] w-full rounded-md border-2 border-foreground bg-card px-ds-md font-caption text-[24px] tracking-[0.35em]" data-oid="5581404f2f"
              />
            </label>
            <button type="button" disabled={busy || code.length !== 6} onClick={() => void verify()} className="ds-button ds-button-primary min-h-[60px] w-full border-2 border-foreground" data-oid="4826553dca" data-oid-text-editable="false">
              <ShieldCheck className="size-5" strokeWidth={2.5} data-oid="ad690104f7" />
              {busy ? "Checking…" : "Verify"}
            </button>
            {error ? <p className="border-2 border-foreground bg-primary px-ds-sm py-ds-xs font-body text-[14px] text-primary-foreground" data-oid="ab1f438ae9">{error}</p> : null}
          </div>
        </section>
        <button type="button" onClick={onSignOut} className="mt-ds-lg inline-flex min-h-[52px] items-center justify-center gap-ds-xs font-label text-label font-bold uppercase text-muted-foreground underline underline-offset-4" data-oid="16172f8357">
          <LogOut className="size-4" strokeWidth={2.5} data-oid="1f2122e0cd" />
          Sign out
        </button>
      </div>
    </main>
  )
}
