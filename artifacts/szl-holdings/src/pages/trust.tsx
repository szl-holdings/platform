import { m } from "framer-motion";
import { Link } from "wouter";
import { ShieldCheck, Lock, Brain, Download, Settings, CheckSquare, ArrowRight, Layers, Database, Eye } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { InlineSegmentedCTA } from "@/components/SegmentedCTA";
import { useNarrativeRouter } from "@/hooks/useNarrativeRouter";

const TRUST_PAGES = [
  {
    href: "/trust/security",
    icon: Lock,
    color: "hsl(145,62%,46%)",
    colorMuted: "hsla(145,62%,40%,0.08)",
    colorBorder: "hsla(145,62%,40%,0.20)",
    label: "Security",
    headline: "Access controls, credential management & responsible disclosure",
    items: ["Six-tier RBAC enforced server-side", "OpenID Connect / PKCE + Azure AD SSO", "Multi-tenant data isolation", "Encrypted infrastructure throughout"],
  },
  {
    href: "/trust/governance",
    icon: Brain,
    color: "var(--color-alloy-light)",
    colorMuted: "var(--color-alloy-muted)",
    colorBorder: "var(--color-alloy-border)",
    label: "Governance",
    headline: "Approval model, human-in-the-loop gates & decision lineage",
    items: ["AI never acts without human sign-off", "Configurable HITL approval gates", "Complete decision lineage exportable", "Override records — not hidden"],
  },
  {
    href: "/trust/ai",
    icon: Brain,
    color: "hsl(258,55%,68%)",
    colorMuted: "hsla(258,55%,68%,0.08)",
    colorBorder: "hsla(258,55%,68%,0.20)",
    label: "AI Policy",
    headline: "AI usage model, source-grounding, model mesh governance",
    items: ["Source-grounded assertions only", "Model isolation — no training on client data", "Confidence scoring and contradiction detection", "Generated content always labeled as such"],
  },
  {
    href: "/trust/approvals",
    icon: CheckSquare,
    color: "hsl(40,90%,54%)",
    colorMuted: "hsla(40,90%,54%,0.08)",
    colorBorder: "hsla(40,90%,54%,0.22)",
    label: "Approvals",
    headline: "Approval path model, sign-off workflows & escalation model",
    items: ["Tiered approval paths by action risk", "Dual-approval for high-impact actions", "Escalation chains with fallback owners", "Emergency override — logged and mandatory review"],
  },
  {
    href: "/trust/exports",
    icon: Download,
    color: "hsl(210,80%,60%)",
    colorMuted: "hsla(210,80%,60%,0.08)",
    colorBorder: "hsla(210,80%,60%,0.20)",
    label: "Exports",
    headline: "Export model, write-back controls & document generation governance",
    items: ["Proof chain on every exported document", "Privilege screening before export", "Immutable export record with hash", "Post-export access audit trail"],
  },
  {
    href: "/trust/operations",
    icon: Settings,
    color: "hsl(200,70%,52%)",
    colorMuted: "hsla(200,70%,52%,0.08)",
    colorBorder: "hsla(200,70%,52%,0.20)",
    label: "Operations",
    headline: "Operational model, admin visibility & external data policy",
    items: ["Continuous service health monitoring", "Runbook-backed operational procedures", "Tenant-isolated query architecture", "External data ingestion governance"],
  },
  {
    href: "/trust/architecture",
    icon: Layers,
    color: "var(--color-lyte-light)",
    colorMuted: "var(--color-lyte-muted)",
    colorBorder: "var(--color-lyte-border)",
    label: "Architecture",
    headline: "System architecture from a trust and auditability perspective",
    items: ["Signal → action 6-stage pipeline", "Tenant namespace isolation by design", "Domain pack layering model", "Connector permission scoping"],
  },
];

const TRUST_SIGNALS = [
  { icon: Database, text: "Multi-tenant data isolation enforced at the database and middleware layer" },
  { icon: Eye, text: "Every AI decision is observable — signal source, confidence, approver attribution" },
  { icon: ShieldCheck, text: "Audit trail designed for LP reporting, regulatory inquiry, and compliance diligence" },
  { icon: Lock, text: "No plaintext credentials in codebase, logs, or any system surface" },
];

