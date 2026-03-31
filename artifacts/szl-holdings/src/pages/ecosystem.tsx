import { m } from "framer-motion";
import { ArrowRight, ArrowUpRight, Layers, Zap, Activity, Ship, Shield, Brain, Building, Globe, Users, Sparkles } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

interface Platform {
  name: string;
  role: string;
  description: string;
  accent: string;
  href: string;
  icon: typeof Layers;
  serves: string;
  capabilities: string[];
}

const FLAGSHIP: Platform[] = [
  {
    name: "Alloy",
    role: "Intelligence & Orchestration Engine",
    description: "The systems backbone. Workflow orchestration, signal processing, multi-agent execution, and Creative Workflows. Every platform in the ecosystem runs through Alloy.",
    accent: "hsl(222,68%,58%)",
    href: "/alloy/",
    icon: Zap,
    serves: "Platform operators, engineering teams",
    capabilities: ["Workflow orchestration", "Signal ingestion", "Multi-agent execution", "Creative Workflows"],
  },
  {
    name: "Lyte",
    role: "Business Observability Platform",
    description: "Role-based visibility into risk, latency, ownership gaps, and workflow friction. Executive, operations, and delivery views — before problems hit execution.",
    accent: "hsl(192,80%,48%)",
    href: "/lyte-command-center/",
    icon: Activity,
    serves: "Executives, operations leads, delivery managers",
    capabilities: ["KPI command", "Risk observability", "Workflow telemetry", "Role-based views"],
  },
  {
    name: "Vessels",
    role: "Maritime Command Platform",
    description: "Fleet visibility, voyage performance, and operational exception management. Connects vessel movement to operational consequence and commercial outcome.",
    accent: "hsl(210,78%,44%)",
    href: "/vessels/",
    icon: Ship,
    serves: "Fleet operators, maritime logistics, charterers",
    capabilities: ["Fleet tracking", "Voyage analytics", "Port intelligence", "Commercial operations"],
  },
];

const OPERATIONS: Platform[] = [
  {
    name: "Aegis",
    role: "Unified Defense & Intelligence Command",
    description: "Consolidated security, managed operations, and AI intelligence in one platform. SOC command, XDR, adversary emulation, MSP operations, client management, AI research, model registry, and agentic cortex — for operators who need everything in one place.",
    accent: "hsl(232,68%,60%)",
    href: "/firestorm/",
    icon: Shield,
    serves: "Security teams, SOC analysts, MSP operators, AI researchers, CISOs",
    capabilities: ["SOC & XDR command", "Managed operations", "AI intelligence engine", "Agentic cortex"],
  },
  {
    name: "Terra",
    role: "Portfolio Intelligence",
    description: "Full-stack real estate command: distress engine, deal pipeline, market intelligence, CRM, and brokerage-level visibility across NYC's five boroughs.",
    accent: "hsl(140,56%,40%)",
    href: "/terra/",
    icon: Building,
    serves: "Brokers, investors, real estate operators",
    capabilities: ["Distress engine", "Deal pipeline", "Market intelligence", "Ownership analysis"],
  },
];

const SERVICES: Platform[] = [
  {
    name: "Carlota Jo Consulting",
    role: "Premium Advisory",
    description: "Estate management and residential operations for high-net-worth families. Discreet, white-glove service through one trusted operator.",
    accent: "hsl(36,52%,54%)",
    href: "/carlota-jo/",
    icon: Globe,
    serves: "High-net-worth families, estate principals",
    capabilities: ["Residence operations", "Household systems", "Vendor management", "Special projects"],
  },
  {
    name: "Stephen Lutar",
    role: "Founder & Operator",
    description: "Builder, operator, and systems thinker. The founder who designed and operates the SZL ecosystem.",
    accent: "hsl(210,8%,56%)",
    href: "/stephen-site/",
    icon: Users,
    serves: "Investors, partners, collaborators",
    capabilities: ["Portfolio", "Thesis", "Writing", "Contact"],
  },
];

