import { m } from "framer-motion";
import { Link } from "wouter";
import { BookOpen, GraduationCap, Play, FileText, Layers, ShieldCheck, Ship, Building2, BarChart3, Scale, ArrowRight, Clock, Users } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const LEARNING_PATHS = [
  {
    id: "platform-foundations",
    title: "Platform Foundations",
    description: "Understand the SZL architecture: signal ingestion, domain packs, Alloy execution fabric, and proof chain.",
    icon: Layers,
    duration: "45 min",
    modules: 6,
    level: "Beginner",
    color: "hsl(38,72%,58%)",
    colorMuted: "hsla(38,72%,58%,0.08)",
    colorBorder: "hsla(38,72%,58%,0.22)",
  },
  {
    id: "lyte-observability",
    title: "Lyte Business Observability",
    description: "Revenue stall detection, approval aging, ownership drift, KPI monitoring, and executive reporting.",
    icon: BarChart3,
    duration: "40 min",
    modules: 5,
    level: "Beginner",
    color: "hsl(191,92%,44%)",
    colorMuted: "hsla(191,92%,44%,0.08)",
    colorBorder: "hsla(191,92%,44%,0.20)",
  },
  {
    id: "prism-counsel",
    title: "PRISM Counsel — Legal Operations",
    description: "Matter signal detection, deadline compliance, demand packet generation, approval chain governance, and legal export safety.",
    icon: Scale,
    duration: "55 min",
    modules: 7,
    level: "Intermediate",
    color: "hsl(38,72%,58%)",
    colorMuted: "hsla(38,72%,58%,0.08)",
    colorBorder: "hsla(38,72%,58%,0.22)",
  },
  {
    id: "aegis-primer",
    title: "Aegis Security Operations",
    description: "SOC workflows, SOAR automation, threat intelligence feeds, and incident response playbooks.",
    icon: ShieldCheck,
    duration: "60 min",
    modules: 8,
    level: "Intermediate",
    color: "hsl(222,60%,62%)",
    colorMuted: "hsla(222,60%,62%,0.08)",
    colorBorder: "hsla(222,60%,62%,0.22)",
  },
  {
    id: "vessels-maritime",
    title: "Vessels Maritime Intelligence",
    description: "Fleet tracking, AIS anomaly detection, route risk scoring, dark vessel identification, and sanctions compliance.",
    icon: Ship,
    duration: "50 min",
    modules: 7,
    level: "Intermediate",
    color: "hsl(206,72%,52%)",
    colorMuted: "hsla(206,72%,52%,0.08)",
    colorBorder: "hsla(206,72%,52%,0.20)",
  },
  {
    id: "terra-real-estate",
    title: "Terra Real Estate Intelligence",
    description: "Property twin model, distress detection, ownership analysis, deal pipeline management, and diligence workflows.",
    icon: Building2,
    duration: "55 min",
    modules: 7,
    level: "Intermediate",
    color: "hsl(140,50%,48%)",
    colorMuted: "hsla(140,50%,48%,0.08)",
    colorBorder: "hsla(140,50%,48%,0.20)",
  },
  {
    id: "alloy-execution",
    title: "Alloy Execution Fabric",
    description: "Workflow orchestration, connector mesh, governance audit, human-in-the-loop gates, and decision lineage.",
    icon: Play,
    duration: "50 min",
    modules: 6,
    level: "Advanced",
    color: "hsl(258,55%,68%)",
    colorMuted: "hsla(258,55%,68%,0.08)",
    colorBorder: "hsla(258,55%,68%,0.20)",
  },
];

const QUICK_STARTS = [
  { title: "Your First Signal-to-Action Flow", time: "10 min", href: "/docs" },
  { title: "Setting Up Domain Packs", time: "15 min", href: "/docs/architecture" },
  { title: "Understanding Proof Chain", time: "8 min", href: "/docs/proof-chain" },
  { title: "Connecting External Data Sources", time: "12 min", href: "/platform" },
  { title: "PRISM Counsel Matter Workflow", time: "20 min", href: "/solutions/prism-counsel" },
  { title: "Alloy Governance & Approvals", time: "15 min", href: "/docs/control-plane" },
];

