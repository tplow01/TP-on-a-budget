import { LOCALE } from "../../lib/budget"

export function BoardHeader() {
  const month = new Date().toLocaleString(LOCALE, { month: "long", year: "numeric" })
  return (
    <header className="px-ds-md pb-ds-md pt-ds-3xl" data-oid="d8700b0aa4" data-oid-component-root="true" data-oid-callsite-deletable="true" data-oid-callsite-single="true">
      <p className="font-caption text-caption uppercase text-muted-foreground" data-oid="67988d8cf1" data-oid-text-editable="false" data-oid-text-source="expression:021710fa7866|text">{month} · Monthly budget</p>
      <h1 className="mt-ds-xs font-heading text-heading font-extrabold uppercase text-foreground" data-oid="2876965f02">My money</h1>
    </header>
  )
}
