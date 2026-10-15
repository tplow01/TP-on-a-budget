import { PolicyPage } from "../components/PolicyPage"
import { CONTACT_EMAIL } from "../lib/contact"

export default function Privacy() {
  return (
    <PolicyPage title="Privacy Policy" updated="October 15, 2026">
      <p data-oid="060170bf3a">This budget app helps you plan your income, spending and savings. This policy explains what data it handles and why.</p>

      <h2 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="c35306d09c">What we collect</h2>
      <ul className="list-disc space-y-ds-xs pl-ds-lg" data-oid="6a8da8da49">
        <li data-oid="ae863ca2f5">Your email address, used only to sign you in.</li>
        <li data-oid="f6957904d5">The budget you enter: income, costs, due dates, goals and balances.</li>
        <li data-oid="e6af374ad7">If you link a bank: account names, types, the last four digits and balances, provided by Plaid.</li>
      </ul>

      <h2 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="703213f015">Bank connections (Plaid)</h2>
      <p data-oid="d29877ecab">
        We use Plaid Inc. to connect your bank. Your bank username and password go directly to Plaid and your bank; this app never sees or stores them. Plaid's handling of your data is covered by the{" "}
        <a href="https://plaid.com/legal/#end-user-privacy-policy" target="_blank" rel="noreferrer" className="font-bold underline" data-oid="b25fd4df24">Plaid End User Privacy Policy</a>.
        The access token Plaid issues is stored on our server and is never sent to your browser.
      </p>

      <h2 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="e2178d343e">How we use it</h2>
      <p data-oid="92190fe383">Only to show you your budget and balances across your devices. We don't sell your data, show ads, or share it with anyone except the service providers that run the app (Supabase for storage and sign-in, Plaid for bank connections).</p>

      <h2 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="8f8d48c35a">Security</h2>
      <p data-oid="ecb4277968">Data is encrypted in transit, and database rules stop any account from reading another account's data.</p>

      <h2 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="b1ffc93eea">Your choices</h2>
      <p data-oid="2cb89a54a9">You can disconnect a bank at any time from Profile → Bank accounts, which deletes its stored token, balances and transactions. You can delete your account and all your data instantly from Profile → Data → Delete account & data.</p>

      <h2 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="284cc898b2">Consent</h2>
      <p data-oid="b4be3e8aba">Before connecting a bank we ask for your explicit consent to collect, process and store your bank data, and record when you gave it. Disconnecting a bank or deleting your account withdraws that consent.</p>

      <h2 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="6e234fe086">Retention</h2>
      <p data-oid="a823161ddb">We keep your data only while your account is active. Bank data is deleted immediately when you disconnect that bank, and everything is deleted immediately when you delete your account. Transactions older than 24 months are deleted automatically.</p>

      <h2 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="a8bae6dd8d">Contact</h2>
      <p data-oid="4a40632d10">Questions? Email <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold underline" data-oid="9e5223d677">{CONTACT_EMAIL}</a>.</p>
    </PolicyPage>
  )
}
