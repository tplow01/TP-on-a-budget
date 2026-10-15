import { useEffect, useState } from "react"
import { ArrowRight, Copy, KeyRound, Mail } from "lucide-react"
import { supabase } from "../../lib/supabase"
import { success } from "../../lib/haptics"

type Mode = "link" | "password"

const redirectUrl = () => window.location.origin + import.meta.env.BASE_URL
const RESEND_SECONDS = 60

/** Turn Supabase auth errors into something actionable. */
function explain(message: string): string {
  const m = message.toLowerCase()
  if (m.includes("invalid login credentials"))
    return "Email or password doesn't match. No password yet? Use the email link instead. You can always sign in that way."
  if (m.includes("email not confirmed"))
    return "This account is waiting for email confirmation. Use the email link tab, or turn off “Confirm email” in Supabase → Authentication → Sign In / Providers → Email."
  if (m.includes("rate limit") || m.includes("security purposes")) return "Too many emails just now. Wait a minute and try again."
  if (m.includes("expired") || m.includes("invalid") && m.includes("token")) return "That code has expired or was already used. Send a new link."
  if (m.includes("user not found") || m.includes("signups not allowed"))
    return "No account exists for that email."
  return message
}

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>("link")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => window.clearTimeout(t)
  }, [cooldown])

  const run = async (fn: () => Promise<{ error: { message: string } | null }>) => {
    setBusy(true)
    setError(null)
    setNotice(null)
    const { error } = await fn()
    setBusy(false)
    if (error) setError(explain(error.message))
    return !error
  }

  const sendLink = async () => {
    const to = email.trim()
    const ok = await run(() => supabase!.auth.signInWithOtp({ email: to, options: { shouldCreateUser: false, emailRedirectTo: redirectUrl() } }))
    if (ok) {
      setSentTo(to)
      setCooldown(RESEND_SECONDS)
      success()
    }
  }

  const verify = () => run(() => supabase!.auth.verifyOtp({ email: (sentTo ?? email).trim(), token: code.trim(), type: "email" }))

  const signIn = () => run(() => supabase!.auth.signInWithPassword({ email: email.trim(), password }))

  return (
    <main className="relative min-h-screen bg-background text-foreground" data-oid="868fc29f7b" data-oid-component-root="true" data-oid-callsite-deletable="true" data-oid-callsite-single="true">
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col justify-center px-ds-md pb-[56px] pt-[72px]" data-oid="81d4b27f6e">
        <section className="border-4 border-foreground bg-card shadow-[6px_6px_0_0_var(--foreground)]" data-oid="35db043b50" data-oid-text-editable="false" data-oid-text-source="element:div|element:div|element:div|expression:54a77c6e23d9|expression:945a8a749906|element:details">
          <div className="m-ds-xs border-2 border-foreground bg-primary px-ds-md py-ds-md text-center text-primary-foreground" data-oid="90a732d591">
            <p className="font-caption text-caption uppercase" data-oid="64b176807f">Collect your budget</p>
            <h1 className="font-heading text-heading font-extrabold uppercase" data-oid="e2f6c33921">Sign in</h1>
          </div>

          <div role="tablist" aria-label="Sign-in method" className="mx-ds-md mt-ds-sm grid grid-cols-2 border-2 border-foreground" data-oid="65638ad4f2">
            <button type="button" role="tab" aria-selected={mode === "link"} onClick={() => setMode("link")} className="min-h-[48px] border-r-2 border-foreground bg-muted font-label text-label font-bold uppercase text-muted-foreground aria-selected:bg-card aria-selected:text-foreground" data-oid="f49dc311cd">
              Email link
            </button>
            <button type="button" role="tab" aria-selected={mode === "password"} onClick={() => setMode("password")} className="min-h-[48px] bg-muted font-label text-label font-bold uppercase text-muted-foreground aria-selected:bg-card aria-selected:text-foreground" data-oid="4727c8620f">
              Password
            </button>
          </div>

          <div className="space-y-ds-md p-ds-md" data-oid="94841c4a50" data-oid-text-editable="false" data-oid-text-source="element:label|expression:e33fbe43da33">
            <label className="ds-field" data-oid="715504ba69">
              <span className="ds-field-label uppercase" data-oid="a8704fef2b">Email</span>
              <input
                type="email"
                inputMode="email"
                autoComplete="username email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="ds-input min-h-[56px] w-full rounded-md border-2 border-foreground bg-card px-ds-md font-body text-[17px]" data-oid="d68717a397"
              />
            </label>

            {mode === "link" ? (
              <>
                {sentTo ? (
                  <>
                    <div className="border-2 border-foreground bg-warning px-ds-sm py-ds-sm text-warning-foreground" data-oid="1678871748">
                      <p className="font-label text-label font-extrabold uppercase" data-oid="991d346f0d">Check your email</p>
                      <p className="font-body text-[14px] leading-snug" data-oid="9190e956bb" data-oid-text-editable="false" data-oid-text-source="text|expression:7b70acaececf|text">Tap the link we sent to {sentTo}, or type the 6-digit code from the same email.</p>
                    </div>
                    <label className="ds-field" data-oid="fe8030c9e3">
                      <span className="ds-field-label uppercase" data-oid="e3468ceec8">Code from email</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={8}
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="123456"
                        className="ds-input min-h-[56px] w-full rounded-md border-2 border-foreground bg-card px-ds-md font-caption text-[22px] tracking-[0.3em]" data-oid="7e9459d87b"
                      />
                    </label>
                    <button type="button" disabled={busy || code.length < 6} onClick={() => void verify()} className="ds-button ds-button-primary min-h-[60px] w-full border-2 border-foreground" data-oid="fbcaf9d413" data-oid-text-editable="false">
                      <ArrowRight className="size-5" strokeWidth={2.5} data-oid="503f7f6876" />
                      {busy ? "Checking…" : "Sign in"}
                    </button>
                    <button type="button" disabled={busy || cooldown > 0} onClick={() => void sendLink()} className="ds-button ds-button-secondary min-h-[52px] w-full border-2 border-foreground" data-oid="a7193c4736" data-oid-text-editable="false">
                      <Mail className="size-5" strokeWidth={2.5} data-oid="3c0fbd0fdb" />
                      {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend link"}
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" disabled={busy || !email.includes("@")} onClick={() => void sendLink()} className="ds-button ds-button-primary min-h-[60px] w-full border-2 border-foreground" data-oid="cdab10c5df" data-oid-text-editable="false">
                      <Mail className="size-5" strokeWidth={2.5} data-oid="faa7c23397" />
                      {busy ? "Sending…" : "Email me a sign-in link"}
                    </button>
                    <p className="font-body text-[14px] leading-snug text-muted-foreground" data-oid="b43bf3f93b">No password to remember or reset.</p>
                  </>
                )}
              </>
            ) : (
              <>
                <label className="ds-field" data-oid="54aa9963ac">
                  <span className="ds-field-label uppercase" data-oid="492600a309">Password</span>
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="ds-input min-h-[56px] w-full rounded-md border-2 border-foreground bg-card px-ds-md font-body text-[17px]" data-oid="0a6371b45f"
                  />
                </label>
                <button type="button" disabled={busy || !email || !password} onClick={() => void signIn()} className="ds-button ds-button-primary min-h-[60px] w-full border-2 border-foreground" data-oid="88c4ae97d6" data-oid-text-editable="false">
                  <KeyRound className="size-5" strokeWidth={2.5} data-oid="4bad4c724d" />
                  {busy ? "Working…" : "Sign in"}
                </button>
                <p className="font-body text-[14px] leading-snug text-muted-foreground" data-oid="7e9d5e18cf">Save the password to iCloud Keychain when asked. Next time Safari fills it in with Face ID.</p>
              </>
            )}
          </div>

          {notice ? <p className="mx-ds-md mb-ds-md border-2 border-foreground bg-warning px-ds-sm py-ds-xs font-body text-[14px] text-warning-foreground" data-oid="f98e798750">{notice}</p> : null}
          {error ? <p className="mx-ds-md mb-ds-md border-2 border-foreground bg-primary px-ds-sm py-ds-xs font-body text-[14px] text-primary-foreground" data-oid="e98044a451">{error}</p> : null}

          <details className="mx-ds-md mb-ds-md border-2 border-dashed border-foreground p-ds-sm" data-oid="3473394bc9">
            <summary className="min-h-[44px] cursor-pointer content-center font-label text-[12px] font-bold uppercase tracking-[0.06em]" data-oid="513795231f">Link not arriving?</summary>
            <div className="space-y-ds-xs pt-ds-xs" data-oid="0e373ef2dd">
              <p className="font-body text-[14px] leading-snug" data-oid="88896adb82">
                In Supabase, add <code className="font-caption" data-oid="ba11d93c9b">{"{{ .Token }}"}</code> to Authentication → Email Templates → Magic Link, and add this address under Authentication → URL Configuration:
              </p>
              <button type="button" onClick={() => void navigator.clipboard?.writeText(redirectUrl())} className="flex min-h-[44px] w-full items-center gap-ds-xs rounded-md border-2 border-foreground bg-background px-ds-sm text-left" data-oid="57a4dd4284">
                <code className="min-w-0 flex-1 break-all font-caption text-caption" data-oid="96671aafc3">{redirectUrl()}</code>
                <Copy className="size-4 shrink-0" strokeWidth={2.5} data-oid="45d8efe2d0" />
              </button>
            </div>
          </details>
        </section>
      </div>
    </main>
  )
}
