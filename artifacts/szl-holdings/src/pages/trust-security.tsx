import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Lock, Key, Shield, Users, Server, AlertTriangle, FileText } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const CONTROLS = [
  {
    icon: Users,
    title: "Identity & Access",
    items: [
      "11-role platform hierarchy (founder_admin → anonymous_visitor) enforced server-side with deny-by-default global auth enforcer on all /api/* routes",
      "OpenID Connect with PKCE (Replit + Azure AD multi-tenant SSO)",
      "SCIM 2.0 provisioning server for automated user lifecycle management",
      "Session management with DB-backed sessions, expiration, and rotation",
      "Organization-scoped middleware prevents cross-tenant access",
      "Platform role mapping from external IdP groups to internal RBAC",
    ],
  },
  {
    icon: Server,
    title: "Infrastructure",
    items: [
      "All services run in isolated container environments",
      "HTTPS / TLS 1.3 enforced across all public-facing surfaces",
      "Database connections use encrypted channels",
      "Environment variables managed as secrets, never committed to version control",
      "Staging, pilot, and production environments logically separated",
      "CSRF protection on all mutating endpoints",
    ],
  },
  {
    icon: Key,
    title: "Credential Management",
    items: [
      "No plaintext credentials in codebase or logs",
      "API keys and secrets stored in environment secret management",
      "Third-party integrations use scoped access tokens with minimum required permissions",
      "Key rotation process defined for all critical credentials",
      "Audit log of credential access events with sensitive-key redaction",
    ],
  },
  {
    icon: Lock,
    title: "Data Handling",
    items: [
      "Multi-tenant data isolation enforced at database and middleware level",
      "Organization-scoped queries prevent cross-tenant data leakage",
      "Retrieval engine scoped by tenant context",
      "Data retention policies defined per data category",
      "Personal data handling follows minimum-necessary principle",
      "Demo data is synthetic — never derived from real customer data",
    ],
  },
];

const DISCLOSURE_STEPS = [
  { step: "01", title: "Report", body: "Submit vulnerability details via the contact form, marked as security disclosure. Include steps to reproduce and impact assessment." },
  { step: "02", title: "Acknowledge", body: "We acknowledge security reports within 24 hours with an initial severity assessment. Critical issues are targeted for patch within 48–72 hours; lower-severity issues follow the standard remediation cycle." },
  { step: "03", title: "Remediate", body: "We investigate and remediate confirmed vulnerabilities. Researchers are kept informed of progress and expected timeline." },
  { step: "04", title: "Disclose", body: "After remediation, we support coordinated disclosure. Researchers who report responsibly are credited unless they prefer anonymity." },
];

