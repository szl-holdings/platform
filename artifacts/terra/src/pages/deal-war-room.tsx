import { useState } from "react";
import {
  Target, MessageSquare, BarChart3, Download, Plus, Edit3, CheckCircle2,
  AlertTriangle, TrendingUp, TrendingDown, DollarSign, Users, Clock, FileText, X, Star
} from "lucide-react";

const ACCENT = "#c8a060";
const BG = { page: "#060a07", surface: "#0a0e08", elevated: "#0e1209" } as const;
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.08)" } as const;
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)" } as const;

interface DealProperty {
  id: string;
  address: string;
  borough: string;
  askingPrice: number;
  avm: number;
  units: number;
  class: "A" | "B" | "C";
  noi: number;
  capRate: number;
  distressScore: number;
  renovationEstimate: number;
  proFormaCapRate: number;
  proFormaNoi: number;
  starred: boolean;
}

interface DealAnnotation {
  id: string;
  author: string;
  avatar: string;
  text: string;
  type: "note" | "concern" | "positive";
  time: string;
  propertyId: string;
}

interface RenovationScenario {
  id: string;
  label: string;
  scope: string;
  cost: number;
  noiUplift: number;
  valueUplift: number;
  capRateDelta: number;
  timeMonths: number;
}

const PROPERTIES: DealProperty[] = [
  { id: "dwr-001", address: "247 W 116th St", borough: "Manhattan", askingPrice: 5_200_000, avm: 5_900_000, units: 18, class: "B", noi: 284_000, capRate: 5.46, distressScore: 72, renovationEstimate: 540_000, proFormaCapRate: 7.2, proFormaNoi: 424_800, starred: true },
  { id: "dwr-002", address: "854 Lincoln Ave", borough: "Bronx", askingPrice: 1_370_000, avm: 1_800_000, units: 12, class: "C", noi: 92_000, capRate: 6.72, distressScore: 78, renovationEstimate: 240_000, proFormaCapRate: 8.9, proFormaNoi: 169_400, starred: false },
  { id: "dwr-003", address: "1920 Flatbush Ave", borough: "Brooklyn", askingPrice: 4_592_000, avm: 5_600_000, units: 24, class: "B", noi: 336_000, capRate: 7.32, distressScore: 67, renovationEstimate: 720_000, proFormaCapRate: 9.1, proFormaNoi: 504_000, starred: true },
];

const ANNOTATIONS: DealAnnotation[] = [
  { id: "ann-001", author: "R. Martinez", avatar: "RM", text: "Title search came back clean — no surprises beyond the mechanic's lien we already know about. ETA on resolution is 3 weeks per seller's counsel.", type: "note", time: "2h ago", propertyId: "dwr-001" },
  { id: "ann-002", author: "K. Patel", avatar: "KP", text: "14 of 18 units are RS — this caps NOI upside significantly. Pro forma needs to be stress-tested at lower vacancy improvement.", type: "concern", time: "5h ago", propertyId: "dwr-001" },
  { id: "ann-003", author: "J. Thornton", avatar: "JT", text: "Zoning overlay allows ground floor commercial. If we can convert the current super unit, we could add $28K/yr in NOI on commercial lease.", type: "positive", time: "1d ago", propertyId: "dwr-001" },
  { id: "ann-004", author: "R. Martinez", avatar: "RM", text: "Owner is motivated — third family member in a dispute. Legal hold on estate. This is a pre-foreclosure opportunity, not a traditional sale.", type: "positive", time: "4h ago", propertyId: "dwr-002" },
];

const RENO_SCENARIOS: RenovationScenario[] = [
  { id: "rs-1", label: "Light Refresh", scope: "Paint, flooring, fixtures", cost: 180_000, noiUplift: 42_000, valueUplift: 630_000, capRateDelta: 0.8, timeMonths: 3 },
  { id: "rs-2", label: "Unit Renovation", scope: "Full unit gut + kitchens/baths", cost: 360_000, noiUplift: 98_000, valueUplift: 1_450_000, capRateDelta: 1.8, timeMonths: 8 },
  { id: "rs-3", label: "Full Repositioning", scope: "Systems + units + lobby + facade", cost: 540_000, noiUplift: 140_800, valueUplift: 2_100_000, capRateDelta: 2.7, timeMonths: 14 },
];

