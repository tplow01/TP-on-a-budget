import { AnimatePresence, motion } from "framer-motion"
import { Cloud, CloudOff, LogIn, LogOut, RefreshCw, RotateCcw, UserRound, X } from "lucide-react"
import { Link } from "react-router-dom"
import type { SyncStatus } from "../../hooks/useBudget"
import { BankSection } from "./BankSection"

interface Props {
  open: boolean
  onClose: () => void
  configured: boolean
  email: string | null
  status: SyncStatus
  updatedAt: string
  onSignIn: () => void
  onSignOut: () => void
  onRetry: () => void
  onReset: () => void
  onBankTotal: (total: number) => void
}

const STATUS_TEXT: Record<SyncStatus, string> = {
  local: "Saved on this device only",
  loading: "Loading from the cloud…",
  saving: "Saving…",
  synced: "Synced to the cloud",
  offline: "Offline — will sync when you reconnect",
  error: "Couldn't reach the cloud",
}

const SHEET = {
  initial: { y: "100%" },
  animate: { y: 0 },
  exit: { y: "100%" },
  transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] as const },
}

export function ProfileSheet({ open, onClose, configured, email, status, updatedAt, onSignIn, onSignOut, onRetry, onReset, onBankTotal }: Props) {
  const failed = status === "error" || status === "offline"
  const synced = status !== "local" && !failed

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50" data-oid="5901f564c9">
          <motion.div
            className="absolute inset-0 bg-foreground/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose} data-oid="c365b8f7b1"
          />
          <motion.div data-oid="d984a0d13a" {...SHEET} className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[480px]" data-oid-component="d984a0d13a" data-oid-attr-dynamic="placeholder">
            <div role="dialog" aria-modal="true" aria-label="Profile and settings" className="max-h-[85vh] overflow-y-auto border-x-4 border-t-4 border-foreground bg-background pb-[calc(env(safe-area-inset-bottom)+34px)]" data-oid="85bd91eed6">
              <div className="flex items-center justify-between gap-ds-sm border-b-4 border-foreground bg-card px-ds-md py-ds-md" data-oid="6e14817ef5">
                <h2 className="font-heading text-heading font-extrabold uppercase" data-oid="bce7d771af">Profile</h2>
                <button type="button" onClick={onClose} aria-label="Close" className="flex size-12 items-center justify-center rounded-md border-2 border-foreground bg-card active:scale-90" data-oid="df74edd5b3">
                  <X className="size-5" strokeWidth={3} data-oid="9a7c5e5682" />
                </button>
              </div>

              <div className="space-y-ds-md p-ds-md" data-oid="ef2bbc752a" data-oid-text-editable="false" data-oid-text-source="element:section|expression:b4a250afb4fe|element:section|element:section">
                {/* Account */}
                <section className="border-4 border-foreground bg-card" data-oid="080019ebe8">
                  <div className="m-ds-xs flex items-center gap-ds-sm border-2 border-foreground bg-primary px-ds-md py-ds-sm text-primary-foreground" data-oid="a329fefc2e">
                    <UserRound className="size-5" strokeWidth={2.5} data-oid="4331a02366" />
                    <h3 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="906360fec8">Account</h3>
                  </div>
                  <div className="space-y-ds-sm p-ds-md" data-oid="05c73a073f" data-oid-text-editable="false" data-oid-text-source="element:p|expression:f46f0b812016|expression:7ffe5d52ddcf|expression:52ada25be2c9">
                    <p className="break-all font-body text-body" data-oid="90eac4558c">{email ?? "Not signed in"}</p>
                    {!configured ? <p className="font-caption text-caption text-muted-foreground" data-oid="469795e514">Cloud sync isn't set up for this app.</p> : null}
                    {configured && email ? (
                      <button type="button" onClick={onSignOut} className="ds-button min-h-[56px] w-full border-2 border-foreground bg-card" data-oid="f7c2795ef3">
                        <LogOut className="size-5" strokeWidth={2.5} data-oid="080061d346" />
                        Sign out
                      </button>
                    ) : null}
                    {configured && !email ? (
                      <button type="button" onClick={onSignIn} className="ds-button ds-button-primary min-h-[56px] w-full border-2 border-foreground" data-oid="ddd40fbf2e">
                        <LogIn className="size-5" strokeWidth={2.5} data-oid="db463957cf" />
                        Sign in to sync
                      </button>
                    ) : null}
                  </div>
                </section>

                {configured && email ? <BankSection onTotal={onBankTotal} /> : null}

                {/* Sync */}
                <section className="border-4 border-foreground bg-card" data-oid="cc282666e5">
                  <div className="m-ds-xs flex items-center gap-ds-sm border-2 border-foreground bg-secondary px-ds-md py-ds-sm text-secondary-foreground" data-oid="627025c548" data-oid-text-editable="false" data-oid-text-source="expression:cda5f46d5107|element:h3">
                    {synced ? <Cloud className="size-5" strokeWidth={2.5} data-oid="243a0c8798" /> : <CloudOff className="size-5" strokeWidth={2.5} data-oid="00c169ba21" />}
                    <h3 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="40fe6baeb9">Sync</h3>
                  </div>
                  <div className="space-y-ds-sm p-ds-md" data-oid="663fb11712" data-oid-text-editable="false" data-oid-text-source="element:p|element:p|expression:bb3486dc3b73">
                    <p data-failed={failed} className="font-body text-body data-[failed=true]:text-primary" data-oid="919cec7110">{STATUS_TEXT[status]}</p>
                    <p className="font-caption text-caption text-muted-foreground" data-oid="b5943ce7ed" data-oid-text-editable="false" data-oid-text-source="text|expression:4d201f1f8e72">
                      Last updated {new Date(updatedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                    {failed ? (
                      <button type="button" onClick={onRetry} className="ds-button ds-button-secondary min-h-[56px] w-full border-2 border-foreground" data-oid="a8d5f63388">
                        <RefreshCw className="size-5" strokeWidth={2.5} data-oid="69762c1969" />
                        Retry
                      </button>
                    ) : null}
                  </div>
                </section>

                {/* Data */}
                <section className="border-4 border-foreground bg-card" data-oid="74f6ada981">
                  <div className="m-ds-xs flex items-center gap-ds-sm border-2 border-foreground bg-warning px-ds-md py-ds-sm text-warning-foreground" data-oid="6ea15c3aa9">
                    <RotateCcw className="size-5" strokeWidth={2.5} data-oid="eb5c344406" />
                    <h3 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="3c1c85f252">Data</h3>
                  </div>
                  <div className="space-y-ds-sm p-ds-md" data-oid="b8ef9d3228">
                    <p className="font-body text-[14px] leading-snug text-muted-foreground" data-oid="62572db300">Clear everything back to a blank budget. If you're signed in, this applies on all your devices.</p>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Clear everything and start from a blank budget?")) {
                          onReset()
                          onClose()
                        }
                      }}
                      className="ds-button min-h-[56px] w-full border-2 border-foreground bg-card text-primary" data-oid="880a22faec"
                    >
                      <RotateCcw className="size-5" strokeWidth={2.5} data-oid="bd346ccc04" />
                      Reset budget
                    </button>
                  </div>
                </section>

                <div className="flex justify-center gap-ds-sm pt-ds-xs font-caption text-caption text-muted-foreground">
                  <Link to="/privacy" className="underline" onClick={onClose}>Privacy</Link>
                  <span>·</span>
                  <Link to="/terms" className="underline" onClick={onClose}>Terms</Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
