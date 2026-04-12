import { useState } from "react";
import { Dna, Search, MapPin, ChevronRight, TrendingUp, TrendingDown, Shield, AlertTriangle, Eye, BarChart3, Layers } from "lucide-react";

const ACCENT = "#c8a060";
const BG = { page: "#060a07", surface: "#0a0e08", elevated: "#0e1209" } as const;
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.08)" } as const;
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)" } as const;

type GenomeCategory = "ownership" | "zoning" | "financials" | "physical" | "market" | "risk" | "demographics" | "transit";

interface GenomeAttribute {
  key: string;
  label: string;
  value: string | number;
  score?: number;
  signal: "positive" | "neutral" | "negative" | "watch";
  category: GenomeCategory;
  description?: string;
}

interface PropertyProfile {
  id: string;
  address: string;
  borough: string;
  class: "A" | "B" | "C";
  units: number;
  sqft: number;
  yearBuilt: number;
  zoning: string;
  genome: GenomeAttribute[];
  overallScore: number;
  distressScore: number;
  opportunityScore: number;
  avm: number;
}

const CATEGORY_CONFIG: Record<GenomeCategory, { label: string; color: string; icon: React.ElementType }> = {
  ownership: { label: "Ownership DNA", color: "#c8a060", icon: Shield },
  zoning: { label: "Zoning DNA", color: "#7ba3d4", icon: Layers },
  financials: { label: "Financial Health", color: "#22c55e", icon: TrendingUp },
  physical: { label: "Physical Profile", color: "#a78bfa", icon: BarChart3 },
  market: { label: "Market Position", color: "#f59e0b", icon: TrendingUp },
  risk: { label: "Risk Factors", color: "#ef4444", icon: AlertTriangle },
  demographics: { label: "Demographics", color: "#64748b", icon: Eye },
  transit: { label: "Transit Access", color: "#22d3ee", icon: MapPin },
};

const SIGNAL_CONFIG = {
  positive: { color: "#22c55e", dot: "#22c55e" },
  neutral: { color: "rgba(255,255,255,0.5)", dot: "rgba(255,255,255,0.3)" },
  negative: { color: "#ef4444", dot: "#ef4444" },
  watch: { color: "#f59e0b", dot: "#f59e0b" },
};

