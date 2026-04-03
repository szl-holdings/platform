import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function LegalTermsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        <div className="mb-10">
          <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "0.75rem" }}>Legal</p>
          <h1 style={{ fontSize: "2rem", fontWeight: "700", letterSpacing: "-0.022em", color: "hsl(38,12%,94%)", marginBottom: "0.75rem" }}>Terms of Use</h1>
          <p style={{ fontSize: "13px", color: "hsl(210,5%,44%)" }}>Last updated: March 2026</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", fontSize: "14px", lineHeight: "1.7", color: "hsl(210,5%,56%)" }}>
          <p>By accessing any SZL Holdings website or platform, you agree to these terms. If you do not agree, please do not use our services.</p>
          <h2 style={{ fontSize: "15px", fontWeight: "600", color: "hsl(38,12%,88%)" }}>Use of our sites</h2>
          <p>Our sites and platforms are provided for informational and operational purposes. You may not use them for unlawful purposes or in any manner that could damage or impair our services.</p>
          <h2 style={{ fontSize: "15px", fontWeight: "600", color: "hsl(38,12%,88%)" }}>Intellectual property</h2>
          <p>All content on SZL Holdings sites — including text, design, software, and branding — is the property of SZL Holdings or its licensors. You may not reproduce or distribute content without written permission.</p>
          <h2 style={{ fontSize: "15px", fontWeight: "600", color: "hsl(38,12%,88%)" }}>Limitations</h2>
          <p>Our platforms are provided "as is". SZL Holdings makes no warranties regarding uptime, accuracy, or fitness for a particular purpose.</p>
          <h2 style={{ fontSize: "15px", fontWeight: "600", color: "hsl(38,12%,88%)" }}>Governing law</h2>
          <p>These terms are governed by the laws of England and Wales. Disputes will be resolved in the courts of England and Wales.</p>
          <h2 style={{ fontSize: "15px", fontWeight: "600", color: "hsl(38,12%,88%)" }}>Contact</h2>
          <p>For legal enquiries: legal@szlholdings.com</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
