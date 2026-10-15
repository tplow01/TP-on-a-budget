import { PolicyPage } from "../components/PolicyPage"
import { CONTACT_EMAIL } from "../lib/contact"

export default function Terms() {
  return (
    <PolicyPage title="Terms of Service" updated="October 15, 2026">
      <p data-oid="c268909a8a">By using this budget app you agree to these terms.</p>

      <h2 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="8dacfaade5">Planning tool, not advice</h2>
      <p data-oid="e4c26024aa">Tax figures and take-home pay are estimates. Nothing in the app is financial, tax or legal advice. Check important decisions with a qualified professional.</p>

      <h2 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="8b31ec52a0">Your account</h2>
      <p data-oid="fafc873960">Keep your sign-in details safe. You're responsible for activity on your account and for the accuracy of the figures you enter.</p>

      <h2 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="2caff70e4a">Bank connections</h2>
      <p data-oid="a11fa2991b">Linking a bank is optional and handled by Plaid. Balances may be delayed or incomplete depending on your bank. By linking, you also agree to Plaid's terms and privacy policy.</p>

      <h2 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="eb29dec9d6">Availability</h2>
      <p data-oid="aed882244e">The app is provided "as is". We may change or stop features at any time and aren't liable for losses resulting from its use, to the extent the law allows.</p>

      <h2 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="f2aee41062">Contact</h2>
      <p data-oid="04a122820f">Email <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold underline" data-oid="8a432ffe34">{CONTACT_EMAIL}</a>.</p>
    </PolicyPage>
  )
}
