import { useEffect, useRef, useState } from "react"

interface Props {
  value: number
  format: (n: number) => string
  /** ms */
  duration?: number
}

/** Rolls a money figure from its previous value (0 on first show) to the new one. */
export function CountUp({ value, format, duration = 650 }: Props) {
  const [shown, setShown] = useState(0)
  const current = useRef(0)

  useEffect(() => {
    const start = current.current
    if (start === value) return
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      current.current = value
      setShown(value)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      const v = p === 1 ? value : start + (value - start) * eased
      current.current = v
      setShown(v)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return <span className="tabular-nums" data-oid="307d4fba0e" data-oid-component-root="true" data-oid-callsite-deletable="true" data-oid-callsite-single="true" data-oid-callsite-editable="true">{format(shown)}</span>
}
