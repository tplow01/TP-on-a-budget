import { useCallback, useEffect, useState } from "react"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "../lib/supabase"

type Aal = { current: string | null; next: string | null }

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [aal, setAal] = useState<Aal>({ current: null, next: null })
  const [aalLoading, setAalLoading] = useState(false)

  const refreshAal = useCallback(async () => {
    if (!supabase) return
    setAalLoading(true)
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    setAal({ current: data?.currentLevel ?? null, next: data?.nextLevel ?? null })
    setAalLoading(false)
  }, [])

  useEffect(() => {
    if (!supabase) return
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setLoading(false)
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  // Re-check the assurance level whenever the session changes (sign-in, MFA verify, token refresh).
  useEffect(() => {
    if (session) void refreshAal()
    else setAal({ current: null, next: null })
  }, [session?.access_token, refreshAal]) // eslint-disable-line react-hooks/exhaustive-deps

  const mfaEnabled = aal.next === "aal2"
  return {
    configured: Boolean(supabase),
    session,
    loading: loading || (Boolean(session) && aalLoading && aal.current === null),
    /** Has a verified authenticator app. */
    mfaEnabled,
    /** Signed in with both password/link AND the authenticator code this session. */
    mfaVerified: aal.current === "aal2",
    /** Signed in, has MFA, but hasn't entered the code yet. */
    needsMfa: Boolean(session) && mfaEnabled && aal.current !== "aal2",
    refreshAal,
    signOut: async () => {
      await supabase?.auth.signOut()
    },
  }
}
