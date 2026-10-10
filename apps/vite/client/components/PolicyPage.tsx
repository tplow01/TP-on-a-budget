import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

export function PolicyPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,color-mix(in_srgb,var(--foreground)_6%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--foreground)_6%,transparent)_1px,transparent_1px)] bg-[size:36px_36px]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-background/70 sm:border-x-4 sm:border-foreground">
        <header className="flex items-center gap-3 border-b-4 border-foreground bg-card px-ds-md py-ds-md">
          <Link
            to="/"
            className="flex size-9 shrink-0 items-center justify-center rounded-md border-2 border-foreground bg-muted text-foreground transition-colors hover:bg-card"
            aria-label="Back"
          >
            <ArrowLeft className="size-5" strokeWidth={2.5} />
          </Link>
          <div>
            <h1 className="font-label text-lg font-bold uppercase tracking-[0.04em]">{title}</h1>
            <p className="text-xs text-muted-foreground">Last updated {updated}</p>
          </div>
        </header>

        <div className="flex-1 space-y-ds-lg px-ds-md py-ds-lg pb-[80px] text-sm leading-relaxed text-foreground">{children}</div>
      </div>
    </main>
  )
}

export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-label text-sm font-bold uppercase tracking-[0.04em] text-foreground">{heading}</h2>
      <div className="space-y-2 text-muted-foreground">{children}</div>
    </section>
  )
}
