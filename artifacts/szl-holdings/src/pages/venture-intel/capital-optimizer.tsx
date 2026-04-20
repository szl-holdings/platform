import { useState } from "react";
import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, TrendingUp, Zap } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
  PieChart, Pie, Legend,
} from "recharts";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const SCENARIOS = [
  {
    id: "growth",
    label: "Growth Acceleration",
    description: "Front-load capital into highest-velocity companies to maximize IRR over 36-month horizon.",
    allocations: [
      { name: "Lyte", value: 32, color: "#38bee0", rationale: "Highest NRR + burn efficiency" },
      { name: "PRISM", value: 24, color: "#a855f7", rationale: "Strong matter volume growth" },
      { name: "Vessels", value: 20, color: "#3aa4dc", rationale: "Regulatory tailwind + maritime demand" },
      { name: "Aegis", value: 12, color: "#6366f1", rationale: "Managed SOC bundle scaling" },
      { name: "Terra", value: 8, color: "#6b9c30", rationale: "PRISM synergy pipeline" },
      { name: "Carlota Jo", value: 4, color: "#c4924a", rationale: "Self-funded — minimal needed" },
    ],
    projectedIrr: "42%",
    projectedMoic: "5.2×",
    riskLevel: "Moderate",
    riskColor: "#c4924a",
  },
  {
    id: "balanced",
    label: "Balanced Portfolio",
    description: "Distribute capital to support all companies at growth stage with risk-adjusted weighting.",
    allocations: [
      { name: "Lyte", value: 26, color: "#38bee0", rationale: "Top performer — maintain momentum" },
      { name: "Vessels", value: 22, color: "#3aa4dc", rationale: "Market position defense" },
      { name: "PRISM", value: 20, color: "#a855f7", rationale: "Consistent growth trajectory" },
      { name: "Aegis", value: 16, color: "#6366f1", rationale: "CAC improvement investment" },
      { name: "Terra", value: 12, color: "#6b9c30", rationale: "Channel partnership enablement" },
      { name: "Carlota Jo", value: 4, color: "#c4924a", rationale: "Selective premium expansion" },
    ],
    projectedIrr: "36%",
    projectedMoic: "4.4×",
    riskLevel: "Low",
    riskColor: "#38bee0",
  },
  {
    id: "synergy",
    label: "Synergy Maximizer",
    description: "Weight capital toward companies where cross-portfolio synergies compound returns most aggressively.",
    allocations: [
      { name: "Vessels", value: 28, color: "#3aa4dc", rationale: "Aegis + Vessels bundle anchor" },
      { name: "Aegis", value: 24, color: "#6366f1", rationale: "Maritime cyber cross-sell" },
      { name: "Terra", value: 20, color: "#6b9c30", rationale: "PRISM litigation data feed" },
      { name: "PRISM", value: 16, color: "#a855f7", rationale: "Terra distress data consumer" },
      { name: "Lyte", value: 8, color: "#38bee0", rationale: "Platform observability layer" },
      { name: "Carlota Jo", value: 4, color: "#c4924a", rationale: "UHNW relationship gateway" },
    ],
    projectedIrr: "38%",
    projectedMoic: "4.8×",
    riskLevel: "Moderate",
    riskColor: "#c4924a",
  },
];

const TOTAL_CAPITAL = 24;

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; color?: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "hsl(210,12%,8%)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", padding: "0.625rem 0.875rem" }}>
      <p style={{ fontSize: "11px", color: "hsl(38,12%,85%)", fontWeight: 600, marginBottom: "4px" }}>{label}</p>
      <p style={{ fontSize: "11px", color: payload[0]?.color ?? "hsl(210,5%,55%)" }}>
        ${((payload[0]?.value ?? 0) / 100 * TOTAL_CAPITAL).toFixed(1)}M ({payload[0]?.value}%)
      </p>
    </div>
  );
};

const PieCustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { color: string; rationale: string } }> }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0]!;
  return (
    <div style={{ background: "hsl(210,12%,8%)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", padding: "0.75rem 1rem", maxWidth: "180px" }}>
      <p style={{ fontSize: "12px", color: p.payload.color, fontWeight: 700, marginBottom: "4px" }}>{p.name}</p>
      <p style={{ fontSize: "11px", color: "hsl(38,12%,85%)" }}>${((p.value / 100) * TOTAL_CAPITAL).toFixed(1)}M ({p.value}%)</p>
      <p style={{ fontSize: "10px", color: "hsl(210,5%,52%)", marginTop: "4px" }}>{p.payload.rationale}</p>
    </div>
  );
};

