import { m } from "framer-motion";
import { Link } from "wouter";
import { HelpCircle, BookOpen, MessageSquare, FileText, Shield, ArrowRight, Mail, Zap, ExternalLink, Scale, Ship, Building2 } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const HELP_CATEGORIES = [
  {
    icon: BookOpen,
    title: "Getting Started",
    description: "Platform setup, first login, workspace configuration, and initial data connection.",
    links: [
      { label: "Platform overview", href: "/platform" },
      { label: "Architecture walkthrough", href: "/docs/architecture" },
      { label: "Academy quick start", href: "/academy" },
    ],
    color: "hsl(38,72%,58%)",
    colorMuted: "hsla(38,72%,58%,0.08)",
    colorBorder: "hsla(38,72%,58%,0.22)",
  },
  {
    icon: Shield,
    title: "Security & Access",
    description: "Authentication, RBAC roles, SSO setup, API keys, and tenant isolation.",
    links: [
      { label: "Trust center", href: "/trust" },
      { label: "Security posture", href: "/trust/security" },
      { label: "Governance model", href: "/trust/governance" },
    ],
    color: "hsl(145,62%,46%)",
    colorMuted: "hsla(145,62%,46%,0.08)",
    colorBorder: "hsla(145,62%,46%,0.20)",
  },
  {
    icon: Zap,
    title: "Alloy & Workflows",
    description: "Workflow orchestration, connector setup, approval gates, and execution history.",
    links: [
      { label: "Control plane docs", href: "/docs/control-plane" },
      { label: "Connector mesh", href: "/alloy/connectors" },
      { label: "Governance audit", href: "/alloy/governance" },
    ],
    color: "hsl(258,55%,68%)",
    colorMuted: "hsla(258,55%,68%,0.08)",
    colorBorder: "hsla(258,55%,68%,0.20)",
  },
  {
    icon: FileText,
    title: "API & Integration",
    description: "REST API reference, webhook configuration, data export, and third-party integrations.",
    links: [
      { label: "API reference", href: "/api" },
      { label: "GitHub integration", href: "/docs/github" },
      { label: "Export controls", href: "/trust/exports" },
    ],
    color: "hsl(206,72%,52%)",
    colorMuted: "hsla(206,72%,52%,0.08)",
    colorBorder: "hsla(206,72%,52%,0.20)",
  },
  {
    icon: Scale,
    title: "PRISM Counsel",
    description: "Legal matter workflows, demand packet generation, deadline compliance, and settlement band forecasting.",
    links: [
      { label: "PRISM overview", href: "/solutions/prism-counsel" },
      { label: "Pilot program", href: "/pilot/prism-counsel" },
      { label: "Trust — legal exports", href: "/trust/exports" },
    ],
    color: "hsl(38,72%,58%)",
    colorMuted: "hsla(38,72%,58%,0.08)",
    colorBorder: "hsla(38,72%,58%,0.22)",
  },
  {
    icon: Ship,
    title: "Domain Packs",
    description: "Configuration and operation guides for Vessels (maritime), Aegis (security), and Terra (real estate).",
    links: [
      { label: "Vessels docs", href: "/solutions/vessels" },
      { label: "Aegis docs", href: "/solutions/aegis" },
      { label: "Terra docs", href: "/solutions/terra" },
    ],
    color: "hsl(200,80%,52%)",
    colorMuted: "hsla(200,80%,52%,0.08)",
    colorBorder: "hsla(200,80%,52%,0.20)",
  },
];

const FAQ_ITEMS = [
  { q: "How do I add a new domain pack?", a: "Domain packs are modular extensions. Contact your account team or visit the Platform page to see available packs and request activation." },
  { q: "What data sources does SZL connect to?", a: "SZL ingests from 40+ public and proprietary sources including AIS maritime feeds, NYC PLUTO, FEMA, NVD/CVE, and more. Each domain pack brings its own connectors." },
  { q: "How is AI governed in the platform?", a: "All AI actions require human approval through configurable HITL gates. Every AI-generated recommendation includes source attribution and confidence scoring. See our AI Policy." },
  { q: "Can I export audit trails?", a: "Yes. Every action, approval, and AI recommendation is recorded in the proof chain. Export as JSON, CSV, or PDF from any dashboard." },
  { q: "Is multi-tenant data isolated?", a: "Yes. Tenant namespacing is enforced at the database query layer. No cross-tenant data leakage is architecturally possible." },
  { q: "How does PRISM Counsel integrate with existing legal systems?", a: "PRISM Counsel connects to case management, document management, and billing systems via the Alloy connector mesh. Matter signals are ingested and normalized into the SZL domain model automatically." },
  { q: "What is the proof chain?", a: "Every AI recommendation, human approval, override, and system action is recorded in a cryptographically linked audit trail. This chain is exportable for regulatory or LP reporting." },
];

