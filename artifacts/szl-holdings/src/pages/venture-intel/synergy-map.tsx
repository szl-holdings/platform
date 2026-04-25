import { useState } from "react";
import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, GitMerge, ArrowRight, DollarSign } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const SYNERGIES = [
  {
    id: "aegis-vessels",
    source: "Aegis",
    target: "Vessels",
    sourceColor: "#6366f1",
    targetColor: "#3aa4dc",
    category: "Cross-sell",
    value: "$4.2M",
    annualOpportunity: 4200000,
    status: "Active",
    statusColor: "#38bee0",
    title: "Maritime Cyber Defense Bundle",
    description: "Aegis SOC capabilities bundled with Vessels maritime intelligence subscriptions. Ship operators managing high-value cargo lanes have regulatory cybersecurity obligations under IMO 2021 resolution MSC-FAL.1/Circ.3. Aegis provides the cyber layer; Vessels provides the operational layer.",
    mechanism: "Vessels identifies vessels with cyber risk indicators (flag state, ownership structure, cargo type). Aegis provides automated cyber posture assessment and continuous monitoring. Bundle priced at 40% premium to standalone.",
    pipeline: "38 Vessels enterprise clients identified as qualified for cyber bundle",
    conversionTarget: "65% conversion rate → $2.7M incremental ARR",
  },
  {
    id: "terra-prism",
    source: "Terra",
    target: "PRAXIS",
    sourceColor: "#6b9c30",
    targetColor: "#a855f7",
    category: "Data Feed",
    value: "$2.8M",
    annualOpportunity: 2800000,
    status: "In Development",
    statusColor: "#c4924a",
    title: "Distress Property → Litigation Pipeline",
    description: "Terra's ACRIS-linked distress signal detection feeds PRAXIS's matter intake pipeline. When Terra identifies a property in financial distress (foreclosure filings, tax lien escalation, ownership transfer under duress), PRAXIS receives a referral alert for potential litigation matter.",
    mechanism: "Terra automated distress classifier publishes events to shared Counsel event bus. PRAXIS matter intake agent evaluates eligibility and creates pre-qualified matter shells. Attorneys receive pre-populated intake with full property intelligence.",
    pipeline: "Terra averages 340 distress signals monthly across NYC portfolio",
    conversionTarget: "12% matter conversion rate → $2.8M incremental matter value",
  },
  {
    id: "carlota-vessels",
    source: "Carlota Jo",
    target: "Vessels",
    sourceColor: "#c4924a",
    targetColor: "#3aa4dc",
    category: "Referral",
    value: "$1.9M",
    annualOpportunity: 1900000,
    status: "Active",
    statusColor: "#38bee0",
    title: "UHNW Client Fleet Intelligence",
    description: "Carlota Jo serves principals who own or charter private vessels. Vessels provides the intelligence layer for their maritime assets — voyage planning, flag registry monitoring, AIS tracking of chartered vessels, and cargo movement alerts for commodity-invested clients.",
    mechanism: "Carlota Jo relationship managers identify vessel-owning clients. Vessels onboarded as premium concierge tier with white-glove support. Revenue split with Carlota Jo on referral basis.",
    pipeline: "14 existing Carlota Jo clients with identified vessel interests",
    conversionTarget: "Vessels premium tier pricing → $1.9M ARR at full conversion",
  },
  {
    id: "lyte-aegis",
    source: "Lyte",
    target: "Aegis",
    sourceColor: "#38bee0",
    targetColor: "#6366f1",
    category: "Platform",
    value: "$3.1M",
    annualOpportunity: 3100000,
    status: "Active",
    statusColor: "#38bee0",
    title: "Operational Signal → Security Alert Correlation",
    description: "Lyte's operational signal intelligence feeds directly into Aegis threat detection. Anomalies in business process metrics (sudden SLA degradation, unusual access patterns, workflow failures) are correlated with Aegis threat signals for early breach detection — operational data as a security sensor.",
    mechanism: "Lyte signals normalized through Counsel event bus. Aegis SIEM ingests as custom telemetry feed. Joint clients get correlated view: business anomaly + security context in single interface.",
    pipeline: "22 Lyte enterprise clients are Aegis-eligible by sector profile",
    conversionTarget: "Aegis add-on at 30% uplift → $3.1M in joint contract value",
  },
  {
    id: "terra-carlota",
    source: "Terra",
    target: "Carlota Jo",
    sourceColor: "#6b9c30",
    targetColor: "#c4924a",
    category: "Intelligence",
    value: "$1.4M",
    annualOpportunity: 1400000,
    status: "Planned",
    statusColor: "hsl(210,5%,42%)",
    title: "UHNW Property Intelligence Service",
    description: "Carlota Jo principals require institutional-grade real estate intelligence for acquisition decisions, portfolio monitoring, and market timing. Terra provides proprietary market data, cap rate analytics, and distress signals that give UHNW clients CRE intelligence their advisors cannot match.",
    mechanism: "Terra generates bespoke property intelligence reports for Carlota Jo clients. White-labeled as 'Estate Intelligence by Carlota Jo'. Delivered as premium advisory add-on.",
    pipeline: "8 Carlota Jo principals with active real estate portfolios",
    conversionTarget: "Annual intelligence retainer → $1.4M ARR",
  },
  {
    id: "prism-aegis",
    source: "PRAXIS",
    target: "Aegis",
    sourceColor: "#a855f7",
    targetColor: "#6366f1",
    category: "Compliance",
    value: "$2.2M",
    annualOpportunity: 2200000,
    status: "In Development",
    statusColor: "#c4924a",
    title: "Cyber Regulatory Compliance Pipeline",
    description: "PRAXIS clients in regulated sectors (financial, maritime, healthcare) face increasing cybersecurity regulatory mandates. PRAXIS identifies compliance obligations during matter intake; Aegis delivers the technical compliance solution. Legal identifies the need; security fills it.",
    mechanism: "PRAXIS compliance assessment flags cyber regulatory exposure. Aegis receives warm referral with regulatory context pre-populated. Joint proposal developed with legal + technical remediation bundled.",
    pipeline: "45 PRAXIS matters identified with cyber compliance component",
    conversionTarget: "Aegis retainer at $49K avg → $2.2M pipeline at 100% conversion",
  },
];