const GENOME_ATTRS: GenomeAttribute[] = [
  // Ownership
  { key: "o1", label: "Ownership Duration", value: "3.2 years", score: 62, signal: "watch", category: "ownership", description: "Short hold period suggests potential distress or flip strategy" },
  { key: "o2", label: "Entity Type", value: "Single-member LLC", score: 45, signal: "watch", category: "ownership", description: "Opaque structure; UBO not fully disclosed" },
  { key: "o3", label: "Ownership Velocity", value: "4 transfers in 12yr", score: 38, signal: "negative", category: "ownership", description: "High transfer frequency — above-median for block" },
  { key: "o4", label: "Portfolio Health", value: "3 liens across portfolio", score: 31, signal: "negative", category: "ownership", description: "Owner entity has active liens on 3 of 7 owned properties" },
  { key: "o5", label: "Tax Compliance", value: "1 cycle delinquent", score: 28, signal: "negative", category: "ownership", description: "$84,200 in delinquent NYC taxes, Q4 2025" },

  // Zoning
  { key: "z1", label: "Zoning District", value: "R6B", score: 72, signal: "positive", category: "zoning", description: "Moderate density residential — upzoning potential" },
  { key: "z2", label: "FAR Utilization", value: "71%", score: 71, signal: "neutral", category: "zoning", description: "29% unutilized floor area ratio — development upside available" },
  { key: "z3", label: "Air Rights", value: "8,400 sqft available", score: 80, signal: "positive", category: "zoning", description: "Transferable air rights with current neighbour gap" },
  { key: "z4", label: "Overlay District", value: "C2-3 Commercial", score: 68, signal: "positive", category: "zoning", description: "Ground floor commercial use permitted" },
  { key: "z5", label: "Upzoning Probability", value: "High (83%)", score: 83, signal: "positive", category: "zoning", description: "Block in active NYC comprehensive plan review cycle" },

  // Financials
  { key: "f1", label: "NOI (Est.)", value: "$284,000/yr", score: 66, signal: "neutral", category: "financials" },
  { key: "f2", label: "Cap Rate", value: "4.8%", score: 55, signal: "neutral", category: "financials" },
  { key: "f3", label: "Rent Roll Quality", value: "Below-market avg 18%", score: 40, signal: "watch", category: "financials", description: "18% below market for comparable units — rent upside exists" },
  { key: "f4", label: "DSCR", value: "0.92x", score: 22, signal: "negative", category: "financials", description: "Below 1.0x threshold — debt may not be self-servicing" },
  { key: "f5", label: "Lien Stack", value: "2 mortgages + 1 mechanic", score: 18, signal: "negative", category: "financials", description: "Mechanic's lien filed June 2025, $128,000" },
  { key: "f6", label: "Debt Balance", value: "$3.84M", score: 35, signal: "watch", category: "financials" },

  // Physical
  { key: "p1", label: "Year Built", value: 1927, score: 44, signal: "neutral", category: "physical" },
  { key: "p2", label: "Last Major Renovation", value: "2011", score: 52, signal: "watch", category: "physical", description: "14-year-old renovation — capital needs likely in near term" },
  { key: "p3", label: "Building Class", value: "B", score: 58, signal: "neutral", category: "physical" },
  { key: "p4", label: "Open DOB Violations", value: "2 active", score: 35, signal: "watch", category: "physical", description: "2 open DOB Class 1 violations, unresolved since 2024" },
  { key: "p5", label: "Façade Compliance", value: "Current (FISP Cycle 9)", score: 78, signal: "positive", category: "physical" },
  { key: "p6", label: "Mechanical Systems", value: "Aged — pre-2000", score: 30, signal: "negative", category: "physical" },

  // Market
  { key: "m1", label: "AVM", value: "$5,900,000", score: 65, signal: "neutral", category: "market" },
  { key: "m2", label: "12-Month Appreciation", value: "+4.1%", score: 72, signal: "positive", category: "market" },
  { key: "m3", label: "Block Comp Velocity", value: "7 sales in 12mo", score: 62, signal: "positive", category: "market", description: "Active block — liquidity above borough median" },
  { key: "m4", label: "Rent Growth (1yr)", value: "+6.8%", score: 78, signal: "positive", category: "market" },
  { key: "m5", label: "Gentrification Vector", value: "High (89)", score: 89, signal: "positive", category: "market", description: "Neighborhood in top decile for demographic shift velocity" },

  // Risk
  { key: "r1", label: "Flood Zone", value: "Zone X (minimal)", score: 88, signal: "positive", category: "risk" },
  { key: "r2", label: "Environmental Flags", value: "None", score: 92, signal: "positive", category: "risk" },
  { key: "r3", label: "Historic District", value: "No", score: 85, signal: "positive", category: "risk" },
  { key: "r4", label: "Pending Litigation", value: "1 tenant case", score: 42, signal: "watch", category: "risk" },
  { key: "r5", label: "Rent Stabilization", value: "14 of 18 units", score: 28, signal: "negative", category: "risk", description: "78% of units are rent-stabilized — limits NOI upside" },

  // Demographics
  { key: "d1", label: "Population Growth (3yr)", value: "+8.2%", score: 76, signal: "positive", category: "demographics" },
  { key: "d2", label: "Median Income Δ", value: "+12% in 3yr", score: 80, signal: "positive", category: "demographics" },
  { key: "d3", label: "Renter Proportion", value: "74%", score: 68, signal: "neutral", category: "demographics" },
  { key: "d4", label: "Age Median", value: "34 years", score: 72, signal: "positive", category: "demographics" },

  // Transit
  { key: "t1", label: "Subway Score", value: "94/100", score: 94, signal: "positive", category: "transit" },
  { key: "t2", label: "Walk Score", value: "88/100", score: 88, signal: "positive", category: "transit" },
  { key: "t3", label: "Bike Score", value: "72/100", score: 72, signal: "positive", category: "transit" },
  { key: "t4", label: "Distance to Station", value: "180m", score: 90, signal: "positive", category: "transit" },
];

