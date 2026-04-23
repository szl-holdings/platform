import { m } from "framer-motion";
import { Link } from "wouter";
import { Activity, TrendingUp, GitMerge, Users, Radio, BarChart3, ChevronRight } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const MODULES = [
  {
    href: "/venture-intelligence/health-radar",
    icon: Activity,
    color: "#38bee0",
    rgb: "56,190,224",
    label: "Health Radar",
    title: "Portfolio Company Health Radar",
    description:
      "Composite health scores for every portfolio company — usage velocity, revenue trajectory, CAC efficiency, burn discipline, and market sentiment visualized as interactive radar charts with drill-down.",
  },
  {
    href: "/venture-intelligence/capital-optimizer",
    icon: TrendingUp,
    color: "#d4a054",
    rgb: "212,160,84",
    label: "Capital Optimizer",
    title: "Capital Allocation Optimizer",
    description:
      "AI-recommended capital deployment strategies across portfolio companies based on growth stage, market opportunity, competitive position, and expected return multiples — with scenario modeling.",
  },
  {
    href: "/venture-intelligence/synergy-map",
    icon: GitMerge,
    color: "#8b7ac8",
    rgb: "139,122,200",
    label: "Portfolio Connections",
    title: "Cross-Portfolio Connections",
    description:
      "Automatically identifies and quantifies revenue synergies between portfolio companies — PARAGON cyber for SEXTANT maritime clients, DOMAINE property data for PRISM litigation, and more.",
  },
  {
    href: "/venture-intelligence/lp-portal",
    icon: Users,
    color: "#6aaa72",
    rgb: "106,170,114",
    label: "LP Portal",
    title: "Investor Intelligence Portal",
    description:
      "LP-facing performance attribution, IRR and MOIC calculations, benchmark comparisons, and AI-generated quarterly narratives — replacing static PDF reports with living intelligence.",
  },
  {
    href: "/venture-intelligence/market-signals",
    icon: Radio,
    color: "#e05a5a",
    rgb: "224,90,90",
    label: "Market Signals",
    title: "Market Timing Signals",
    description:
      "AI monitoring of macro trends, regulatory shifts, and competitive landscape changes affecting each portfolio company — with recommended strategic responses and timing guidance.",
  },
  {
    href: "/venture-intelligence/exit-modeler",
    icon: BarChart3,
    color: "#c8953c",
    rgb: "200,149,60",
    label: "Exit Modeler",
    title: "Exit Scenario Modeler",
    description:
      "Probability-weighted exit valuations for each portfolio company across acquisition, IPO, and secondary sale scenarios — with optimal timing recommendations and comps analysis.",
  },
];

const PORTFOLIO_STATS = [
  { value: "6", label: "Portfolio companies" },
  { value: "$2.4B", label: "Combined TAM" },
  { value: "4.2×", label: "Avg blended MOIC" },
  { value: "38%", label: "Portfolio IRR (3yr)" },
];

export default function VentureIntelHubPage() {
  const __pageMeta = usePageMeta({
    title: "Venture Intelligence — SZL Holdings",
    description: "Portfolio company health, capital allocation, synergy analysis, LP reporting, market signals, and exit modeling for the SZL Holdings venture portfolio.",
    canonical: "https://szlholdings.com/venture-intelligence",
  });

  return (
    <>
      {__pageMeta}
      <div className="min-h-screen" style={{ background: "hsl(210,12%,5%)" }}>
        <SiteNav />
        <main id="main-content" >
          <section style={{ padding: "clamp(6rem,10vw,8rem) 0 clamp(4rem,7vw,6rem)", borderBottom: "1px solid hsla(0,0%,100%,0.04)" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
              <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "hsl(210,5%,40%)", marginBottom: "0.75rem", fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>
                  Venture Intelligence
                </p>
                <h1 style={{ fontSize: "clamp(2.25rem,4.5vw,3.5rem)", fontWeight: 700, letterSpacing: "-0.028em", color: "hsl(38,12%,94%)", lineHeight: 1.08, marginBottom: "1.25rem", maxWidth: "40rem", fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>
                  Portfolio analytics at top-tier VC depth.
                </h1>
                <p style={{ fontSize: "0.9375rem", color: "hsl(210,5%,55%)", lineHeight: 1.7, maxWidth: "36rem", marginBottom: "2rem" }}>
                  Predict portfolio company trajectories, optimize capital allocation, surface cross-portfolio synergies, and deliver LP intelligence that replaces static reports with living data.
                </p>
                <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
                  {PORTFOLIO_STATS.map(s => (
                    <div key={s.label}>
                      <p style={{ fontSize: "1.75rem", fontWeight: 700, color: "hsl(38,12%,94%)", letterSpacing: "-0.03em", lineHeight: 1, fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>{s.value}</p>
                      <p style={{ fontSize: "10px", color: "hsl(210,5%,42%)", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: "0.3rem" }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </m.div>
            </div>
          </section>
  
          <section style={{ padding: "clamp(4rem,7vw,6rem) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%,380px),1fr))", gap: "1.25rem" }}>
                {MODULES.map((mod, i) => {
                  const Icon = mod.icon;
                  return (
                    <m.div
                      key={mod.label}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Link
                        href={mod.href}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          padding: "1.75rem",
                          border: `1px solid rgba(${mod.rgb},0.14)`,
                          background: `rgba(${mod.rgb},0.025)`,
                          borderRadius: "6px",
                          textDecoration: "none",
                          transition: "border-color 0.2s ease, background 0.2s ease",
                          cursor: "pointer",
                          height: "100%",
                        }}
                        onMouseEnter={(e) => {
                          const el = e.currentTarget as HTMLElement;
                          el.style.borderColor = `rgba(${mod.rgb},0.32)`;
                          el.style.background = `rgba(${mod.rgb},0.05)`;
                        }}
                        onMouseLeave={(e) => {
                          const el = e.currentTarget as HTMLElement;
                          el.style.borderColor = `rgba(${mod.rgb},0.14)`;
                          el.style.background = `rgba(${mod.rgb},0.025)`;
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                            <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: `rgba(${mod.rgb},0.12)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Icon size={15} style={{ color: mod.color }} />
                            </div>
                            <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: mod.color }}>{mod.label}</span>
                          </div>
                          <ChevronRight size={14} style={{ color: "hsl(210,5%,38%)", flexShrink: 0, marginTop: "2px" }} />
                        </div>
                        <h2 style={{ fontSize: "16px", fontWeight: 700, color: "hsl(38,12%,92%)", letterSpacing: "-0.01em", marginBottom: "0.625rem", fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>
                          {mod.title}
                        </h2>
                        <p style={{ fontSize: "12.5px", lineHeight: 1.7, color: "hsl(210,5%,52%)", flexGrow: 1 }}>
                          {mod.description}
                        </p>
                      </Link>
                    </m.div>
                  );
                })}
              </div>
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
