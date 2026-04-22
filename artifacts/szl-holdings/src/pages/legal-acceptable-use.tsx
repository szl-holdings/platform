import { m } from "framer-motion";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const SECTIONS = [
  {
    title: "Overview",
    body: "This Acceptable Use Policy (\"AUP\") governs the use of Lyte, Alloy, and all associated products and services operated by SZL Holdings. By accessing or using our platforms, you agree to these terms. Violations may result in account suspension or termination.",
  },
  {
    title: "Permitted use",
    body: "Our platforms are designed for legitimate business operations in the environments they are built for — legal operations, maritime intelligence, security operations, and real estate intelligence. You may use our services to monitor, analyze, and act on operational data within your organization's remit, in compliance with all applicable laws and regulations.",
  },
  {
    title: "Prohibited conduct",
    body: "The following are strictly prohibited: (1) Attempting to gain unauthorized access to any system, account, or data not explicitly authorized to you; (2) Using the platform to store, transmit, or process data in violation of applicable privacy laws; (3) Uploading malicious code, malware, or exploits; (4) Interfering with platform availability through denial-of-service attacks, excessive automated requests, or scraping; (5) Reverse engineering, decompiling, or attempting to extract source code; (6) Using the platform to facilitate fraud, money laundering, or other illegal activity; (7) Violating any applicable export control or sanctions regulations.",
  },
  {
    title: "AI and automation",
    body: "Our AI systems are advisory tools — they surface recommendations that require human review and approval. Using the platform in ways that circumvent human-in-the-loop approval controls, attempt to force autonomous execution, or exploit model behavior for unintended outputs is prohibited. Attempting to extract model weights, training data, or proprietary system prompts is strictly prohibited.",
  },
  {
    title: "Data responsibility",
    body: "You are responsible for the data you bring into our platforms. This includes ensuring you have the legal right to process that data and that doing so complies with applicable privacy regulations and data processing agreements. Do not upload data that you are not authorized to process or that belongs to individuals without appropriate consent.",
  },
  {
    title: "Security testing",
    body: "Security testing of our production systems without prior written authorization is prohibited. Authorized security research must follow our vulnerability disclosure policy and be conducted within the scope explicitly agreed in advance. For security research inquiries, contact security@stephenl.dev.",
  },
  {
    title: "Reporting violations",
    body: "If you become aware of a violation of this policy — including misuse of the platform, security vulnerabilities, or unauthorized access — please report it promptly to security@stephenl.dev. We investigate all reports and take appropriate action.",
  },
  {
    title: "Enforcement",
    body: "We reserve the right to suspend or terminate access to our platforms for violations of this policy, with or without notice depending on the severity of the violation. We may report violations to law enforcement where required or appropriate.",
  },
  {
    title: "Changes",
    body: "This policy may be updated as our platforms evolve and as applicable laws change. Material updates will be communicated through the platform. Continued use after an update constitutes acceptance of the revised policy.",
  },
  {
    title: "Contact",
    body: "For questions about acceptable use: legal@szlholdings.com.",
  },
];

export default function LegalAcceptableUsePage() {
  const __pageMeta = usePageMeta({
    title: "Acceptable Use Policy — Legal · SZL Holdings",
    description: "SZL Holdings acceptable use policy for Lyte, Alloy, and all platform products and services.",
    canonical: "https://szlholdings.com/legal/acceptable-use",
  });

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
        <SiteNav />
        <main id="main-content" >
          <section style={{ paddingTop: "var(--space-hero-pt)", paddingBottom: "clamp(3rem,6vw,5rem)", borderBottom: "1px solid var(--color-szl-border)" }}>
            <div style={{ maxWidth: "860px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.75rem" }}>
                  <Link href="/trust" style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", textDecoration: "none" }}>Legal</Link>
                  <span style={{ color: "var(--color-szl-text-faint)" }}>/</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-secondary)" }}>Acceptable Use</span>
                </div>
                <h1 style={{ fontSize: "clamp(2rem,4.5vw,3rem)", fontWeight: 600, letterSpacing: "-0.028em", lineHeight: 1.1, marginBottom: "1rem" }}>Acceptable Use Policy</h1>
                <p style={{ fontSize: "0.875rem", color: "hsl(214,7%,48%)" }}>Last updated: April 2026</p>
              </m.div>
            </div>
          </section>
  
          <section style={{ padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "860px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                {SECTIONS.map((section, i) => (
                  <m.div
                    key={section.title}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: i * 0.04 }}
                  >
                    <h2 style={{ fontSize: "1.0625rem", fontWeight: 600, letterSpacing: "-0.01em", color: "hsl(38,8%,90%)", marginBottom: "0.625rem" }}>{section.title}</h2>
                    <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "hsl(214,7%,60%)" }}>{section.body}</p>
                  </m.div>
                ))}
              </div>
  
              <m.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35 }} style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid var(--color-szl-border)", display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                <Link href="/legal/privacy" className="szl-btn-secondary">Privacy Policy</Link>
                <Link href="/legal/terms" className="szl-btn-secondary">Terms of Service</Link>
                <Link href="/legal/security-disclosure" className="szl-btn-secondary">Security Disclosure</Link>
                <Link href="/trust" className="szl-btn-ghost">Trust Center</Link>
              </m.div>
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
