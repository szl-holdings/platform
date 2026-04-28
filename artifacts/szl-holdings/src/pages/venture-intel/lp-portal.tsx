import { useState } from "react";
import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, TrendingUp, Award, FileText } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
  BarChart, Bar, Cell,
} from "recharts";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const QUARTERLY_PERFORMANCE = [
  { quarter: "Q1 '24", nav: 100, benchmark: 100 },
  { quarter: "Q2 '24", nav: 112, benchmark: 104 },
  { quarter: "Q3 '24", nav: 128, benchmark: 108 },
  { quarter: "Q4 '24", nav: 148, benchmark: 112 },
  { quarter: "Q1 '25", nav: 168, benchmark: 115 },
  { quarter: "Q2 '25", nav: 192, benchmark: 119 },
  { quarter: "Q3 '25", nav: 218, benchmark: 123 },
  { quarter: "Q4 '25", nav: 246, benchmark: 127 },
  { quarter: "Q1 '26", nav: 282, benchmark: 130 },
];

const ATTRIBUTION = [
  { name: "KORA", contribution: 42, color: "#38bee0" },
  { name: "SEXTANT", contribution: 28, color: "#3aa4dc" },
  { name: "PRAXIS", contribution: 18, color: "#a855f7" },
  { name: "PARAGON", contribution: 14, color: "#6366f1" },
  { name: "DOMAINE", contribution: 8, color: "#6b9c30" },
  { name: "Carlota Jo", contribution: 12, color: "#c4924a" },
];

const BENCHMARKS = [
  { label: "SZL Holdings", irr: 38, moic: 4.2, color: "#38bee0" },
  { label: "Top Quartile VC", irr: 28, moic: 3.1, color: "#6b9c30" },
  { label: "Median VC", irr: 18, moic: 2.0, color: "hsl(210,5%,40%)" },
  { label: "S&P 500", irr: 12, moic: 1.4, color: "hsl(210,5%,32%)" },
];

const QUARTERLY_NARRATIVES = [
  {
    quarter: "Q1 2026",
    generated: "April 14, 2026",
    headline: "Portfolio velocity accelerates across three verticals — KORA NRR breaks 124% threshold",
    narrative: `This quarter marked a pivotal inflection in portfolio-wide performance. KORA crossed the 124% NRR threshold, a milestone that signals genuine product-led expansion mechanics. When NRR exceeds 120%, new customer acquisition becomes less critical to growth — the installed base compounds on its own. Atlas has upgraded KORA's trajectory model from "growth" to "hypergrowth."

SEXTANT posted its strongest quarterly result since inception, driven by IMO compliance deadlines pulling forward enterprise contracts. The regulatory tailwind we identified in the Q4 2024 Atlas report is materializing on schedule.

PRAXIS matter volume grew 22% quarter-over-quarter, driven by the Governed review backlog compression engine reducing attorney hours by an average of 31%. This created a new buyer motion we're tracking as "hours-freed budget transfer" — surplus attorney capacity being redirected to new PRAXIS capabilities.

Capital efficiency remains a portfolio-wide concern for PARAGON and DOMAINE. Both companies are in the top quartile of their cohort for market position but are burning above plan. The cross-portfolio synergy initiatives with SEXTANT (cyber bundle) and PRAXIS (distress-to-litigation) are the highest-leverage CAC reduction plays available without additional capital.

Carlota Jo continues to function as the portfolio's highest-return, lowest-risk anchor. At 62% margins and >95% retention, it requires minimal capital and contributes strategic UHNW relationship access to all other portfolio companies.`,
    signals: ["KORA NRR > 124%", "SEXTANT IMO tailwind", "PRAXIS matter volume +22%", "PARAGON CAC above target"],
  },
  {
    quarter: "Q4 2025",
    generated: "January 14, 2026",
    headline: "Cross-portfolio synergy pipeline reaches $15.6M — PARAGON-SEXTANT bundle closes first enterprise deal",
    narrative: `The PARAGON-SEXTANT maritime cyber bundle closed its first enterprise deal in Q4 — a $480K annual contract with a major dry bulk operator. This validates the synergy thesis that drove our Q2 capital allocation model and establishes a replicable sales motion. The technical integration (SEXTANT AIS feeds into PARAGON threat detection engine) is now production-grade.

Portfolio NAV grew 28 index points in Q4 on a base of 218, representing the strongest absolute NAV growth quarter in the fund's history. The combination of KORA expansion revenue, SEXTANT contract acceleration, and PRAXIS matter volume created a compounding effect that models had projected for Q2 2026 — achieved one quarter ahead.`,
    signals: ["PARAGON-SEXTANT first enterprise deal", "Portfolio NAV +28 points", "Synergy pipeline $15.6M"],
  },
];

