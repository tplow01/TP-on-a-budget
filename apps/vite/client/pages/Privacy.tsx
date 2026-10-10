import { PolicyPage, Section } from "../components/PolicyPage"

export default function Privacy() {
  return (
    <PolicyPage title="Privacy Policy" updated="October 2026">
      <Section heading="What this app is">
        <p>
          Monthly Budget is a personal budgeting tool. It tracks your income, bills, spending
          categories, and savings goals, and — if you choose to connect a bank account — your
          account balances and transactions from that bank.
        </p>
      </Section>

      <Section heading="What we collect">
        <p>
          <strong className="text-foreground">Account info.</strong> If you sign in, we store
          your email address to identify your account.
        </p>
        <p>
          <strong className="text-foreground">Budget data.</strong> Income, bills, categories,
          goals, and balances you enter yourself.
        </p>
        <p>
          <strong className="text-foreground">Bank data (optional).</strong> If you connect a
          bank account through Plaid, we receive and store your account balances and transaction
          history for that account. We never see or store your bank login credentials — those go
          directly to Plaid and your bank, never through our servers.
        </p>
      </Section>

      <Section heading="How your data is used">
        <p>
          Your data is used only to show you your own budget and bank information inside this
          app. We do not sell your data, use it for advertising, or share it with third parties
          other than the service providers below.
        </p>
      </Section>

      <Section heading="Who we share data with">
        <p>
          <strong className="text-foreground">Plaid</strong> — connects to your bank and returns
          account data to us. Governed by{" "}
          <a href="https://plaid.com/legal/" target="_blank" rel="noreferrer" className="underline">
            Plaid's own privacy policy
          </a>
          .
        </p>
        <p>
          <strong className="text-foreground">Supabase</strong> — hosts our database and
          authentication. Your budget data is stored there, scoped to your account only.
        </p>
      </Section>

      <Section heading="Data access and deletion">
        <p>
          Your budget data is readable only by you — it's protected at the database level, not
          just in the app. You can disconnect your bank account or delete your data at any time
          from the Profile screen. Deleting your account removes your stored budget data and
          revokes our access to your bank connection.
        </p>
      </Section>

      <Section heading="Security">
        <p>
          Bank access tokens are stored server-side only and never sent to your browser. All
          bank API calls happen through a server function you never directly interact with.
        </p>
      </Section>

      <Section heading="Changes to this policy">
        <p>If this policy changes, the "Last updated" date above will change with it.</p>
      </Section>

      <Section heading="Contact">
        <p>Questions about this policy or your data: tplowman2@art.edu</p>
      </Section>
    </PolicyPage>
  )
}