const INTERNAL = [
  { name: "Control Plane", role: "Platform Operations", description: "Service registry, health monitoring, connector management, feature governance, and audit controls.", accent: "hsl(210,8%,56%)", href: "/control-plane" },
  { name: "Portfolio Readiness", role: "Maturity Assessment", description: "App-by-app readiness scoring, deployment status, ownership, confidence, and risk tracking.", accent: "hsl(218,72%,52%)", href: "/portfolio-ops" },
  { name: "Trust Center", role: "Security & Architecture", description: "Platform architecture, access control, auditability, data governance, and AI accountability documentation.", accent: "hsl(152,50%,42%)", href: "/trust" },
];

function PlatformCard({ p, i }: { p: Platform; i: number }) {
  const Icon = p.icon;
  return (
    <m.a
      href={p.href}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.48, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: "block",
        padding: "1.5rem",
        borderRadius: "0.875rem",
        background: "hsla(0,0%,100%,0.025)",
        border: "1px solid hsla(0,0%,100%,0.06)",
        textDecoration: "none",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.04)";
        (e.currentTarget as HTMLElement).style.borderColor = `${p.accent}30`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.025)";
        (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.06)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.875rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", background: `${p.accent}12`, border: `1px solid ${p.accent}20` }}>
            <Icon size={15} style={{ color: p.accent }} />
          </div>
          <div>
            <p style={{ fontSize: "15px", fontWeight: 700, color: "hsl(38,12%,92%)", letterSpacing: "-0.008em" }}>{p.name}</p>
            <p style={{ fontSize: "11px", fontWeight: 500, color: p.accent, letterSpacing: "0.01em" }}>{p.role}</p>
          </div>
        </div>
        <ArrowUpRight size={14} style={{ color: "hsl(210,5%,32%)" }} />
      </div>
      <p style={{ fontSize: "12.5px", lineHeight: 1.6, color: "hsl(210,5%,54%)", marginBottom: "1rem" }}>{p.description}</p>
      <div style={{ marginBottom: "0.75rem" }}>
        <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "hsl(210,5%,38%)", marginBottom: "0.375rem" }}>Serves</p>
        <p style={{ fontSize: "11.5px", color: "hsl(210,5%,48%)" }}>{p.serves}</p>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
        {p.capabilities.map(c => (
          <span key={c} style={{
            fontSize: "10px", fontWeight: 500, padding: "2px 8px", borderRadius: "4px",
            background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.06)", color: "hsl(210,5%,54%)",
          }}>{c}</span>
        ))}
      </div>
    </m.a>
  );
}

function SectionHeader({ label, title, description }: { label: string; title: string; description: string }) {
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(210,5%,38%)", marginBottom: "0.5rem" }}>{label}</p>
      <h2 style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.625rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "hsl(38,12%,92%)", marginBottom: "0.375rem", fontFamily: "var(--font-display)" }}>{title}</h2>
      <p style={{ fontSize: "13px", lineHeight: 1.6, color: "hsl(210,5%,50%)", maxWidth: "36rem" }}>{description}</p>
    </div>
  );
}

