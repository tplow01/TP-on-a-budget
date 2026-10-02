/** Top-hat-and-moustache tycoon face, drawn to match lucide icon proportions. */
export function TycoonIcon({ className, strokeWidth = 2.5 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true" data-oid="0af38eab80" data-oid-component-root="true" data-oid-callsite-deletable="true" data-oid-callsite-single="true" data-oid-classname-dynamic="true"
    >
      {/* top hat */}
      <path d="M8 2.5h8v6H8z" fill="currentColor" />
      <path d="M5 8.5h14" />
      {/* face */}
      <path d="M7 9.5v3.5a5 5 0 0 0 10 0V9.5" />
      {/* eyes */}
      <circle cx="10" cy="12" r="0.6" fill="currentColor" />
      <circle cx="14" cy="12" r="0.6" fill="currentColor" />
      {/* moustache */}
      <path d="M8.5 15.5c1.5 0 2.5-.8 3.5-.8s2 .8 3.5.8" />
      {/* bow tie */}
      <path d="M9.5 20.5l2.5 1-2.5 1zM14.5 20.5l-2.5 1 2.5 1z" fill="currentColor" strokeWidth={1} />
    </svg>
  )
}
