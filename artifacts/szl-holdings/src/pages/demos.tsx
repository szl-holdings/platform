import { m } from "framer-motion";
import { Link } from "wouter";
import { Play, ShieldCheck, Ship, Building2, BarChart3, Scale, ArrowRight, Eye, Layers, Monitor } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const DEMOS = [
  {
    id: "lyte",
    title: "Lyte Business Observability",
    subtitle: "See what's invisible before it costs you",
    description: "Revenue stall detection, approval aging, ownership drift, KPI monitoring — all surfaced in a single command layer with governed action routing.",
    icon: BarChart3,
    color: "hsl(191,92%,44%)",
    colorMuted: "hsla(191,92%,44%,0.08)",
    colorBorder: "hsla(191,92%,44%,0.20)",
    href: "/lyte-command-center/",
    cta: "Open Lyte",
  },
  {
    id: "prism-counsel",
    title: "PRISM Counsel",
    subtitle: "Legal matter intelligence",
    description: "Matter twin, demand readiness scoring, settlement band forecasting, deadline compliance, insurer behavior profiling — with a proof chain for everything that moves.",
    icon: Scale,
    color: "hsl(38,72%,58%)",
    colorMuted: "hsla(38,72%,58%,0.08)",
    colorBorder: "hsla(38,72%,58%,0.22)",
    href: "/prism-counsel-public",
    cta: "See PRISM Counsel",
  },
  {
    id: "aegis",
    title: "Aegis Security Command",
    subtitle: "Unified defense and intelligence",
    description: "SOC operations, SOAR automation, threat intelligence, incident response, and vulnerability management in a single surface. Real-time alert correlation and playbook execution.",
    icon: ShieldCheck,
    color: "hsl(222,60%,62%)",
    colorMuted: "hsla(222,60%,62%,0.08)",
    colorBorder: "hsla(222,60%,62%,0.22)",
    href: "/firestorm/",
    cta: "Open Aegis",
  },
  {
    id: "vessels",
    title: "Vessels Maritime Intelligence",
    subtitle: "Fleet visibility built for command",
    description: "AIS tracking, route risk scoring, dark vessel detection, sanctions compliance, and predictive maintenance. Every vessel, every route, every risk — visible.",
    icon: Ship,
    color: "hsl(206,72%,52%)",
    colorMuted: "hsla(206,72%,52%,0.08)",
    colorBorder: "hsla(206,72%,52%,0.20)",
    href: "/vessels/",
    cta: "Open Vessels",
  },
  {
    id: "terra",
    title: "Terra Real Estate Intelligence",
    subtitle: "The operating surface for serious real estate",
    description: "Property twin, distress detection, ownership analysis, MLS integration, deal pipeline management, and diligence workflows with LP-ready export.",
    icon: Building2,
    color: "hsl(140,50%,48%)",
    colorMuted: "hsla(140,50%,48%,0.08)",
    colorBorder: "hsla(140,50%,48%,0.20)",
    href: "/terra/",
    cta: "Open Terra",
  },
  {
    id: "alloy",
    title: "Alloy Execution Fabric",
    subtitle: "Governed action routing",
    description: "Workflow orchestration, connector mesh, human-in-the-loop gates, decision lineage, and enterprise governance. The execution layer that makes every other pack actionable.",
    icon: Layers,
    color: "hsl(258,55%,68%)",
    colorMuted: "hsla(258,55%,68%,0.08)",
    colorBorder: "hsla(258,55%,68%,0.20)",
    href: "/alloy",
    cta: "Open Alloy",
  },
];

const PLATFORM_STATS = [
  { label: "Domain packs", value: "5" },
  { label: "Live applications", value: "6" },
  { label: "Signal categories", value: "40+" },
  { label: "Data connectors", value: "40+" },
];

