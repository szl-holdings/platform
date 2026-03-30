import { MarketingNav } from "@/components/MarketingNav";
import { MarketingFooter } from "@/components/MarketingFooter";

export default function LegalPrivacyPage() {
  return (
    <div className="min-h-screen bg-[#060410] text-violet-50">
      <MarketingNav />
      <div className="max-w-3xl mx-auto px-6 pt-28 pb-24">
        <div className="mb-10">
          <p className="text-[11px] font-semibold text-violet-400/60 tracking-[0.15em] uppercase mb-3">Legal</p>
          <h1 className="text-3xl font-bold text-violet-50 mb-3">Privacy Policy</h1>
          <p className="text-violet-400/30 text-[13px]">Last updated: March 2026</p>
        </div>
        <div className="space-y-6 text-[14px] text-violet-300/50 leading-relaxed">
          <p>INCA, operated by SZL Holdings, processes personal data only as required to deliver the intelligence platform and respond to access requests.</p>
          <h2 className="text-[16px] font-bold text-violet-200">Data we collect</h2>
          <p>Account credentials, access request information, usage activity within the platform, and intelligence data submitted by authorised organisations.</p>
          <h2 className="text-[16px] font-bold text-violet-200">How we use it</h2>
          <p>To operate the INCA platform, qualify and respond to access requests, and improve product experience through aggregated analytics.</p>
          <h2 className="text-[16px] font-bold text-violet-200">Data security</h2>
          <p>All data is encrypted at rest and in transit. Tenant data is completely isolated and never commingled with other organisations' intelligence data.</p>
          <h2 className="text-[16px] font-bold text-violet-200">Contact</h2>
          <p>privacy@szlholdings.com</p>
        </div>
      </div>
      <MarketingFooter />
    </div>
  );
}
