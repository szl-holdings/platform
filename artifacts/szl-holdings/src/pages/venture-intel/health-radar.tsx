import { useStandardQuery } from "@szl-holdings/api-client-react";
import { useState } from "react";
import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend,
} from "recharts";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const COMPANIES = [
  {
    id: "lyte",
    name: "Lyte",
    tagline: "Business Observability",
    color: "#38bee0",
    rgb: "56,190,224",
    healthScore: 87,
    trend: "up",
    metrics: {
      revenueGrowth: 88,
      customerAcquisition: 82,
      burnEfficiency: 90,
      marketPosition: 85,
      platformAdoption: 92,
      strategicSynergy: 80,
    },
    kpis: [
      { label: "MoM Revenue Growth", value: "+18%", good: true },
      { label: "CAC Payback", value: "11mo", good: true },
      { label: "Burn Multiple", value: "1.2×", good: true },
      { label: "NRR", value: "124%", good: true },
      { label: "Pipeline Coverage", value: "3.8×", good: true },
    ],
    sentiment: "Strong signal velocity and NRR above 120% indicate efficient go-to-market with excellent expansion revenue. Burn discipline best-in-class at 1.2× multiple.",
  },
  {
    id: "vessels",
    name: "Vessels",
    tagline: "Maritime Intelligence",
    color: "#3aa4dc",
    rgb: "58,164,220",
    healthScore: 81,
    trend: "up",
    metrics: {
      revenueGrowth: 78,
      customerAcquisition: 74,
      burnEfficiency: 84,
      marketPosition: 92,
      platformAdoption: 80,
      strategicSynergy: 88,
    },
    kpis: [
      { label: "MoM Revenue Growth", value: "+14%", good: true },
      { label: "CAC Payback", value: "14mo", good: true },
      { label: "Burn Multiple", value: "1.5×", good: true },
      { label: "NRR", value: "118%", good: true },
      { label: "Vessel Coverage", value: "2,400+", good: true },
    ],
    sentiment: "Market position dominance with 2,400+ vessels tracked. Regulatory tailwinds from IMO and sanctions enforcement driving inbound pipeline acceleration.",
  },
  {
    id: "aegis",
    name: "Aegis",
    tagline: "SOC Command",
    color: "#6366f1",
    rgb: "99,102,241",
    healthScore: 79,
    trend: "stable",
    metrics: {
      revenueGrowth: 76,
      customerAcquisition: 70,
      burnEfficiency: 78,
      marketPosition: 88,
      platformAdoption: 82,
      strategicSynergy: 82,
    },
    kpis: [
      { label: "MoM Revenue Growth", value: "+11%", good: true },
      { label: "CAC Payback", value: "17mo", good: false },
      { label: "Burn Multiple", value: "1.8×", good: false },
      { label: "NRR", value: "112%", good: true },
      { label: "MTTR Improvement", value: "62%", good: true },
    ],
    sentiment: "Solid market position but CAC payback trending above target. Managed SOC bundling with Vessels maritime clients is highest-priority synergy play to accelerate.",
  },
  {
    id: "terra",
    name: "Terra",
    tagline: "Real Estate Intelligence",
    color: "#6b9c30",
    rgb: "107,156,48",
    healthScore: 74,
    trend: "up",
    metrics: {
      revenueGrowth: 72,
      customerAcquisition: 68,
      burnEfficiency: 76,
      marketPosition: 80,
      platformAdoption: 72,
      strategicSynergy: 78,
    },
    kpis: [
      { label: "MoM Revenue Growth", value: "+9%", good: true },
      { label: "CAC Payback", value: "19mo", good: false },
      { label: "Burn Multiple", value: "2.1×", good: false },
      { label: "NRR", value: "108%", good: true },
      { label: "Data Source Coverage", value: "8 feeds", good: true },
    ],
    sentiment: "Proprietary ACRIS linkage is a defensible moat. CAC payback longer than target — channel partnership with PRISM Counsel for distress litigation pipeline is key lever.",
  },
  {
    id: "prism",
    name: "PRISM",
    tagline: "Legal Matter Command",
    color: "#a855f7",
    rgb: "168,85,247",
    healthScore: 77,
    trend: "up",
    metrics: {
      revenueGrowth: 74,
      customerAcquisition: 76,
      burnEfficiency: 82,
      marketPosition: 82,
      platformAdoption: 74,
      strategicSynergy: 76,
    },
    kpis: [
      { label: "MoM Revenue Growth", value: "+12%", good: true },
      { label: "CAC Payback", value: "13mo", good: true },
      { label: "Burn Multiple", value: "1.4×", good: true },
      { label: "NRR", value: "116%", good: true },
      { label: "Matter Volume", value: "+22%", good: true },
    ],
    sentiment: "Efficient burns and strong matter volume growth. Governed review backlog compression driving measurable attorney hours saved — key buyer ROI proof point.",
  },
  {
    id: "carlota",
    name: "Carlota Jo",
    tagline: "Private Advisory",
    color: "#c4924a",
    rgb: "196,146,74",
    healthScore: 91,
    trend: "stable",
    metrics: {
      revenueGrowth: 82,
      customerAcquisition: 95,
      burnEfficiency: 98,
      marketPosition: 88,
      platformAdoption: 88,
      strategicSynergy: 96,
    },
    kpis: [
      { label: "Client Retention", value: ">95%", good: true },
      { label: "NPS Score", value: "78", good: true },
      { label: "Referral Rate", value: "68%", good: true },
      { label: "Burn Multiple", value: "0.4×", good: true },
      { label: "Margin", value: "62%", good: true },
    ],
    sentiment: "Highest health score in portfolio. Near-zero acquisition cost via referrals, 62% margin, and >95% retention are exceptional fundamentals. Strategic synergy anchor for UHNW client relationships.",
  },
];