const ANNOTATION_CONFIG = {
  note: { color: ACCENT, bg: `${ACCENT}12`, icon: MessageSquare },
  concern: { color: "#ef4444", bg: "#ef444412", icon: AlertTriangle },
  positive: { color: "#22c55e", bg: "#22c55e12", icon: CheckCircle2 },
};

export default function DealWarRoom() {
  const [activeProperty, setActiveProperty] = useState<DealProperty>(PROPERTIES[0]);
  const [activeTab, setActiveTab] = useState<"analysis" | "reno" | "comps" | "team">("analysis");
  const [activeReno, setActiveReno] = useState<RenovationScenario>(RENO_SCENARIOS[2]);
  const [newNote, setNewNote] = useState("");

  const propAnnotations = ANNOTATIONS.filter(a => a.propertyId === activeProperty.id);
  const premium = activeProperty.avm - activeProperty.askingPrice;
  const premiumPct = ((premium / activeProperty.askingPrice) * 100).toFixed(1);

  return (
    <div style={{ background: BG.page, height: "100vh", display: "flex", flexDirection: "column", color: TEXT.primary }}>
      {/* Header */}
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${BORDER.subtle}`, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: `${ACCENT}18`, border: `1px solid ${ACCENT}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Target style={{ color: ACCENT, width: 16, height: 16 }} />
        </div>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}>Deal War Room</h1>
          <p style={{ fontSize: 11, color: TEXT.tertiary, marginTop: 1 }}>Collaborative analysis · Renovation modeling · Comp benchmarks · One-click deal package</p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 8, border: `1px solid ${ACCENT}35`, background: `${ACCENT}12`, color: ACCENT, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            <Download style={{ width: 12, height: 12 }} />
            Export Deal Package
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "280px 1fr", overflow: "hidden" }}>
        {/* Property list */}
        <div style={{ borderRight: `1px solid ${BORDER.subtle}`, overflowY: "auto", padding: "14px 14px" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Active Deals ({PROPERTIES.length})</div>
          {PROPERTIES.map(p => {
            const isActive = p.id === activeProperty.id;
            const prem = p.avm - p.askingPrice;
            return (
              <div
                key={p.id}
                onClick={() => setActiveProperty(p)}
                style={{
                  background: isActive ? `${ACCENT}10` : BG.surface,
                  border: `1px solid ${isActive ? ACCENT + "30" : BORDER.subtle}`,
                  borderRadius: 10, padding: "12px 12px", marginBottom: 8, cursor: "pointer",
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  {p.starred && <Star style={{ width: 10, height: 10, color: ACCENT, fill: ACCENT, flexShrink: 0 }} />}
                  <div style={{ fontSize: 12, fontWeight: 700, color: TEXT.primary, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.address}</div>
                </div>
                <div style={{ fontSize: 10, color: TEXT.tertiary, marginBottom: 6 }}>{p.borough} · Class {p.class} · {p.units} units</div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: TEXT.primary }}>${(p.askingPrice / 1e6).toFixed(2)}M</div>
                    <div style={{ fontSize: 9, color: TEXT.tertiary }}>Asking</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: prem > 0 ? "#22c55e" : "#ef4444" }}>+{((prem / p.askingPrice) * 100).toFixed(1)}%</div>
                    <div style={{ fontSize: 9, color: TEXT.tertiary }}>vs AVM</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <div style={{ fontSize: 10, padding: "1px 5px", borderRadius: 3, background: `${p.distressScore >= 70 ? "#ef4444" : "#f9731618"}`, color: p.distressScore >= 70 ? "#ef4444" : "#f97316" }}>
                    Distress {p.distressScore}
                  </div>
                  <div style={{ fontSize: 10, color: TEXT.tertiary }}>{propAnnotations.filter(a => a.propertyId === p.id).length} notes</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main workspace */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Property overview bar */}
          <div style={{ padding: "12px 20px", borderBottom: `1px solid ${BORDER.subtle}`, display: "flex", alignItems: "center", gap: 20, flexShrink: 0, background: BG.surface }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: TEXT.primary }}>{activeProperty.address}</div>
              <div style={{ fontSize: 11, color: TEXT.tertiary }}>{activeProperty.borough} · {activeProperty.units} units · Class {activeProperty.class}</div>
            </div>
            {[
              { label: "Asking", value: `$${(activeProperty.askingPrice / 1e6).toFixed(2)}M`, color: TEXT.primary },
              { label: "AVM", value: `$${(activeProperty.avm / 1e6).toFixed(2)}M`, color: ACCENT },
              { label: "Spread", value: `+${premiumPct}%`, color: "#22c55e" },
              { label: "Current Cap", value: `${activeProperty.capRate}%`, color: TEXT.secondary },
              { label: "Pro Forma Cap", value: `${activeProperty.proFormaCapRate}%`, color: "#22c55e" },
              { label: "Distress", value: activeProperty.distressScore, color: activeProperty.distressScore >= 70 ? "#ef4444" : "#f97316" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: s.color, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
                <div style={{ fontSize: 9, color: TEXT.tertiary }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 2, padding: "0 20px", borderBottom: `1px solid ${BORDER.subtle}`, flexShrink: 0 }}>
            {(["analysis", "reno", "comps", "team"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "10px 16px", border: "none", cursor: "pointer", fontSize: 12, fontWeight: activeTab === tab ? 700 : 500,
                  color: activeTab === tab ? ACCENT : TEXT.secondary, background: "transparent",
                  borderBottom: `2px solid ${activeTab === tab ? ACCENT : "transparent"}`, textTransform: "capitalize",
                }}
              >
                {tab === "reno" ? "Renovation Modeling" : tab === "comps" ? "Comp Analysis" : tab === "team" ? "Team Notes" : "Deal Analysis"}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
            {activeTab === "analysis" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {/* Financial model */}
                <div style={{ gridColumn: "span 2", background: BG.surface, borderRadius: 10, border: `1px solid ${BORDER.subtle}`, padding: "14px 16px" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Financial Model</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
                    {[
                      { label: "Asking Price", value: `$${(activeProperty.askingPrice / 1e6).toFixed(2)}M`, sub: "Current ask" },
                      { label: "AVM", value: `$${(activeProperty.avm / 1e6).toFixed(2)}M`, sub: "Estimated value" },
                      { label: "Current NOI", value: `$${(activeProperty.noi / 1000).toFixed(0)}K`, sub: "As-is" },
                      { label: "Reno Cost", value: `$${(activeProperty.renovationEstimate / 1000).toFixed(0)}K`, sub: "Full scenario" },
                      { label: "Pro Forma NOI", value: `$${(activeProperty.proFormaNoi / 1000).toFixed(0)}K`, sub: "Post-stabilization" },
                      { label: "Pro Forma Cap", value: `${activeProperty.proFormaCapRate}%`, sub: "Target rate" },
                    ].map(m => (
                      <div key={m.label} style={{ background: BG.elevated, borderRadius: 7, padding: "10px 12px" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: TEXT.primary, fontVariantNumeric: "tabular-nums" }}>{m.value}</div>
                        <div style={{ fontSize: 9, color: TEXT.tertiary }}>{m.label}</div>
                        <div style={{ fontSize: 9, color: TEXT.tertiary }}>{m.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deal metrics */}
                <div style={{ background: BG.surface, borderRadius: 10, border: `1px solid ${BORDER.subtle}`, padding: "14px 16px" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Return Metrics</div>
                  {[
                    { label: "Cash-on-Cash (Yr 1)", value: "6.2%", trend: "up" },
                    { label: "IRR (5-yr hold)", value: "18.4%", trend: "up" },
                    { label: "Equity Multiple", value: "2.1×", trend: "up" },
                    { label: "Break-even Occupancy", value: "71%", trend: "neutral" },
                    { label: "Refinance LTV (Yr 3)", value: "62%", trend: "up" },
                  ].map(m => (
                    <div key={m.label} className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
                      <span style={{ fontSize: 12, color: TEXT.secondary }}>{m.label}</span>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 12, fontWeight: 700, color: TEXT.primary, fontVariantNumeric: "tabular-nums" }}>{m.value}</span>
                        {m.trend === "up" && <TrendingUp style={{ width: 11, height: 11, color: "#22c55e" }} />}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Risk flags */}
                <div style={{ background: BG.surface, borderRadius: 10, border: `1px solid ${BORDER.subtle}`, padding: "14px 16px" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Risk Flags</div>
                  {[
                    { text: "14/18 units rent stabilized — NOI upside capped", level: "high" },
                    { text: "Mechanic's lien $128K — resolution uncertain", level: "watch" },
                    { text: "DSCR 0.92x at asking price — below threshold", level: "high" },
                    { text: "DOB violations (2 Class 1) unresolved since 2024", level: "watch" },
                    { text: "Flood zone X — minimal environmental risk", level: "clear" },
                  ].map((r, i) => (
                    <div key={i} className="flex items-start gap-2 py-2" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: r.level === "high" ? "#ef4444" : r.level === "watch" ? "#f59e0b" : "#22c55e", flexShrink: 0, marginTop: 5 }} />
                      <span style={{ fontSize: 11, color: TEXT.secondary, lineHeight: 1.5 }}>{r.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "reno" && (
              <div>
                <div style={{ fontSize: 12, color: TEXT.secondary, marginBottom: 14, lineHeight: 1.6 }}>
                  Model renovation scenarios to project NOI uplift, cap rate improvement, and value creation. Select a scenario to update financial model.
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
                  {RENO_SCENARIOS.map(sc => {
                    const isActive = activeReno.id === sc.id;
                    return (
                      <div
                        key={sc.id}
                        onClick={() => setActiveReno(sc)}
                        style={{
                          background: isActive ? `${ACCENT}10` : BG.surface,
                          border: `1px solid ${isActive ? ACCENT + "30" : BORDER.subtle}`,
                          borderRadius: 10, padding: "14px 16px", cursor: "pointer",
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span style={{ fontSize: 13, fontWeight: 700, color: isActive ? ACCENT : TEXT.primary }}>{sc.label}</span>
                          {isActive && <CheckCircle2 style={{ width: 14, height: 14, color: ACCENT }} />}
                        </div>
                        <p style={{ fontSize: 11, color: TEXT.tertiary, marginBottom: 10, lineHeight: 1.5 }}>{sc.scope}</p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                          {[
                            { label: "Cost", value: `$${(sc.cost / 1000).toFixed(0)}K`, color: "#f97316" },
                            { label: "NOI Uplift", value: `+$${(sc.noiUplift / 1000).toFixed(0)}K`, color: "#22c55e" },
                            { label: "Value Add", value: `+$${(sc.valueUplift / 1000).toFixed(0)}K`, color: "#22c55e" },
                            { label: "Timeline", value: `${sc.timeMonths}mo`, color: ACCENT },
                          ].map(m => (
                            <div key={m.label} style={{ background: BG.elevated, borderRadius: 5, padding: "6px 8px" }}>
                              <div style={{ fontSize: 10, color: TEXT.tertiary }}>{m.label}</div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: m.color, fontVariantNumeric: "tabular-nums" }}>{m.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Active scenario detail */}
                <div style={{ background: `${ACCENT}08`, border: `1px solid ${ACCENT}20`, borderRadius: 12, padding: "16px 18px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: ACCENT, marginBottom: 10 }}>Active Scenario: {activeReno.label}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                    {[
                      { label: "All-In Cost", value: `$${((activeProperty.askingPrice + activeReno.cost) / 1e6).toFixed(2)}M` },
                      { label: "Stabilized NOI", value: `$${((activeProperty.noi + activeReno.noiUplift) / 1000).toFixed(0)}K` },
                      { label: "Exit Value (7.5%)", value: `$${(((activeProperty.noi + activeReno.noiUplift) / 0.075) / 1e6).toFixed(2)}M` },
                      { label: "Projected Profit", value: `$${(((activeProperty.noi + activeReno.noiUplift) / 0.075 - activeProperty.askingPrice - activeReno.cost) / 1e6).toFixed(2)}M` },
                    ].map(m => (
                      <div key={m.label} style={{ background: BG.elevated, borderRadius: 8, padding: "10px 14px" }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: TEXT.primary, fontVariantNumeric: "tabular-nums" }}>{m.value}</div>
                        <div style={{ fontSize: 10, color: TEXT.tertiary }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "comps" && (
              <div>
                <div style={{ fontSize: 11, color: TEXT.tertiary, marginBottom: 14 }}>Recent comparable sales within 0.5mi · Same zoning class · Similar vintage</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { addr: "231 W 114th St", date: "Feb 2026", price: 5_650_000, units: 16, ppu: 353_125, capRate: 5.1 },
                    { addr: "189 W 118th St", date: "Jan 2026", price: 4_800_000, units: 14, ppu: 342_857, capRate: 5.4 },
                    { addr: "308 W 112th St", date: "Nov 2025", price: 6_100_000, units: 20, ppu: 305_000, capRate: 4.9 },
                    { addr: "412 Manhattan Ave", date: "Sep 2025", price: 3_950_000, units: 12, ppu: 329_167, capRate: 5.8 },
                    { addr: "175 W 115th St", date: "Aug 2025", price: 5_200_000, units: 17, ppu: 305_882, capRate: 5.2 },
                  ].map((c, i) => (
                    <div key={i} style={{ background: BG.surface, borderRadius: 9, border: `1px solid ${BORDER.subtle}`, padding: "12px 16px", display: "flex", gap: 24, alignItems: "center" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: TEXT.primary }}>{c.addr}</div>
                        <div style={{ fontSize: 10, color: TEXT.tertiary }}>{c.units} units · {c.date}</div>
                      </div>
                      {[
                        { label: "Sale Price", value: `$${(c.price / 1e6).toFixed(2)}M` },
                        { label: "Per Unit", value: `$${(c.ppu / 1000).toFixed(0)}K` },
                        { label: "Cap Rate", value: `${c.capRate}%` },
                      ].map(m => (
                        <div key={m.label} style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: TEXT.primary }}>{m.value}</div>
                          <div style={{ fontSize: 9, color: TEXT.tertiary }}>{m.label}</div>
                        </div>
                      ))}
                    </div>
                  ))}
                  <div style={{ background: `${ACCENT}08`, border: `1px solid ${ACCENT}20`, borderRadius: 9, padding: "12px 16px", display: "flex", gap: 24, alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: ACCENT }}>Comp Average</div>
                      <div style={{ fontSize: 10, color: TEXT.tertiary }}>5 comps · 0.5mi radius</div>
                    </div>
                    {[
                      { label: "Avg Price", value: "$5.14M" },
                      { label: "Avg Per Unit", value: "$327K" },
                      { label: "Avg Cap", value: "5.28%" },
                    ].map(m => (
                      <div key={m.label} style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: ACCENT }}>{m.value}</div>
                        <div style={{ fontSize: 9, color: TEXT.tertiary }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "team" && (
              <div>
                {/* Annotation thread */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                  {propAnnotations.map(ann => {
                    const cfg = ANNOTATION_CONFIG[ann.type];
                    return (
                      <div key={ann.id} style={{ background: BG.surface, border: `1px solid ${cfg.color}20`, borderRadius: 10, padding: "12px 14px" }}>
                        <div className="flex items-center gap-8 mb-2">
                          <div style={{ width: 26, height: 26, borderRadius: "50%", background: `${ACCENT}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: ACCENT, flexShrink: 0 }}>{ann.avatar}</div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: TEXT.primary }}>{ann.author}</span>
                          <cfg.icon style={{ width: 12, height: 12, color: cfg.color }} />
                          <span style={{ fontSize: 10, color: TEXT.tertiary, marginLeft: "auto" }}>{ann.time}</span>
                        </div>
                        <p style={{ fontSize: 12, color: TEXT.secondary, lineHeight: 1.6, paddingLeft: 34 }}>{ann.text}</p>
                      </div>
                    );
                  })}
                </div>

                {/* New note */}
                <div style={{ background: BG.surface, borderRadius: 10, border: `1px solid ${BORDER.muted}`, padding: "14px 16px" }}>
                  <div style={{ fontSize: 11, color: TEXT.tertiary, marginBottom: 8 }}>Add a note, concern, or positive observation:</div>
                  <textarea
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Type your analysis note here…"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 7, border: `1px solid ${BORDER.muted}`, background: BG.elevated, color: TEXT.primary, fontSize: 12, resize: "vertical", minHeight: 80, outline: "none", boxSizing: "border-box" }}
                  />
                  <div className="flex justify-end mt-2">
                    <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 7, border: `1px solid ${ACCENT}35`, background: `${ACCENT}12`, color: ACCENT, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      <Plus style={{ width: 12, height: 12 }} />
                      Add Note
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
