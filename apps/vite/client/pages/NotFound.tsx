import { Link } from "react-router-dom"

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-ds-md pb-[34px] pt-[56px] text-foreground" data-oid="36ecb0f418" data-oid-component-root="true" data-oid-callsite-deletable="true" data-oid-callsite-single="true">
      <div className="w-full max-w-[400px] border-4 border-foreground bg-card text-center shadow-[4px_4px_0_0_var(--foreground)]" data-oid="878232183b">
        <div className="border-b-4 border-foreground bg-primary px-ds-md py-ds-sm text-primary-foreground" data-oid="35cd6a37b2">
          <p className="font-caption text-caption uppercase" data-oid="0703b89e07">Go directly to jail</p>
          <h1 className="font-heading text-heading font-extrabold uppercase" data-oid="022276ba3d">Page not found</h1>
        </div>
        <div className="space-y-ds-md p-ds-md" data-oid="e50af77406">
          <p className="font-body text-body text-muted-foreground" data-oid="5a3b700fc3">This square isn't on the board.</p>
          <Link to="/" className="ds-button ds-button-primary min-h-[56px] w-full border-2 border-foreground" data-oid="db13a0f214">Back to budget</Link>
        </div>
      </div>
    </main>
  )
}