const RADAR_AXES = [
  { key: "revenueGrowth", label: "Revenue Growth" },
  { key: "customerAcquisition", label: "Customer Acq." },
  { key: "burnEfficiency", label: "Burn Efficiency" },
  { key: "marketPosition", label: "Market Position" },
  { key: "platformAdoption", label: "Platform Adoption" },
  { key: "strategicSynergy", label: "Synergy Score" },
];

function HealthBadge({ score }: { score: number }) {
  const color = score >= 85 ? "#38bee0" : score >= 75 ? "#6b9c30" : "#c4924a";
  const label = score >= 85 ? "Excellent" : score >= 75 ? "Good" : "Developing";
  return (
    <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", padding: "3px 8px", borderRadius: "3px", background: `${color}18`, color, border: `1px solid ${color}30` }}>
      {label}
    </span>
  );
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "up") return <TrendingUp size={13} style={{ color: "#38bee0" }} />;
  if (trend === "down") return <TrendingDown size={13} style={{ color: "#e05a5a" }} />;
  return <Minus size={13} style={{ color: "hsl(210,5%,48%)" }} />;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string }> }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "hsl(210,12%,8%)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", padding: "0.625rem 0.875rem" }}>
      {payload.map((p) => (
        <div key={p.name} style={{ fontSize: "11px", color: "hsl(38,12%,85%)" }}>
          <span style={{ color: p.color ?? "hsl(210,5%,55%)" }}>{p.name}: </span>
          <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

const BASE = (typeof import.meta !== "undefined" ? (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL : "") ?? "";
const API_BASE = BASE.replace(/\/$/, "");

interface VentureHealthSignals {
  signals: {
    lyte?: { incidents?: number };
    vessels?: { trackedVessels?: number };
    aegis?: { incidents?: number; findings?: number };
    terra?: { activeDeals?: number };
    carlota?: { inquiries?: number };
  };
}

export default function HealthRadarPage() {
  const __pageMeta = usePageMeta({
    title: "Portfolio Health Radar — SZL Holdings Venture Intelligence",
    description: "Real-time health scores for every SZL portfolio company across usage, revenue, CAC, burn rate, and market sentiment.",
    canonical: "https://szlholdings.com/venture-intelligence/health-radar",
  });

  const { data: healthSignals } = useStandardQuery<VentureHealthSignals>({
    queryKey: ["venture-health-signals"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/holdings/venture-health`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch venture health");
      return res.json();
    },
    staleTime: 60_000,
    retry: false,
  });

  const [selected, setSelected] = useState<string>("lyte");
  const company = COMPANIES.find(c => c.id === selected) ?? COMPANIES[0]!;

  const liveKpiValue = (id: string, defaultValue: string): string => {
    if (!healthSignals?.signals) return defaultValue;
    const s = healthSignals.signals;
    if (id === "vessels" && s.vessels?.trackedVessels != null) return `${s.vessels.trackedVessels.toLocaleString()}`;
    if (id === "aegis" && s.aegis?.incidents != null) return `${s.aegis.incidents} active`;
    if (id === "terra" && s.terra?.activeDeals != null) return `${s.terra.activeDeals} deals`;
    if (id === "carlota" && s.carlota?.inquiries != null) return `${s.carlota.inquiries} inquiries`;
    return defaultValue;
  };

  const companyKpis = company.kpis.map(kpi => {
    if (kpi.label === "Vessel Coverage") return { ...kpi, value: liveKpiValue("vessels", kpi.value) };
    if (kpi.label === "MTTR Improvement" && company.id === "aegis") return { ...kpi, value: liveKpiValue("aegis", kpi.value) };
    if (kpi.label === "Data Source Coverage" && company.id === "terra") return { ...kpi, value: liveKpiValue("terra", kpi.value) };
    return kpi;
  });

  const radarData = RADAR_AXES.map(axis => ({
    axis: axis.label,
    [company.name]: company.metrics[axis.key as keyof typeof company.metrics],
    Benchmark: 70,
  }));

  return (
    <>
      {__pageMeta}
      <div className="min-h-screen" style={{ background: "hsl(210,12%,5%)" }}>
        <SiteNav />
        <main id="main-content" role="main">
          <section style={{ padding: "clamp(5rem,8vw,7rem) 0 2rem", borderBottom: "1px solid hsla(0,0%,100%,0.04)" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
              <Link href="/venture-intelligence" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "hsl(210,5%,42%)", textDecoration: "none", marginBottom: "1.5rem" }}>
                <ArrowLeft size={12} /> Venture Intelligence
              </Link>
              <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
                <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "hsl(210,5%,40%)", marginBottom: "0.6rem", fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>
                  Health Radar
                </p>
                <h1 style={{ fontSize: "clamp(1.75rem,3.5vw,2.75rem)", fontWeight: 700, letterSpacing: "-0.026em", color: "hsl(38,12%,94%)", lineHeight: 1.1, marginBottom: "0.75rem", fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>
                  Portfolio Company Health Radar
                </h1>
                <p style={{ fontSize: "0.875rem", color: "hsl(210,5%,52%)", lineHeight: 1.65, maxWidth: "38rem" }}>
                  Composite health scores across revenue trajectory, customer acquisition efficiency, burn discipline, market position, platform adoption, and cross-portfolio synergy potential.
                </p>
              </m.div>
            </div>
          </section>
  
          <section style={{ padding: "2rem 0 clamp(4rem,7vw,6rem)" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
              <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap", marginBottom: "2.5rem" }}>
                {COMPANIES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c.id)}
                    style={{
                      padding: "0.4rem 0.875rem",
                      borderRadius: "4px",
                      border: `1px solid ${selected === c.id ? `rgba(${c.rgb},0.5)` : "hsla(0,0%,100%,0.08)"}`,
                      background: selected === c.id ? `rgba(${c.rgb},0.1)` : "transparent",
                      color: selected === c.id ? c.color : "hsl(210,5%,52%)",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif",
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
  
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", alignItems: "start" }}>
                <m.div
                  key={company.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  style={{ border: `1px solid rgba(${company.rgb},0.16)`, background: `rgba(${company.rgb},0.03)`, borderRadius: "8px", padding: "1.75rem" }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                        <Activity size={14} style={{ color: company.color }} />
                        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "hsl(38,12%,92%)", letterSpacing: "-0.015em", fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>{company.name}</h2>
                        <TrendIcon trend={company.trend} />
                      </div>
                      <p style={{ fontSize: "11px", color: "hsl(210,5%,50%)" }}>{company.tagline}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "2.5rem", fontWeight: 800, color: company.color, letterSpacing: "-0.04em", lineHeight: 1, fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>{company.healthScore}</div>
                      <div style={{ fontSize: "9px", color: "hsl(210,5%,42%)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.375rem" }}>Health Score</div>
                      <HealthBadge score={company.healthScore} />
                    </div>
                  </div>
  
                  <div style={{ height: "280px", marginBottom: "1.5rem" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="hsla(0,0%,100%,0.06)" />
                        <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: "hsl(210,5%,48%)", fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: "hsl(210,5%,32%)" }} tickCount={4} />
                        <Radar name="Benchmark" dataKey="Benchmark" stroke="hsla(0,0%,100%,0.12)" fill="hsla(0,0%,100%,0.03)" strokeDasharray="3 3" />
                        <Radar name={company.name} dataKey={company.name} stroke={company.color} fill={company.color} fillOpacity={0.12} strokeWidth={2} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: "10px", color: "hsl(210,5%,48%)" }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
  
                  <p style={{ fontSize: "12px", lineHeight: 1.7, color: "hsl(210,5%,52%)", borderTop: `1px solid rgba(${company.rgb},0.1)`, paddingTop: "1rem" }}>
                    {company.sentiment}
                  </p>
                </m.div>
  
                <m.div
                  key={`kpis-${company.id}`}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
                >
                  <div style={{ border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "8px", padding: "1.5rem" }}>
                    <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,40%)", marginBottom: "1rem", fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>Key Performance Indicators</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                      {companyKpis.map(kpi => (
                        <div key={kpi.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0.75rem", background: "hsla(0,0%,100%,0.02)", borderRadius: "4px" }}>
                          <span style={{ fontSize: "12px", color: "hsl(210,5%,55%)" }}>{kpi.label}</span>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: kpi.good ? "hsl(38,12%,88%)" : "#e07070", fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>{kpi.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
  
                  <div style={{ border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "8px", padding: "1.5rem" }}>
                    <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,40%)", marginBottom: "1rem", fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>Dimension Scores</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                      {RADAR_AXES.map(axis => {
                        const val = company.metrics[axis.key as keyof typeof company.metrics];
                        return (
                          <div key={axis.key}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                              <span style={{ fontSize: "11px", color: "hsl(210,5%,52%)" }}>{axis.label}</span>
                              <span style={{ fontSize: "11px", fontWeight: 700, color: "hsl(38,12%,82%)", fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>{val}</span>
                            </div>
                            <div style={{ height: "3px", background: "hsla(0,0%,100%,0.06)", borderRadius: "2px" }}>
                              <div style={{ height: "100%", width: `${val}%`, background: company.color, borderRadius: "2px", transition: "width 0.6s ease" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
  
                  <div style={{ border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "8px", padding: "1.5rem" }}>
                    <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,40%)", marginBottom: "0.875rem", fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>Portfolio Rank</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                      {[...COMPANIES].sort((a, b) => b.healthScore - a.healthScore).map((c, i) => (
                        <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.375rem 0.5rem", borderRadius: "4px", background: c.id === selected ? `rgba(${c.rgb},0.06)` : "transparent" }}>
                          <span style={{ fontSize: "10px", color: "hsl(210,5%,40%)", width: "14px", textAlign: "right", fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>#{i + 1}</span>
                          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                          <span style={{ fontSize: "12px", color: c.id === selected ? "hsl(38,12%,88%)" : "hsl(210,5%,52%)", flex: 1 }}>{c.name}</span>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: c.color, fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>{c.healthScore}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </m.div>
              </div>
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
