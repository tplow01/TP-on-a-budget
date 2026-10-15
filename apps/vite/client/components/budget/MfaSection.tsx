import { useState } from "react"
import { ShieldCheck, ShieldOff } from "lucide-react"
import { supabase } from "../../lib/supabase"
import { success } from "../../lib/haptics"

interface Props {
  enabled: boolean
  onChanged: () => void
}

/** Turn an authenticator app (TOTP) on or off. Required before linking a bank. */
export function MfaSection({ enabled, onChanged }: Props) {
  const [enroll, setEnroll] = useState<{ factorId: string; qr: string; secret: string } | null>(null)
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const start = async () => {
    if (!supabase) return
    setBusy(true)
    setError(null)
    // Clear any half-finished setups first.
    const { data: list } = await supabase.auth.mfa.listFactors()
    for (const f of list?.all ?? []) if (f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id })
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `Authenticator ${Date.now()}` })
    setBusy(false)
    if (error || !data) return setError(error?.message ?? "Couldn't start setup. Check that MFA is enabled in Supabase → Authentication.")
    setEnroll({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret })
  }

  const confirm = async () => {
    if (!supabase || !enroll) return
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: enroll.factorId, code: code.trim() })
    setBusy(false)
    if (error) return setError("That code didn't work. Try the newest one from the app.")
    success()
    setEnroll(null)
    setCode("")
    onChanged()
  }

  const turnOff = async () => {
    if (!supabase || !window.confirm("Turn off two-step verification? You'll need it again to connect a bank.")) return
    setBusy(true)
    const { data } = await supabase.auth.mfa.listFactors()
    for (const f of data?.totp ?? []) await supabase.auth.mfa.unenroll({ factorId: f.id })
    await supabase.auth.refreshSession()
    setBusy(false)
    onChanged()
  }

  return (
    <section className="border-4 border-foreground bg-card" data-oid="173d4dbc18" data-oid-component-root="true" data-oid-callsite-deletable="true" data-oid-callsite-single="true">
      <div className="m-ds-xs flex items-center gap-ds-sm border-2 border-foreground bg-secondary px-ds-md py-ds-sm text-secondary-foreground" data-oid="dde21d40e4" data-oid-text-editable="false" data-oid-text-source="expression:d5103b33b20a|element:h3|element:span">
        {enabled ? <ShieldCheck className="size-5" strokeWidth={2.5} data-oid="434bb8a7ce" /> : <ShieldOff className="size-5" strokeWidth={2.5} data-oid="69ef1a21cf" />}
        <h3 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="d534b1dd87">Two-step verification</h3>
        <span data-on={enabled} className="ml-auto rounded-sm border-2 border-foreground bg-card px-1.5 font-caption text-[11px] uppercase text-foreground data-[on=true]:bg-success data-[on=true]:text-success-foreground" data-oid="02a302ccc1">
          {enabled ? "On" : "Off"}
        </span>
      </div>
      <div className="space-y-ds-sm p-ds-md" data-oid="ce605ae717" data-oid-text-editable="false" data-oid-text-source="expression:7f6ff5d9354c|expression:72c51f5cbf8a">
        {enabled ? (
          <>
            <p className="font-body text-[14px] leading-snug text-muted-foreground" data-oid="919cdfb0d7">You'll be asked for a code from your authenticator app each time you sign in.</p>
            <button type="button" disabled={busy} onClick={() => void turnOff()} className="ds-button min-h-[52px] w-full border-2 border-foreground bg-card text-primary" data-oid="c86294c379">
              <ShieldOff className="size-5" strokeWidth={2.5} data-oid="32ce301cb6" />
              Turn off
            </button>
          </>
        ) : enroll ? (
          <>
            <p className="font-body text-[14px] leading-snug" data-oid="f8bdf7de64">Scan this in Google Authenticator, 1Password or Authy (or tap the code below to copy it), then enter the 6-digit code.</p>
            <div className="mx-auto size-44 border-4 border-foreground bg-popover p-ds-xs" data-oid="f5dd25b609">
              <img src={enroll.qr} alt="Authenticator QR code" className="size-full" data-oid="f3b95c9a1d" />
            </div>
            <button type="button" onClick={() => void navigator.clipboard?.writeText(enroll.secret)} className="block min-h-[44px] w-full break-all rounded-md border-2 border-dashed border-foreground px-ds-sm text-center font-caption text-caption" data-oid="9f20f407fc">
              {enroll.secret}
            </button>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              aria-label="6-digit code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="ds-input min-h-[56px] w-full rounded-md border-2 border-foreground bg-card px-ds-md font-caption text-[22px] tracking-[0.35em]" data-oid="55b0e569c1"
            />
            <button type="button" disabled={busy || code.length !== 6} onClick={() => void confirm()} className="ds-button ds-button-primary min-h-[56px] w-full border-2 border-foreground" data-oid="d01e0bdb24" data-oid-text-editable="false">
              <ShieldCheck className="size-5" strokeWidth={2.5} data-oid="1c1896801d" />
              {busy ? "Checking…" : "Confirm"}
            </button>
          </>
        ) : (
          <>
            <p className="font-body text-[14px] leading-snug text-muted-foreground" data-oid="1b248e5506">Add a code from an authenticator app at sign-in. Required before you connect a bank.</p>
            <button type="button" disabled={busy} onClick={() => void start()} className="ds-button ds-button-secondary min-h-[52px] w-full border-2 border-foreground" data-oid="43e091ce94" data-oid-text-editable="false">
              <ShieldCheck className="size-5" strokeWidth={2.5} data-oid="a14a7e8a7a" />
              {busy ? "Starting…" : "Turn on"}
            </button>
          </>
        )}
        {error ? <p className="border-2 border-foreground bg-primary px-ds-sm py-ds-xs font-body text-[14px] text-primary-foreground" data-oid="49db1cb3de">{error}</p> : null}
      </div>
    </section>
  )
}