const PROPERTY: PropertyProfile = {
  id: "prop-247", address: "247 W 116th St", borough: "Manhattan", class: "B", units: 18, sqft: 14400, yearBuilt: 1927,
  zoning: "R6B / C2-3", genome: GENOME_ATTRS, overallScore: 58, distressScore: 72, opportunityScore: 64, avm: 5_900_000,
};

function DnaStrand({ attrs, activeCategory }: { attrs: GenomeAttribute[]; activeCategory: GenomeCategory | "all" }) {
  const displayed = activeCategory === "all" ? attrs : attrs.filter(a => a.category === activeCategory);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {displayed.map((attr, i) => {
        const sig = SIGNAL_CONFIG[attr.signal];
        const catCfg = CATEGORY_CONFIG[attr.category];
        const score = attr.score ?? 50;
        return (
          <div key={attr.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 10px", borderRadius: 6, background: i % 2 === 0 ? BG.elevated : "transparent" }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: sig.dot, flexShrink: 0 }} />
            <div style={{ flex: "0 0 160px" }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: TEXT.secondary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{attr.label}</div>
              {activeCategory === "all" && <div style={{ fontSize: 9, color: catCfg.color }}>{catCfg.label}</div>}
            </div>
            <div style={{ flex: "0 0 120px", fontSize: 11, fontWeight: 600, color: TEXT.primary, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{String(attr.value)}</div>
            <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div style={{ width: `${score}%`, height: "100%", borderRadius: 3, background: score >= 70 ? "#22c55e" : score >= 40 ? ACCENT : "#ef4444", transition: "width 0.4s" }} />
            </div>
            <div style={{ flex: "0 0 32px", fontSize: 10, fontWeight: 700, color: score >= 70 ? "#22c55e" : score >= 40 ? ACCENT : "#ef4444", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{score}</div>
            {attr.description && <div title={attr.description} style={{ flex: "0 0 12px", width: 12, height: 12, borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "help" }}>
              <span style={{ fontSize: 8, color: TEXT.tertiary }}>?</span>
            </div>}
          </div>
        );
      })}
    </div>
  );
}

export default function PropertyGenome() {
  const [activeCategory, setActiveCategory] = useState<GenomeCategory | "all">("all");
  const [activeAttr, setActiveAttr] = useState<GenomeAttribute | null>(null);

  const categoryScores = Object.keys(CATEGORY_CONFIG).reduce<Record<string, number>>((acc, cat) => {
    const catAttrs = GENOME_ATTRS.filter(a => a.category === cat);
    acc[cat] = catAttrs.length ? Math.round(catAttrs.reduce((s, a) => s + (a.score ?? 50), 0) / catAttrs.length) : 50;
    return acc;
  }, {});

  return (
    <div style={{ background: BG.page, minHeight: "100vh", color: TEXT.primary }}>
      {/* Header */}
      <div style={{ padding: "20px 28px 16px", borderBottom: `1px solid ${BORDER.subtle}` }}>
        <div className="flex items-center gap-3 mb-3">
          <div style={{ width: 36, height: 36, borderRadius: 8, background: `${ACCENT}18`, border: `1px solid ${ACCENT}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Dna style={{ color: ACCENT, width: 18, height: 18 }} />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>Property Genome</h1>
            <p style={{ fontSize: 12, color: TEXT.tertiary, marginTop: 1 }}>200+ data-point fingerprint · Zoning DNA · Ownership velocity · Risk layers</p>
          </div>
        </div>

        {/* Property header */}
        <div style={{ background: BG.surface, borderRadius: 12, border: `1px solid ${BORDER.muted}`, padding: "14px 18px", display: "flex", alignItems: "center", gap: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: TEXT.primary }}>{PROPERTY.address}</div>
            <div style={{ fontSize: 12, color: TEXT.tertiary, marginTop: 2 }}>{PROPERTY.borough} · {PROPERTY.units} units · {PROPERTY.sqft.toLocaleString()} sqft · Zoning: {PROPERTY.zoning}</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 16 }}>
            {[
              { label: "Genome Score", value: PROPERTY.overallScore, color: PROPERTY.overallScore >= 70 ? "#22c55e" : PROPERTY.overallScore >= 40 ? ACCENT : "#ef4444" },
              { label: "Distress Score", value: PROPERTY.distressScore, color: PROPERTY.distressScore >= 70 ? "#ef4444" : PROPERTY.distressScore >= 40 ? "#f97316" : "#22c55e" },
              { label: "Opportunity Score", value: PROPERTY.opportunityScore, color: PROPERTY.opportunityScore >= 70 ? "#22c55e" : PROPERTY.opportunityScore >= 40 ? ACCENT : TEXT.tertiary },
              { label: "AVM", value: `$${(PROPERTY.avm / 1e6).toFixed(1)}M`, color: ACCENT },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "right" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: s.color, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
                <div style={{ fontSize: 9, color: TEXT.tertiary }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", height: "calc(100vh - 180px)" }}>
        {/* Category sidebar */}
        <div style={{ borderRight: `1px solid ${BORDER.subtle}`, overflowY: "auto", padding: "16px 12px" }}>
          <button
            onClick={() => setActiveCategory("all")}
            style={{
              width: "100%", padding: "8px 10px", borderRadius: 7, marginBottom: 6, cursor: "pointer", textAlign: "left",
              background: activeCategory === "all" ? `${ACCENT}15` : "transparent",
              border: `1px solid ${activeCategory === "all" ? ACCENT + "30" : "transparent"}`,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: activeCategory === "all" ? 700 : 500, color: activeCategory === "all" ? ACCENT : TEXT.secondary }}>All Attributes</div>
            <div style={{ fontSize: 9, color: TEXT.tertiary, marginTop: 1 }}>{GENOME_ATTRS.length} data points</div>
          </button>

          {(Object.entries(CATEGORY_CONFIG) as [GenomeCategory, { label: string; color: string; icon: React.ElementType }][]).map(([cat, cfg]) => {
            const isActive = activeCategory === cat;
            const score = categoryScores[cat];
            const count = GENOME_ATTRS.filter(a => a.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  width: "100%", padding: "8px 10px", borderRadius: 7, marginBottom: 4, cursor: "pointer", textAlign: "left",
                  background: isActive ? `${cfg.color}12` : "transparent",
                  border: `1px solid ${isActive ? cfg.color + "28" : "transparent"}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 500, color: isActive ? cfg.color : TEXT.secondary }}>{cfg.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: score >= 70 ? "#22c55e" : score >= 40 ? ACCENT : "#ef4444", fontVariantNumeric: "tabular-nums" }}>{score}</span>
                </div>
                <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div style={{ width: `${score}%`, height: "100%", borderRadius: 2, background: score >= 70 ? "#22c55e" : score >= 40 ? ACCENT : "#ef4444" }} />
                </div>
                <div style={{ fontSize: 9, color: TEXT.tertiary, marginTop: 2 }}>{count} attributes</div>
              </button>
            );
          })}
        </div>

        {/* DNA strand */}
        <div style={{ overflowY: "auto", padding: "16px 20px" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT.primary }}>
                {activeCategory === "all" ? "Full Genome — All 200+ Attributes" : CATEGORY_CONFIG[activeCategory].label}
              </div>
              <div style={{ fontSize: 11, color: TEXT.tertiary, marginTop: 1 }}>
                Score bars: 0–100 · Green ≥70 · Amber 40–69 · Red &lt;40
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ fontSize: 10, color: TEXT.tertiary }}>Positive</span>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: ACCENT }} />
              <span style={{ fontSize: 10, color: TEXT.tertiary }}>Watch</span>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
              <span style={{ fontSize: 10, color: TEXT.tertiary }}>Negative</span>
            </div>
          </div>

          <DnaStrand attrs={GENOME_ATTRS} activeCategory={activeCategory} />
        </div>
      </div>
    </div>
  );
}
