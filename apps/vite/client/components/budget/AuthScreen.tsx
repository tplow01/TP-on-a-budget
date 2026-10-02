import { useState } from "react"
import { ArrowRight, Mail } from "lucide-react"
import { supabase } from "../../lib/supabase"

export function AuthScreen({ onSkip }: { onSkip: () => void }) {
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [step, setStep] = useState<"email" | "code">("email")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendCode = async () => {
    if (!supabase || !email.trim()) return
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true, emailRedirectTo: window.location.origin + import.meta.env.BASE_URL },
    })
    setBusy(false)
    if (error) setError(error.message)
    else setStep("code")
  }

  const verify = async () => {
    if (!supabase || !code.trim()) return
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" })
    setBusy(false)
    if (error) setError(error.message)
  }

  return (
    <main className="relative min-h-screen bg-background text-foreground" data-oid="69baf898b2" data-oid-component-root="true" data-oid-callsite-deletable="true" data-oid-callsite-single="true">
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col justify-center px-ds-md py-ds-3xl" data-oid="2c09789ede">
        <section className="border-4 border-foreground bg-card" data-oid="0806ec1613" data-oid-text-editable="false" data-oid-text-source="element:div|expression:581de70fb31d|expression:383a46889f9d">
          <div className="m-ds-xs border-2 border-foreground bg-primary px-ds-md py-ds-md text-center text-primary-foreground" data-oid="f43fc2cfbd">
            <p className="font-caption text-caption uppercase" data-oid="f62ea71bf8">Sync across devices</p>
            <h1 className="font-heading text-heading font-extrabold uppercase" data-oid="05a5968aa0">Sign in</h1>
          </div>

          {step === "email" ? (
            <form
              className="space-y-ds-md p-ds-md"
              onSubmit={(e) => {
                e.preventDefault()
                void sendCode()
              }} data-oid="ffb9f07770"
            >
              <p className="font-body text-body" data-oid="b85403e34e">Enter your email and we'll send you a sign-in code. No password needed.</p>
              <label className="ds-field" data-oid="471f9b9ba3">
                <span className="ds-field-label uppercase" data-oid="936162f53d">Email</span>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="ds-input min-h-[56px] w-full rounded-md border-2 border-foreground bg-card px-ds-md font-body text-[17px]" data-oid="0bb13edfa8"
                />
              </label>
              <button type="submit" disabled={busy} className="ds-button ds-button-primary min-h-[60px] w-full border-2 border-foreground" data-oid="d1f709bb9e" data-oid-text-editable="false">
                <Mail className="size-5" strokeWidth={2.5} data-oid="303492783b" />
                {busy ? "Sending…" : "Send code"}
              </button>
            </form>
          ) : (
            <form
              className="space-y-ds-md p-ds-md"
              onSubmit={(e) => {
                e.preventDefault()
                void verify()
              }} data-oid="e2c0fbc787"
            >
              <p className="font-body text-body" data-oid="2aeaa1eac3" data-oid-text-editable="false" data-oid-text-source="text|expression:a88b7dcd1a9e|text">We sent a code to {email}. Type it below, or tap the link in the email on this device.</p>
              <label className="ds-field" data-oid="70f6d2b465">
                <span className="ds-field-label uppercase" data-oid="7109d8d829">Code</span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="ds-input min-h-[56px] w-full rounded-md border-2 border-foreground bg-card px-ds-md font-caption text-[22px] tracking-[0.3em]" data-oid="8891510ff6"
                />
              </label>
              <button type="submit" disabled={busy} className="ds-button ds-button-primary min-h-[60px] w-full border-2 border-foreground" data-oid="9ca5ab0b0a" data-oid-text-editable="false">
                <ArrowRight className="size-5" strokeWidth={2.5} data-oid="045aebbbe2" />
                {busy ? "Checking…" : "Sign in"}
              </button>
              <button type="button" onClick={() => setStep("email")} className="ds-button ds-button-secondary min-h-[52px] w-full border-2 border-foreground" data-oid="e7f7dd2b35">
                Use a different email
              </button>
            </form>
          )}

          {error ? <p className="mx-ds-md mb-ds-md border-2 border-foreground bg-primary px-ds-sm py-ds-xs font-body text-[14px] text-primary-foreground" data-oid="766206a8fc">{error}</p> : null}
        </section>

        <button type="button" onClick={onSkip} className="mt-ds-lg min-h-[52px] font-label text-label font-bold uppercase text-muted-foreground underline underline-offset-4" data-oid="616334f226">
          Use on this device only
        </button>
      </div>
    </main>
  )
}
