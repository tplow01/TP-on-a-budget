import { useState } from "react"
import { ArrowRight, Copy, KeyRound, Mail, UserPlus } from "lucide-react"
import { supabase } from "../../lib/supabase"

type Mode = "password" | "code"

const redirectUrl = () => window.location.origin + import.meta.env.BASE_URL

export function AuthScreen({ onSkip }: { onSkip: () => void }) {
  const [mode, setMode] = useState<Mode>("password")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [codeSent, setCodeSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const run = async (fn: () => Promise<{ error: { message: string } | null }>) => {
    setBusy(true)
    setError(null)
    setNotice(null)
    const { error } = await fn()
    setBusy(false)
    if (error) setError(error.message)
    return !error
  }

  const signIn = () =>
    run(() => supabase!.auth.signInWithPassword({ email: email.trim(), password }))

  const signUp = async () => {
    setBusy(true)
    setError(null)
    setNotice(null)
    const { data, error } = await supabase!.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: redirectUrl() },
    })
    setBusy(false)
    if (error) return setError(error.message)
    if (!data.session) {
      setNotice(
        "Account created, but Supabase wants the email confirmed first. To skip that: Supabase → Authentication → Sign In / Providers → Email → turn off “Confirm email”, then tap Sign in.",
      )
    }
  }

  const sendCode = async () => {
    const ok = await run(() =>
      supabase!.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true, emailRedirectTo: redirectUrl() } }),
    )
    if (ok) setCodeSent(true)
  }

  const verify = () => run(() => supabase!.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" }))

  return (
    <main className="relative min-h-screen bg-background text-foreground" data-oid="96384403e2" data-oid-component-root="true" data-oid-callsite-deletable="true" data-oid-callsite-single="true">
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col justify-center px-ds-md py-ds-3xl" data-oid="a32f187891">
        <section className="border-4 border-foreground bg-card" data-oid="a6361494a2" data-oid-text-editable="false" data-oid-text-source="element:div|element:div|element:div|expression:bd3e71572039|expression:c49cb531f8ee">
          <div className="m-ds-xs border-2 border-foreground bg-primary px-ds-md py-ds-md text-center text-primary-foreground" data-oid="d5f6e3ddf4">
            <p className="font-caption text-caption uppercase" data-oid="689cbdb71f">Sync across devices</p>
            <h1 className="font-heading text-heading font-extrabold uppercase" data-oid="fdc167dc0b">Sign in</h1>
          </div>

          <div role="tablist" aria-label="Sign-in method" className="mx-ds-md mt-ds-sm grid grid-cols-2 border-2 border-foreground" data-oid="98db39a5f6">
            <button type="button" role="tab" aria-selected={mode === "password"} onClick={() => setMode("password")} className="min-h-[48px] border-r-2 border-foreground bg-muted font-label text-label font-bold uppercase text-muted-foreground aria-selected:bg-card aria-selected:text-foreground" data-oid="0fb5da6d44">
              Password
            </button>
            <button type="button" role="tab" aria-selected={mode === "code"} onClick={() => setMode("code")} className="min-h-[48px] bg-muted font-label text-label font-bold uppercase text-muted-foreground aria-selected:bg-card aria-selected:text-foreground" data-oid="c11e0f0f8f">
              Email code
            </button>
          </div>

          <div className="space-y-ds-md p-ds-md" data-oid="5d5e5c4d29" data-oid-text-editable="false" data-oid-text-source="element:label|expression:f0dcfe84b2ed">
            <label className="ds-field" data-oid="5781d1aefc">
              <span className="ds-field-label uppercase" data-oid="70f6d2b465">Email</span>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="ds-input min-h-[56px] w-full rounded-md border-2 border-foreground bg-card px-ds-md font-body text-[17px]" data-oid="1849bb9540"
              />
            </label>

            {mode === "password" ? (
              <>
                <label className="ds-field" data-oid="cf3b9b25d9">
                  <span className="ds-field-label uppercase" data-oid="a4d9060e03">Password</span>
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="ds-input min-h-[56px] w-full rounded-md border-2 border-foreground bg-card px-ds-md font-body text-[17px]" data-oid="afd8ce44e2"
                  />
                </label>
                <button type="button" disabled={busy || !email || !password} onClick={() => void signIn()} className="ds-button ds-button-primary min-h-[60px] w-full border-2 border-foreground" data-oid="eb3ad1bff8" data-oid-text-editable="false">
                  <KeyRound className="size-5" strokeWidth={2.5} data-oid="bb28e76578" />
                  {busy ? "Working…" : "Sign in"}
                </button>
                <button type="button" disabled={busy || !email || password.length < 6} onClick={() => void signUp()} className="ds-button ds-button-secondary min-h-[56px] w-full border-2 border-foreground" data-oid="33906b8dfc">
                  <UserPlus className="size-5" strokeWidth={2.5} data-oid="1a6033df79" />
                  Create account
                </button>
              </>
            ) : (
              <>
                {codeSent ? (
                  <label className="ds-field" data-oid="e74b3e4186">
                    <span className="ds-field-label uppercase" data-oid="70f36e3adc">Code from email</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      className="ds-input min-h-[56px] w-full rounded-md border-2 border-foreground bg-card px-ds-md font-caption text-[22px] tracking-[0.3em]" data-oid="4c720ba00d"
                    />
                  </label>
                ) : null}
                {codeSent ? (
                  <button type="button" disabled={busy || !code} onClick={() => void verify()} className="ds-button ds-button-primary min-h-[60px] w-full border-2 border-foreground" data-oid="1353680704" data-oid-text-editable="false">
                    <ArrowRight className="size-5" strokeWidth={2.5} data-oid="5fba89f537" />
                    {busy ? "Checking…" : "Sign in"}
                  </button>
                ) : (
                  <button type="button" disabled={busy || !email} onClick={() => void sendCode()} className="ds-button ds-button-primary min-h-[60px] w-full border-2 border-foreground" data-oid="3c4e7e6b90" data-oid-text-editable="false">
                    <Mail className="size-5" strokeWidth={2.5} data-oid="e4704bb559" />
                    {busy ? "Sending…" : "Send code"}
                  </button>
                )}
                <div className="space-y-ds-xs border-2 border-dashed border-foreground p-ds-sm" data-oid="383a2657d9">
                  <p className="font-body text-[14px] leading-snug" data-oid="37531c77d7">
                    No code in the email, or the link opens localhost? In Supabase, add <code className="font-caption" data-oid="8991f401b9">{"{{ .Token }}"}</code> to Authentication → Email Templates → Magic Link, and add this address under Authentication → URL Configuration:
                  </p>
                  <button
                    type="button"
                    onClick={() => void navigator.clipboard?.writeText(redirectUrl())}
                    className="flex min-h-[44px] w-full items-center gap-ds-xs rounded-md border-2 border-foreground bg-background px-ds-sm text-left" data-oid="e8340902c0"
                  >
                    <code className="min-w-0 flex-1 break-all font-caption text-caption" data-oid="5537f82319">{redirectUrl()}</code>
                    <Copy className="size-4 shrink-0" strokeWidth={2.5} data-oid="60b08d0bf0" />
                  </button>
                </div>
              </>
            )}
          </div>

          {notice ? <p className="mx-ds-md mb-ds-md border-2 border-foreground bg-warning px-ds-sm py-ds-xs font-body text-[14px] text-warning-foreground" data-oid="4f80de1afb">{notice}</p> : null}
          {error ? <p className="mx-ds-md mb-ds-md border-2 border-foreground bg-primary px-ds-sm py-ds-xs font-body text-[14px] text-primary-foreground" data-oid="930e05e323">{error}</p> : null}
        </section>

        <button type="button" onClick={onSkip} className="mt-ds-lg min-h-[52px] font-label text-label font-bold uppercase text-muted-foreground underline underline-offset-4" data-oid="ef839d2179">
          Use on this device only
        </button>
      </div>
    </main>
  )
}
