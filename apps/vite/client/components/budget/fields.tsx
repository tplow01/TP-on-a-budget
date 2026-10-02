import { useEffect, useState } from "react"
import { cn } from "@vibe/ui"

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  prefix?: string
  suffix?: string
  className?: string
  id?: string
  ariaLabel?: string
}

/** Text-backed numeric input so users can clear and retype freely on mobile. */
export function NumberInput({ value, onChange, prefix, suffix, className, id, ariaLabel }: NumberInputProps) {
  const [draft, setDraft] = useState(value === 0 ? "" : String(value))

  useEffect(() => {
    if ((parseFloat(draft) || 0) !== value) setDraft(value === 0 ? "" : String(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className={cn("flex min-h-[56px] items-center rounded-md border-2 border-foreground bg-card focus-within:ring-2 focus-within:ring-ring", className)} data-oid="95987fec8a" data-oid-component-root="true" data-oid-text-editable="false" data-oid-text-source="expression:8483ca67ca7e|element:input|expression:2d2639bb6556" data-oid-classname-dynamic="true">
      {prefix ? <span className="pl-ds-md font-caption text-[15px] text-muted-foreground" data-oid="b0e780eae0">{prefix}</span> : null}
      <input
        id={id}
        aria-label={ariaLabel}
        type="text"
        inputMode="decimal"
        placeholder="0"
        value={draft}
        onChange={(e) => {
          const v = e.target.value.replace(/[^0-9.\-]/g, "")
          setDraft(v)
          const n = parseFloat(v)
          onChange(Number.isFinite(n) ? n : 0)
        }}
        className="w-full min-w-0 bg-transparent px-ds-sm py-ds-sm font-caption text-[18px] text-foreground outline-none placeholder:text-muted-foreground" data-oid="c086319685"
      />
      {suffix ? <span className="pr-ds-md font-caption text-[15px] text-muted-foreground" data-oid="1ac4f061bf">{suffix}</span> : null}
    </div>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="group/switch relative inline-flex h-10 w-[68px] shrink-0 items-center rounded-full border-2 border-foreground bg-muted transition-colors aria-checked:bg-success" data-oid="67854cdd57" data-oid-component-root="true"
    >
      <span aria-hidden="true" className="absolute left-1 size-7 rounded-full border-2 border-foreground bg-card transition-transform group-aria-checked/switch:translate-x-7" data-oid="bde47f313b" />
    </button>
  )
}

export function ProgressBar({ value, band }: { value: number; band: string }) {
  const w = Math.max(0, Math.min(1, value)) * 100
  return (
    <div className="h-4 w-full overflow-hidden rounded-sm border-2 border-foreground bg-background" data-oid="bec99d0c2e" data-oid-component-root="true" data-oid-callsite-deletable="true" data-oid-callsite-editable="true">
      <div className={cn("h-full border-r-2 border-foreground transition-[width] duration-500", band)} style={{ width: `${w}%` }} data-oid="32a1a48d61" data-oid-callsite-deletable="true" data-oid-callsite-editable="true" data-oid-style-dynamic="width" data-oid-classname-dynamic="true" />
    </div>
  )
}
