import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, ShieldCheck, Lock, FileCheck2, Eye, Database, Users, ChevronRight, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const TRUST_PILLARS = [
  {
    icon: Lock,
    title: "Security Posture",
    sub: "Identity, access, and infrastructure controls",
    href: "/trust/security",
    color: "hsl(145,62%,40%)",
    colorMuted: "hsla(145,62%,40%,0.08)",
    colorBorder: "hsla(145,62%,40%,0.18)",
    bullets: ["Role-based access control", "Environment separation", "Credential management", "Responsible disclosure"],
  },
  {
    icon: Database,
    title: "AI Governance",
    sub: "Human-in-the-loop, lineage, and approval model",
    href: "/trust/governance",
    color: "var(--color-alloy-light)",
    colorMuted: "var(--color-alloy-muted)",
    colorBorder: "var(--color-alloy-border)",
    bullets: ["HITL approval gates", "Decision lineage tracking", "Model explainability", "Override and exception model"],
  },
  {
    icon: Eye,
    title: "Architecture",
    sub: "Data flow, tenant model, and pipeline design",
    href: "/trust/architecture",
    color: "var(--color-lyte-light)",
    colorMuted: "var(--color-lyte-muted)",
    colorBorder: "var(--color-lyte-border)",
    bullets: ["Signal → action pipeline", "Tenant-aware isolation", "Role-scoped execution", "Domain pack model"],
  },
];

const PRINCIPLES = [
  { icon: Lock, title: "Access discipline", body: "Private routes, role-aware access, and permission boundaries enforced consistently. No ambiguity about who can see or act on what." },
  { icon: FileCheck2, title: "Traceable workflows", body: "Every signal, decision, action, and outcome is logged with full attribution. Audit trail is a first-class design requirement, not a logging afterthought." },
  { icon: Eye, title: "Clear environment labeling", body: "All demos, screenshots, and dashboards are clearly labeled as demo, pilot, or live. Buyers and capital partners know exactly what they're looking at." },
  { icon: Users, title: "Human in the loop", body: "Consequential actions require explicit human approval before execution. AI does not act autonomously on high-stakes decisions." },
];

