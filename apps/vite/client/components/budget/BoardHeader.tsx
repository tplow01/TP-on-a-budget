import { UserRound } from "lucide-react"
import { fmt, type Summary } from "../../lib/budget"
import { CountUp } from "./CountUp"

interface HeaderProps {
  summary: Summary
  balance: number
  compactTitle: string
  /** First letter of the signed-in email, or null when signed out. */
  profileInitial: string | null
  onOpenProfile: () => void
}

export function BoardHeader({ summary, balance, compactTitle, profileInitial, onOpenProfile }: HeaderProps) {
  const profileButton = (
    <button
      type="button"
      onClick={onOpenProfile}
      aria-label="Profile and settings"
      className="flex size-12 shrink-0 items-center justify-center rounded-full border-4 border-foreground bg-card font-heading text-[20px] font-extrabold uppercase text-foreground transition-[scale] duration-150 active:scale-90" data-oid="3cabda1a89" data-oid-component-root="true" data-oid-callsite-deletable="true" data-oid-callsite-single="true"
    >
      {profileInitial ?? <UserRound className="size-6" strokeWidth={2.5} data-oid="5a580d8600" />}
    </button>
  )

  const leftover = summary.leftover

  return (
    <header className="sticky top-0 z-30 border-b-4 border-foreground bg-card px-ds-md pb-ds-sm pt-[calc(env(safe-area-inset-top)+16px)]" data-oid="b5fbae0562" data-oid-component-root="true" data-oid-callsite-deletable="true" data-oid-callsite-single="true">
      <div className="flex items-end justify-between gap-ds-md" data-oid="ebabdccfd1" data-oid-text-editable="false" data-oid-text-source="element:div|element:div|expression:ecf0a98ab97c">
        <div className="min-w-0" data-oid="851ef6add4">
          <p className="font-caption text-caption uppercase text-muted-foreground" data-oid="d979b6a48f">My money · <CountUp value={balance} format={fmt} /></p>
          <h1 className="truncate font-heading text-heading font-extrabold uppercase" data-oid="7afcdc4500">{compactTitle}</h1>
        </div>
        <div data-negative={leftover < 0} className="shrink-0 border-2 border-foreground bg-background px-ds-sm py-ds-xs text-right data-[negative=true]:bg-primary data-[negative=true]:text-primary-foreground" data-oid="a45c4ef19b">
          <p className="font-caption text-[10px] uppercase" data-oid="0922fd97e8" data-oid-text-editable="false" data-oid-text-source="text|expression:6e08cc8009dd">Left over per month</p>
          <p className="font-caption text-[17px] font-bold leading-tight" data-oid="91d12409ae" data-oid-text-editable="false">
            {leftover < 0 ? "−" : ""}
            <CountUp value={Math.abs(leftover)} format={fmt} />
          </p>
        </div>
        {profileButton}
      </div>
    </header>
  )
}