export default function HelpPage() {
  usePageMeta({
    title: "Help Center — SZL Holdings",
    description: "Get help with the SZL platform. Guides, FAQs, support resources, and documentation for Lyte, Alloy, PRISM Counsel, and all domain packs.",
    canonical: "https://szlholdings.com/help",
  });

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />
      <main id="main-content" role="main">

        <section
          className="szl-grid-texture"
          style={{
            paddingTop: "var(--space-hero-pt)",
            paddingBottom: "clamp(4rem,8vw,6rem)",
            borderBottom: "1px solid var(--color-szl-border)",
          }}
        >
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 0.875rem", borderRadius: "99px", border: "1px solid var(--color-szl-border-hover)", background: "hsla(0,0%,100%,0.04)", marginBottom: "1.75rem" }}>
                <HelpCircle size={13} color="var(--color-szl-text-muted)" />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-szl-text-secondary)" }}>Help Center</span>
              </div>
            </m.div>
            <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.05 }}>
              <h1 style={{ fontSize: "clamp(2.25rem,5vw,3.75rem)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.06, maxWidth: "22ch", marginBottom: "1.5rem" }}>
                How can we help?
              </h1>
              <p style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", lineHeight: 1.72, color: "hsl(214,7%,64%)", maxWidth: "55ch" }}>
                Find answers, explore guides, and get support for every part of the SZL platform —
                from platform fundamentals to domain-specific operations.
              </p>
            </m.div>
          </div>
        </section>

        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "1rem" }}>
                Browse by topic
              </p>
            </m.div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.25rem" }}>
              {HELP_CATEGORIES.map((cat, i) => {
                const Icon = cat.icon;
                return (
                  <m.div
                    key={cat.title}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06, duration: 0.4 }}
                    className="szl-card"
                    style={{ borderRadius: "0.875rem", padding: "1.5rem" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.75rem" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", background: cat.colorMuted, border: `1px solid ${cat.colorBorder}` }}>
                        <Icon size={15} style={{ color: cat.color }} />
                      </div>
                      <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "hsl(38,8%,92%)" }}>{cat.title}</span>
                    </div>
                    <p style={{ fontSize: "0.8125rem", color: "hsl(214,7%,58%)", lineHeight: 1.6, marginBottom: "1rem" }}>{cat.description}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {cat.links.map(link => (
                        <Link key={link.href} href={link.href} style={{ textDecoration: "none" }}>
                          <span style={{ fontSize: "0.8125rem", color: cat.color, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem", transition: "opacity 0.2s" }}>
                            {link.label} <ArrowRight size={12} />
                          </span>
                        </Link>
                      ))}
                    </div>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0", background: "hsla(0,0%,100%,0.01)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "1rem" }}>
                Frequently asked
              </p>
              <h2 style={{ fontSize: "clamp(1.375rem,3vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.020em", lineHeight: 1.2, marginBottom: "2rem" }}>
                Common questions
              </h2>
            </m.div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {FAQ_ITEMS.map((item, i) => (
                <m.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.35 }}
                  className="szl-card"
                  style={{ borderRadius: "0.75rem", padding: "1.25rem" }}
                >
                  <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "hsl(38,8%,92%)", marginBottom: "0.5rem" }}>{item.q}</p>
                  <p style={{ fontSize: "0.8125rem", color: "hsl(214,7%,58%)", lineHeight: 1.6 }}>{item.a}</p>
                </m.div>
              ))}
            </div>
            <m.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }} style={{ marginTop: "1.5rem" }}>
              <Link href="/faq" style={{ textDecoration: "none" }}>
                <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "hsl(38,72%,58%)", display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                  View all FAQs <ArrowRight size={14} />
                </span>
              </Link>
            </m.div>
          </div>
        </section>

        <section style={{ padding: "var(--space-section-sm) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.25rem" }}>
              <m.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="szl-card"
                style={{ borderRadius: "0.875rem", padding: "1.5rem" }}
              >
                <div style={{ width: "36px", height: "36px", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(258,55%,68%,0.10)", border: "1px solid hsla(258,55%,68%,0.18)", marginBottom: "0.75rem" }}>
                  <Mail size={16} color="hsl(258,55%,68%)" />
                </div>
                <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "hsl(38,8%,92%)", marginBottom: "0.375rem" }}>Contact Support</p>
                <p style={{ fontSize: "0.8125rem", color: "hsl(214,7%,55%)", lineHeight: 1.55, marginBottom: "0.75rem" }}>
                  Reach out for technical support, enterprise inquiries, or partnership discussions.
                </p>
                <Link href="/contact" style={{ textDecoration: "none" }}>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "hsl(258,55%,68%)", display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                    Contact us <ArrowRight size={14} />
                  </span>
                </Link>
              </m.div>

              <m.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.06 }}
                className="szl-card"
                style={{ borderRadius: "0.875rem", padding: "1.5rem" }}
              >
                <div style={{ width: "36px", height: "36px", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(38,72%,58%,0.10)", border: "1px solid hsla(38,72%,58%,0.18)", marginBottom: "0.75rem" }}>
                  <MessageSquare size={16} color="hsl(38,72%,58%)" />
                </div>
                <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "hsl(38,8%,92%)", marginBottom: "0.375rem" }}>Community</p>
                <p style={{ fontSize: "0.8125rem", color: "hsl(214,7%,55%)", lineHeight: 1.55, marginBottom: "0.75rem" }}>
                  Join the conversation on Substack and Medium for insights, updates, and platform thinking.
                </p>
                <a href="https://szlholdings.substack.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.8125rem", fontWeight: 500, color: "hsl(38,72%,58%)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                  Substack <ExternalLink size={12} />
                </a>
              </m.div>

              <m.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.12 }}
                className="szl-card"
                style={{ borderRadius: "0.875rem", padding: "1.5rem" }}
              >
                <div style={{ width: "36px", height: "36px", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(145,62%,46%,0.10)", border: "1px solid hsla(145,62%,46%,0.18)", marginBottom: "0.75rem" }}>
                  <Building2 size={16} color="hsl(145,62%,46%)" />
                </div>
                <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "hsl(38,8%,92%)", marginBottom: "0.375rem" }}>Design Partners</p>
                <p style={{ fontSize: "0.8125rem", color: "hsl(214,7%,55%)", lineHeight: 1.55, marginBottom: "0.75rem" }}>
                  Interested in a hands-on 90-day proof engagement? Learn about the design partner program.
                </p>
                <Link href="/design-partners" style={{ textDecoration: "none" }}>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "hsl(145,62%,46%)", display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                    Learn more <ArrowRight size={14} />
                  </span>
                </Link>
              </m.div>
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