export default function TrustPage() {
  const { visitorType } = useNarrativeRouter();

  usePageMeta({
    title: "Trust Center — SZL Holdings",
    description: "Security, governance, AI policy, approvals, exports, operations and architecture — documented for buyer and investor diligence.",
    canonical: "https://szlholdings.com/trust",
  });

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />
      <main id="main-content" role="main">

        {/* Hero */}
        <section className="szl-grid-texture szl-depth-glow-dual" style={{ paddingTop: "var(--space-hero-pt)", paddingBottom: "clamp(4rem,8vw,6rem)", borderBottom: "1px solid var(--color-szl-border)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 0.875rem", borderRadius: "99px", border: "1px solid hsla(145,62%,40%,0.22)", background: "hsla(145,62%,40%,0.08)", marginBottom: "1.75rem" }}>
                <ShieldCheck size={13} color="hsl(145,62%,46%)" />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "hsl(145,62%,46%)" }}>Trust Center</span>
              </div>
              <h1 style={{ fontSize: "clamp(2.25rem,5vw,3.75rem)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.06, maxWidth: "20ch", marginBottom: "1.5rem" }}>
                Trust is part of the product, not a slide at the end.
              </h1>
              <p style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", lineHeight: 1.72, color: "hsl(214,7%,64%)", maxWidth: "55ch", marginBottom: "2rem" }}>
                SZL is building Lyte + Alloy for serious operating environments. That means access discipline,
                workflow accountability, observable AI behavior, and full auditability — documented here, not
                promised in a deck.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                <Link href="/contact" className="szl-btn-primary">
                  Start a diligence conversation <ArrowRight size={14} />
                </Link>
                <Link href="/architecture" className="szl-btn-secondary">
                  System architecture →
                </Link>
              </div>
            </m.div>
          </div>
        </section>

        {/* Trust signal strip */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "2rem 0", background: "hsla(214,12%,6%,0.60)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
              {TRUST_SIGNALS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <m.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: i * 0.06 }}
                    style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}
                  >
                    <div style={{ width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(145,62%,40%,0.08)", border: "1px solid hsla(145,62%,40%,0.18)", borderRadius: "0.4375rem", flexShrink: 0 }}>
                      <Icon size={14} color="hsl(145,62%,46%)" />
                    </div>
                    <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "hsl(214,7%,58%)", marginTop: "2px" }}>{s.text}</p>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Trust hub grid */}
        <section style={{ padding: "var(--space-section-md) 0", borderBottom: "1px solid var(--color-szl-border)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>Seven coverage areas</p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "30ch", marginBottom: "3rem" }}>
                Everything a serious buyer needs to see.
              </h2>
            </m.div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.25rem" }}>
              {TRUST_PAGES.map((page, i) => {
                const Icon = page.icon;
                return (
                  <m.div
                    key={page.href}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.38, delay: i * 0.06 }}
                  >
                    <Link href={page.href} style={{ display: "block", textDecoration: "none" }}>
                      <div className="szl-card" style={{ borderRadius: "0.875rem", padding: "1.5rem", height: "100%", transition: "border-color 0.18s ease, background 0.18s ease", cursor: "pointer" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = page.color + "40"; (e.currentTarget as HTMLElement).style.background = page.colorMuted; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = ""; (e.currentTarget as HTMLElement).style.background = ""; }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: page.colorMuted, border: `1px solid ${page.colorBorder}`, borderRadius: "0.4375rem" }}>
                              <Icon size={16} color={page.color} />
                            </div>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: page.color }}>{page.label}</span>
                          </div>
                          <ArrowRight size={14} color="hsl(214,7%,42%)" />
                        </div>
                        <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "hsl(38,8%,80%)", marginBottom: "1rem", lineHeight: 1.5 }}>{page.headline}</p>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                          {page.items.map((item) => (
                            <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                              <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: page.color, flexShrink: 0, marginTop: "7px", opacity: 0.7 }} />
                              <span style={{ fontSize: "0.8125rem", lineHeight: 1.55, color: "hsl(214,7%,54%)" }}>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Link>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Architecture CTA */}
        <section style={{ padding: "var(--space-section-md) 0", borderBottom: "1px solid var(--color-szl-border)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <div className="szl-card" style={{ borderRadius: "1rem", padding: "clamp(2rem,4vw,3rem)", display: "grid", gridTemplateColumns: "1fr auto", gap: "2rem", alignItems: "center" }}>
                <div>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-lyte-light)", marginBottom: "0.875rem" }}>System Architecture</p>
                  <h2 style={{ fontSize: "clamp(1.375rem,2.5vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.22, marginBottom: "0.875rem", maxWidth: "32ch" }}>
                    Why this architecture is hard to copy — and why that matters.
                  </h2>
                  <p style={{ fontSize: "0.9375rem", lineHeight: 1.68, color: "hsl(214,7%,58%)", maxWidth: "50ch" }}>
                    The standalone architecture page explains every layer of Lyte + Alloy — Lyte as command layer,
                    Alloy as action spine, pack-specific twins, Proof Chain, Worldline, GraphQL control plane,
                    and model mesh — in terms of business value, trust, and defensibility.
                  </p>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <Link href="/architecture" className="szl-btn-primary">
                    View architecture <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </m.div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section style={{ padding: "var(--space-section-sm) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "2rem" }}>
              <Link href="/trust-route" className="szl-btn-primary">
                Walk the trust route <ArrowRight size={14} />
              </Link>
              <Link href="/contact" className="szl-btn-ghost">
                Request a diligence package
              </Link>
              <Link href="/investor-relations" className="szl-btn-ghost">
                Investor relations
              </Link>
            </div>
            {visitorType !== "unknown" && (
              <div style={{ borderTop: "1px solid var(--color-szl-border)", paddingTop: "1.5rem" }}>
                <p style={{ fontSize: "0.75rem", color: "hsl(214,7%,45%)", marginBottom: "0.75rem" }}>
                  Based on your visit context, we've identified the right next step:
                </p>
                <InlineSegmentedCTA visitorType={visitorType} />
              </div>
            )}
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
