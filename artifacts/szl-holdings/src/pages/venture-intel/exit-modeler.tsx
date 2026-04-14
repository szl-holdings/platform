import { useState } from "react";
import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, BarChart3, TrendingUp, Clock, DollarSign } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, CartesianGrid,
} from "recharts";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const COMPANIES = [
  {
    id: "lyte",
    name: "Lyte",
    color: "#38bee0",
    rgb: "56,190,224",
    currentArr: "12.4M",
    arrGrowthRate: 18,
    currentValuation: "$148M",
    scenarios: [
      {
        type: "Strategic Acquisition",
        icon: "🤝",
        probability: 55,
        timing: "18–30 months",
        valuation: { bear: "$320M", base: "$440M", bull: "$580M" },
        multiple: "32–47× ARR",
        acquirerProfile: "Enterprise software consolidator (ServiceNow, Datadog, PagerDuty tier)",
        rationale: "Operational intelligence category is hot M&A territory. Lyte's NRR >124% and proprietary agent layer command premium multiples from strategic acquirers who need the workflow coverage Lyte owns.",
        comparables: ["Datadog acquired Sqreen at 40× ARR", "PagerDuty acquired Rundeck at 38× ARR"],
        keyDrivers: ["NRR > 120%", "Agent-native architecture", "Enterprise contracts > 50K ARR"],
      },
      {
        type: "Series C / Growth Round",
        icon: "💰",
        probability: 35,
        timing: "12–18 months",
        valuation: { bear: "$240M", base: "$310M", bull: "$420M" },
        multiple: "22–34× ARR",
        acquirerProfile: "Tier-1 growth equity (Tiger Global, General Atlantic, Insight Partners tier)",
        rationale: "At current trajectory, Lyte hits the scale inflection point where institutional growth investors get competitive around Series C. The operational observability category comps warrant 25–35× forward ARR.",
        comparables: ["Incident.io raised at 28× ARR", "incident.io Series C benchmark"],
        keyDrivers: ["18% MoM growth rate", "Capital efficiency < 1.5× burn multiple", "Enterprise sales motion"],
      },
      {
        type: "IPO",
        icon: "📈",
        probability: 10,
        timing: "36–48 months",
        valuation: { bear: "$580M", base: "$820M", bull: "$1.2B" },
        multiple: "35–60× ARR",
        acquirerProfile: "Public markets — NYSE/Nasdaq listing",
        rationale: "IPO requires $30M+ ARR and demonstrated public company operational discipline. Achievable in 3–4 years at current trajectory. The AI-native operational intelligence category is likely to have strong public market appetite by 2028–2029.",
        comparables: ["Datadog IPO at 38× forward ARR", "HashiCorp IPO at 32× ARR"],
        keyDrivers: ["$30M+ ARR threshold", "Rule of 40 compliance", "90+ NPS"],
      },
    ],
    optimalTiming: "Acquisition — 24 months",
    optimalValue: "$440M base case",
    recommendation: "Maximize time to 24-month M&A exit. Invest in enterprise sales team and strategic partner relationships with likely acquirers. Begin confidential acquirer conversations at 18 months.",
  },
  {
    id: "vessels",
    name: "Vessels",
    color: "#3aa4dc",
    rgb: "58,164,220",
    currentArr: "8.2M",
    arrGrowthRate: 14,
    currentValuation: "$98M",
    scenarios: [
      {
        type: "Strategic Acquisition",
        icon: "🤝",
        probability: 60,
        timing: "24–36 months",
        valuation: { bear: "$180M", base: "$260M", bull: "$380M" },
        multiple: "22–46× ARR",
        acquirerProfile: "Data/intelligence platform (IHS Markit, S&P Global, LSEG tier) or maritime tech (Wärtsilä, DNV)",
        rationale: "Maritime intelligence is a consolidating category. IHS Markit-tier data companies pay premium for proprietary vessel and commodity data. IMO regulatory tailwinds make acquisition timing optimal at the 24–30 month mark.",
        comparables: ["IHS Markit acquired OceanScore", "LSEG maritime data acquisitions at 3–5× revenue"],
        keyDrivers: ["2,400+ vessel coverage", "OFAC/sanctions compliance feed", "Proprietary AIS + ownership data"],
      },
      {
        type: "Private Equity Platform",
        icon: "🏦",
        probability: 25,
        timing: "30–42 months",
        valuation: { bear: "$140M", base: "$195M", bull: "$265M" },
        multiple: "17–32× ARR",
        acquirerProfile: "Maritime-focused PE (Montagu, Equistone) building logistics intelligence platform",
        rationale: "PE roll-up of maritime tech is an emerging category. Vessels as platform acquisition, then bolt-on AIS, port, and freight assets. Exit via strategic sale in 5–7 year horizon.",
        comparables: ["Kpler PE-backed to strategic sale at 6× revenue"],
        keyDrivers: ["Recurring revenue base", "Enterprise contract stickiness", "Regulatory compliance moat"],
      },
      {
        type: "IPO",
        icon: "📈",
        probability: 15,
        timing: "48–60 months",
        valuation: { bear: "$320M", base: "$480M", bull: "$720M" },
        multiple: "28–55× ARR",
        acquirerProfile: "Public markets — specialized maritime data company",
        rationale: "Longer path to IPO given category maturity and public market precedent. MarineTraffic/Kpler trajectory shows the category can reach $500M+ revenue at scale. Vessels at $50M+ ARR would be IPO-eligible.",
        comparables: ["MarineTraffic private valuation trajectory", "Kpler pre-IPO estimates"],
        keyDrivers: ["$25M+ ARR milestone", "Global port coverage expansion", "Commodity intelligence layer"],
      },
    ],
    optimalTiming: "Acquisition — 28 months",
    optimalValue: "$260M base case",
    recommendation: "Build strategic acquirer relationship program immediately. Target IHS Markit, S&P Global, and LSEG business development teams. Regulatory tailwinds make the next 24–36 months the optimal acquisition window.",
  },
  {
    id: "aegis",
    name: "Aegis",
    color: "#6366f1",
    rgb: "99,102,241",
    currentArr: "6.8M",
    arrGrowthRate: 11,
    currentValuation: "$72M",
    scenarios: [
      {
        type: "Strategic Acquisition",
        icon: "🤝",
        probability: 50,
        timing: "30–42 months",
        valuation: { bear: "$150M", base: "$220M", bull: "$320M" },
        multiple: "22–47× ARR",
        acquirerProfile: "Managed security service provider or SOC platform (Secureworks, Arctic Wolf, Huntress)",
        rationale: "Managed SOC is consolidating rapidly. Aegis' maritime cyber specialization is a premium vertical that large MSSPs lack. Combined with Vessels maritime book, creates a defensible vertical MSSP.",
        comparables: ["Arctic Wolf Series F at $1.3B (14× ARR)", "Huntress raised at 25× ARR"],
        keyDrivers: ["Maritime cyber specialization", "MITRE ATT&CK coverage", "Managed SOC economics"],
      },
    ],
    optimalTiming: "Acquisition — 36 months",
    optimalValue: "$220M base case",
    recommendation: "Prioritize CAC reduction through Vessels cross-sell. Reach $15M ARR before pursuing strategic acquirer conversations. The maritime cyber vertical differentiation is the core exit value driver.",
  },
  {
    id: "prism",
    name: "PRISM",
    color: "#a855f7",
    rgb: "168,85,247",
    currentArr: "5.4M",
    arrGrowthRate: 12,
    currentValuation: "$68M",
    scenarios: [
      {
        type: "Strategic Acquisition",
        icon: "🤝",
        probability: 65,
        timing: "24–36 months",
        valuation: { bear: "$130M", base: "$190M", bull: "$280M" },
        multiple: "24–52× ARR",
        acquirerProfile: "LegalTech platform (Clio, Thomson Reuters, LexisNexis, Relativity)",
        rationale: "LegalTech M&A is active and PRISM's AI-native matter intelligence layer is what legacy legal platforms lack. Thomson Reuters and LexisNexis have multi-billion acquisition capacity and active LegalTech acquisition mandates.",
        comparables: ["Thomson Reuters acquired CoCounsel", "Clio acquisition strategy at 15–25× ARR"],
        keyDrivers: ["Matter volume growth >20% QoQ", "AI-powered review automation", "Enterprise law firm penetration"],
      },
    ],
    optimalTiming: "Acquisition — 30 months",
    optimalValue: "$190M base case",
    recommendation: "Accelerate enterprise law firm penetration. Thomson Reuters and LexisNexis are the most natural strategic acquirers — build product partnerships that create strategic dependency before acquisition conversations.",
  },
  {
    id: "terra",
    name: "Terra",
    color: "#6b9c30",
    rgb: "107,156,48",
    currentArr: "4.2M",
    arrGrowthRate: 9,
    currentValuation: "$48M",
    scenarios: [
      {
        type: "Strategic Acquisition",
        icon: "🤝",
        probability: 45,
        timing: "36–48 months",
        valuation: { bear: "$90M", base: "$140M", bull: "$210M" },
        multiple: "21–50× ARR",
        acquirerProfile: "CRE data platform (CoStar, Reonomy, CompStak, Yardi)",
        rationale: "CoStar has acquisition mandate for specialized data layers. Terra's ACRIS-linked distress intelligence is not replicable at CoStar's scale — it's more defensible than it appears. PropTech consolidation creates natural buyer universe.",
        comparables: ["CoStar acquired Homesnap, Ten-X — active acquirer at 3–8× revenue", "Reonomy acquired at premium for data assets"],
        keyDrivers: ["ACRIS proprietary linkage", "Distress signal automation", "NYC market depth"],
      },
    ],
    optimalTiming: "Acquisition — 40 months",
    optimalValue: "$140M base case",
    recommendation: "PRISM synergy pipeline is the fastest path to CAC reduction and valuation improvement. Accelerate Terra-PRISM distress-to-litigation data feed. CoStar partnership is also a potential precursor to acquisition.",
  },
  {
    id: "carlota",
    name: "Carlota Jo",
    color: "#c4924a",
    rgb: "196,146,74",
    currentArr: "2.8M",
    arrGrowthRate: 8,
    currentValuation: "$38M",
    scenarios: [
      {
        type: "Strategic Partnership",
        icon: "🤝",
        probability: 50,
        timing: "24–36 months",
        valuation: { bear: "$60M", base: "$85M", bull: "$120M" },
        multiple: "21–43× ARR",
        acquirerProfile: "Private wealth management or family office services firm (Northern Trust, Bessemer Trust, UHNW concierge platform)",
        rationale: "Carlota Jo's client book is more valuable than its revenue. UHNW relationships with discretionary household management represent 15–20 years of financial relationship value. Family office platforms pay significant premiums for established trust relationships.",
        comparables: ["Quintessentially acquired at premium client book multiple"],
        keyDrivers: [">95% client retention", "Referral-driven acquisition", "UHNW trust relationships"],
      },
      {
        type: "Hold / Compounding",
        icon: "💰",
        probability: 50,
        timing: "Indefinite",
        valuation: { bear: "$55M", base: "$90M", bull: "$160M" },
        multiple: "19–57× ARR",
        acquirerProfile: "SZL Holdings — continued ownership",
        rationale: "Carlota Jo at 62% margin and >95% retention is a compounding asset that improves portfolio access to UHNW relationships. The strategic value to the SZL ecosystem may exceed standalone sale price. Premium to hold.",
        comparables: ["Family office services businesses typically held 10+ years"],
        keyDrivers: ["Strategic UHNW access", "62% margin", "Network effect on other portfolio companies"],
      },
    ],
    optimalTiming: "Hold or Partnership — 36 months",
    optimalValue: "$85M base case",
    recommendation: "Strong case to hold Carlota Jo indefinitely — UHNW relationship access provides portfolio-wide strategic value that exceeds marginal sale premium. If exit, Northern Trust or Bessemer Trust-tier strategic partnership is preferred over PE buyout.",
  },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; color?: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "hsl(210,12%,8%)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", padding: "0.625rem 0.875rem" }}>
      <p style={{ fontSize: "10px", color: "hsl(210,5%,50%)", marginBottom: "4px" }}>{label}</p>
      <p style={{ fontSize: "11px", color: payload[0]?.color ?? "#38bee0", fontWeight: 700 }}>{payload[0]?.value}% probability</p>
    </div>
  );
};