export default function TrustSecurityPage() {
  const __pageMeta = usePageMeta({
    title: "Security — Trust Center · SZL Holdings",
    description: "Identity & access model, infrastructure controls, credential management, and responsible disclosure for Lyte + Counsel.",
    canonical: "https://szlholdings.com/trust/security",
  });

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
        <SiteNav />
        <main id="main-content" >
  
          <section className="szl-grid-texture" style={{ paddingTop: "var(--space-hero-pt)", paddingBottom: "clamp(4rem,8vw,6rem)", borderBottom: "1px solid var(--color-szl-border)", background: "radial-gradient(ellipse at 50% 0%, hsla(145,62%,40%,0.05) 0%, transparent 60%)" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.75rem" }}>
                  <Link href="/trust" style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", textDecoration: "none" }}>Trust Center</Link>
                  <span style={{ color: "var(--color-szl-text-faint)" }}>/</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "hsl(145,62%,46%)" }}>Security</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                  <div style={{ width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(145,62%,40%,0.08)", border: "1px solid hsla(145,62%,40%,0.20)", borderRadius: "0.5625rem" }}>
                    <Shield size={20} color="hsl(145,62%,46%)" />
                  </div>
                  <h1 style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)", fontWeight: 600, letterSpacing: "-0.028em", lineHeight: 1.08 }}>Security Posture</h1>
                </div>
                <p style={{ fontSize: "clamp(1rem,1.8vw,1.0625rem)", lineHeight: 1.72, color: "hsl(214,7%,64%)", maxWidth: "52ch" }}>
                  This page documents the current security controls in place for Lyte + Counsel.
                  It reflects the honest current state — not aspirational certifications or future
                  roadmap items presented as existing capabilities.
                </p>
              </m.div>
            </div>
          </section>
  
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(145,62%,46%)", marginBottom: "1rem" }}>Controls</p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "3rem" }}>Active security controls as of today.</h2>
              </m.div>
              <div className="szl-grid-2" style={{ gap: "1.5rem" }}>
                {CONTROLS.map((section, i) => {
                  const Icon = section.icon;
                  return (
                    <m.div key={section.title} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.38, delay: i * 0.07 }} className="szl-card" style={{ borderRadius: "0.875rem", padding: "var(--space-card-pad)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                        <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(145,62%,40%,0.08)", border: "1px solid hsla(145,62%,40%,0.18)", borderRadius: "0.4375rem" }}>
                          <Icon size={16} color="hsl(145,62%,46%)" />
                        </div>
                        <h3 style={{ fontSize: "1.0625rem", fontWeight: 600, letterSpacing: "-0.012em" }}>{section.title}</h3>
                      </div>
                      <ul style={{ display: "flex", flexDirection: "column", gap: "0.5rem", listStyle: "none", padding: 0, margin: 0 }}>
                        {section.items.map((item) => (
                          <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
                            <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "hsl(145,62%,46%)", flexShrink: 0, marginTop: "8px" }} />
                            <span style={{ fontSize: "0.875rem", lineHeight: 1.65, color: "hsl(214,7%,64%)" }}>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </m.div>
                  );
                })}
              </div>
            </div>
          </section>
  
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                  <AlertTriangle size={14} color="hsl(40,90%,54%)" />
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(40,90%,54%)" }}>Responsible Disclosure</p>
                </div>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "3rem" }}>How to report a vulnerability.</h2>
              </m.div>
              <div className="szl-grid-4">
                {DISCLOSURE_STEPS.map((step, i) => (
                  <m.div key={step.step} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.38, delay: i * 0.07 }} className="szl-card" style={{ borderRadius: "0.75rem", padding: "var(--space-card-pad)" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 600, color: "hsl(40,90%,54%)", letterSpacing: "0.08em", marginBottom: "0.875rem" }}>{step.step}</div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.012em", marginBottom: "0.625rem" }}>{step.title}</h3>
                    <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,60%)" }}>{step.body}</p>
                  </m.div>
                ))}
              </div>
              <m.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.20 }} style={{ marginTop: "2rem" }}>
                <Link href="/contact" className="szl-btn-primary">
                  Report a vulnerability <ArrowRight size={14} />
                </Link>
              </m.div>
            </div>
          </section>
  
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                  <FileText size={14} color="hsl(145,62%,46%)" />
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "hsl(145,62%,46%)" }}>Diligence Materials</p>
                </div>
                <h2 style={{ fontSize: "clamp(1.25rem,2.5vw,1.75rem)", fontWeight: 600, letterSpacing: "-0.018em", lineHeight: 1.2, maxWidth: "32ch", marginBottom: "1.5rem" }}>
                  Security documentation for enterprise evaluators.
                </h2>
              </m.div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: "0.875rem" }}>
                {[
                  { label: "Security Diligence Brief", desc: "RBAC matrix, isolation model, credential handling, and vulnerability disclosure process", href: "/trust/diligence/security" },
                  { label: "Technical Diligence Brief", desc: "Architecture layers, tenancy model, API surface, integration security, and proof chain", href: "/trust/diligence/technical" },
                  { label: "Known Gaps Register", desc: "Transparent gap register with severity classification and remediation status. Remaining open gaps — including immutable log sink, internal token rotation, query timeouts, and AI provider circuit breakers — are tracked openly with roadmap dates.", href: "/trust-center" },
                ].map((item, i) => (
                  <m.div key={item.label} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.07 }} className="szl-card" style={{ borderRadius: "0.75rem", padding: "1.125rem 1.25rem" }}>
                    <Link href={item.href} style={{ textDecoration: "none", display: "block" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "hsl(38,8%,85%)" }}>{item.label}</span>
                        <ArrowRight size={13} color="hsl(145,62%,46%)" />
                      </div>
                      <p style={{ fontSize: "12.5px", lineHeight: 1.6, color: "hsl(214,7%,52%)" }}>{item.desc}</p>
                    </Link>
                  </m.div>
                ))}
              </div>
              <m.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.25 }} style={{ fontSize: "12px", color: "hsl(214,7%,40%)", marginTop: "1.25rem" }}>
                Full technical diligence packet available on request —{" "}
                <a href="mailto:security@szlholdings.com" style={{ color: "hsl(145,62%,46%)", textDecoration: "none" }}>security@szlholdings.com</a>
              </m.p>
            </div>
          </section>
  
          <section style={{ padding: "var(--space-section-sm) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                <Link href="/trust/governance" className="szl-btn-secondary">AI Governance →</Link>
                <Link href="/trust/architecture" className="szl-btn-secondary">Architecture →</Link>
                <Link href="/trust" className="szl-btn-ghost">Back to Trust Center</Link>
              </div>
            </div>
          </section>
  
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
