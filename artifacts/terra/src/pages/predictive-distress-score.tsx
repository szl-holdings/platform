import { useState } from "react";
import {
  AlertTriangle, TrendingDown, TrendingUp, Search, Filter, ChevronRight, BarChart3, Calendar, DollarSign, Eye, Shield, Clock, RefreshCw
} from "lucide-react";

const ACCENT = "#c8a060";
const BG = { page: "#060a07", surface: "#0a0e08", elevated: "#0e1209" } as const;
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.08)" } as const;
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)" } as const;

type RiskBand = "critical" | "high" | "moderate" | "low";
type Timeframe = "6mo" | "12mo" | "18mo";

interface DistressSignal {
  key: string;
  label: string;
  weight: number;
  value: string;
  trend: "worsening" | "stable" | "improving";
}

interface DistressProperty {
  id: string;
  address: string;
  borough: string;
  class: "A" | "B" | "C" | "D";
  units: number;
  score: number;
  riskBand: RiskBand;
  scoreDelta: number;
  owner: string;
  ownerEntities: number;
  portfolioDistressSignals: number;
  taxDelinquency: number;
  dscr: number;
  lienCount: number;
  daysSinceLastSale: number;
  signals: DistressSignal[];
  prediction: { horizon: Timeframe; probability: number; trigger: string };
  avm: number;
}

const RISK_CONFIG: Record<RiskBand, { color: string; bg: string; label: string; range: string }> = {
  critical: { color: "#ef4444", bg: "#ef444415", label: "Critical", range: "80–100" },
  high: { color: "#f97316", bg: "#f9731615", label: "High", range: "60–79" },
  moderate: { color: "#f59e0b", bg: "#f59e0b15", label: "Moderate", range: "40–59" },
  low: { color: "#22c55e", bg: "#22c55e15", label: "Low", range: "0–39" },
};