export default function EcosystemPage() {
  usePageMeta({
    title: "Ecosystem — SZL Holdings",
    description: "The SZL Holdings ecosystem: one parent company, one intelligence backbone, and purpose-built platforms across observability, maritime command, cybersecurity, AI research, and premium services.",
    canonical: "https://szlholdings.com/ecosystem",
  });

  return (
    <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
      <SiteNav />
      <main className="pt-24">
        <section style={{ padding: "4rem 0 3rem" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
              <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "0.75rem" }}>
                Product Registry
              </p>
              <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, letterSpacing: "-0.025em", color: "hsl(38,12%,94%)", lineHeight: 1.08, marginBottom: "1rem", fontFamily: "var(--font-display)" }}>
                One holding company.<br />One architecture. Six platforms.
              </h1>
              <p style={{ fontSize: "1rem", lineHeight: 1.7, color: "hsl(210,5%,58%)", maxWidth: "40rem" }}>
                Every entity in the SZL ecosystem has a defined role, a defined audience, and a defined relationship to the whole. Nothing competes. Everything compounds.
              </p>
            </m.div>

            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              style={{ marginTop: "2rem", display: "flex", gap: "0.25rem", flexWrap: "wrap" }}
            >
              {[
                { label: "SZL Holdings", desc: "Parent Brand", accent: "hsl(38,55%,60%)" },
                { label: "Alloy", desc: "Engine", accent: "hsl(222,68%,58%)" },
                { label: "3 Flagships", desc: "Alloy · Lyte · Vessels", accent: "hsl(218,72%,52%)" },
                { label: "5 Platforms", desc: "Domain-specific", accent: "hsl(210,5%,54%)" },
                { label: "2 Brands", desc: "Carlota Jo · Stephen Lutar", accent: "hsl(36,52%,54%)" },
              ].map((item, i) => (
                <div key={item.label} style={{
                  padding: "0.625rem 1rem",
                  background: "hsla(0,0%,100%,0.025)",
                  border: "1px solid hsla(0,0%,100%,0.06)",
                  borderRadius: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}>
                  <div style={{ width: "4px", height: "20px", borderRadius: "2px", background: item.accent, opacity: 0.7 }} />
                  <div>
                    <p style={{ fontSize: "11.5px", fontWeight: 600, color: "hsl(38,12%,88%)" }}>{item.label}</p>
                    <p style={{ fontSize: "10px", color: "hsl(210,5%,42%)" }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </m.div>
          </div>
        </section>

        <section style={{ padding: "2rem 0 3rem" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <SectionHeader
              label="Tier 1 — Flagship Platforms"
              title="Core infrastructure and primary command surfaces"
              description="The three platforms that define the SZL operational model. Alloy is the engine; Lyte and Vessels are the first command surfaces built on top of it."
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {FLAGSHIP.map((p, i) => <PlatformCard key={p.name} p={p} i={i} />)}
            </div>
          </div>
        </section>

        <section style={{ padding: "2rem 0 3rem" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <SectionHeader
              label="Tier 2 — Operations Platforms"
              title="Domain-specific command surfaces"
              description="Specialized platforms built on the Alloy backbone, each serving a distinct operational domain with its own data model, workflows, and audience."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {OPERATIONS.map((p, i) => <PlatformCard key={p.name} p={p} i={i} />)}
            </div>
          </div>
        </section>

        <section style={{ padding: "2rem 0 3rem" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <SectionHeader
              label="Service & Identity Brands"
              title="Advisory services and founder identity"
              description="Independent brands that operate alongside the platform ecosystem, each with its own audience and positioning."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SERVICES.map((p, i) => <PlatformCard key={p.name} p={p} i={i} />)}
            </div>
          </div>
        </section>

        <section style={{ padding: "2rem 0 4rem" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <SectionHeader
              label="Internal Surfaces"
              title="Operational infrastructure"
              description="Internal tools for platform governance, readiness assessment, and trust documentation. Not public-facing products."
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {INTERNAL.map((item, i) => (
                <m.a
                  key={item.name}
                  href={item.href}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    display: "block",
                    padding: "1.25rem",
                    borderRadius: "0.75rem",
                    background: "hsla(0,0%,100%,0.015)",
                    border: "1px solid hsla(0,0%,100%,0.04)",
                    textDecoration: "none",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.03)";
                    (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.015)";
                    (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.04)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <div style={{ width: "3px", height: "16px", borderRadius: "2px", background: item.accent, opacity: 0.5 }} />
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "hsl(38,12%,78%)" }}>{item.name}</p>
                  </div>
                  <p style={{ fontSize: "10.5px", fontWeight: 500, color: "hsl(210,5%,42%)", marginBottom: "0.375rem", letterSpacing: "0.02em" }}>{item.role}</p>
                  <p style={{ fontSize: "12px", lineHeight: 1.55, color: "hsl(210,5%,48%)" }}>{item.description}</p>
                </m.a>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
