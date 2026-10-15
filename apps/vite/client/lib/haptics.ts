/**
 * Light haptic feedback.
 * - Android / Chrome: Vibration API.
 * - iPhone (Safari 18+): toggling a hidden native `<input switch>` fires the system haptic.
 * Always call from a user tap; silently does nothing where unsupported.
 */
let label: HTMLLabelElement | null = null

function iosTick() {
  if (typeof document === "undefined") return
  if (!label) {
    const input = document.createElement("input")
    input.type = "checkbox"
    input.setAttribute("switch", "")
    input.id = "budget-haptic-switch"
    input.tabIndex = -1
    label = document.createElement("label")
    label.htmlFor = input.id
    const wrap = document.createElement("div")
    wrap.setAttribute("aria-hidden", "true")
    wrap.style.cssText = "position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none"
    wrap.append(input, label)
    document.body.appendChild(wrap)
  }
  label.click()
}

const canVibrate = () => typeof navigator !== "undefined" && typeof navigator.vibrate === "function"

/** A single light tap — saves, toggles, adds. */
export function tap() {
  try {
    if (canVibrate()) navigator.vibrate(10)
    else iosTick()
  } catch {
    /* ignore */
  }
}

/** A double tap — bigger confirmations like applying a scenario. */
export function success() {
  try {
    if (canVibrate()) navigator.vibrate([12, 50, 18])
    else {
      iosTick()
      window.setTimeout(iosTick, 110)
    }
  } catch {
    /* ignore */
  }
}
