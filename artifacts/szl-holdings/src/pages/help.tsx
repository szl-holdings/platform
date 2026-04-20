import { m } from "framer-motion";
import { Link } from "wouter";
import { HelpCircle, BookOpen, MessageSquare, FileText, Search, ArrowRight, Mail, Shield, ExternalLink, Zap } from "lucide-react";
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
      { label: "Quick start guide", href: "/academy" },
    ],
    color: "hsl(38,72%,58%)",
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
  },
  {
    icon: Zap,
    title: "Alloy & Workflows",
    description: "Workflow orchestration, connector setup, approval gates, and execution history.",
    links: [
      { label: "Workflow docs", href: "/docs/control-plane" },
      { label: "Connector mesh", href: "/alloy/connectors" },
      { label: "Governance audit", href: "/alloy/governance" },
    ],
    color: "hsl(258,55%,68%)",
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
    color: "hsl(200,80%,52%)",
  },
];

const FAQ_ITEMS = [
  { q: "How do I add a new domain pack?", a: "Domain packs are modular extensions. Contact your account team or visit the Platform page to see available packs and request activation." },
  { q: "What data sources does SZL connect to?", a: "SZL ingests from 40+ public and proprietary sources including AIS maritime feeds, NYC PLUTO, FEMA, NVD/CVE, and more. Each domain pack brings its own connectors." },
  { q: "How is AI governed in the platform?", a: "All AI actions require human approval through configurable HITL gates. Every AI-generated recommendation includes source attribution and confidence scoring. See our AI Policy." },
  { q: "Can I export audit trails?", a: "Yes. Every action, approval, and AI recommendation is recorded in the proof chain. Export as JSON, CSV, or PDF from any dashboard." },
  { q: "Is multi-tenant data isolated?", a: "Yes. Tenant namespacing is enforced at the database query layer. No cross-tenant data leakage is architecturally possible." },
];

export default function HelpPage() {
  const __pageMeta = usePageMeta({ title: "Help Center — SZL Holdings", description: "Get help with the SZL platform. Guides, FAQs, and support resources." });

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "#080c14", color: "hsl(38,8%,88%)" }}>
        <SiteNav />
  
        <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "6rem 1.5rem 4rem" }}>
          <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <HelpCircle size={28} style={{ color: "hsl(38,72%,58%)" }} />
              <span style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "hsl(38,72%,58%)" }}>Help Center</span>
            </div>
            <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, lineHeight: 1.15, marginBottom: "1rem", color: "hsl(38,8%,94%)" }}>
              How can we help?
            </h1>
            <p style={{ fontSize: "1.125rem", color: "hsl(214,7%,55%)", maxWidth: "640px", lineHeight: 1.6 }}>
              Find answers, explore guides, and get support for every part of the SZL platform.
            </p>
          </m.div>
  
          <section style={{ marginTop: "3.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
              {HELP_CATEGORIES.map((cat, i) => (
                <m.div
                  key={cat.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  style={{
                    background: "hsla(0,0%,100%,0.025)",
                    border: "1px solid hsla(0,0%,100%,0.08)",
                    borderRadius: "12px",
                    padding: "1.5rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <cat.icon size={18} style={{ color: cat.color }} />
                    <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "hsl(38,8%,92%)" }}>{cat.title}</span>
                  </div>
                  <p style={{ fontSize: "0.8125rem", color: "hsl(214,7%,55%)", lineHeight: 1.55, marginBottom: "1rem" }}>{cat.description}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {cat.links.map(link => (
                      <Link key={link.href} href={link.href}>
                        <span style={{ fontSize: "0.8125rem", color: cat.color, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          {link.label} <ArrowRight size={12} />
                        </span>
                      </Link>
                    ))}
                  </div>
                </m.div>
              ))}
            </div>
          </section>
  
          <section style={{ marginTop: "4rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1.5rem", color: "hsl(38,8%,90%)" }}>Frequently Asked Questions</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {FAQ_ITEMS.map((item, i) => (
                <m.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 + i * 0.06 }}
                  style={{
                    background: "hsla(0,0%,100%,0.02)",
                    border: "1px solid hsla(0,0%,100%,0.06)",
                    borderRadius: "10px",
                    padding: "1.25rem",
                  }}
                >
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "hsl(38,8%,92%)", marginBottom: "0.5rem" }}>{item.q}</div>
                  <div style={{ fontSize: "0.8125rem", color: "hsl(214,7%,55%)", lineHeight: 1.55 }}>{item.a}</div>
                </m.div>
              ))}
            </div>
          </section>
  
          <section style={{ marginTop: "4rem", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
            <div style={{ background: "hsla(258,55%,68%,0.06)", border: "1px solid hsla(258,55%,68%,0.18)", borderRadius: "12px", padding: "1.5rem" }}>
              <Mail size={20} style={{ color: "hsl(258,55%,68%)", marginBottom: "0.75rem" }} />
              <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "hsl(38,8%,92%)", marginBottom: "0.375rem" }}>Contact Support</div>
              <p style={{ fontSize: "0.8125rem", color: "hsl(214,7%,55%)", lineHeight: 1.5 }}>
                Reach out to our team for technical support, enterprise inquiries, or partnership discussions.
              </p>
              <Link href="/contact">
                <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "hsl(258,55%,68%)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.375rem", marginTop: "0.75rem" }}>
                  Contact us <ArrowRight size={14} />
                </span>
              </Link>
            </div>
            <div style={{ background: "hsla(38,72%,58%,0.06)", border: "1px solid hsla(38,72%,58%,0.18)", borderRadius: "12px", padding: "1.5rem" }}>
              <MessageSquare size={20} style={{ color: "hsl(38,72%,58%)", marginBottom: "0.75rem" }} />
              <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "hsl(38,8%,92%)", marginBottom: "0.375rem" }}>Community</div>
              <p style={{ fontSize: "0.8125rem", color: "hsl(214,7%,55%)", lineHeight: 1.5 }}>
                Join the conversation on Substack and Medium for insights, updates, and platform thinking.
              </p>
              <a href="https://szlholdings.substack.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.8125rem", fontWeight: 500, color: "hsl(38,72%,58%)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.375rem", marginTop: "0.75rem" }}>
                Substack <ExternalLink size={12} />
              </a>
            </div>
          </section>
        </main>
  
        <SiteFooter />
      </div>
        </>
  );
}
