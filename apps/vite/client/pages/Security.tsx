import { PolicyPage } from "../components/PolicyPage"
import { CONTACT_EMAIL } from "../lib/contact"

export default function Security() {
  return (
    <PolicyPage title="Information Security Policy" updated="October 15, 2026">
      <p data-oid="c7cff64f0b">
        This policy describes how we identify, reduce and monitor information security risks for the budget app, including data received from Plaid. It applies to everyone with access to the app's code, infrastructure or data. It is reviewed at least once a year and after any security incident.
      </p>

      <h2 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="dadc9149cd">1. Ownership</h2>
      <p data-oid="a40c96b1f1">The app owner is responsible for security. They keep this policy up to date, keep a record of risks, and decide who gets access.</p>

      <h2 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="731e5c5c96">2. Risk assessment</h2>
      <p data-oid="a5958940b9">A risk review is done every quarter and before any major release. Each risk is logged with its likelihood, impact, fix and owner. The main risks we track are:</p>
      <ul className="list-disc space-y-ds-xs pl-ds-lg" data-oid="268294fc40">
        <li data-oid="09a31288df">Leaked Plaid or Supabase secrets</li>
        <li data-oid="10cf3c5e22">One user seeing another user's data</li>
        <li data-oid="482b121e15">Account takeover</li>
        <li data-oid="ae01f2ce2a">Vulnerable third-party packages</li>
        <li data-oid="e946f1522c">An outage or problem at one of our suppliers</li>
      </ul>

      <h2 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="81a34c3c90">3. Access control</h2>
      <ul className="list-disc space-y-ds-xs pl-ds-lg" data-oid="5119e75cb2">
        <li data-oid="e518f0e1e2">Access to production systems (Supabase, Plaid Dashboard, GitHub, hosting) is limited to named people who need it. Each person gets only the access their job requires.</li>
        <li data-oid="3ab89cbd36">Multi-factor authentication is required on every admin account.</li>
        <li data-oid="dc041ac535">Access is reviewed every quarter, and removed within 24 hours when someone no longer needs it.</li>
        <li data-oid="b96bed5b0b">Database row-level security stops each signed-in user from reading anyone else's budget or account data.</li>
      </ul>

      <h2 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="3aa0201ec2">4. Data protection</h2>
      <ul className="list-disc space-y-ds-xs pl-ds-lg" data-oid="58cdd4482a">
        <li data-oid="bfd5b886bd">All traffic uses TLS 1.2 or higher. Data is encrypted at rest by Supabase (AES-256).</li>
        <li data-oid="2c5c15ef21">Plaid access tokens are only stored on the server, in a table the browser cannot read. Only the server-side Edge Function can use them.</li>
        <li data-oid="4e85af1a3d">API secrets are kept in Supabase's secret store. They are never committed to source code or included in the app's code.</li>
        <li data-oid="86d76c6222">We only collect the data the app needs: account names, types, last four digits and balances. Bank login details are never received or stored.</li>
        <li data-oid="5bf677f517">Disconnecting a bank removes its Plaid item and deletes the stored token and balances. Account deletion requests are completed within 30 days.</li>
      </ul>

      <h2 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="c8e0ad4b51">5. Secure development</h2>
      <ul className="list-disc space-y-ds-xs pl-ds-lg" data-oid="d9f7d8e388">
        <li data-oid="972adb8620">All code lives in version control, and changes are reviewed before they go to production.</li>
        <li data-oid="ce15b7d457">GitHub Dependabot alerts and secret scanning are turned on. Critical or high-severity vulnerabilities are fixed within 14 days.</li>
        <li data-oid="bbbf471070">New features are built and tested against Plaid Sandbox before going live.</li>
      </ul>

      <h2 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="2bd95902e7">6. Monitoring</h2>
      <p data-oid="e3bd08d2b5">Supabase authentication, database and Edge Function logs, plus Plaid Dashboard activity, are checked every week for errors, unusual sign-ins or unexpected access. Alerts from our suppliers go to the owner's email.</p>

      <h2 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="a13bc08249">7. Incident response</h2>
      <p data-oid="7cbe88aea5">If a security incident is suspected:</p>
      <ol className="list-decimal space-y-ds-xs pl-ds-lg" data-oid="f853f2229e">
        <li data-oid="719aa634c9">Contain it: rotate the Plaid and Supabase secrets and revoke any affected sessions or Plaid items.</li>
        <li data-oid="d89d03026b">Investigate using the logs.</li>
        <li data-oid="56b2bcd81d">Notify affected users, and Plaid where required, within 72 hours of confirming the incident.</li>
        <li data-oid="7e14259f69">Write up what happened and update this policy.</li>
      </ol>

      <h2 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="1d1d584076">8. Suppliers</h2>
      <p data-oid="8334249f24">We rely on Supabase (database, sign-in, Edge Functions), Plaid (bank connections) and our hosting provider. Each is checked for SOC 2 Type II or an equivalent standard before we start using it, and again every year.</p>

      <h2 className="font-label text-[15px] font-extrabold uppercase tracking-[0.06em]" data-oid="17db85430b">Contact</h2>
      <p data-oid="5648078180">Report a security issue to <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold underline" data-oid="3d5b13c613">{CONTACT_EMAIL}</a>.</p>
    </PolicyPage>
  )
}