export default function TrustPage() {
  usePageMeta({
    title: "Trust Center — SZL Holdings",
    description: "Security posture, AI governance, architecture, and responsible disclosure. Trust is part of the Lyte + Alloy product — documented for customer and capital diligence.",
    canonical: "https://szlholdings.com/trust",
  });

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />
      <main id="main-content" role="main">

        {/* Hero */}
        <section
          className="szl-grid-texture"
          style={{
            paddingTop: "var(--space-hero-pt)",
            paddingBottom: "clamp(4rem,8vw,6rem)",
            borderBottom: "1px solid var(--color-szl-border)",
            background: "radial-gradient(ellipse at 50% 0%, hsla(145,62%,40%,0.05) 0%, transparent 60%)",
          }}
        >
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", border: "1px solid hsla(145,62%,40%,0.22)", background: "hsla(145,62%,40%,0.08)", borderRadius: "9999px", padding: "0.25rem 0.75rem", marginBottom: "1.75rem" }}>
                <ShieldCheck size={13} color="hsl(145,62%,46%)" />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "hsl(145,62%,56%)" }}>Trust Center</span>
              </div>
              <h1
                style={{
                  fontSize: "clamp(2.25rem,5vw,3.75rem)",
                  fontWeight: 600,
                  letterSpacing: "-0.028em",
                  lineHeight: 1.08,
                  maxWidth: "24ch",
                  marginBottom: "1.5rem",
                }}
              >
                Trust is part of the product, not a slide at the end.
              </h1>
              <p style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", lineHeight: 1.72, color: "hsl(214,7%,64%)", maxWidth: "52ch", marginBottom: "2.25rem" }}>
                SZL is building Lyte + Alloy for serious operating environments. That means
                security posture, AI governance, human-in-the-loop architecture, and truthful
                product-state communication all matter. This center documents what exists,
                what's being hardened, and how the platform is prepared for diligence.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                <Link href="/contact" className="szl-btn-primary">
                  Start a diligence conversation <ArrowRight size={15} />
                </Link>
                <Link href="/trust/architecture" className="szl-btn-secondary">
                  Architecture overview
                </Link>
              </div>
            </m.div>
          </div>
        </section>

        {/* Trust pillars */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>
                Three pillars
              </p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "3rem" }}>
                Full documentation across security, governance, and architecture.
              </h2>
            </m.div>
            <div className="szl-grid-3" style={{ gap: "1.5rem" }}>
              {TRUST_PILLARS.map((pillar, i) => {
                const Icon = pillar.icon;
                return (
                  <m.div
                    key={pillar.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className="szl-card"
                    style={{ borderRadius: "0.875rem", padding: "clamp(1.5rem,3vw,2rem)", display: "flex", flexDirection: "column" }}
                  >
                    <div style={{ width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", background: pillar.colorMuted, border: `1px solid ${pillar.colorBorder}`, borderRadius: "0.5rem", marginBottom: "1.25rem" }}>
                      <Icon size={18} color={pillar.color} />
                    </div>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 600, letterSpacing: "-0.015em", marginBottom: "0.375rem" }}>{pillar.title}</h3>
                    <p style={{ fontSize: "0.8125rem", color: "hsl(214,7%,55%)", marginBottom: "1.25rem" }}>{pillar.sub}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem", flex: 1 }}>
                      {pillar.bullets.map((b) => (
                        <div key={b} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: pillar.color, flexShrink: 0 }} />
                          <span style={{ fontSize: "0.8375rem", color: "hsl(214,7%,64%)" }}>{b}</span>
                        </div>
                      ))}
                    </div>
                    <Link
                      href={pillar.href}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "0.375rem",
                        fontSize: "0.8375rem", fontWeight: 500, color: pillar.color,
                        textDecoration: "none", marginTop: "auto",
                      }}
                    >
                      Read full documentation <ChevronRight size={14} />
                    </Link>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Principles */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>
                Design principles
              </p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "3rem" }}>
                Four non-negotiables in how Lyte + Alloy is built.
              </h2>
            </m.div>
            <div className="szl-grid-2">
              {PRINCIPLES.map((p, i) => {
                const Icon = p.icon;
                return (
                  <m.div
                    key={p.title}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.38, delay: i * 0.07 }}
                    className="szl-card"
                    style={{ borderRadius: "0.75rem", padding: "var(--space-card-pad)", display: "flex", gap: "1.25rem", alignItems: "flex-start" }}
                  >
                    <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(145,62%,40%,0.08)", border: "1px solid hsla(145,62%,40%,0.16)", borderRadius: "0.4375rem", flexShrink: 0 }}>
                      <Icon size={16} color="hsl(145,62%,46%)" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.012em", marginBottom: "0.5rem" }}>{p.title}</h3>
                      <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,60%)" }}>{p.body}</p>
                    </div>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Pilot Readiness */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(40,90%,54%)", marginBottom: "1rem" }}>
                Readiness
              </p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "1.25rem" }}>
                Honest product-state boundaries.
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "hsl(214,7%,62%)", maxWidth: "60ch", marginBottom: "3rem" }}>
                Every product uses standardized readiness labels. We clearly separate current controls
                from future certification plans, and demo environments from live systems. We do not
                overclaim certification status or imply production readiness where it is pilot readiness.
              </p>
            </m.div>
            <div className="szl-grid-3" style={{ gap: "1rem" }}>
              {[
                { name: "Lyte", label: "Functional Alpha", desc: "Primary commercial wedge. Core workflows operational. Approaching pilot readiness.", icon: CheckCircle2, color: "hsl(145,62%,46%)" },
                { name: "Alloy", label: "Functional Alpha", desc: "Execution fabric with schema-validated AI decisions, policy-gated tools, eval harness, and audit trail.", icon: CheckCircle2, color: "hsl(145,62%,46%)" },
                { name: "Aegis / Terra / Vessels", label: "Functional Alpha", desc: "Staged expansion lanes. Functional but secondary to the Lyte + Alloy commercial focus.", icon: Clock, color: "hsl(40,90%,54%)" },
              ].map((product, i) => {
                const Icon = product.icon;
                return (
                  <m.div key={product.name} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.38, delay: i * 0.07 }} className="szl-card" style={{ borderRadius: "0.75rem", padding: "var(--space-card-pad)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.875rem" }}>
                      <Icon size={16} color={product.color} />
                      <span style={{ fontSize: "1rem", fontWeight: 600 }}>{product.name}</span>
                    </div>
                    <div style={{ display: "inline-block", fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.06em", color: product.color, background: `${product.color}14`, border: `1px solid ${product.color}2a`, borderRadius: "4px", padding: "0.1875rem 0.5rem", marginBottom: "0.75rem" }}>
                      {product.label}
                    </div>
                    <p style={{ fontSize: "0.8375rem", lineHeight: 1.65, color: "hsl(214,7%,58%)" }}>{product.desc}</p>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Known Gaps */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <AlertCircle size={14} color="hsl(40,90%,54%)" />
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(40,90%,54%)" }}>Known Boundaries</p>
              </div>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "1.25rem" }}>
                What we have — and what comes next.
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "hsl(214,7%,62%)", maxWidth: "60ch", marginBottom: "3rem" }}>
                Transparency about current gaps is part of the trust model. These are disclosed
                for controlled diligence — not as risks, but as the natural maturation path for
                a Functional Alpha platform.
              </p>
            </m.div>
            <div className="szl-card" style={{ borderRadius: "0.875rem", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--color-szl-border)", background: "hsla(214,12%,8%,0.60)" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-szl-text-muted)" }}>Area</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-szl-text-muted)" }}>Current state</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-szl-text-muted)" }}>Path forward</span>
              </div>
              {[
                { area: "SOC 2 Type II", current: "Controls implemented, not yet audited", next: "Audit engagement planned for post-pilot" },
                { area: "Load testing", current: "Functional testing complete, no stress testing yet", next: "Performance baseline before first enterprise pilot" },
                { area: "Disaster recovery", current: "Database backups and Git history", next: "Formal DR plan with documented RTO/RPO" },
                { area: "Dedicated inference", current: "Shared HuggingFace API", next: "Evaluate dedicated model serving for pilot customers" },
                { area: "Monitoring / APM", current: "Health endpoints and structured logging", next: "Full APM integration (Sentry, Datadog, or equivalent)" },
              ].map((row, i, arr) => (
                <m.div
                  key={row.area}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    padding: "0.875rem 1.25rem",
                    borderBottom: i < arr.length - 1 ? "1px solid var(--color-szl-border)" : "none",
                    gap: "1rem",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "hsl(38,8%,85%)" }}>{row.area}</span>
                  <span style={{ fontSize: "0.8375rem", color: "hsl(214,7%,60%)", lineHeight: 1.55 }}>{row.current}</span>
                  <span style={{ fontSize: "0.8375rem", color: "hsl(40,90%,54%)", lineHeight: 1.55 }}>{row.next}</span>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        {/* Responsible disclosure notice */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-sm) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="szl-card"
              style={{ borderRadius: "0.75rem", padding: "clamp(1.5rem,3vw,2rem)", display: "flex", gap: "1.5rem", alignItems: "flex-start" }}
            >
              <div style={{ width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(40,90%,48%,0.08)", border: "1px solid hsla(40,90%,48%,0.18)", borderRadius: "0.5rem", flexShrink: 0 }}>
                <ShieldCheck size={18} color="hsl(40,90%,58%)" />
              </div>
              <div>
                <h3 style={{ fontSize: "1.0625rem", fontWeight: 600, letterSpacing: "-0.012em", marginBottom: "0.5rem" }}>Responsible Disclosure</h3>
                <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,62%)", maxWidth: "64ch", marginBottom: "0.875rem" }}>
                  If you discover a security vulnerability in any SZL Holdings product or infrastructure,
                  please contact us directly before public disclosure. We commit to acknowledging
                  reports within 48 hours and keeping researchers informed throughout the remediation
                  process.
                </p>
                <Link href="/contact" style={{ fontSize: "0.875rem", fontWeight: 500, color: "hsl(40,90%,58%)", textDecoration: "none" }}>
                  Report a vulnerability →
                </Link>
              </div>
            </m.div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="szl-card szl-grid-cta"
              style={{ borderRadius: "1rem", padding: "clamp(2.5rem,5vw,4rem)", gap: "2.5rem", alignItems: "center" }}
            >
              <div>
                <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.2, marginBottom: "0.875rem" }}>
                  Need a full security or technical diligence package?
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,62%)", maxWidth: "48ch" }}>
                  We prepare tailored diligence packages for investors, design partners, and
                  enterprise customers. Reach out to start the conversation.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", flexShrink: 0 }}>
                <Link href="/contact" className="szl-btn-primary">
                  Request diligence package <ArrowRight size={14} />
                </Link>
                <Link href="/trust/security" className="szl-btn-secondary" style={{ textAlign: "center" }}>
                  Security documentation
                </Link>
              </div>
            </m.div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
