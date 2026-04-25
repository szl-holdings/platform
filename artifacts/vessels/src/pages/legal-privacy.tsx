import { MarketingFooter } from '@/components/MarketingFooter';
import { MarketingNav } from '@/components/MarketingNav';

export default function LegalPrivacyPage() {
  return (
    <div className="min-h-screen bg-[#060e1a] text-sky-50">
      <MarketingNav />
      <div className="max-w-3xl mx-auto px-6 pt-28 pb-24">
        <div className="mb-10">
          <p className="text-[11px] font-semibold text-sky-400/60 tracking-[0.15em] uppercase mb-3">
            Legal
          </p>
          <h1 className="text-3xl font-bold text-sky-50 mb-3">Privacy Policy</h1>
          <p className="text-sky-400/30 text-[13px]">Last updated: March 2026</p>
        </div>
        <div className="space-y-6 text-[14px] text-sky-300/50 leading-relaxed">
          <p>
            Vessels, operated by SZL Holdings, processes personal data only as required to deliver
            the maritime intelligence platform and respond to enquiries.
          </p>
          <h2 className="text-[16px] font-bold text-sky-200">Data we collect</h2>
          <p>
            Account credentials, usage activity within the platform, contact details provided during
            demo requests, and fleet configuration data submitted by operators.
          </p>
          <h2 className="text-[16px] font-bold text-sky-200">How we use it</h2>
          <p>
            To operate the Vessels platform, respond to demo and commercial enquiries, and improve
            product experience through aggregated analytics.
          </p>
          <h2 className="text-[16px] font-bold text-sky-200">Data security</h2>
          <p>
            All data is encrypted at rest and in transit. Fleet data is tenant-isolated and never
            commingled with other organisations' data.
          </p>
          <h2 className="text-[16px] font-bold text-sky-200">Contact</h2>
          <p>privacy@szlholdings.com</p>
        </div>
      </div>
      <MarketingFooter />
    </div>
  );
}