export default function CapitalOptimizerPage() {
  const __pageMeta = usePageMeta({
    title: "Capital Allocation Optimizer — SZL Holdings Venture Intelligence",
    description: "AI-recommended capital deployment strategies across SZL portfolio companies with scenario modeling.",
    canonical: "https://szlholdings.com/venture-intelligence/capital-optimizer",
  });

  const [activeScenario, setActiveScenario] = useState<string>("balanced");
  const scenario = SCENARIOS.find(s => s.id === activeScenario) ?? SCENARIOS[0]!;

  const barData = scenario.allocations.map(a => ({
    name: a.name,
    allocation: a.value,
    amount: (a.value / 100) * TOTAL_CAPITAL,
    color: a.color,
    rationale: a.rationale,
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
                  Capital Optimizer
                </p>
                <h1 style={{ fontSize: "clamp(1.75rem,3.5vw,2.75rem)", fontWeight: 700, letterSpacing: "-0.026em", color: "hsl(38,12%,94%)", lineHeight: 1.1, marginBottom: "0.75rem", fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>
                  Capital Allocation Optimizer
                </h1>
                <p style={{ fontSize: "0.875rem", color: "hsl(210,5%,52%)", lineHeight: 1.65, maxWidth: "38rem" }}>
                  Model capital deployment strategies across the portfolio. Each scenario optimizes for a different objective — growth velocity, balanced risk, or synergy compounding.
                </p>
              </m.div>
            </div>
          </section>
  
          <section style={{ padding: "2rem 0 clamp(4rem,7vw,6rem)" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
              <div style={{ display: "flex", gap: "0.875rem", flexWrap: "wrap", marginBottom: "2rem" }}>
                {SCENARIOS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setActiveScenario(s.id)}
                    style={{
                      padding: "0.625rem 1.125rem",
                      borderRadius: "4px",
                      border: `1px solid ${activeScenario === s.id ? "hsla(212,100%,70%,0.4)" : "hsla(0,0%,100%,0.08)"}`,
                      background: activeScenario === s.id ? "hsla(212,100%,70%,0.08)" : "transparent",
                      color: activeScenario === s.id ? "hsl(212,80%,72%)" : "hsl(210,5%,52%)",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif",
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
  
              <m.div
                key={activeScenario}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                  {[
                    { label: "Total Capital Pool", value: `$${TOTAL_CAPITAL}M`, icon: "💰", sub: "Current deployment round" },
                    { label: "Projected IRR", value: scenario.projectedIrr, icon: "📈", sub: "36-month horizon" },
                    { label: "Projected MOIC", value: scenario.projectedMoic, icon: "✕", sub: "On invested capital" },
                  ].map(stat => (
                    <div key={stat.label} style={{ padding: "1.25rem 1.5rem", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "6px", background: "hsl(210,12%,6%)" }}>
                      <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "hsl(210,5%,42%)", marginBottom: "0.5rem" }}>{stat.label}</p>
                      <p style={{ fontSize: "1.875rem", fontWeight: 800, color: "hsl(38,12%,92%)", letterSpacing: "-0.03em", lineHeight: 1, fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>{stat.value}</p>
                      <p style={{ fontSize: "10px", color: "hsl(210,5%,40%)", marginTop: "0.3rem" }}>{stat.sub}</p>
                    </div>
                  ))}
                </div>
  
                <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "1.5rem" }}>
                  <div style={{ border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "8px", padding: "1.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                      <TrendingUp size={14} style={{ color: "hsl(212,80%,65%)" }} />
                      <p style={{ fontSize: "12px", fontWeight: 600, color: "hsl(38,12%,80%)", fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>Allocation by Company ($M)</p>
                    </div>
                    <div style={{ height: "240px" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(210,5%,48%)" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 9, fill: "hsl(210,5%,36%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${((v / 100) * TOTAL_CAPITAL).toFixed(0)}M`} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="allocation" radius={[3, 3, 0, 0]}>
                            {barData.map((entry) => (
                              <Cell key={`cell-${entry.name}`} fill={entry.color} fillOpacity={0.8} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
  
                  <div style={{ border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "8px", padding: "1.75rem" }}>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "hsl(38,12%,80%)", marginBottom: "1rem", fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>Portfolio Split</p>
                    <div style={{ height: "200px" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={scenario.allocations} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} strokeWidth={0}>
                            {scenario.allocations.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} fillOpacity={0.85} />
                            ))}
                          </Pie>
                          <Tooltip content={<PieCustomTooltip />} />
                          <Legend wrapperStyle={{ fontSize: "10px", color: "hsl(210,5%,48%)" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
  
                <div style={{ marginTop: "1.5rem", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "8px", padding: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                    <Zap size={13} style={{ color: "#d4a054" }} />
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "hsl(38,12%,80%)", fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>AI Rationale — {scenario.label}</p>
                    <span style={{ marginLeft: "auto", fontSize: "10px", padding: "2px 8px", borderRadius: "3px", background: `${scenario.riskColor}15`, color: scenario.riskColor, border: `1px solid ${scenario.riskColor}30`, fontWeight: 600 }}>
                      Risk: {scenario.riskLevel}
                    </span>
                  </div>
                  <p style={{ fontSize: "12.5px", color: "hsl(210,5%,55%)", lineHeight: 1.7, marginBottom: "1rem" }}>{scenario.description}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px),1fr))", gap: "0.5rem" }}>
                    {scenario.allocations.map(a => (
                      <div key={a.name} style={{ display: "flex", gap: "0.625rem", alignItems: "flex-start", padding: "0.5rem 0.75rem", background: "hsla(0,0%,100%,0.02)", borderRadius: "4px" }}>
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: a.color, marginTop: "5px", flexShrink: 0 }} />
                        <div>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "hsl(38,12%,82%)" }}>{a.name}</span>
                          <span style={{ fontSize: "10px", color: "hsl(210,5%,48%)", marginLeft: "6px" }}>{a.value}% · ${((a.value / 100) * TOTAL_CAPITAL).toFixed(1)}M</span>
                          <p style={{ fontSize: "10px", color: "hsl(210,5%,48%)", marginTop: "2px" }}>{a.rationale}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </m.div>
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
