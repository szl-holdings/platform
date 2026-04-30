import { MarketingFooter } from '@/components/MarketingFooter';
import { MarketingNav } from '@/components/MarketingNav';

export default function LegalTermsPage() {
  return (
    <div className="min-h-screen bg-[#060e1a] text-sky-50">
      <MarketingNav />
      <div className="max-w-3xl mx-auto px-6 pt-28 pb-24">
        <div className="mb-10">
          <p className="text-[11px] font-semibold text-sky-400/60 tracking-[0.15em] uppercase mb-3">
            Legal
          </p>
          <h1 className="text-3xl font-bold text-sky-50 mb-3">Terms of Use</h1>
          <p className="text-sky-400/30 text-[13px]">Last updated: March 2026</p>
        </div>
        <div className="space-y-6 text-[14px] text-sky-300/50 leading-relaxed">
          <p>
            By accessing Vessels, you agree to these terms. The platform is provided for operational
            and informational use by authorised fleet operators.
          </p>
          <h2 className="text-[16px] font-bold text-sky-200">Acceptable use</h2>
          <p>
            Vessels may not be used for unlawful purposes, to circumvent sanctions compliance
            requirements, or in any manner that impairs the platform's operation for other users.
          </p>
          <h2 className="text-[16px] font-bold text-sky-200">Intellectual property</h2>
          <p>
            All platform software, design, and data models are the intellectual property of SZL
            Holdings. Data you submit remains your property; you grant us a limited licence to
            process it for platform operation.
          </p>
          <h2 className="text-[16px] font-bold text-sky-200">Limitation of liability</h2>
          <p>
            Vessels intelligence outputs are provided for decision-support purposes. We do not
            guarantee the accuracy of third-party AIS data or regulatory data sources.
          </p>
          <h2 className="text-[16px] font-bold text-sky-200">Contact</h2>
          <p>legal@szlholdings.com</p>
        </div>
      </div>
      <MarketingFooter />
    </div>
  );
}
