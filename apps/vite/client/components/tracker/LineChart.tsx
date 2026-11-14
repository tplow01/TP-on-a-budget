interface Props {
  points: Array<{ day: string; total: number }>
  className?: string
}

const W = 320
const H = 80
const PAD = 4

export function LineChart({ points, className }: Props) {
  if (points.length < 2) {
    return <p className="font-caption text-caption text-muted-foreground">History starts today</p>
  }
  const values = points.map((p) => p.total)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const coords = points.map((p, i) => {
    const x = PAD + (i / (points.length - 1)) * (W - PAD * 2)
    const y = max === min ? H / 2 : H - PAD - ((p.total - min) / span) * (H - PAD * 2)
    return [x, y] as const
  })
  const last = coords[coords.length - 1]
  return (
    <div className={className}>
      <div className="relative">
      <svg viewBox="0 0 320 80" preserveAspectRatio="none" className="h-20 w-full text-foreground" role="img" aria-label="Balance history">
        <polyline points={coords.map(([x, y]) => `${x},${y}`).join(" ")} fill="none" stroke="currentColor" strokeWidth={2} vectorEffect="non-scaling-stroke" />
      </svg>
      <span aria-hidden="true" className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" style={{ left: `${(last[0] / W) * 100}%`, top: `${(last[1] / H) * 100}%` }} />
      </div>
      <div className="flex justify-between">
        <span className="font-caption text-[10px] text-muted-foreground">{points[0].day}</span>
        <span className="font-caption text-[10px] text-muted-foreground">{points[points.length - 1].day}</span>
      </div>
    </div>
  )
}
