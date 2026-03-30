import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function LegalTermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        <div className="mb-10">
          <p className="text-[11px] font-semibold text-[hsl(215,45%,45%)] tracking-[0.15em] uppercase mb-3">Legal</p>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight mb-4">Terms of Use</h1>
          <p className="text-neutral-400 text-[13px]">Last updated: March 2026</p>
        </div>
        <div className="prose prose-neutral max-w-none space-y-6 text-[14px] text-neutral-600 leading-relaxed">
          <p>By accessing any SZL Holdings website or platform, you agree to these terms. If you do not agree, please do not use our services.</p>
          <h2 className="text-[16px] font-bold text-neutral-800">Use of our sites</h2>
          <p>Our sites and platforms are provided for informational and operational purposes. You may not use them for unlawful purposes or in any manner that could damage or impair our services.</p>
          <h2 className="text-[16px] font-bold text-neutral-800">Intellectual property</h2>
          <p>All content on SZL Holdings sites — including text, design, software, and branding — is the property of SZL Holdings or its licensors. You may not reproduce or distribute content without written permission.</p>
          <h2 className="text-[16px] font-bold text-neutral-800">Limitations</h2>
          <p>Our platforms are provided "as is". SZL Holdings makes no warranties regarding uptime, accuracy, or fitness for a particular purpose.</p>
          <h2 className="text-[16px] font-bold text-neutral-800">Governing law</h2>
          <p>These terms are governed by the laws of England and Wales. Disputes will be resolved in the courts of England and Wales.</p>
          <h2 className="text-[16px] font-bold text-neutral-800">Contact</h2>
          <p>For legal enquiries: legal@szlholdings.com</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
