import { useState } from "react";
import { TrendingUp, TrendingDown, AlertTriangle, Building2, MapPin, DollarSign, Clock, ChevronRight, ArrowUpRight, Filter, BarChart3 } from "lucide-react";

interface PropertyScore {
  id: string;
  address: string;
  city: string;
  state: string;
  type: string;
  score: number;
  scoreTrend: "up" | "down" | "stable";
  trendDelta: number;
  signals: string[];
  estimatedValue: string;
  distressType: string;
  daysOnMarket: number;
  ownerType: string;
  lastUpdated: string;
}

const PROPERTIES: PropertyScore[] = [
  { id: "P001", address: "1420 NW 7th Ave", city: "Miami", state: "FL", type: "Office", score: 94, scoreTrend: "up", trendDelta: 8, signals: ["Pre-foreclosure", "Tax lien", "Vacancy 80%+"], estimatedValue: "$4.2M", distressType: "Foreclosure", daysOnMarket: 0, ownerType: "LLC (shell)", lastUpdated: "2h ago" },
  { id: "P002", address: "3200 Biscayne Blvd", city: "Miami", state: "FL", type: "Retail", score: 89, scoreTrend: "up", trendDelta: 12, signals: ["Debt maturity <90d", "Anchor tenant leaving"], estimatedValue: "$8.7M", distressType: "Debt Maturity", daysOnMarket: 0, ownerType: "Private equity", lastUpdated: "4h ago" },
  { id: "P003", address: "450 Park Ave S", city: "New York", state: "NY", type: "Office", score: 82, scoreTrend: "up", trendDelta: 5, signals: ["Rate cap expiry", "NOI declining"], estimatedValue: "$42.5M", distressType: "Rate Cap", daysOnMarket: 0, ownerType: "REIT subsidiary", lastUpdated: "1h ago" },
  { id: "P004", address: "8850 Sunset Blvd", city: "Los Angeles", state: "CA", type: "Mixed Use", score: 76, scoreTrend: "stable", trendDelta: 1, signals: ["Construction lien", "Permit delays"], estimatedValue: "$12.1M", distressType: "Construction", daysOnMarket: 45, ownerType: "Family office", lastUpdated: "6h ago" },
  { id: "P005", address: "200 Congress Ave", city: "Austin", state: "TX", type: "Office", score: 71, scoreTrend: "down", trendDelta: -3, signals: ["Tenant rollover risk", "Below-market lease"], estimatedValue: "$18.9M", distressType: "Lease Risk", daysOnMarket: 0, ownerType: "Institutional", lastUpdated: "3h ago" },
  { id: "P006", address: "1600 Market St", city: "Philadelphia", state: "PA", type: "Office", score: 68, scoreTrend: "up", trendDelta: 4, signals: ["Special servicer transfer", "DSCR <1.0"], estimatedValue: "$28.3M", distressType: "CMBS", daysOnMarket: 0, ownerType: "CMBS trust", lastUpdated: "5h ago" },
  { id: "P007", address: "500 Terry Francois", city: "San Francisco", state: "CA", type: "Industrial", score: 63, scoreTrend: "stable", trendDelta: 0, signals: ["Environmental remediation", "Zoning change pending"], estimatedValue: "$6.8M", distressType: "Environmental", daysOnMarket: 120, ownerType: "Corporate", lastUpdated: "1d ago" },
  { id: "P008", address: "2100 Woodward Ave", city: "Detroit", state: "MI", type: "Multifamily", score: 58, scoreTrend: "down", trendDelta: -7, signals: ["Occupancy <60%", "Code violations"], estimatedValue: "$3.4M", distressType: "Occupancy", daysOnMarket: 90, ownerType: "LLC (individual)", lastUpdated: "8h ago" },
];

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "#ef4444" : score >= 60 ? "#f59e0b" : score >= 40 ? "#22d3ee" : "#22c55e";
  const label = score >= 80 ? "HIGH" : score >= 60 ? "MODERATE" : score >= 40 ? "LOW" : "MINIMAL";
  const ring = `conic-gradient(${color} ${score * 3.6}deg, hsla(0,0%,100%,0.06) 0deg)`;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div style={{
        width: 48, height: 48, borderRadius: "50%", background: ring, display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
      }}>
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "hsl(210, 25%, 8%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "0.875rem", fontWeight: 800, fontFamily: "monospace", color }}>{score}</span>
        </div>
      </div>
      <div>
        <div style={{ fontSize: "0.5625rem", fontFamily: "monospace", fontWeight: 700, color, letterSpacing: "0.1em" }}>{label} LIKELIHOOD</div>
        <div style={{ fontSize: "0.625rem", color: "#4b5563" }}>Predicted to sell</div>
      </div>
    </div>
  );
}

