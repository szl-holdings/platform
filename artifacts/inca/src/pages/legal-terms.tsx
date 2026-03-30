import { MarketingNav } from "@/components/MarketingNav";
import { MarketingFooter } from "@/components/MarketingFooter";

export default function LegalTermsPage() {
  return (
    <div className="min-h-screen bg-[#060410] text-violet-50">
      <MarketingNav />
      <div className="max-w-3xl mx-auto px-6 pt-28 pb-24">
        <div className="mb-10">
          <p className="text-[11px] font-semibold text-violet-400/60 tracking-[0.15em] uppercase mb-3">Legal</p>
          <h1 className="text-3xl font-bold text-violet-50 mb-3">Terms of Use</h1>
          <p className="text-violet-400/30 text-[13px]">Last updated: March 2026</p>
        </div>
        <div className="space-y-6 text-[14px] text-violet-300/50 leading-relaxed">
          <p>By accessing INCA, you agree to these terms. The platform is provided for intelligence and research operations by authorised enterprise teams.</p>
          <h2 className="text-[16px] font-bold text-violet-200">Acceptable use</h2>
          <p>INCA may not be used to process data in violation of applicable law, to circumvent security controls, or for purposes inconsistent with your stated use case at time of access request.</p>
          <h2 className="text-[16px] font-bold text-violet-200">Intellectual property</h2>
          <p>All platform software, model outputs, and design are the intellectual property of SZL Holdings. Intelligence data you submit remains your property.</p>
          <h2 className="text-[16px] font-bold text-violet-200">Limitation of liability</h2>
          <p>INCA intelligence outputs are provided for decision-support purposes. We do not warrant the completeness or accuracy of AI-generated outputs.</p>
          <h2 className="text-[16px] font-bold text-violet-200">Contact</h2>
          <p>legal@szlholdings.com</p>
        </div>
      </div>
      <MarketingFooter />
    </div>
  );
}
