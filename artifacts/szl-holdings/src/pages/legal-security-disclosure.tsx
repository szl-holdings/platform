import { m } from "framer-motion";
import { Link } from "wouter";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const PROCESS = [
  {
    step: "01",
    title: "Submit your report",
    body: "Send a detailed report to security@stephenl.dev. Include: the system or component affected, a clear description of the vulnerability, steps to reproduce the issue, the potential impact you have identified, and your contact information. Encrypted submissions are welcome — request our PGP public key.",
  },
  {
    step: "02",
    title: "Acknowledgement",
    body: "We acknowledge all reports within 48 business hours. Our initial response will confirm receipt, assign an internal tracking reference, and provide an initial severity assessment. We may request additional technical details at this stage.",
  },
  {
    step: "03",
    title: "Investigation and remediation",
    body: "We investigate every confirmed vulnerability promptly. For critical issues, we begin remediation within 24 hours of confirmation. We will keep you informed of our progress and provide an estimated remediation timeline. Complex issues may take longer — we will communicate openly about this.",
  },
  {
    step: "04",
    title: "Coordinated disclosure",
    body: "After remediation, we support coordinated disclosure. We ask for a 90-day embargo from the date of initial report — or less if we complete remediation sooner. Researchers who report responsibly will be publicly credited unless they prefer anonymity.",
  },
];

const SCOPE = [
  "szlholdings.com and all subdomains",
  "Lyte platform and all authenticated surfaces",
  "Alloy execution fabric and API endpoints",
  "Authentication and authorization systems",
  "Data handling and storage infrastructure",
  "PRISM Counsel, Vessels, Aegis, Terra, and Carlota Jo applications",
];

const OUT_OF_SCOPE = [
  "Social engineering of SZL Holdings employees or contractors",
  "Physical security attacks against facilities or hardware",
  "Denial-of-service attacks (volumetric or application-layer)",
  "Automated scanning without prior authorization",
  "Third-party services not controlled by SZL Holdings",
  "Vulnerabilities in systems disclosed without a 90-day coordinated disclosure window",
];

const PROHIBITED = [
  "Accessing, modifying, or exfiltrating data that does not belong to you",
  "Impacting the availability of production systems or other users",
  "Publicly disclosing a vulnerability before coordinated disclosure is agreed",
  "Extortion or threats in connection with a vulnerability report",
  "Testing in production environments beyond minimal proof-of-concept",
];

const GOOD_REPORT = [
  "Clearly describe the vulnerability and the system affected",
  "Provide reproduction steps — specific, step-by-step",
  "Include the potential impact: what data could be accessed, what actions could be taken",
  "Note the severity in your view: critical, high, medium, or low",
  "Disclose only to us initially — no social media, public forums, or third-party disclosure",
  "Stop testing once the vulnerability is confirmed — do not demonstrate impact on real data",
];