const TOTAL_OPPORTUNITY = SYNERGIES.reduce((acc, s) => acc + s.annualOpportunity, 0);

export default function SynergyMapPage() {
  const __pageMeta = usePageMeta({
    title: "Cross-Portfolio Connections — SZL Holdings Venture Intelligence",
    description: "Revenue synergies between SZL portfolio companies — quantified and actionable.",
    canonical: "https://szlholdings.com/venture-intelligence/synergy-map",
  });

  const [activeSynergy, setActiveSynergy] = useState<string>(SYNERGIES[0]?.id);
  const detail = SYNERGIES.find(s => s.id === activeSynergy) ?? SYNERGIES[0]!;

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
                  Portfolio Connections
                </p>
                <h1 style={{ fontSize: "clamp(1.75rem,3.5vw,2.75rem)", fontWeight: 700, letterSpacing: "-0.026em", color: "hsl(38,12%,94%)", lineHeight: 1.1, marginBottom: "0.75rem", fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>
                  Cross-Portfolio Connections
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
                  <p style={{ fontSize: "0.875rem", color: "hsl(210,5%,52%)", lineHeight: 1.65, maxWidth: "36rem" }}>
                    Revenue synergies between portfolio companies — identified, quantified, and tracked by the AI synergy engine.
                  </p>
                  <div style={{ flexShrink: 0 }}>
                    <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "#6aaa72", letterSpacing: "-0.03em", lineHeight: 1, fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>
                      ${(TOTAL_OPPORTUNITY / 1000000).toFixed(1)}M
                    </p>
                    <p style={{ fontSize: "9px", color: "hsl(210,5%,42%)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Total annual opportunity</p>
                  </div>
                </div>
              </m.div>
            </div>
          </section>
  
          <section style={{ padding: "2rem 0 clamp(4rem,7vw,6rem)" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 3fr", gap: "1.5rem", alignItems: "start" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {SYNERGIES.map(s => (
                    <m.button
                      key={s.id}
                      onClick={() => setActiveSynergy(s.id)}
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35 }}
                      style={{
                        padding: "1rem 1.125rem",
                        border: `1px solid ${activeSynergy === s.id ? "hsla(0,0%,100%,0.14)" : "hsla(0,0%,100%,0.06)"}`,
                        background: activeSynergy === s.id ? "hsla(0,0%,100%,0.04)" : "transparent",
                        borderRadius: "6px",
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: s.sourceColor }} />
                          <span style={{ fontSize: "11.5px", fontWeight: 700, color: "hsl(38,12%,85%)" }}>{s.source}</span>
                          <ArrowRight size={10} style={{ color: "hsl(210,5%,40%)" }} />
                          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: s.targetColor }} />
                          <span style={{ fontSize: "11.5px", fontWeight: 700, color: "hsl(38,12%,85%)" }}>{s.target}</span>
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "#6aaa72", fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>{s.value}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "2px", background: "hsla(0,0%,100%,0.05)", color: "hsl(210,5%,48%)", fontWeight: 600, letterSpacing: "0.06em" }}>{s.category}</span>
                        <span style={{ fontSize: "9px", fontWeight: 600, color: s.statusColor }}>{s.status}</span>
                      </div>
                    </m.button>
                  ))}
                </div>
  
                <m.div
                  key={activeSynergy}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  style={{ border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "8px", padding: "1.75rem", position: "sticky", top: "1rem" }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.375rem" }}>
                        <GitMerge size={14} style={{ color: "hsl(210,5%,45%)" }} />
                        <h2 style={{ fontSize: "16px", fontWeight: 700, color: "hsl(38,12%,92%)", letterSpacing: "-0.01em", fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>{detail.title}</h2>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: detail.sourceColor }} />
                          <span style={{ fontSize: "12px", color: "hsl(38,12%,78%)", fontWeight: 600 }}>{detail.source}</span>
                        </span>
                        <ArrowRight size={11} style={{ color: "hsl(210,5%,38%)" }} />
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: detail.targetColor }} />
                          <span style={{ fontSize: "12px", color: "hsl(38,12%,78%)", fontWeight: 600 }}>{detail.target}</span>
                        </span>
                        <span style={{ fontSize: "9px", fontWeight: 600, padding: "2px 6px", borderRadius: "2px", background: `${detail.statusColor}18`, color: detail.statusColor, marginLeft: "4px" }}>{detail.status}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end" }}>
                        <DollarSign size={14} style={{ color: "#6aaa72" }} />
                        <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#6aaa72", letterSpacing: "-0.03em", fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>{detail.value}</span>
                      </div>
                      <span style={{ fontSize: "9px", color: "hsl(210,5%,42%)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Annual opportunity</span>
                    </div>
                  </div>
  
                  <p style={{ fontSize: "12.5px", color: "hsl(210,5%,55%)", lineHeight: 1.75, marginBottom: "1.25rem" }}>{detail.description}</p>
  
                  <div style={{ borderTop: "1px solid hsla(0,0%,100%,0.06)", paddingTop: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {[
                      { label: "Mechanism", content: detail.mechanism },
                      { label: "Pipeline", content: detail.pipeline },
                      { label: "Conversion Target", content: detail.conversionTarget },
                    ].map(item => (
                      <div key={item.label}>
                        <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "hsl(210,5%,40%)", marginBottom: "0.375rem" }}>{item.label}</p>
                        <p style={{ fontSize: "12px", color: "hsl(210,5%,58%)", lineHeight: 1.65 }}>{item.content}</p>
                      </div>
                    ))}
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
