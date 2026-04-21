import { useState } from "react";
import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, Radio, AlertTriangle, TrendingUp, TrendingDown, Globe, Shield, Zap } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const SIGNAL_CATEGORIES = ["All", "Macro", "Regulatory", "Competitive", "Geopolitical"] as const;
type SignalCategory = (typeof SIGNAL_CATEGORIES)[number];

const SIGNALS = [
  {
    id: "imo-2026",
    title: "IMO CII Ratings Enforcement — Q3 2026",
    category: "Regulatory",
    urgency: "High",
    urgencyColor: "#e05a5a",
    impact: "Positive",
    impactColor: "#6aaa72",
    affectedCompanies: ["SEXTANT", "PARAGON"],
    companyColors: ["#3aa4dc", "#6366f1"],
    icon: Globe,
    date: "Apr 12, 2026",
    summary: "IMO Carbon Intensity Indicator ratings become enforceable in Q3 2026. Vessels with CII rating below 'C' face operational restrictions. Creates immediate demand for Vessels' voyage optimization and emissions reporting.",
    recommendation: "Accelerate Vessels enterprise sales motion targeting bulk carriers and tanker operators. Bundle Aegis cyber compliance as regulatory package. Expected 18-month tailwind worth $8–12M incremental ARR.",
    confidence: 91,
    responseWindow: "90 days",
  },
  {
    id: "sec-ai-disclosure",
    title: "SEC AI Risk Factor Disclosure Rule — Final",
    category: "Regulatory",
    urgency: "Medium",
    urgencyColor: "#c4924a",
    impact: "Positive",
    impactColor: "#6aaa72",
    affectedCompanies: ["PRAXIS", "KORA"],
    companyColors: ["#a855f7", "#38bee0"],
    icon: Shield,
    date: "Apr 9, 2026",
    summary: "SEC finalized AI risk factor disclosure requirements for public companies. All companies with material AI dependencies must disclose governance frameworks, failure modes, and mitigation strategies in 10-K filings.",
    recommendation: "PRISM should add 'AI governance legal advisory' as discrete service line — warm market of 4,200 SEC-registered companies needing compliance counsel. Lyte operational audit trails directly support client disclosure requirements.",
    confidence: 88,
    responseWindow: "60 days",
  },
  {
    id: "interest-rate-cre",
    title: "Fed signals 75bps cut through 2026 — CRE cycle inflection",
    category: "Macro",
    urgency: "High",
    urgencyColor: "#e05a5a",
    impact: "Positive",
    impactColor: "#6aaa72",
    affectedCompanies: ["DOMAINE", "Carlota Jo"],
    companyColors: ["#6b9c30", "#c4924a"],
    icon: TrendingUp,
    date: "Apr 7, 2026",
    summary: "Federal Reserve forward guidance projects 75 basis points of cuts through end of 2026. Historical pattern shows CRE transaction volume increases 30–45% in the 12 months following an inflection below 4.5% rate environment. Currently at 4.75%.",
    recommendation: "Terra should position now for transaction volume surge. Build institutional buyer workflow that pre-indexes distressed properties at current valuations. Carlota Jo should accelerate estate acquisition advisory services for principals looking to deploy liquidity.",
    confidence: 74,
    responseWindow: "120 days",
  },
  {
    id: "crowdstrike-outage-aftermath",
    title: "CrowdStrike managed services gap — 34% of enterprise SOC seeking alternatives",
    category: "Competitive",
    urgency: "High",
    urgencyColor: "#e05a5a",
    impact: "Positive",
    impactColor: "#6aaa72",
    affectedCompanies: ["PARAGON"],
    companyColors: ["#6366f1"],
    icon: TrendingUp,
    date: "Apr 5, 2026",
    summary: "Post-outage survey data shows 34% of enterprise security teams are actively evaluating SOC alternatives to CrowdStrike's managed services tier. Budget is allocated — buyers are in active evaluation cycles with 90-day decision windows.",
    recommendation: "Aegis should launch a 'SOC Continuity Guarantee' positioning. Differentiate on managed human-in-the-loop escalation (vs. fully automated CrowdStrike). Target mid-market with 45-day pilot → annual contract motion.",
    confidence: 82,
    responseWindow: "45 days",
  },
  {
    id: "russia-shipping-sanctions",
    title: "OFAC expands Russia oil shipping sanctions — fleet re-registration wave",
    category: "Geopolitical",
    urgency: "Critical",
    urgencyColor: "#e05a5a",
    impact: "Mixed",
    impactColor: "#c4924a",
    affectedCompanies: ["SEXTANT", "PARAGON"],
    companyColors: ["#3aa4dc", "#6366f1"],
    icon: AlertTriangle,
    date: "Apr 3, 2026",
    summary: "OFAC announced expansion of Russia oil shipping sanctions targeting 47 additional vessels and 12 management companies. Estimated 180+ vessels will seek re-registration to avoid sanctions exposure. Shadow fleet tracking becomes critical compliance requirement.",
    recommendation: "Vessels' AIS + ownership tracking is the highest-value product in this environment. Immediate outreach to compliance teams at major trading houses, refiners, and commodity desks. Aegis should flag this to maritime insurer clients.",
    confidence: 96,
    responseWindow: "30 days",
  },
  {
    id: "legaltech-ai-consolidation",
    title: "Harvey, Ironclad in M&A discussions — LegalTech consolidation wave",
    category: "Competitive",
    urgency: "Medium",
    urgencyColor: "#c4924a",
    impact: "Positive",
    impactColor: "#6aaa72",
    affectedCompanies: ["PRAXIS"],
    companyColors: ["#a855f7"],
    icon: TrendingDown,
    date: "Mar 28, 2026",
    summary: "Sources indicate Harvey and Ironclad are in M&A discussions. If this deal closes, it creates the dominant LegalTech platform — but also significant integration disruption and client uncertainty. Historically, competitor M&A creates 6–18 month windows where clients freeze contract renewals.",
    recommendation: "PRISM should accelerate deals with Harvey or Ironclad customers whose renewal dates fall in the next 12 months. Position as 'stability alternative' during integration uncertainty. Prepare a 'migration from Harvey' playbook.",
    confidence: 68,
    responseWindow: "60 days",
  },
  {
    id: "uhnw-family-office-growth",
    title: "Family office formation rate at 20-year high — UHNW market expansion",
    category: "Macro",
    urgency: "Low",
    urgencyColor: "#38bee0",
    impact: "Positive",
    impactColor: "#6aaa72",
    affectedCompanies: ["Carlota Jo"],
    companyColors: ["#c4924a"],
    icon: TrendingUp,
    date: "Mar 22, 2026",
    summary: "UBS and Knight Frank report family office formation at highest rate in 20 years. New wealth from tech exits, crypto, and alternative assets creating a new tier of UHNW principals who lack established advisor relationships and lifestyle management infrastructure.",
    recommendation: "Carlota Jo should develop a 'New Family Office' onboarding package targeting newly wealthy principals in the $30–150M net worth range. First-generation principals are highest-retention clients once relationships are established.",
    confidence: 85,
    responseWindow: "180 days",
  },
];