export default function PredictiveScoresPage() {
  const [sortBy, setSortBy] = useState<"score" | "value" | "trend">("score");
  const sorted = [...PROPERTIES].sort((a, b) => {
    if (sortBy === "score") return b.score - a.score;
    if (sortBy === "trend") return b.trendDelta - a.trendDelta;
    return 0;
  });

  const highCount = PROPERTIES.filter(p => p.score >= 80).length;
  const avgScore = Math.round(PROPERTIES.reduce((a, b) => a + b.score, 0) / PROPERTIES.length);

  return (
    <div style={{ padding: "24px 32px", minHeight: "100vh" }}>
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          <BarChart3 size={20} style={{ color: "#22c55e" }} />
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f0f0f0", margin: 0 }}>Predictive Distress Scores</h1>
        </div>
        <p style={{ fontSize: "0.8125rem", color: "#6b7280", margin: 0 }}>
          AI-generated likelihood-to-sell scores powered by debt maturity, occupancy, tax, and market signals.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Properties Scored", value: String(PROPERTIES.length), icon: Building2, color: "#22d3ee" },
          { label: "High Likelihood (80+)", value: String(highCount), icon: AlertTriangle, color: "#ef4444" },
          { label: "Avg Score", value: String(avgScore), icon: TrendingUp, color: "#f59e0b" },
          { label: "Model Refresh", value: "2h ago", icon: Clock, color: "#a78bfa" },
        ].map(s => (
          <div key={s.label} style={{ background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "8px", padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <s.icon size={13} style={{ color: s.color }} />
              <span style={{ fontSize: "0.625rem", fontFamily: "monospace", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</span>
            </div>
            <div style={{ fontSize: "1.375rem", fontWeight: 700, fontFamily: "monospace", color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {(["score", "value", "trend"] as const).map(s => (
          <button key={s} onClick={() => setSortBy(s)} style={{
            padding: "4px 12px", borderRadius: "4px", border: sortBy === s ? "1px solid #22c55e" : "1px solid hsla(0,0%,100%,0.08)",
            background: sortBy === s ? "hsla(140, 50%, 48%, 0.1)" : "transparent", color: sortBy === s ? "#22c55e" : "#6b7280",
            fontSize: "0.75rem", cursor: "pointer", fontFamily: "monospace", textTransform: "uppercase",
          }}>
            Sort: {s}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {sorted.map(property => (
          <div
            key={property.id}
            style={{
              background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "8px",
              padding: "18px 22px", cursor: "pointer", transition: "border-color 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "hsla(140, 50%, 48%, 0.3)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "hsla(0,0%,100%,0.06)")}
          >
            <div style={{ display: "grid", gridTemplateColumns: "200px 1fr auto", gap: "20px", alignItems: "center" }}>
              <ScoreBadge score={property.score} />

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e5e7eb" }}>{property.address}</span>
                  <span style={{ fontSize: "0.625rem", fontFamily: "monospace", padding: "1px 6px", borderRadius: "3px", background: "hsla(0,0%,100%,0.05)", color: "#9ca3af" }}>{property.type}</span>
                  {property.scoreTrend === "up" && (
                    <span style={{ display: "flex", alignItems: "center", gap: "2px", fontSize: "0.625rem", color: "#ef4444", fontFamily: "monospace" }}>
                      <TrendingUp size={10} /> +{property.trendDelta}
                    </span>
                  )}
                  {property.scoreTrend === "down" && (
                    <span style={{ display: "flex", alignItems: "center", gap: "2px", fontSize: "0.625rem", color: "#22c55e", fontFamily: "monospace" }}>
                      <TrendingDown size={10} /> {property.trendDelta}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.75rem", color: "#6b7280" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><MapPin size={10} /> {property.city}, {property.state}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><DollarSign size={10} /> {property.estimatedValue}</span>
                  <span>{property.ownerType}</span>
                </div>
                <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                  {property.signals.map(s => (
                    <span key={s} style={{
                      fontSize: "0.625rem", padding: "2px 8px", borderRadius: "4px",
                      background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.06)",
                      color: "#9ca3af", fontFamily: "monospace",
                    }}>{s}</span>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                <span style={{
                  fontSize: "0.625rem", fontFamily: "monospace", padding: "2px 8px", borderRadius: "4px",
                  background: property.distressType === "Foreclosure" ? "hsla(0,80%,55%,0.12)" : "hsla(35,90%,55%,0.08)",
                  color: property.distressType === "Foreclosure" ? "#ef4444" : "#f59e0b",
                  fontWeight: 600, letterSpacing: "0.06em",
                }}>{property.distressType}</span>
                <span style={{ fontSize: "0.625rem", color: "#4b5563" }}>Updated {property.lastUpdated}</span>
                <ChevronRight size={14} style={{ color: "#4b5563", marginTop: "4px" }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
