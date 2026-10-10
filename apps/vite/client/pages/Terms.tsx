import { PolicyPage, Section } from "../components/PolicyPage"

export default function Terms() {
  return (
    <PolicyPage title="Terms of Service" updated="October 2026">
      <Section heading="What you're agreeing to">
        <p>
          By using Monthly Budget, you agree to these terms. If you don't agree, please don't
          use the app.
        </p>
      </Section>

      <Section heading="The app is informational only">
        <p>
          Monthly Budget helps you track and visualize your own finances. It does not provide
          financial, tax, legal, or investment advice. Estimates shown (such as take-home pay or
          savings timelines) are approximations and may not match your actual bank or paycheck
          figures.
        </p>
      </Section>

      <Section heading="Bank connections">
        <p>
          Connecting a bank account is optional and happens through Plaid. We only request
          read-only access to balances and transactions — this app never initiates a transfer,
          payment, or any action on your bank account. You can disconnect a bank account at any
          time.
        </p>
      </Section>

      <Section heading="Your responsibility">
        <p>
          You're responsible for the accuracy of data you enter manually, and for keeping your
          account credentials secure. Decisions you make based on information shown in this app
          are your own responsibility.
        </p>
      </Section>

      <Section heading="No warranty">
        <p>
          The app is provided as-is, without warranty of any kind. We don't guarantee it will be
          available, error-free, or fit for a particular purpose.
        </p>
      </Section>

      <Section heading="Limitation of liability">
        <p>
          We are not liable for any financial decision, loss, or damage resulting from your use
          of this app, including inaccuracies in displayed data or interruptions in bank
          connectivity.
        </p>
      </Section>

      <Section heading="Changes">
        <p>
          These terms may change over time. Continued use of the app after a change means you
          accept the updated terms.
        </p>
      </Section>

      <Section heading="Contact">
        <p>Questions about these terms: tplowman2@art.edu</p>
      </Section>
    </PolicyPage>
  )
}
