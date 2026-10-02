import { Cloud, CloudOff, LogIn, LogOut, RefreshCw } from "lucide-react"
import type { SyncStatus } from "../../hooks/useBudget"

interface Props {
  configured: boolean
  email: string | null
  status: SyncStatus
  onSignIn: () => void
  onSignOut: () => void
  onRetry: () => void
}

const STATUS_TEXT: Record<SyncStatus, string> = {
  local: "Saved on this device only",
  loading: "Loading from the cloud…",
  saving: "Saving…",
  synced: "Synced to the cloud",
  offline: "Offline — will sync when you reconnect",
  error: "Couldn't reach the cloud",
}

export function SyncPanel({ configured, email, status, onSignIn, onSignOut, onRetry }: Props) {
  const failed = status === "error" || status === "offline"
  return (
    <section className="mt-ds-lg border-4 border-foreground bg-card" data-oid="d322fc41c7" data-oid-component-root="true">
      <div className="m-ds-xs flex items-center gap-ds-sm border-2 border-foreground bg-secondary px-ds-md py-ds-sm text-secondary-foreground" data-oid="553b6995c2" data-oid-text-editable="false" data-oid-text-source="expression:6b529dba4a83|element:h2">
        {status === "local" || failed ? <CloudOff className="size-5" strokeWidth={2.5} data-oid="a3df234e06" /> : <Cloud className="size-5" strokeWidth={2.5} data-oid="c03b5022dc" />}
        <h2 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="a706041a2b">Sync</h2>
      </div>
      <div className="space-y-ds-sm p-ds-md" data-oid="8fa8c10013" data-oid-text-editable="false" data-oid-text-source="element:p|expression:8f5523d967b1|expression:81c1295eadba|element:div">
        <p data-failed={failed} className="font-body text-body data-[failed=true]:text-primary" data-oid="dfe14483a0">{STATUS_TEXT[status]}</p>
        {email ? <p className="font-caption text-caption text-muted-foreground" data-oid="1ece31d793" data-oid-text-editable="false" data-oid-text-source="text|expression:a88b7dcd1a9e">Signed in as {email}</p> : null}
        {!configured ? (
          <p className="font-caption text-caption text-muted-foreground" data-oid="440de72cd5">Add your Supabase URL and public key to turn on cloud sync.</p>
        ) : null}

        <div className="flex gap-ds-sm pt-ds-xs" data-oid="15c56af3bf" data-oid-text-editable="false" data-oid-text-source="expression:8769b564b922|expression:359c0f70c789|expression:c65df3e3dd56">
          {failed ? (
            <button type="button" onClick={onRetry} className="ds-button ds-button-secondary min-h-[52px] flex-1 border-2 border-foreground" data-oid="3d9a3e41e6">
              <RefreshCw className="size-4" strokeWidth={2.5} data-oid="df37da71e6" />
              Retry
            </button>
          ) : null}
          {configured && email ? (
            <button type="button" onClick={onSignOut} className="ds-button min-h-[52px] flex-1 border-2 border-foreground bg-card" data-oid="0ea3e1be25">
              <LogOut className="size-4" strokeWidth={2.5} data-oid="4f8b63367b" />
              Sign out
            </button>
          ) : null}
          {configured && !email ? (
            <button type="button" onClick={onSignIn} className="ds-button ds-button-primary min-h-[52px] flex-1 border-2 border-foreground" data-oid="edafc5778f">
              <LogIn className="size-4" strokeWidth={2.5} data-oid="2c0982771e" />
              Sign in to sync
            </button>
          ) : null}
        </div>
      </div>
    </section>
  )
}
