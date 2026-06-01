import { BillingAccount } from '@szl-holdings/shared-ui/billing';

export default function A11oyBillingPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-a11oy-text)' }}>Billing & Subscription</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
          Manage your A11oy subscription and payment details.
        </p>
      </div>
      <BillingAccount
        accentColor="#c9b787"
        pricingUrl="/pricing"
        productName="A11oy"
      />
    </div>
  );
}
