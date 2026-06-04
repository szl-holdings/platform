import { BillingAccount } from '@szl-holdings/shared-ui/billing';

const ACCENT = '#d97706';

export default function CarlotaJoBillingPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>Billing & Services</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Manage your advisory retainer and past engagements.
        </p>
      </div>
      <BillingAccount
        accentColor={ACCENT}
        pricingUrl="/pricing"
        productName="Carlota Jo Advisory"
      />
    </div>
  );
}
