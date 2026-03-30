import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function LegalPrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        <div className="mb-10">
          <p className="text-[11px] font-semibold text-[hsl(215,45%,45%)] tracking-[0.15em] uppercase mb-3">Legal</p>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-neutral-400 text-[13px]">Last updated: March 2026</p>
        </div>
        <div className="prose prose-neutral max-w-none space-y-6 text-[14px] text-neutral-600 leading-relaxed">
          <p>SZL Holdings and its portfolio companies collect and process information only to the extent necessary to operate our platforms and respond to legitimate inquiries. We do not sell personal data to third parties.</p>
          <h2 className="text-[16px] font-bold text-neutral-800">Information we collect</h2>
          <p>We may collect contact information submitted through forms on our sites, usage analytics to improve product experience, and data provided voluntarily during onboarding or demos.</p>
          <h2 className="text-[16px] font-bold text-neutral-800">How we use it</h2>
          <p>Submitted contact data is used solely to respond to your inquiry. Analytics data is used in aggregate to understand site performance. We do not use personal data for advertising.</p>
          <h2 className="text-[16px] font-bold text-neutral-800">Data retention</h2>
          <p>Contact submissions are retained for up to 24 months. You may request deletion at any time by emailing privacy@szlholdings.com.</p>
          <h2 className="text-[16px] font-bold text-neutral-800">Third parties</h2>
          <p>We use a small number of trusted service providers (hosting, analytics) who are contractually bound to protect data. No personal data is sold or shared for commercial purposes.</p>
          <h2 className="text-[16px] font-bold text-neutral-800">Contact</h2>
          <p>For privacy-related questions: privacy@szlholdings.com</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
