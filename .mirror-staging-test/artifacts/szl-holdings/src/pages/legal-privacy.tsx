import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function LegalPrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        <div className="mb-10">
          <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "0.75rem" }}>Legal</p>
          <h1 style={{ fontSize: "2rem", fontWeight: "700", letterSpacing: "-0.022em", color: "hsl(38,12%,94%)", marginBottom: "0.75rem" }}>Privacy Policy</h1>
          <p style={{ fontSize: "13px", color: "hsl(210,5%,44%)" }}>Last updated: March 2026</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", fontSize: "14px", lineHeight: "1.7", color: "hsl(210,5%,56%)" }}>
          <p>SZL Holdings and its portfolio companies collect and process information only to the extent necessary to operate our platforms and respond to legitimate inquiries. We do not sell personal data to third parties.</p>
          <h2 style={{ fontSize: "15px", fontWeight: "600", color: "hsl(38,12%,88%)" }}>Information we collect</h2>
          <p>We may collect contact information submitted through forms on our sites, usage analytics to improve product experience, and data provided voluntarily during onboarding or demos.</p>
          <h2 style={{ fontSize: "15px", fontWeight: "600", color: "hsl(38,12%,88%)" }}>How we use it</h2>
          <p>Submitted contact data is used solely to respond to your inquiry. Analytics data is used in aggregate to understand site performance. We do not use personal data for advertising.</p>
          <h2 style={{ fontSize: "15px", fontWeight: "600", color: "hsl(38,12%,88%)" }}>Data retention</h2>
          <p>Contact submissions are retained for up to 24 months. You may request deletion at any time by emailing privacy@szlholdings.com.</p>
          <h2 style={{ fontSize: "15px", fontWeight: "600", color: "hsl(38,12%,88%)" }}>Third parties</h2>
          <p>We use a small number of trusted service providers (hosting, analytics) who are contractually bound to protect data. No personal data is sold or shared for commercial purposes.</p>
          <h2 style={{ fontSize: "15px", fontWeight: "600", color: "hsl(38,12%,88%)" }}>Contact</h2>
          <p>For privacy-related questions: privacy@szlholdings.com</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
