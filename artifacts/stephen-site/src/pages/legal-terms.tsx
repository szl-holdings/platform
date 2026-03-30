import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export function LegalTerms() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 lg:px-12 pt-28 pb-24">
        <div className="mb-10">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-primary/60 mb-3">Legal</p>
          <h1 className="text-2xl font-bold text-foreground mb-2">Terms of Use</h1>
          <p className="text-muted-foreground/40 text-[13px]">Last updated: March 2026</p>
        </div>
        <div className="space-y-5 text-[14px] text-muted-foreground leading-relaxed">
          <p>By using this site, you agree to these terms. The content is provided for informational purposes only and does not constitute professional or advisory services.</p>
          <h2 className="text-[16px] font-semibold text-foreground">Intellectual property</h2>
          <p>All content on this site — writing, design, and code — is the intellectual property of Stephen Lutar and SZL Holdings. You may not reproduce it without attribution and written permission.</p>
          <h2 className="text-[16px] font-semibold text-foreground">Downloadable materials</h2>
          <p>Documents available for download are provided for informational purposes. They may not be redistributed or published without permission.</p>
          <h2 className="text-[16px] font-semibold text-foreground">Contact</h2>
          <p>legal@szlholdings.com</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default LegalTerms;
