import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

/** Shared shell for the Privacy Policy and Terms pages. */
export function PolicyPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-background text-foreground" data-oid="c889a222b5" data-oid-component-root="true" data-oid-callsite-deletable="true" data-oid-callsite-single="true" data-oid-callsite-editable="true">
      <div className="mx-auto w-full max-w-[640px] px-ds-md pb-ds-3xl pt-[64px]" data-oid="d28d4a6503" data-oid-callsite-deletable="true" data-oid-callsite-editable="true">
        <Link to="/" className="inline-flex min-h-[48px] items-center gap-ds-xs font-label text-label font-bold uppercase" data-oid="14f65b6e8f" data-oid-callsite-deletable="true" data-oid-callsite-editable="true">
          <ArrowLeft className="size-4" strokeWidth={3} data-oid="ead79fc2c7" data-oid-callsite-deletable="true" data-oid-callsite-editable="true" />
          Back to budget
        </Link>
        <article className="mt-ds-md border-4 border-foreground bg-card shadow-[4px_4px_0_0_var(--foreground)]" data-oid="9cba195e86" data-oid-callsite-deletable="true" data-oid-callsite-editable="true">
          <div className="border-b-4 border-foreground bg-primary px-ds-md py-ds-md text-primary-foreground" data-oid="4ace210a02" data-oid-callsite-deletable="true" data-oid-callsite-editable="true">
            <h1 className="font-heading text-heading font-extrabold uppercase" data-oid="a5ab94582b" data-oid-callsite-deletable="true" data-oid-callsite-editable="true">{title}</h1>
            <p className="font-caption text-caption" data-oid="ce429e8d57" data-oid-callsite-deletable="true" data-oid-callsite-editable="true" data-oid-text-editable="false" data-oid-text-source="text|expression:13a1891af75c">Last updated {updated}</p>
          </div>
          <div className="space-y-ds-md p-ds-md font-body text-body" data-oid="a32c0d68c3" data-oid-callsite-deletable="true" data-oid-callsite-editable="true">{children}</div>
        </article>
      </div>
    </main>
  )
}