export default function DemosPage() {
  usePageMeta({
    title: "Live Demos — SZL Holdings",
    description: "Explore live demos of every SZL platform product. Lyte, PRISM Counsel, Aegis, Vessels, Terra, and Alloy — running applications, not mockups.",
    canonical: "https://szlholdings.com/demos",
  });

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />
      <main id="main-content" role="main">

        <section
          className="szl-grid-texture szl-depth-glow-gold"
          style={{
            paddingTop: "var(--space-hero-pt)",
            paddingBottom: "clamp(4rem,8vw,6rem)",
            borderBottom: "1px solid var(--color-szl-border)",
          }}
        >
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 0.875rem", borderRadius: "99px", border: "1px solid hsla(38,72%,58%,0.22)", background: "hsla(38,72%,58%,0.08)", marginBottom: "1.75rem" }}>
                <Monitor size={13} color="hsl(38,72%,58%)" />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "hsl(38,72%,58%)" }}>Live Demos</span>
              </div>
            </m.div>
            <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.05 }}>
              <h1 style={{ fontSize: "clamp(2.25rem,5vw,3.75rem)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.06, maxWidth: "22ch", marginBottom: "1.5rem" }}>
                See every product. Live.
              </h1>
              <p style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", lineHeight: 1.72, color: "hsl(214,7%,64%)", maxWidth: "55ch", marginBottom: "2rem" }}>
                Each product below is a live, running application. Explore the interfaces, examine the data models,
                and understand how signal-to-action works across every domain.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                <Link href="/contact" className="szl-btn-primary">
                  Schedule a guided walkthrough <ArrowRight size={14} />
                </Link>
                <Link href="/platform" className="szl-btn-secondary">
                  See the platform →
                </Link>
              </div>
            </m.div>
          </div>
        </section>

        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "1.75rem 0", background: "hsla(214,12%,6%,0.60)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
              {PLATFORM_STATS.map((stat, i) => (
                <m.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + i * 0.06 }}
                  style={{ textAlign: "center" }}
                >
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "1.375rem", fontWeight: 700, color: "hsl(38,72%,58%)", letterSpacing: "-0.02em" }}>{stat.value}</p>
                  <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginTop: "0.25rem" }}>{stat.label}</p>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "1rem" }}>
                Six live applications
              </p>
            </m.div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "1.5rem" }}>
              {DEMOS.map((demo, i) => {
                const Icon = demo.icon;
                return (
                  <m.div
                    key={demo.id}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06, duration: 0.4 }}
                    className="szl-card"
                    style={{
                      borderRadius: "0.875rem",
                      padding: "1.75rem",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      borderLeft: `3px solid ${demo.color}`,
                      transition: "border-color 0.2s ease",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.5rem" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", background: demo.colorMuted, border: `1px solid ${demo.colorBorder}` }}>
                          <Icon size={15} style={{ color: demo.color }} />
                        </div>
                        <span style={{ fontSize: "1rem", fontWeight: 600, color: "hsl(38,8%,94%)" }}>{demo.title}</span>
                      </div>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.06em", color: demo.color, marginBottom: "0.75rem" }}>{demo.subtitle}</p>
                      <p style={{ fontSize: "0.8125rem", color: "hsl(214,7%,58%)", lineHeight: 1.65, marginBottom: "1.25rem" }}>{demo.description}</p>
                    </div>
                    <a
                      href={demo.href}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        padding: "0.5rem 1rem",
                        background: demo.colorMuted,
                        border: `1px solid ${demo.colorBorder}`,
                        borderRadius: "0.5rem",
                        color: demo.color,
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        textDecoration: "none",
                        cursor: "pointer",
                        width: "fit-content",
                        transition: "background 0.2s",
                      }}
                    >
                      <Play size={13} /> {demo.cta}
                    </a>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        <section style={{ padding: "var(--space-section-sm) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="szl-card"
              style={{ borderRadius: "0.875rem", padding: "clamp(1.5rem,3vw,2.5rem)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "2rem", flexWrap: "wrap" }}
            >
              <div style={{ flex: 1, minWidth: "200px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.75rem" }}>
                  <Eye size={18} style={{ color: "hsl(38,72%,58%)" }} />
                  <span style={{ fontSize: "1rem", fontWeight: 600, color: "hsl(38,8%,92%)" }}>Want a guided walkthrough?</span>
                </div>
                <p style={{ fontSize: "0.875rem", color: "hsl(214,7%,58%)", lineHeight: 1.6 }}>
                  Schedule a live session with our team. We'll walk through any domain pack, show the signal-to-action pipeline,
                  and demonstrate how Alloy governs every step.
                </p>
              </div>
              <Link href="/contact" className="szl-btn-primary" style={{ textDecoration: "none", flexShrink: 0 }}>
                Schedule a walkthrough <ArrowRight size={14} />
              </Link>
            </m.div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
