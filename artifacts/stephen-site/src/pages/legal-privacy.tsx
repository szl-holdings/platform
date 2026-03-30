import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export function LegalPrivacy() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 lg:px-12 pt-28 pb-24">
        <div className="mb-10">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-primary/60 mb-3">Legal</p>
          <h1 className="text-2xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground/40 text-[13px]">Last updated: March 2026</p>
        </div>
        <div className="space-y-5 text-[14px] text-muted-foreground leading-relaxed">
          <p>This site (stephenlutar.com) collects only the personal data required to respond to contact inquiries and download requests.</p>
          <h2 className="text-[16px] font-semibold text-foreground">Data we collect</h2>
          <p>Name, email, company, and message content submitted through the contact form. No tracking cookies or third-party analytics.</p>
          <h2 className="text-[16px] font-semibold text-foreground">How we use it</h2>
          <p>To respond to your inquiry. Your data is not shared with third parties or used for marketing purposes.</p>
          <h2 className="text-[16px] font-semibold text-foreground">Contact</h2>
          <p>privacy@szlholdings.com</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default LegalPrivacy;
