import { m } from "framer-motion";
import { ArrowRight, ArrowUpRight, Activity, Globe, Shield, Building2, Briefcase } from "lucide-react";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const VENTURES = [
  {
    name: "KORA",
    tagline: "Decision Intelligence Platform",
    category: "Enterprise Software",
    stage: "Growth",
    description: "The operational intelligence layer that surfaces critical business signals, routes action, and verifies follow-through across the workflows that break between systems. Comparable category to Datadog — applied to operational risk rather than infrastructure.",
    metrics: [
      { label: "Signal Coverage", value: "218 normalized" },
      { label: "Active Agents", value: "6 autonomous" },
      { label: "Avg Response", value: "<30 min" },
    ],
    color: "hsl(190,90%,55%)",
    rgb: "38,190,218",
    Icon: Activity,
    path: "/lyte",
  },
  {
    name: "FORGE",
    tagline: "AI Orchestration Engine",
    category: "AI Infrastructure",
    stage: "Growth",
    description: "The execution layer beneath Lyte. FORGE routes decisions to the right actor, confirms completion, and maintains an auditable record of every workflow outcome. LangSmith-tier traceability with enterprise-tier operational depth.",
    metrics: [
      { label: "Workflow Templates", value: "12 live" },
      { label: "Completion Rate", value: ">94%" },
      { label: "Audit Trail", value: "Full lineage" },
    ],
    color: "hsl(214,80%,65%)",
    rgb: "72,142,218",
    Icon: Briefcase,
    path: "/platform",
  },
  {
    name: "SEXTANT",
    tagline: "Maritime Intelligence Command",
    category: "Maritime Technology",
    stage: "Growth",
    description: "Fleet intelligence, voyage performance, commodity flow analysis, and autonomous risk monitoring across global shipping lanes. MarineTraffic-tier vessel tracking combined with Kpler-tier commodity intelligence.",
    metrics: [
      { label: "SEXTANT Tracked", value: "2,400+" },
      { label: "Chokepoints", value: "8 monitored" },
      { label: "Risk Checks", value: "Autonomous" },
    ],
    color: "hsl(205,85%,55%)",
    rgb: "38,164,218",
    Icon: Globe,
    path: "/vessels",
  },
  {
    name: "PARAGON",
    tagline: "SOC Command & Defense Intelligence",
    category: "Cybersecurity",
    stage: "Growth",
    description: "Unified security operations — threat detection, kill chain analysis, MITRE ATT&CK correlation, autonomous threat hunting, and compliance readiness. CrowdStrike-tier adversary intelligence with managed SOC depth.",
    metrics: [
      { label: "Threat Feeds", value: "Live + AI" },
      { label: "Kill Chain", value: "Full visualization" },
      { label: "MITRE Coverage", value: "12 tactics" },
    ],
    color: "hsl(232,68%,60%)",
    rgb: "99,102,241",
    Icon: Shield,
    path: "/aegis/",
  },
  {
    name: "DOMAINE",
    tagline: "Real Estate Intelligence",
    category: "PropTech",
    stage: "Growth",
    description: "Institutional-grade CRE and distress intelligence — deal sourcing, market heat maps, net absorption analytics, cap rate tracking, and ACRIS-linked ownership data. CoStar-tier data depth with Reonomy-tier predictive analysis.",
    metrics: [
      { label: "NYC Records", value: "500+ daily" },
      { label: "Data Sources", value: "8 integrated" },
      { label: "Distress Signals", value: "Automated" },
    ],
    color: "hsl(88,42%,44%)",
    rgb: "85,140,48",
    Icon: Building2,
    path: "/terra",
  },
  {
    name: "Carlota Jo",
    tagline: "Private Advisory & Estate Management",
    category: "Private Advisory",
    stage: "Established",
    description: "High-trust, high-discretion operational support for principals with complex lives. Residence management, vendor coordination, household operations, and lifestyle administration. Quintessentially-tier service with operational precision.",
    metrics: [
      { label: "Client Retention", value: ">95%" },
      { label: "Response SLA", value: "Same day" },
      { label: "Discretion", value: "NDA standard" },
    ],
    color: "hsl(38,55%,58%)",
    rgb: "191,152,82",
    Icon: Briefcase,
    path: "/carlota-jo",
  },
];