export default function LegalSecurityDisclosurePage() {
  usePageMeta({
    title: "Security Disclosure Policy — Legal · SZL Holdings",
    description: "SZL Holdings responsible vulnerability disclosure policy — how to report, what we do, timeline, safe harbor, and scope.",
    canonical: "https://szlholdings.com/legal/security-disclosure",
  });

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />
      <main id="main-content" role="main">
        <section style={{ paddingTop: "var(--space-hero-pt)", paddingBottom: "clamp(3rem,6vw,5rem)", borderBottom: "1px solid var(--color-szl-border)", background: "radial-gradient(ellipse at 50% 0%, hsla(40,90%,54%,0.04) 0%, transparent 60%)" }}>
          <div style={{ maxWidth: "860px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.75rem" }}>
                <Link href="/trust" style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", textDecoration: "none" }}>Legal</Link>
                <span style={{ color: "var(--color-szl-text-faint)" }}>/</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "hsl(40,90%,54%)" }}>Security Disclosure</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <div style={{ width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(40,90%,54%,0.08)", border: "1px solid hsla(40,90%,54%,0.22)", borderRadius: "0.5rem" }}>
                  <AlertTriangle size={18} color="hsl(40,90%,54%)" />
                </div>
                <h1 style={{ fontSize: "clamp(2rem,4.5vw,3rem)", fontWeight: 600, letterSpacing: "-0.028em", lineHeight: 1.1 }}>Vulnerability Disclosure Policy</h1>
              </div>
              <p style={{ fontSize: "clamp(1rem,1.8vw,1.0625rem)", lineHeight: 1.72, color: "hsl(214,7%,64%)", maxWidth: "52ch" }}>
                We believe responsible security research makes software safer. If you discover a security
                vulnerability in our systems, we want to hear from you. This page describes how to report it
                and what happens next.
              </p>
            </m.div>
          </div>
        </section>

        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "860px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(40,90%,54%)", marginBottom: "1rem" }}>Reporting Process</p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "30ch", marginBottom: "3rem" }}>How to report a vulnerability.</h2>
            </m.div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {PROCESS.map((step, i) => (
                <m.div
                  key={step.step}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.38, delay: i * 0.07 }}
                  className="szl-card"
                  style={{ borderRadius: "0.875rem", padding: "var(--space-card-pad)", display: "grid", gridTemplateColumns: "3rem 1fr", gap: "1.25rem", alignItems: "start" }}
                >
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, color: "hsl(40,90%,54%)", letterSpacing: "0.08em", paddingTop: "2px" }}>{step.step}</div>
                  <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.01em", marginBottom: "0.5rem" }}>{step.title}</h3>
                    <p style={{ fontSize: "0.9rem", lineHeight: 1.68, color: "hsl(214,7%,60%)" }}>{step.body}</p>
                  </div>
                </m.div>
              ))}
            </div>
            <m.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35 }} style={{ marginTop: "2rem" }}>
              <a href="mailto:security@stephenl.dev" className="szl-btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                security@stephenl.dev <ArrowRight size={14} />
              </a>
            </m.div>
          </div>
        </section>

        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "860px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2.5rem" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(145,62%,46%)", marginBottom: "1rem" }}>In scope</p>
                <ul style={{ display: "flex", flexDirection: "column", gap: "0.5rem", listStyle: "none", padding: 0, margin: 0 }}>
                  {SCOPE.map((item) => (
                    <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
                      <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "hsl(145,62%,46%)", flexShrink: 0, marginTop: "9px" }} />
                      <span style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "hsl(214,7%,62%)" }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </m.div>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.08 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(0,75%,58%)", marginBottom: "1rem" }}>Out of scope</p>
                <ul style={{ display: "flex", flexDirection: "column", gap: "0.5rem", listStyle: "none", padding: 0, margin: 0 }}>
                  {OUT_OF_SCOPE.map((item) => (
                    <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
                      <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "hsl(0,75%,58%)", flexShrink: 0, marginTop: "9px" }} />
                      <span style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "hsl(214,7%,62%)" }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </m.div>
            </div>
          </div>
        </section>

        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "860px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2.5rem" }}>
              <div>
                <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(0,75%,58%)", marginBottom: "1rem" }}>Prohibited behavior</p>
                  <ul style={{ display: "flex", flexDirection: "column", gap: "0.5rem", listStyle: "none", padding: 0, margin: 0 }}>
                    {PROHIBITED.map((item) => (
                      <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
                        <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "hsl(0,75%,58%)", flexShrink: 0, marginTop: "9px" }} />
                        <span style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "hsl(214,7%,62%)" }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </m.div>
              </div>
              <div>
                <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.08 }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(145,62%,46%)", marginBottom: "1rem" }}>Good report guidance</p>
                  <ul style={{ display: "flex", flexDirection: "column", gap: "0.5rem", listStyle: "none", padding: 0, margin: 0 }}>
                    {GOOD_REPORT.map((item) => (
                      <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
                        <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "hsl(145,62%,46%)", flexShrink: 0, marginTop: "9px" }} />
                        <span style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "hsl(214,7%,62%)" }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </m.div>
              </div>
            </div>
          </div>
        </section>

        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "860px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>Safe Harbor</p>
              <h2 style={{ fontSize: "1.375rem", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.22, marginBottom: "1rem" }}>We protect good-faith researchers.</h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "hsl(214,7%,62%)", maxWidth: "56ch" }}>
                Security researchers who follow this policy in good faith will not face legal action from SZL Holdings
                for their research activities. We will not pursue civil or criminal claims against researchers who
                adhere to the scope, prohibited behavior restrictions, and coordinated disclosure process described
                here. We reserve the right to pursue remedies against those who do not follow this policy.
              </p>
            </m.div>
          </div>
        </section>

        <section style={{ padding: "var(--space-section-sm) 0" }}>
          <div style={{ maxWidth: "860px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              <Link href="/security" className="szl-btn-secondary">Security overview →</Link>
              <Link href="/trust/security" className="szl-btn-secondary">Trust Center: Security →</Link>
              <Link href="/legal/acceptable-use" className="szl-btn-ghost">Acceptable Use Policy</Link>
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