export default function ExitModelerPage() {
  usePageMeta({
    title: "Exit Scenario Modeler — SZL Holdings Venture Intelligence",
    description: "Probability-weighted exit valuations for each SZL portfolio company across acquisition, IPO, and secondary sale scenarios.",
    canonical: "https://szlholdings.com/venture-intelligence/exit-modeler",
  });

  const [selected, setSelected] = useState<string>("lyte");
  const company = COMPANIES.find(c => c.id === selected) ?? COMPANIES[0]!;

  const probData = company.scenarios.map(s => ({
    name: s.type.split(" ")[0],
    probability: s.probability,
  }));

  return (
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
                Exit Modeler
              </p>
              <h1 style={{ fontSize: "clamp(1.75rem,3.5vw,2.75rem)", fontWeight: 700, letterSpacing: "-0.026em", color: "hsl(38,12%,94%)", lineHeight: 1.1, marginBottom: "0.75rem", fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>
                Exit Scenario Modeler
              </h1>
              <p style={{ fontSize: "0.875rem", color: "hsl(210,5%,52%)", lineHeight: 1.65, maxWidth: "38rem" }}>
                Probability-weighted exit valuations across acquisition, IPO, and secondary scenarios — with optimal timing recommendations and comparable transaction analysis for each portfolio company.
              </p>
            </m.div>
          </div>
        </section>

        <section style={{ padding: "2rem 0 clamp(4rem,7vw,6rem)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
            <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap", marginBottom: "2rem" }}>
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

            <m.div
              key={company.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
                {[
                  { label: "Current ARR", value: `$${company.currentArr}`, icon: DollarSign, color: company.color },
                  { label: "ARR Growth", value: `${company.arrGrowthRate}% MoM`, icon: TrendingUp, color: "#6aaa72" },
                  { label: "Current Valuation", value: company.currentValuation, icon: BarChart3, color: "#d4a054" },
                  { label: "Optimal Exit", value: company.optimalTiming.split(" — ")[1] ?? company.optimalTiming, icon: Clock, color: "#a855f7" },
                ].map(stat => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} style={{ padding: "1.125rem 1.375rem", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "6px", background: "hsl(210,12%,6%)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
                        <Icon size={11} style={{ color: stat.color }} />
                        <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "hsl(210,5%,42%)" }}>{stat.label}</p>
                      </div>
                      <p style={{ fontSize: "1.25rem", fontWeight: 800, color: stat.color, letterSpacing: "-0.02em", lineHeight: 1, fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>{stat.value}</p>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {company.scenarios.map(s => (
                    <div key={s.type} style={{ border: `1px solid rgba(${company.rgb},0.14)`, borderRadius: "8px", padding: "1.375rem" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.875rem" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                            <span>{s.icon}</span>
                            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "hsl(38,12%,90%)", letterSpacing: "-0.01em", fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>{s.type}</h3>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <Clock size={10} style={{ color: "hsl(210,5%,42%)" }} />
                            <span style={{ fontSize: "10px", color: "hsl(210,5%,45%)" }}>{s.timing}</span>
                            <span style={{ fontSize: "9px", color: "hsl(210,5%,36%)" }}>·</span>
                            <span style={{ fontSize: "10px", color: "hsl(210,5%,45%)" }}>{s.multiple}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: company.color, letterSpacing: "-0.03em", fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>{s.probability}%</div>
                          <div style={{ fontSize: "9px", color: "hsl(210,5%,40%)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Probability</div>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "0.875rem", padding: "0.75rem", background: "hsla(0,0%,100%,0.025)", borderRadius: "4px" }}>
                        {[
                          { label: "Bear", value: s.valuation.bear },
                          { label: "Base", value: s.valuation.base },
                          { label: "Bull", value: s.valuation.bull },
                        ].map(v => (
                          <div key={v.label} style={{ textAlign: "center" }}>
                            <p style={{ fontSize: "11px", fontWeight: 700, color: "hsl(38,12%,82%)", fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>{v.value}</p>
                            <p style={{ fontSize: "9px", color: "hsl(210,5%,40%)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{v.label}</p>
                          </div>
                        ))}
                      </div>

                      <p style={{ fontSize: "11.5px", color: "hsl(210,5%,52%)", lineHeight: 1.7, marginBottom: "0.75rem" }}>{s.rationale}</p>

                      <div>
                        <p style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "hsl(210,5%,38%)", marginBottom: "0.375rem" }}>Comparable Transactions</p>
                        {s.comparables.map((comp, i) => (
                          <p key={i} style={{ fontSize: "10.5px", color: "hsl(210,5%,46%)", marginBottom: "2px" }}>· {comp}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", position: "sticky", top: "1rem" }}>
                  <div style={{ border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "8px", padding: "1.375rem" }}>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "hsl(38,12%,80%)", marginBottom: "1.125rem", fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>Scenario Probability</p>
                    <div style={{ height: "180px" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={probData} margin={{ top: 0, right: 10, bottom: 0, left: -24 }}>
                          <CartesianGrid strokeDasharray="2 4" stroke="hsla(0,0%,100%,0.04)" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(210,5%,44%)" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 9, fill: "hsl(210,5%,36%)" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="probability" radius={[3, 3, 0, 0]}>
                            {probData.map((_, idx) => (
                              <Cell key={`cell-${idx}`} fill={company.color} fillOpacity={0.75 - idx * 0.15} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div style={{ border: `1px solid rgba(${company.rgb},0.2)`, borderRadius: "8px", padding: "1.375rem", background: `rgba(${company.rgb},0.03)` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: company.color }} />
                      <p style={{ fontSize: "11px", fontWeight: 700, color: "hsl(38,12%,80%)", fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>Optimal Exit Path</p>
                    </div>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: company.color, marginBottom: "0.25rem", fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>{company.optimalTiming}</p>
                    <p style={{ fontSize: "12px", color: "hsl(38,12%,72%)", fontWeight: 600, marginBottom: "0.875rem", fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>{company.optimalValue}</p>
                    <p style={{ fontSize: "11.5px", color: "hsl(210,5%,52%)", lineHeight: 1.7 }}>{company.recommendation}</p>
                  </div>
                </div>
              </div>
            </m.div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
