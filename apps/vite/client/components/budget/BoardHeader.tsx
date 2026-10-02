import { Download } from "lucide-react"
import { LOCALE } from "../../lib/budget"

export function BoardHeader({ onExport }: { onExport: () => void }) {
  const month = new Date().toLocaleString(LOCALE, { month: "long", year: "numeric" })
  return (
    <header className="px-ds-md pb-ds-lg pt-ds-3xl" data-oid="0ce16044ae" data-oid-component-root="true" data-oid-callsite-deletable="true" data-oid-callsite-single="true">
      <div className="flex items-center justify-between gap-ds-sm" data-oid="2876965f02">
        <p className="font-caption text-caption uppercase text-muted-foreground" data-oid="8994ed0f7b" data-oid-text-editable="false" data-oid-text-source="expression:021710fa7866|text">{month} · Monthly budget</p>
        <button type="button" onClick={onExport} className="ds-button ds-button-secondary min-h-[40px] border-2" data-oid="e69c0467ce">
          <Download className="size-4" strokeWidth={2.5} data-oid="5a7c189780" />
          Export CSV
        </button>
      </div>

      <div className="relative mx-auto mt-ds-lg w-[92%] -rotate-[4deg] border-4 border-foreground bg-primary p-1 shadow-[6px_6px_0_0_var(--foreground)]" data-oid="3df83d7679">
        <div className="border-2 border-primary-foreground px-ds-sm py-ds-sm" data-oid="603e9ab3f3">
          <h1 className="text-center font-display text-[40px] font-black uppercase leading-none tracking-[0.02em] text-primary-foreground drop-shadow-[2px_2px_0_var(--foreground)]" data-oid="6e998aec96">
            Budgetopoly
          </h1>
        </div>
      </div>
      <p className="mt-ds-lg text-center font-label text-label font-bold uppercase text-foreground" data-oid="1f9e8d0bf0">The fast-dealing personal money game</p>
    </header>
  )
}