const PROPERTIES: DistressProperty[] = [
  {
    id: "ds-001", address: "412 E 148th St", borough: "Bronx", class: "C", units: 10, score: 94, riskBand: "critical", scoreDelta: +12,
    owner: "Harbor View RE", ownerEntities: 3, portfolioDistressSignals: 4, taxDelinquency: 340_000,
    dscr: 0.68, lienCount: 2, daysSinceLastSale: 2840, avm: 1_400_000,
    signals: [
      { key: "s1", label: "Tax Delinquency", weight: 28, value: "$340K outstanding", trend: "worsening" },
      { key: "s2", label: "DSCR", weight: 24, value: "0.68x (critical threshold)", trend: "worsening" },
      { key: "s3", label: "Owner Portfolio Health", weight: 18, value: "4/7 properties distressed", trend: "worsening" },
      { key: "s4", label: "Mechanic Liens", weight: 12, value: "2 active liens", trend: "stable" },
      { key: "s5", label: "Occupancy Trend", weight: 8, value: "62% — falling", trend: "worsening" },
    ],
    prediction: { horizon: "6mo", probability: 94, trigger: "Tax lien acceleration + DSCR breach → foreclosure filing probable within 6 months" },
  },
  {
    id: "ds-002", address: "247 W 116th St", borough: "Manhattan", class: "B", units: 18, score: 72, riskBand: "high", scoreDelta: +8,
    owner: "116th Realty LLC", ownerEntities: 1, portfolioDistressSignals: 2, taxDelinquency: 84_200,
    dscr: 0.92, lienCount: 1, daysSinceLastSale: 1140, avm: 5_900_000,
    signals: [
      { key: "s1", label: "Tax Delinquency", weight: 22, value: "$84.2K Q4 2025", trend: "worsening" },
      { key: "s2", label: "DSCR", weight: 20, value: "0.92x — sub-1.0", trend: "stable" },
      { key: "s3", label: "Mechanic Lien", weight: 16, value: "$128K (June 2025)", trend: "stable" },
      { key: "s4", label: "Ownership Duration", weight: 10, value: "3.2yr — short hold", trend: "stable" },
      { key: "s5", label: "Rent Roll Quality", weight: 8, value: "18% below market", trend: "improving" },
    ],
    prediction: { horizon: "12mo", probability: 72, trigger: "Tax arrears + DSCR pressure → probable distressed sale or default within 12 months without intervention" },
  },
  {
    id: "ds-003", address: "854 Lincoln Ave", borough: "Bronx", class: "C", units: 12, score: 78, riskBand: "high", scoreDelta: +5,
    owner: "Lincoln Holdings Trust", ownerEntities: 2, portfolioDistressSignals: 2, taxDelinquency: 180_000,
    dscr: 0.84, lienCount: 1, daysSinceLastSale: 520, avm: 1_800_000,
    signals: [
      { key: "s1", label: "Tax Delinquency", weight: 26, value: "$180K NYC tax arrears", trend: "worsening" },
      { key: "s2", label: "DSCR", weight: 20, value: "0.84x", trend: "worsening" },
      { key: "s3", label: "Note Delinquency", weight: 18, value: "3mo past due", trend: "worsening" },
      { key: "s4", label: "Vacancy", weight: 12, value: "42% occupied", trend: "worsening" },
    ],
    prediction: { horizon: "6mo", probability: 78, trigger: "Owner under financial stress across portfolio — likely to accept sub-market acquisition offer" },
  },
  {
    id: "ds-004", address: "228 W 145th St", borough: "Manhattan", class: "B", units: 13, score: 64, riskBand: "high", scoreDelta: +3,
    owner: "Harbor View RE", ownerEntities: 3, portfolioDistressSignals: 4, taxDelinquency: 140_000,
    dscr: 0.81, lienCount: 0, daysSinceLastSale: 2200, avm: 3_200_000,
    signals: [
      { key: "s1", label: "Tax Delinquency", weight: 24, value: "$140K — 1yr delinquent", trend: "worsening" },
      { key: "s2", label: "DSCR", weight: 18, value: "0.81x", trend: "worsening" },
      { key: "s3", label: "Owner Portfolio", weight: 16, value: "Same owner — 4 distressed assets", trend: "worsening" },
    ],
    prediction: { horizon: "12mo", probability: 64, trigger: "Owner portfolio under systemic stress — high correlation with other Harbor View assets" },
  },
  {
    id: "ds-005", address: "73 Macon St", borough: "Brooklyn", class: "D", units: 8, score: 83, riskBand: "critical", scoreDelta: +18,
    owner: "Vacant Building LLC", ownerEntities: 1, portfolioDistressSignals: 3, taxDelinquency: 0,
    dscr: 0, lienCount: 0, daysSinceLastSale: 4380, avm: 890_000,
    signals: [
      { key: "s1", label: "Vacancy", weight: 30, value: "100% vacant since 2022", trend: "stable" },
      { key: "s2", label: "DOB Violations", weight: 22, value: "4 open violations — Class 2+", trend: "worsening" },
      { key: "s3", label: "Hold Duration", weight: 14, value: "12yr — no activity", trend: "stable" },
      { key: "s4", label: "AVM vs. Debt", weight: 10, value: "No debt — potential estate asset", trend: "improving" },
    ],
    prediction: { horizon: "18mo", probability: 83, trigger: "Prolonged vacancy + accumulating violations → HPD action or distressed auction" },
  },
  {
    id: "ds-006", address: "1920 Flatbush Ave", borough: "Brooklyn", class: "B", units: 24, score: 48, riskBand: "moderate", scoreDelta: +2,
    owner: "Flatbush Partners LLC", ownerEntities: 2, portfolioDistressSignals: 1, taxDelinquency: 0,
    dscr: 0.97, lienCount: 0, daysSinceLastSale: 680, avm: 5_600_000,
    signals: [
      { key: "s1", label: "DSCR", weight: 20, value: "0.97x — borderline", trend: "stable" },
      { key: "s2", label: "Note Delinquency", weight: 16, value: "3mo arrears", trend: "worsening" },
      { key: "s3", label: "Owner Health", weight: 12, value: "1 flag on portfolio", trend: "stable" },
    ],
    prediction: { horizon: "12mo", probability: 48, trigger: "Near-threshold DSCR — note acceleration possible if not resolved in 90 days" },
  },
];

function ScoreGauge({ score, band }: { score: number; band: RiskBand }) {
  const cfg = RISK_CONFIG[band];
  const circumference = 2 * Math.PI * 28;
  const progress = (score / 100) * circumference;
  return (
    <svg width={72} height={72} viewBox="0 0 72 72">
      <circle cx={36} cy={36} r={28} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
      <circle
        cx={36} cy={36} r={28} fill="none"
        stroke={cfg.color} strokeWidth={6} strokeLinecap="round"
        strokeDasharray={`${progress} ${circumference - progress}`}
        strokeDashoffset={circumference * 0.25}
        transform="rotate(-90 36 36)"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      <text x={36} y={38} textAnchor="middle" fill={cfg.color} fontSize={16} fontWeight={700}>{score}</text>
      <text x={36} y={50} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={8}>{cfg.label}</text>
    </svg>
  );
}