const URGENCY_ORDER: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

export default function MarketSignalsPage() {
  const __pageMeta = usePageMeta({
    title: "Market Timing Signals — SZL Holdings Venture Intelligence",
    description: "AI monitoring of macro trends, regulatory shifts, and competitive changes affecting SZL portfolio companies — with recommended strategic responses.",
    canonical: "https://szlholdings.com/venture-intelligence/market-signals",
  });

  const [filter, setFilter] = useState<SignalCategory>("All");
  const [expanded, setExpanded] = useState<string | null>(SIGNALS[0]?.id ?? null);

  const filtered = SIGNALS
    .filter(s => filter === "All" || s.category === filter)
    .sort((a, b) => URGENCY_ORDER[a.urgency]! - URGENCY_ORDER[b.urgency]!);

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
                  Market Signals
                </p>
                <h1 style={{ fontSize: "clamp(1.75rem,3.5vw,2.75rem)", fontWeight: 700, letterSpacing: "-0.026em", color: "hsl(38,12%,94%)", lineHeight: 1.1, marginBottom: "0.75rem", fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>
                  Market Timing Signals
                </h1>
                <p style={{ fontSize: "0.875rem", color: "hsl(210,5%,52%)", lineHeight: 1.65, maxWidth: "38rem" }}>
                  AI monitoring of macro trends, regulatory shifts, and competitive landscape changes — with recommended strategic responses and timing guidance for each portfolio company.
                </p>
              </m.div>
            </div>
          </section>
  
          <section style={{ padding: "2rem 0 clamp(4rem,7vw,6rem)" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
                {SIGNAL_CATEGORIES.map(c => (
                  <button
                    key={c}
                    onClick={() => setFilter(c)}
                    style={{
                      padding: "0.375rem 0.875rem",
                      borderRadius: "4px",
                      border: `1px solid ${filter === c ? "hsla(0,0%,100%,0.2)" : "hsla(0,0%,100%,0.07)"}`,
                      background: filter === c ? "hsla(0,0%,100%,0.06)" : "transparent",
                      color: filter === c ? "hsl(38,12%,88%)" : "hsl(210,5%,50%)",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif",
                    }}
                  >
                    {c}
                  </button>
                ))}
                <span style={{ marginLeft: "auto", fontSize: "11px", color: "hsl(210,5%,42%)", display: "flex", alignItems: "center", gap: "5px" }}>
                  <Radio size={11} />
                  {filtered.length} signals active
                </span>
              </div>
  
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {filtered.map((signal, i) => {
                  const Icon = signal.icon;
                  const isExpanded = expanded === signal.id;
                  return (
                    <m.div
                      key={signal.id}
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35, delay: i * 0.04 }}
                      style={{ border: `1px solid ${isExpanded ? "hsla(0,0%,100%,0.1)" : "hsla(0,0%,100%,0.05)"}`, borderRadius: "8px", overflow: "hidden", transition: "border-color 0.2s ease" }}
                    >
                      <button
                        onClick={() => setExpanded(isExpanded ? null : signal.id)}
                        style={{ width: "100%", padding: "1.125rem 1.5rem", textAlign: "left", background: isExpanded ? "hsl(210,12%,7%)" : "transparent", border: "none", cursor: "pointer" }}
                      >
                        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "0.875rem", alignItems: "center" }}>
                          <Icon size={14} style={{ color: signal.urgencyColor }} />
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                              <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "2px", background: `${signal.urgencyColor}18`, color: signal.urgencyColor, letterSpacing: "0.06em" }}>{signal.urgency}</span>
                              <span style={{ fontSize: "9px", fontWeight: 600, padding: "2px 6px", borderRadius: "2px", background: "hsla(0,0%,100%,0.04)", color: "hsl(210,5%,48%)" }}>{signal.category}</span>
                              {signal.affectedCompanies.map((c, idx) => (
                                <span key={c} style={{ fontSize: "9px", fontWeight: 700, color: signal.companyColors[idx], padding: "2px 6px", border: `1px solid ${signal.companyColors[idx]}30`, borderRadius: "2px" }}>{c}</span>
                              ))}
                              <span style={{ fontSize: "9px", color: "hsl(210,5%,36%)", marginLeft: "auto" }}>{signal.date}</span>
                            </div>
                            <p style={{ fontSize: "13.5px", fontWeight: 700, color: "hsl(38,12%,88%)", letterSpacing: "-0.01em", fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>{signal.title}</p>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontSize: "9px", color: "hsl(210,5%,40%)", marginBottom: "2px" }}>Confidence</div>
                            <div style={{ fontSize: "14px", fontWeight: 800, color: signal.impactColor, fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>{signal.confidence}%</div>
                          </div>
                        </div>
                      </button>
                      {isExpanded && (
                        <m.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          style={{ padding: "0 1.5rem 1.5rem", borderTop: "1px solid hsla(0,0%,100%,0.05)" }}
                        >
                          <p style={{ fontSize: "12.5px", color: "hsl(210,5%,55%)", lineHeight: 1.75, marginTop: "1.125rem", marginBottom: "1.125rem" }}>{signal.summary}</p>
                          <div style={{ padding: "1rem 1.125rem", background: "hsla(0,0%,100%,0.025)", borderRadius: "6px", borderLeft: `3px solid ${signal.impactColor}` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                              <Zap size={11} style={{ color: signal.impactColor }} />
                              <span style={{ fontSize: "10px", fontWeight: 700, color: signal.impactColor, textTransform: "uppercase", letterSpacing: "0.08em" }}>Strategic Recommendation · {signal.responseWindow} window</span>
                            </div>
                            <p style={{ fontSize: "12px", color: "hsl(210,5%,60%)", lineHeight: 1.7 }}>{signal.recommendation}</p>
                          </div>
                        </m.div>
                      )}
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