export default function AcademyPage() {
  usePageMeta({
    title: "Academy — SZL Holdings",
    description: "Learn the SZL platform end-to-end. Structured learning paths for Lyte, Alloy, PRISM Counsel, Aegis, Vessels, and Terra — plus quick starts and domain-specific primers.",
    canonical: "https://szlholdings.com/academy",
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
                <GraduationCap size={13} color="var(--color-szl-text-muted)" />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-szl-text-secondary)" }}>Academy</span>
              </div>
            </m.div>
            <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.05 }}>
              <h1 style={{ fontSize: "clamp(2.25rem,5vw,3.75rem)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.06, maxWidth: "22ch", marginBottom: "1.5rem" }}>
                Learn the platform. Master the system.
              </h1>
              <p style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", lineHeight: 1.72, color: "hsl(214,7%,64%)", maxWidth: "52ch" }}>
                Structured learning paths from platform fundamentals through domain-specific operations.
                Each path is self-paced, with practical exercises and real-world scenarios.
              </p>
            </m.div>
          </div>
        </section>

        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "1rem" }}>
                Learning paths
              </p>
              <h2 style={{ fontSize: "clamp(1.375rem,3vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.020em", lineHeight: 1.2, marginBottom: "2.5rem" }}>
                End-to-end curriculum for every domain
              </h2>
            </m.div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.25rem" }}>
              {LEARNING_PATHS.map((path, i) => {
                const Icon = path.icon;
                return (
                  <m.div
                    key={path.id}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                    className="szl-card"
                    style={{
                      borderRadius: "0.875rem",
                      padding: "1.5rem",
                      borderLeft: `3px solid ${path.color}`,
                      cursor: "pointer",
                      transition: "border-color 0.2s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.75rem" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", background: path.colorMuted, border: `1px solid ${path.colorBorder}` }}>
                        <Icon size={15} style={{ color: path.color }} />
                      </div>
                      <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "hsl(38,8%,92%)" }}>{path.title}</span>
                    </div>
                    <p style={{ fontSize: "0.8125rem", color: "hsl(214,7%,58%)", lineHeight: 1.6, marginBottom: "1rem" }}>{path.description}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.6875rem", fontFamily: "var(--font-mono)", color: "var(--color-szl-text-faint)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><Clock size={11} /> {path.duration}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><BookOpen size={11} /> {path.modules} modules</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><Users size={11} /> {path.level}</span>
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
                Quick starts
              </p>
              <h2 style={{ fontSize: "clamp(1.375rem,3vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.020em", lineHeight: 1.2, marginBottom: "2rem" }}>
                Get started in minutes
              </h2>
            </m.div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
              {QUICK_STARTS.map((qs, i) => (
                <m.div
                  key={qs.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                >
                  <Link href={qs.href} style={{ textDecoration: "none", color: "inherit" }}>
                    <div
                      className="szl-card"
                      style={{
                        borderRadius: "0.75rem",
                        padding: "1.125rem 1.375rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        transition: "border-color 0.2s ease",
                      }}
                    >
                      <div>
                        <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "hsl(38,8%,88%)" }}>{qs.title}</p>
                        <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", color: "var(--color-szl-text-faint)", marginTop: "0.25rem" }}>{qs.time}</p>
                      </div>
                      <ArrowRight size={14} style={{ color: "hsl(214,7%,40%)" }} />
                    </div>
                  </Link>
                </m.div>
              ))}
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
              style={{ borderRadius: "0.875rem", padding: "clamp(1.5rem,3vw,2rem)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "2rem", flexWrap: "wrap" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: "200px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "0.625rem", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(38,72%,58%,0.10)", border: "1px solid hsla(38,72%,58%,0.18)" }}>
                  <FileText size={18} color="hsl(38,72%,58%)" />
                </div>
                <div>
                  <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "hsl(38,8%,92%)" }}>Full Documentation</p>
                  <p style={{ fontSize: "0.8125rem", color: "hsl(214,7%,55%)", lineHeight: 1.55 }}>
                    API reference, architecture diagrams, integration guides, and operational runbooks.
                  </p>
                </div>
              </div>
              <Link href="/docs" className="szl-btn-primary" style={{ textDecoration: "none", flexShrink: 0 }}>
                Open Docs Hub <ArrowRight size={14} />
              </Link>
            </m.div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
