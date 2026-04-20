import { m } from "framer-motion";
import { Link } from "wouter";
import {
  Shield, Lock, Eye, Server, Key, AlertTriangle, ArrowRight,
  CheckCircle, RefreshCw, GitBranch, Cpu, Users, Database
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const SECTIONS = [
  {
    icon: Shield,
    title: "Security Overview",
    color: "hsl(145,62%,46%)",
    colorMuted: "hsla(145,62%,40%,0.08)",
    colorBorder: "hsla(145,62%,40%,0.20)",
    items: [
      "Lyte + Alloy is built for operating environments where governance, auditability, and data integrity are non-negotiable.",
      "Security is an architectural constraint, not a feature layer — multi-tenant isolation, encrypted data paths, and human-in-the-loop approval are structurally enforced.",
      "This page reflects the current honest security state of the platform. Planned certifications are listed separately and clearly distinguished from in-place controls.",
    ],
  },
  {
    icon: Database,
    title: "Data Handling",
    color: "hsl(210,80%,60%)",
    colorMuted: "hsla(210,80%,60%,0.08)",
    colorBorder: "hsla(210,80%,60%,0.20)",
    items: [
      "Data is collected and processed only to the extent required to deliver the service.",
      "Operational data is never sold or shared for advertising or profiling purposes.",
      "Multi-tenant isolation is enforced at the database and middleware layer — cross-tenant data access is architecturally prevented.",
      "Demo data is fully synthetic and never derived from or mixed with real customer data.",
      "Data retention windows are defined per data category and enforced through automated processes.",
    ],
  },
  {
    icon: Users,
    title: "Access Control",
    color: "hsl(258,55%,68%)",
    colorMuted: "hsla(258,55%,68%,0.08)",
    colorBorder: "hsla(258,55%,68%,0.20)",
    items: [
      "Role-based access control (RBAC) with six-tier hierarchy, enforced server-side on every request.",
      "OpenID Connect with PKCE for secure authentication; Azure AD multi-tenant SSO supported.",
      "SCIM 2.0 provisioning for automated user lifecycle management from enterprise identity providers.",
      "Organization-scoped middleware prevents cross-tenant access at the application layer.",
      "Session tokens are time-limited and require re-authentication for privileged operations.",
    ],
  },
  {
    icon: Eye,
    title: "Logging & Auditability",
    color: "hsl(40,90%,54%)",
    colorMuted: "hsla(40,90%,54%,0.08)",
    colorBorder: "hsla(40,90%,54%,0.22)",
    items: [
      "Every significant action generates an immutable audit event — actor, role, timestamp, and affected entity are all recorded.",
      "AI-generated recommendations and human approval decisions are stored together in a complete decision chain.",
      "Audit records are queryable by actor, action type, entity, and time range — not just for compliance, but as an operational tool.",
      "Override and exception records are never hidden; they are surfaced and flagged for mandatory review.",
      "Sensitive credential fields are redacted from all logs at the point of capture.",
    ],
  },
  {
    icon: RefreshCw,
    title: "Backup & Recovery",
    color: "hsl(160,60%,44%)",
    colorMuted: "hsla(160,60%,44%,0.08)",
    colorBorder: "hsla(160,60%,44%,0.20)",
    items: [
      "Database backups are automated and retained for defined recovery windows.",
      "Backup integrity is verified through periodic restoration tests.",
      "Every release supports rollback procedures — configuration changes to live systems require approval before application.",
      "Production and development environments are logically separated to prevent unintended cross-environment impact.",
      "Incident response runbooks are maintained for all critical failure scenarios.",
    ],
  },
  {
    icon: GitBranch,
    title: "Secure Development Lifecycle",
    color: "var(--color-lyte-light)",
    colorMuted: "var(--color-lyte-muted)",
    colorBorder: "var(--color-lyte-border)",
    items: [
      "Infrastructure configuration is version-controlled and peer-reviewed before application.",
      "Dependency vulnerability scanning is automated and integrated into the build pipeline.",
      "Secrets are managed via environment-variable injection and never committed to source control.",
      "Third-party integrations use scoped access tokens with minimum required permissions.",
      "Critical vulnerability disclosures trigger immediate review and prioritized remediation.",
    ],
  },
  {
    icon: AlertTriangle,
    title: "Vulnerability Disclosure",
    color: "hsl(0,75%,58%)",
    colorMuted: "hsla(0,75%,58%,0.08)",
    colorBorder: "hsla(0,75%,58%,0.20)",
    items: [
      "We operate a responsible disclosure program. Security researchers who report vulnerabilities in good faith are treated with respect.",
      "Reports are acknowledged within 48 hours with an initial severity assessment.",
      "Reporters are kept informed of investigation progress and expected remediation timelines.",
      "After remediation, coordinated disclosure is supported. Researchers are credited unless they prefer anonymity.",
      "Submit reports via email: security@stephenl.dev — or use the disclosure form on our Trust Center.",
    ],
  },
  {
    icon: Cpu,
    title: "Responsible AI Use",
    color: "var(--color-alloy-light)",
    colorMuted: "var(--color-alloy-muted)",
    colorBorder: "var(--color-alloy-border)",
    items: [
      "AI agents in Lyte + Alloy are advisory, not autonomous. Every consequential action requires human approval before execution.",
      "All AI-generated outputs are clearly labeled as such — no generated content is presented as human-authored output.",
      "Model isolation is enforced: client data is never used to train, fine-tune, or improve models beyond the agreed service scope.",
      "Confidence scoring and source-grounded assertions only — no opaque scoring on consequential recommendations.",
      "Model versions are logged; predictions are associated with the specific model version that produced them.",
    ],
  },
  {
    icon: RefreshCw,
    title: "Release & Change Management",
    color: "hsl(195,70%,48%)",
    colorMuted: "hsla(195,70%,48%,0.08)",
    colorBorder: "hsla(195,70%,48%,0.20)",
    items: [
      "All production changes follow a documented release process with peer review.",
      "Configuration changes to live systems are gated behind an approval step.",
      "Feature flags are used for staged rollouts — new capabilities can be enabled and disabled per tenant without a full release.",
      "A change log is maintained for all significant platform updates.",
      "Post-deployment verification is performed on every production release.",
    ],
  },
];

const COMPLIANCE = [
  { name: "SOC 2 Type II", status: "In Progress", color: "hsl(40,90%,54%)", note: "Audit preparation underway. Expected Q3 2026." },
  { name: "NIST 800-53", status: "Aligned", color: "hsl(145,62%,46%)", note: "Controls mapped and implemented." },
  { name: "GDPR", status: "Compliant", color: "hsl(145,62%,46%)", note: "Data processing agreements and subject access workflows in place." },
  { name: "ISO 27001", status: "Planned", color: "hsl(210,80%,60%)", note: "ISMS development in progress. Certification targeted Q1 2027." },
  { name: "CCPA", status: "Compliant", color: "hsl(145,62%,46%)", note: "Consumer privacy rights, opt-out and deletion workflows operational." },
];

export default function SecurityPage() {
  const __pageMeta = usePageMeta({
    title: "Security — SZL Holdings",
    description: "Security overview for Lyte + Alloy: data handling, access control, logging, backup, secure development, vulnerability disclosure, and responsible AI use.",
    canonical: "https://szlholdings.com/security",
  });

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
        <SiteNav />
        <main id="main-content" role="main">
  
          <section className="szl-grid-texture" style={{ paddingTop: "var(--space-hero-pt)", paddingBottom: "clamp(4rem,8vw,6rem)", borderBottom: "1px solid var(--color-szl-border)", background: "radial-gradient(ellipse at 50% 0%, hsla(145,62%,40%,0.06) 0%, transparent 60%)" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 0.875rem", borderRadius: "99px", border: "1px solid hsla(145,62%,40%,0.22)", background: "hsla(145,62%,40%,0.08)", marginBottom: "1.75rem" }}>
                  <Shield size={13} color="hsl(145,62%,46%)" />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "hsl(145,62%,46%)" }}>Security</span>
                </div>
                <h1 style={{ fontSize: "clamp(2.25rem,5vw,3.75rem)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.06, maxWidth: "22ch", marginBottom: "1.5rem" }}>
                  Security as an architectural constraint, not an add-on.
                </h1>
                <p style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", lineHeight: 1.72, color: "hsl(214,7%,64%)", maxWidth: "56ch", marginBottom: "2rem" }}>
                  This page documents the current security controls in place for Lyte + Alloy. It
                  reflects the honest current state — not aspirational certifications. Planned
                  certifications are clearly marked.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                  <Link href="/trust" className="szl-btn-primary">
                    Trust Center <ArrowRight size={14} />
                  </Link>
                  <Link href="/legal/security-disclosure" className="szl-btn-secondary">
                    Disclosure policy →
                  </Link>
                  <Link href="/contact" className="szl-btn-ghost">
                    Report a vulnerability
                  </Link>
                </div>
              </m.div>
            </div>
          </section>
  
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(145,62%,46%)", marginBottom: "1rem" }}>Documentation</p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "30ch", marginBottom: "3rem" }}>
                  Nine areas. Full coverage.
                </h2>
              </m.div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {SECTIONS.map((section, i) => {
                  const Icon = section.icon;
                  return (
                    <m.div
                      key={section.title}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.38, delay: i * 0.04 }}
                      className="szl-card"
                      style={{ borderRadius: "0.875rem", padding: "var(--space-card-pad)" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                        <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: section.colorMuted, border: `1px solid ${section.colorBorder}`, borderRadius: "0.4375rem", flexShrink: 0 }}>
                          <Icon size={16} color={section.color} />
                        </div>
                        <h3 style={{ fontSize: "1.0625rem", fontWeight: 600, letterSpacing: "-0.012em" }}>{section.title}</h3>
                      </div>
                      <ul style={{ display: "flex", flexDirection: "column", gap: "0.5rem", listStyle: "none", padding: 0, margin: 0 }}>
                        {section.items.map((item) => (
                          <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
                            <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: section.color, flexShrink: 0, marginTop: "9px" }} />
                            <span style={{ fontSize: "0.9rem", lineHeight: 1.68, color: "hsl(214,7%,62%)" }}>{item}</span>
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
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>Compliance Frameworks</p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "30ch", marginBottom: "2rem" }}>Current compliance posture.</h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.65, color: "hsl(214,7%,60%)", maxWidth: "52ch", marginBottom: "2.5rem" }}>
                  In Progress and Planned items are clearly marked. We do not present planned certifications as existing ones.
                </p>
              </m.div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
                {COMPLIANCE.map((fw, i) => (
                  <m.div
                    key={fw.name}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: i * 0.06 }}
                    className="szl-card"
                    style={{ borderRadius: "0.75rem", padding: "1.25rem" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.625rem" }}>
                      <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "hsl(38,8%,90%)" }}>{fw.name}</span>
                      <span style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "0.1875rem 0.5rem", borderRadius: "4px", color: fw.color, background: `${fw.color}18`, border: `1px solid ${fw.color}30` }}>
                        {fw.status}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "hsl(214,7%,55%)" }}>{fw.note}</p>
                  </m.div>
                ))}
              </div>
            </div>
          </section>
  
          <section style={{ padding: "var(--space-section-sm) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                <Link href="/trust" className="szl-btn-secondary">Trust Center →</Link>
                <Link href="/trust/governance" className="szl-btn-secondary">AI Governance →</Link>
                <Link href="/architecture" className="szl-btn-secondary">Architecture →</Link>
                <Link href="/contact" className="szl-btn-ghost">Report a vulnerability <ArrowRight size={13} /></Link>
              </div>
            </div>
          </section>
  
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
