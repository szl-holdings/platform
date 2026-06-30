// Billing UI is not yet wired in this artifact.
// @szl-holdings/shared-ui is not listed as a dependency of @workspace/a11oy.
// Placeholder until billing is fully integrated.
export default function A11oyBillingPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-a11oy-text)' }}>
          Billing & Subscription
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
          Billing management is coming soon. Contact your account administrator to manage
          your A11oy subscription and payment details.
        </p>
      </div>
    </div>
  );
}