export default function PredictiveDistressScore() {
  const [selected, setSelected] = useState<DistressProperty>(PROPERTIES[0]);
  const [filterBand, setFilterBand] = useState<RiskBand | "all">("all");
  const [timeframe, setTimeframe] = useState<Timeframe>("12mo");
  const [search, setSearch] = useState("");

  const filtered = PROPERTIES.filter(p => {
    if (filterBand !== "all" && p.riskBand !== filterBand) return false;
    if (search && !p.address.toLowerCase().includes(search.toLowerCase()) && !p.borough.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => b.score - a.score);

  return (
    <div style={{ background: BG.page, minHeight: "100vh", color: TEXT.primary }}>
      <div style={{ padding: "20px 28px 14px", borderBottom: `1px solid ${BORDER.subtle}` }}>
        <div className="flex items-center gap-3 mb-3">
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "#ef444415", border: "1px solid #ef444428", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TrendingDown style={{ color: "#ef4444", width: 18, height: 18 }} />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>Predictive Distress Score</h1>
            <p style={{ fontSize: 12, color: TEXT.tertiary, marginTop: 1 }}>ML-based distress probability · Tax delinquency · DSCR pressure · Owner financial health · 6–18 month forecasting</p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: TEXT.tertiary }}>
            <RefreshCw style={{ width: 11, height: 11 }} />
            Model updated 1h ago
          </div>
        </div>

        {/* Band filter + stats */}
        <div style={{ display: "flex", gap: 10 }}>
          {([
            { label: "All", value: "all" as const, count: PROPERTIES.length, color: TEXT.secondary },
            ...Object.entries(RISK_CONFIG).map(([band, cfg]) => ({ label: cfg.label, value: band as RiskBand, count: PROPERTIES.filter(p => p.riskBand === band).length, color: cfg.color })),
          ]).map(f => (
            <button
              key={f.value}
              onClick={() => setFilterBand(f.value)}
              style={{
                padding: "6px 12px", borderRadius: 7, border: `1px solid ${filterBand === f.value ? f.color + "40" : BORDER.muted}`,
                background: filterBand === f.value ? `${f.color}12` : BG.surface, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: filterBand === f.value ? 700 : 500, color: filterBand === f.value ? f.color : TEXT.secondary }}>{f.label}</span>
              <span style={{ fontSize: 10, padding: "1px 5px", borderRadius: 4, background: "rgba(255,255,255,0.06)", color: TEXT.tertiary }}>{f.count}</span>
            </button>
          ))}
          <div style={{ marginLeft: "auto", position: "relative" }}>
            <Search style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", width: 11, height: 11, color: TEXT.tertiary }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search properties…" style={{ paddingLeft: 26, paddingRight: 8, height: 34, borderRadius: 7, border: `1px solid ${BORDER.muted}`, background: BG.surface, color: TEXT.primary, fontSize: 12, width: 180, outline: "none" }} />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", minHeight: "calc(100vh - 130px)" }}>
        {/* Property list */}
        <div style={{ padding: "16px 20px", borderRight: `1px solid ${BORDER.subtle}`, overflowY: "auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(p => {
              const cfg = RISK_CONFIG[p.riskBand];
              const isSelected = selected.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelected(p)}
                  style={{
                    background: isSelected ? `${cfg.color}08` : BG.surface,
                    border: `1px solid ${isSelected ? cfg.color + "28" : BORDER.subtle}`,
                    borderRadius: 12, padding: "14px 16px", cursor: "pointer", transition: "all 0.15s",
                    display: "grid", gridTemplateColumns: "72px 1fr auto", gap: 14, alignItems: "center",
                  }}
                >
                  <ScoreGauge score={p.score} band={p.riskBand} />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ fontSize: 13, fontWeight: 700, color: TEXT.primary }}>{p.address}</span>
                      <span style={{ fontSize: 10, color: TEXT.tertiary }}>{p.borough}</span>
                    </div>
                    <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                      {[
                        { label: "Units", value: p.units },
                        { label: "DSCR", value: p.dscr > 0 ? `${p.dscr}x` : "N/A" },
                        { label: "Tax Arrears", value: p.taxDelinquency > 0 ? `$${(p.taxDelinquency / 1000).toFixed(0)}K` : "None" },
                        { label: "AVM", value: `$${(p.avm / 1e6).toFixed(1)}M` },
                      ].map(m => (
                        <div key={m.label}>
                          <div style={{ fontSize: 9, color: TEXT.tertiary }}>{m.label}</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: TEXT.secondary }}>{m.value}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: TEXT.tertiary, fontStyle: "italic" }}>{p.prediction.trigger.slice(0, 80)}…</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: p.scoreDelta > 0 ? "#ef4444" : "#22c55e", fontWeight: 600 }}>
                      {p.scoreDelta > 0 ? "↑" : "↓"} {Math.abs(p.scoreDelta)} pts
                    </div>
                    <div style={{ fontSize: 9, color: TEXT.tertiary }}>30d change</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        <div style={{ padding: "20px 20px", overflowY: "auto", background: BG.surface }}>
          <div className="flex items-center gap-3 mb-4">
            <ScoreGauge score={selected.score} band={selected.riskBand} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: TEXT.primary }}>{selected.address}</div>
              <div style={{ fontSize: 11, color: TEXT.tertiary }}>{selected.borough} · {selected.units} units · Class {selected.class}</div>
              <div style={{ marginTop: 4, display: "flex", gap: 6 }}>
                <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: RISK_CONFIG[selected.riskBand].bg, color: RISK_CONFIG[selected.riskBand].color, fontWeight: 700 }}>{RISK_CONFIG[selected.riskBand].label} Distress</span>
                <span style={{ fontSize: 10, color: selected.scoreDelta > 0 ? "#ef4444" : "#22c55e" }}>↑ {selected.scoreDelta} pts this month</span>
              </div>
            </div>
          </div>

          {/* Prediction box */}
          <div style={{ background: `${RISK_CONFIG[selected.riskBand].color}10`, border: `1px solid ${RISK_CONFIG[selected.riskBand].color}25`, borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: RISK_CONFIG[selected.riskBand].color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              {selected.prediction.probability}% probability within {selected.prediction.horizon}
            </div>
            <p style={{ fontSize: 12, color: TEXT.primary, lineHeight: 1.6 }}>{selected.prediction.trigger}</p>
          </div>

          {/* Signal breakdown */}
          <div style={{ fontSize: 10, fontWeight: 600, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            Distress Signal Breakdown
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {selected.signals.map(sig => (
              <div key={sig.key} style={{ background: BG.elevated, borderRadius: 8, padding: "10px 12px" }}>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontSize: 12, fontWeight: 600, color: TEXT.primary }}>{sig.label}</span>
                  <div className="flex items-center gap-2">
                    {sig.trend === "worsening" && <TrendingDown style={{ width: 11, height: 11, color: "#ef4444" }} />}
                    {sig.trend === "improving" && <TrendingUp style={{ width: 11, height: 11, color: "#22c55e" }} />}
                    <span style={{ fontSize: 10, color: TEXT.tertiary }}>weight: {sig.weight}%</span>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: TEXT.secondary, marginBottom: 6 }}>{sig.value}</div>
                <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div style={{ width: `${sig.weight * 3}%`, height: "100%", borderRadius: 2, background: sig.trend === "worsening" ? "#ef4444" : sig.trend === "improving" ? "#22c55e" : ACCENT }} />
                </div>
              </div>
            ))}
          </div>

          {/* Owner context */}
          <div style={{ background: BG.elevated, borderRadius: 10, border: `1px solid ${BORDER.subtle}`, padding: "14px 16px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Owner Intelligence</div>
            {[
              { label: "Owner", value: selected.owner },
              { label: "LLC Entities", value: `${selected.ownerEntities}` },
              { label: "Portfolio Distress Signals", value: `${selected.portfolioDistressSignals}` },
              { label: "DSCR", value: selected.dscr > 0 ? `${selected.dscr}x` : "N/A (vacant)" },
              { label: "Tax Delinquency", value: selected.taxDelinquency > 0 ? `$${(selected.taxDelinquency / 1000).toFixed(0)}K` : "None" },
              { label: "Active Liens", value: `${selected.lienCount}` },
            ].map(m => (
              <div key={m.label} className="flex justify-between py-2" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
                <span style={{ fontSize: 11, color: TEXT.tertiary }}>{m.label}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: TEXT.primary }}>{m.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
