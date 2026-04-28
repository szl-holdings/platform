import { m } from "framer-motion";
import { Link } from "wouter";
import { Play, ShieldCheck, Ship, Building2, BarChart3, Scale, ArrowRight, Eye, Layers, Monitor, Smartphone } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const DEMOS = [
  {
    id: "lyte",
    title: "Lyte Decision Intelligence",
    subtitle: "See what's invisible before it costs you",
    description: "Revenue stall detection, approval aging, ownership drift, KPI monitoring — all surfaced in a single command layer with governed action routing.",
    icon: BarChart3,
    color: "hsl(191,92%,44%)",
    colorMuted: "hsla(191,92%,44%,0.08)",
    colorBorder: "hsla(191,92%,44%,0.20)",
    href: "/command/operations/",
    cta: "Open Lyte",
  },
  {
    id: "aegis",
    title: "Aegis Security Command",
    subtitle: "Unified defense and intelligence",
    description: "SOC operations, SOAR automation, threat intelligence, incident response, and vulnerability management in a single surface. Real-time alert correlation and playbook execution.",
    icon: ShieldCheck,
    color: "hsl(0,72%,56%)",
    colorMuted: "hsla(0,72%,56%,0.08)",
    colorBorder: "hsla(0,72%,56%,0.22)",
    href: "/aegis/",
    cta: "Open Aegis",
  },
  {
    id: "vessels",
    title: "Vessels Maritime Intelligence",
    subtitle: "Fleet visibility built for command",
    description: "AIS tracking, route risk scoring, dark vessel detection, sanctions compliance, and predictive maintenance. Every vessel, every route, every risk — visible.",
    icon: Ship,
    color: "hsl(200,80%,52%)",
    colorMuted: "hsla(200,80%,52%,0.08)",
    colorBorder: "hsla(200,80%,52%,0.20)",
    href: "/vessels/",
    cta: "Open Vessels",
  },
  {
    id: "terra",
    title: "Terra Real Estate Intelligence",
    subtitle: "The operating surface for serious real estate",
    description: "Property twin, distress detection, ownership analysis, MLS integration, deal pipeline management, and diligence workflows with LP-ready export.",
    icon: Building2,
    color: "hsl(140,50%,46%)",
    colorMuted: "hsla(140,50%,46%,0.08)",
    colorBorder: "hsla(140,50%,46%,0.20)",
    href: "/terra/",
    cta: "Open Terra",
  },
  {
    id: "prism-counsel",
    title: "Counsel",
    subtitle: "Legal matter intelligence",
    description: "Matter twin, demand readiness scoring, settlement band forecasting, deadline compliance, insurer behavior profiling — with a proof chain for everything that moves.",
    icon: Scale,
    color: "hsl(38,72%,58%)",
    colorMuted: "hsla(38,72%,58%,0.08)",
    colorBorder: "hsla(38,72%,58%,0.22)",
    href: "/counsel-public",
    cta: "See Counsel",
  },
  {
    id: "mobile",
    title: "SZL Mobile Command",
    subtitle: "The portfolio in your pocket — no install",
    description: "Tour the SZL Holdings Mobile Command app directly in your browser. Dashboard, portfolio health, and the Lyte command inbox — rendered as faithful in-browser phone previews. No Expo Go required.",
    icon: Smartphone,
    color: "hsl(38,72%,58%)",
    colorMuted: "hsla(38,72%,58%,0.08)",
    colorBorder: "hsla(38,72%,58%,0.22)",
    href: "/demos/mobile",
    cta: "Open Mobile preview",
  },
  {
    id: "continuum",
    title: "Counsel Execution Fabric",
    subtitle: "Governed action routing",
    description: "Workflow orchestration, connector mesh, human-in-the-loop gates, decision lineage, and enterprise governance. The execution layer that makes every other pack actionable.",
    icon: Layers,
    color: "hsl(258,55%,68%)",
    colorMuted: "hsla(258,55%,68%,0.08)",
    colorBorder: "hsla(258,55%,68%,0.20)",
    href: "/continuum",
    cta: "Open Counsel",
  },
];

export default function DemosPage() {
  const __pageMeta = usePageMeta({ title: "Live Demos — SZL Holdings", description: "Explore live demos of every SZL platform product. Lyte, Aegis, Vessels, Terra, Counsel, and Counsel." });

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "#080c14", color: "hsl(38,8%,88%)" }}>
        <SiteNav />
  
        <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "6rem 1.5rem 4rem" }}>
          <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <Monitor size={28} style={{ color: "hsl(38,72%,58%)" }} />
              <span style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "hsl(38,72%,58%)" }}>Live Demos</span>
            </div>
            <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, lineHeight: 1.15, marginBottom: "1rem", color: "hsl(38,8%,94%)" }}>
              See every product. Live.
            </h1>
            <p style={{ fontSize: "1.125rem", color: "hsl(214,7%,55%)", maxWidth: "640px", lineHeight: 1.6 }}>
              Each product below is a live, running application. Explore the interfaces, examine the data models, 
              and understand how signal-to-action works across every domain.
            </p>
          </m.div>
  
          <section style={{ marginTop: "3.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "1.5rem" }}>
              {DEMOS.map((demo, i) => (
                <m.div
                  key={demo.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  style={{
                    background: demo.colorMuted,
                    border: `1px solid ${demo.colorBorder}`,
                    borderRadius: "14px",
                    padding: "1.75rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.5rem" }}>
                      <demo.icon size={22} style={{ color: demo.color }} />
                      <span style={{ fontSize: "1rem", fontWeight: 600, color: "hsl(38,8%,94%)" }}>{demo.title}</span>
                    </div>
                    <div style={{ fontSize: "0.8125rem", fontWeight: 500, color: demo.color, marginBottom: "0.75rem" }}>{demo.subtitle}</div>
                    <p style={{ fontSize: "0.8125rem", color: "hsl(214,7%,55%)", lineHeight: 1.6, marginBottom: "1.25rem" }}>{demo.description}</p>
                  </div>
                  <a
                    href={demo.href}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      padding: "0.5rem 1rem",
                      background: `${demo.color}18`,
                      border: `1px solid ${demo.color}40`,
                      borderRadius: "8px",
                      color: demo.color,
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      textDecoration: "none",
                      cursor: "pointer",
                      width: "fit-content",
                      transition: "background 0.2s",
                    }}
                  >
                    <Play size={14} /> {demo.cta}
                  </a>
                </m.div>
              ))}
            </div>
          </section>
  
          <section style={{ marginTop: "4rem", padding: "2rem", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.75rem" }}>
              <Eye size={20} style={{ color: "hsl(38,72%,58%)" }} />
              <span style={{ fontSize: "1rem", fontWeight: 600, color: "hsl(38,8%,92%)" }}>Want a guided walkthrough?</span>
            </div>
            <p style={{ fontSize: "0.875rem", color: "hsl(214,7%,55%)", lineHeight: 1.6, marginBottom: "1rem" }}>
              Schedule a live session with our team. We'll walk through any domain pack, show the signal-to-action pipeline,
              and demonstrate how Counsel governs every step.
            </p>
            <Link href="/contact">
              <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "hsl(38,72%,58%)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                Schedule a walkthrough <ArrowRight size={14} />
              </span>
            </Link>
          </section>
        </main>
  
        <SiteFooter />
      </div>
        </>
  );
}