const TABS = ["Overview", "Attribution", "Benchmarks", "AI Narratives"] as const;
type Tab = (typeof TABS)[number];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "hsl(210,12%,8%)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", padding: "0.625rem 0.875rem" }}>
      <p style={{ fontSize: "10px", color: "hsl(210,5%,50%)", marginBottom: "4px" }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ fontSize: "11px", color: p.color ?? "hsl(38,12%,85%)" }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function LpPortalPage() {
  const __pageMeta = usePageMeta({
    title: "LP Investor Portal — SZL Holdings Venture Intelligence",
    description: "Portfolio performance attribution, IRR/MOIC calculations, benchmark comparisons, and AI-generated quarterly narratives for SZL Holdings LPs.",
    canonical: "https://szlholdings.com/venture-intelligence/lp-portal",
  });

  const [tab, setTab] = useState<Tab>("Overview");
  const [expandedNarrative, setExpandedNarrative] = useState<string | null>("Q1 2026");

  return (
    <>
      {__pageMeta}
      <div className="min-h-screen" style={{ background: "hsl(210,12%,5%)" }}>
        <SiteNav />
        <main id="main-content" >
          <section style={{ padding: "clamp(5rem,8vw,7rem) 0 2rem", borderBottom: "1px solid hsla(0,0%,100%,0.04)" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
              <Link href="/venture-intelligence" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "hsl(210,5%,42%)", textDecoration: "none", marginBottom: "1.5rem" }}>
                <ArrowLeft size={12} /> Venture Intelligence
              </Link>
              <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
                <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "hsl(210,5%,40%)", marginBottom: "0.6rem", fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>
                  LP Portal
                </p>
                <h1 style={{ fontSize: "clamp(1.75rem,3.5vw,2.75rem)", fontWeight: 700, letterSpacing: "-0.026em", color: "hsl(38,12%,94%)", lineHeight: 1.1, marginBottom: "0.75rem", fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>
                  Investor Intelligence Portal
                </h1>
                <p style={{ fontSize: "0.875rem", color: "hsl(210,5%,52%)", lineHeight: 1.65, maxWidth: "38rem" }}>
                  Living portfolio intelligence for limited partners — performance attribution, return metrics, benchmark comparisons, and AI-generated quarterly narratives replacing static PDF reports.
                </p>
              </m.div>
            </div>
          </section>
  
          <section style={{ padding: "0", borderBottom: "1px solid hsla(0,0%,100%,0.04)" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
              <div style={{ display: "flex", gap: "0.125rem", paddingTop: "1.5rem" }}>
                {TABS.map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    style={{
                      padding: "0.5rem 1rem",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: tab === t ? "hsl(38,12%,92%)" : "hsl(210,5%,48%)",
                      background: "transparent",
                      border: "none",
                      borderBottom: `2px solid ${tab === t ? "hsl(212,80%,65%)" : "transparent"}`,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif",
                      paddingBottom: "1rem",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </section>
  
          <section style={{ padding: "2rem 0 clamp(4rem,7vw,6rem)" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
              {tab === "Overview" && (
                <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "2rem" }}>
                    {[
                      { label: "Net IRR", value: "38%", sub: "Since inception", color: "#38bee0" },
                      { label: "MOIC", value: "4.2×", sub: "On invested capital", color: "#6aaa72" },
                      { label: "DPI", value: "0.8×", sub: "Distributions to paid-in", color: "#d4a054" },
                      { label: "TVPI", value: "4.2×", sub: "Total value to paid-in", color: "#a855f7" },
                    ].map(metric => (
                      <div key={metric.label} style={{ padding: "1.25rem 1.5rem", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "6px", background: "hsl(210,12%,6%)" }}>
                        <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "hsl(210,5%,42%)", marginBottom: "0.5rem" }}>{metric.label}</p>
                        <p style={{ fontSize: "2rem", fontWeight: 800, color: metric.color, letterSpacing: "-0.03em", lineHeight: 1, fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>{metric.value}</p>
                        <p style={{ fontSize: "10px", color: "hsl(210,5%,40%)", marginTop: "0.3rem" }}>{metric.sub}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "8px", padding: "1.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
                      <TrendingUp size={13} style={{ color: "hsl(212,80%,65%)" }} />
                      <p style={{ fontSize: "12px", fontWeight: 600, color: "hsl(38,12%,80%)", fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>Portfolio NAV vs. Public Market Benchmark (Indexed to 100)</p>
                    </div>
                    <div style={{ height: "280px" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={QUARTERLY_PERFORMANCE} margin={{ top: 5, right: 20, bottom: 0, left: -20 }}>
                          <CartesianGrid strokeDasharray="2 4" stroke="hsla(0,0%,100%,0.04)" />
                          <XAxis dataKey="quarter" tick={{ fontSize: 10, fill: "hsl(210,5%,44%)" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 9, fill: "hsl(210,5%,36%)" }} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Line name="SZL Portfolio" type="monotone" dataKey="nav" stroke="#38bee0" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: "#38bee0" }} />
                          <Line name="S&P 500 Equivalent" type="monotone" dataKey="benchmark" stroke="hsla(0,0%,100%,0.2)" strokeWidth={1.5} dot={false} strokeDasharray="4 3" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </m.div>
              )}
  
              {tab === "Attribution" && (
                <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                  <div style={{ border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "8px", padding: "1.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                      <Award size={13} style={{ color: "#d4a054" }} />
                      <p style={{ fontSize: "12px", fontWeight: 600, color: "hsl(38,12%,80%)", fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>NAV Growth Attribution by Portfolio Company ($M contribution)</p>
                    </div>
                    <div style={{ height: "240px", marginBottom: "1.5rem" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ATTRIBUTION} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 40 }}>
                          <XAxis type="number" tick={{ fontSize: 9, fill: "hsl(210,5%,36%)" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}M`} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "hsl(210,5%,50%)" }} axisLine={false} tickLine={false} width={70} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="contribution" radius={[0, 3, 3, 0]} name="NAV Contribution ($M)">
                            {ATTRIBUTION.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} fillOpacity={0.85} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: "0.75rem" }}>
                      {ATTRIBUTION.map(a => (
                        <div key={a.name} style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.625rem 0.875rem", background: "hsla(0,0%,100%,0.02)", borderRadius: "4px" }}>
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: a.color, flexShrink: 0 }} />
                          <div>
                            <p style={{ fontSize: "12px", fontWeight: 700, color: "hsl(38,12%,82%)" }}>{a.name}</p>
                            <p style={{ fontSize: "11px", color: a.color, fontWeight: 700, fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>${a.contribution}M</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </m.div>
              )}
  
              {tab === "Benchmarks" && (
                <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                  <div style={{ border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "8px", padding: "1.75rem" }}>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "hsl(38,12%,80%)", marginBottom: "1.5rem", fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>Performance vs. Benchmark Universe</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "hsla(0,0%,100%,0.04)", borderRadius: "6px", overflow: "hidden", marginBottom: "1.5rem" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "0.625rem 1rem", background: "hsl(210,12%,7%)" }}>
                        {["Fund / Benchmark", "Net IRR", "MOIC"].map(h => (
                          <p key={h} style={{ fontSize: "10px", fontWeight: 700, color: "hsl(210,5%,40%)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</p>
                        ))}
                      </div>
                      {BENCHMARKS.map((b, i) => (
                        <m.div
                          key={b.label}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: i * 0.06 }}
                          style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "0.875rem 1rem", background: i === 0 ? "hsla(56,190,224,0.04)" : "hsl(210,12%,6%)" }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: b.color }} />
                            <span style={{ fontSize: "13px", fontWeight: i === 0 ? 700 : 400, color: i === 0 ? "hsl(38,12%,90%)" : "hsl(210,5%,55%)" }}>{b.label}</span>
                          </div>
                          <span style={{ fontSize: "14px", fontWeight: 700, color: b.color, fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>{b.irr}%</span>
                          <span style={{ fontSize: "14px", fontWeight: 700, color: b.color, fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>{b.moic}×</span>
                        </m.div>
                      ))}
                    </div>
                    <p style={{ fontSize: "10px", color: "hsl(210,5%,38%)" }}>* Benchmark figures represent published 2025 performance data. SZL figures are unaudited estimates as of Q1 2026.</p>
                  </div>
                </m.div>
              )}
  
              {tab === "AI Narratives" && (
                <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
                    <FileText size={13} style={{ color: "#a855f7" }} />
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "hsl(38,12%,80%)", fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>AI-Generated Quarterly Portfolio Narratives</p>
                    <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "3px", background: "#a855f715", color: "#a855f7", border: "1px solid #a855f730", fontWeight: 600, marginLeft: "auto" }}>Atlas AI</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {QUARTERLY_NARRATIVES.map(n => (
                      <div key={n.quarter} style={{ border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "8px", overflow: "hidden" }}>
                        <button
                          onClick={() => setExpandedNarrative(expandedNarrative === n.quarter ? null : n.quarter)}
                          style={{ width: "100%", padding: "1.25rem 1.5rem", textAlign: "left", background: "hsl(210,12%,7%)", border: "none", cursor: "pointer" }}
                        >
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.375rem" }}>
                                <span style={{ fontSize: "11px", fontWeight: 700, color: "hsl(210,5%,40%)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{n.quarter}</span>
                                <span style={{ fontSize: "9px", color: "hsl(210,5%,36%)" }}>Generated {n.generated}</span>
                              </div>
                              <p style={{ fontSize: "13.5px", fontWeight: 700, color: "hsl(38,12%,88%)", lineHeight: 1.45, fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif", maxWidth: "52rem" }}>{n.headline}</p>
                            </div>
                            <span style={{ fontSize: "18px", color: "hsl(210,5%,42%)", flexShrink: 0, lineHeight: 1, fontFamily: "monospace" }}>{expandedNarrative === n.quarter ? "−" : "+"}</span>
                          </div>
                          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.625rem", flexWrap: "wrap" }}>
                            {n.signals.map(sig => (
                              <span key={sig} style={{ fontSize: "9px", padding: "2px 7px", borderRadius: "2px", background: "hsla(0,0%,100%,0.04)", color: "hsl(210,5%,48%)", border: "1px solid hsla(0,0%,100%,0.06)", fontWeight: 600 }}>{sig}</span>
                            ))}
                          </div>
                        </button>
                        {expandedNarrative === n.quarter && (
                          <m.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ padding: "1.5rem", borderTop: "1px solid hsla(0,0%,100%,0.06)" }}>
                            {n.narrative.split("\n\n").map((para, i) => (
                              <p key={i} style={{ fontSize: "13px", lineHeight: 1.8, color: "hsl(210,5%,58%)", marginBottom: "1rem" }}>{para}</p>
                            ))}
                          </m.div>
                        )}
                      </div>
                    ))}
                  </div>
                </m.div>
              )}
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