const ARCHITECTURE_DIFFERENTIATORS = [
  {
    title: "One data backbone",
    body: "All ventures share a unified API server, knowledge store, and agent infrastructure. Data from SEXTANT can inform KORA signals. DOMAINE distress can trigger PARAGON watchlist checks. The compounds.",
  },
  {
    title: "Autonomous agents, not dashboards",
    body: "Every platform has scheduled autonomous agents that run without human initiation — producing findings, raising alerts, and routing actions. The system works while no one is watching.",
  },
  {
    title: "Auditable by design",
    body: "Every agent run, every signal correlation, every workflow action maintains a complete lineage record. When accountability is required, the evidence exists.",
  },
  {
    title: "Category-defining, not category-average",
    body: "Each venture is benchmarked against the market leader in its vertical. SEXTANT vs MarineTraffic. PARAGON vs CrowdStrike. DOMAINE vs CoStar. The standard is clear.",
  },
];

export default function VenturePortfolioPage() {
  const __pageMeta = usePageMeta({
    title: "Venture Portfolio — SZL Holdings",
    description: "Six operating companies across cybersecurity, maritime intelligence, AI orchestration, real estate, and private advisory — built on one compounding architecture.",
    canonical: "https://szlholdings.com/venture-portfolio",
  });

  return (
    <>
      {__pageMeta}
      <div className="min-h-screen" style={{ background: "hsl(210,12%,5%)" }}>
        <SiteNav />
        <main id="main-content" >
          <section style={{ padding: "clamp(6rem,10vw,8rem) 0 clamp(4rem,7vw,6rem)", borderBottom: "1px solid hsla(0,0%,100%,0.04)" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
              <m.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "hsl(210,5%,40%)", marginBottom: "0.75rem", fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>
                  Portfolio
                </p>
                <h1 style={{ fontSize: "clamp(2.25rem,4.5vw,3.5rem)", fontWeight: 700, letterSpacing: "-0.028em", color: "hsl(38,12%,94%)", lineHeight: 1.08, marginBottom: "1.25rem", maxWidth: "36rem", fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>
                  Six operating companies.<br />One compounding architecture.
                </h1>
                <p style={{ fontSize: "0.9375rem", color: "hsl(210,5%,55%)", lineHeight: 1.7, maxWidth: "34rem", marginBottom: "2rem" }}>
                  Each venture is built to category-defining standards, benchmarked against the market leader in its vertical. All share the same data infrastructure, agent layer, and operational backbone.
                </p>
                <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                  {[
                    { value: "6", label: "Operating companies" },
                    { value: "1", label: "Shared architecture" },
                    { value: "5+", label: "Industry verticals" },
                  ].map(stat => (
                    <div key={stat.label}>
                      <p style={{ fontSize: "1.75rem", fontWeight: 700, color: "hsl(38,12%,94%)", letterSpacing: "-0.03em", lineHeight: 1, fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>{stat.value}</p>
                      <p style={{ fontSize: "10px", color: "hsl(210,5%,42%)", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: "0.3rem" }}>{stat.label}</p>
                    </div>
                  ))}
                </div>
              </m.div>
            </div>
          </section>
  
          <section style={{ padding: "clamp(4rem,7vw,6rem) 0", borderBottom: "1px solid hsla(0,0%,100%,0.04)" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 380px), 1fr))", gap: "1.25rem" }}>
                {VENTURES.map((venture, i) => {
                  const Icon = venture.Icon;
                  return (
                    <m.div
                      key={venture.name}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                      style={{
                        padding: "1.75rem",
                        border: `1px solid rgba(${venture.rgb}, 0.12)`,
                        background: `rgba(${venture.rgb}, 0.025)`,
                        borderRadius: "6px",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: venture.color, flexShrink: 0, boxShadow: `0 0 8px ${venture.color}60` }} />
                            <span style={{ fontSize: "17px", fontWeight: 700, color: "hsl(38,12%,92%)", letterSpacing: "-0.01em", fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>{venture.name}</span>
                            <span style={{ fontSize: "10px", padding: "2px 7px", border: `1px solid rgba(${venture.rgb}, 0.2)`, color: venture.color, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>{venture.stage}</span>
                          </div>
                          <p style={{ fontSize: "11.5px", color: "hsl(210,5%,50%)" }}>{venture.tagline}</p>
                        </div>
                        <Icon size={15} style={{ color: venture.color, opacity: 0.5, flexShrink: 0, marginTop: "3px" }} />
                      </div>
  
                      <p style={{ fontSize: "12.5px", lineHeight: 1.65, color: "hsl(210,5%,55%)", marginBottom: "1.25rem", flexGrow: 1 }}>{venture.description}</p>
  
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "1.25rem", paddingTop: "1rem", borderTop: `1px solid rgba(${venture.rgb}, 0.1)` }}>
                        {venture.metrics.map(m => (
                          <div key={m.label}>
                            <p style={{ fontSize: "12px", fontWeight: 700, color: "hsl(38,12%,88%)", letterSpacing: "-0.01em", marginBottom: "0.2rem" }}>{m.value}</p>
                            <p style={{ fontSize: "9px", color: "hsl(210,5%,42%)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{m.label}</p>
                          </div>
                        ))}
                      </div>
  
                      <Link
                        href={venture.path}
                        style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: venture.color, textDecoration: "none", letterSpacing: "0.04em" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.75"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                      >
                        View platform <ArrowUpRight size={11} />
                      </Link>
                    </m.div>
                  );
                })}
              </div>
            </div>
          </section>
  
          <section style={{ padding: "clamp(4rem,7vw,6rem) 0", borderBottom: "1px solid hsla(0,0%,100%,0.04)", background: "hsl(210,12%,6%)" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
              <m.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55 }}
                style={{ marginBottom: "2.5rem" }}
              >
                <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(210,5%,40%)", marginBottom: "0.75rem", fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>
                  The Architecture Advantage
                </p>
                <h2 style={{ fontSize: "clamp(1.5rem,3vw,2.25rem)", fontWeight: 700, letterSpacing: "-0.024em", color: "hsl(38,12%,94%)", lineHeight: 1.1, maxWidth: "28rem", fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>
                  Why one architecture beats six independent products.
                </h2>
              </m.div>
  
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))", gap: "1px", background: "hsla(0,0%,100%,0.04)" }}>
                {ARCHITECTURE_DIFFERENTIATORS.map((d, i) => (
                  <m.div
                    key={d.title}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: i * 0.07 }}
                    style={{ padding: "1.5rem 1.75rem", background: "hsl(210,12%,6%)" }}
                  >
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "hsl(190,90%,55%)", boxShadow: "0 0 8px hsla(190,90%,55%,0.5)", marginBottom: "0.875rem" }} />
                    <h3 style={{ fontSize: "14px", fontWeight: 700, color: "hsl(38,12%,90%)", letterSpacing: "-0.01em", marginBottom: "0.625rem", fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>{d.title}</h3>
                    <p style={{ fontSize: "12px", lineHeight: 1.7, color: "hsl(210,5%,52%)" }}>{d.body}</p>
                  </m.div>
                ))}
              </div>
            </div>
          </section>
  
          <section style={{ padding: "clamp(4rem,7vw,6rem) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
              <m.div
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                style={{ maxWidth: "32rem" }}
              >
                <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 700, letterSpacing: "-0.022em", color: "hsl(38,12%,94%)", lineHeight: 1.15, marginBottom: "1rem", fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>
                  Working with early teams.
                </h2>
                <p style={{ fontSize: "0.9375rem", color: "hsl(210,5%,58%)", lineHeight: 1.65, marginBottom: "1.5rem" }}>
                  Design partners get direct founder access, a focused engagement on one real workflow, and measurable improvement before any broader commitment.
                </p>
                <Link
                  href="/design-partners"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    padding: "0.625rem 1.25rem", background: "hsl(210,8%,88%)",
                    color: "hsl(210,12%,6%)",
                    fontSize: "13px", fontWeight: 600, textDecoration: "none",
                    transition: "background 0.2s ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(38,15%,96%)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(210,8%,88%)"; }}
                >
                  Request a design partner conversation <ArrowRight size={13} strokeWidth={2.5} />
                </Link>
              </m.div>
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
