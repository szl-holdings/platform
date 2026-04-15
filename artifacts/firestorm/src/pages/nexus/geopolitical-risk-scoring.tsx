import { useState, useMemo } from "react";
import { Globe, AlertTriangle, TrendingUp, TrendingDown, Shield, Activity, BarChart3, Users, Zap, Minus } from "lucide-react";

const ACCENT = "#f59e0b";
const RED = "#ef4444";
const GREEN = "#22c55e";
const BLUE = "#3b82f6";

const DS = {
  surface: "rgba(255,255,255,0.025)",
  border: "rgba(255,255,255,0.06)",
  text: { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.5)", muted: "rgba(255,255,255,0.25)" },
};

interface CountryRisk {
  id: string;
  country: string;
  region: string;
  overallScore: number;
  trend: "escalating" | "stable" | "de-escalating";
  factors: { political: number; economic: number; regulatory: number; conflict: number; sanctions: number };
  affectedAssets: { type: string; count: number; exposure: number }[];
  lastUpdated: string;
  keyDrivers: string[];
}

const COUNTRIES: CountryRisk[] = [
  { id: "GR-001", country: "China", region: "East Asia", overallScore: 78, trend: "escalating",
    factors: { political: 82, economic: 71, regulatory: 85, conflict: 74, sanctions: 78 },
    affectedAssets: [
      { type: "Portfolio Companies", count: 4, exposure: 180_000_000 },
      { type: "Maritime Routes", count: 7, exposure: 45_000_000 },
      { type: "Legal Matters", count: 12, exposure: 8_000_000 },
    ],
    lastUpdated: "2024-03-15T14:00:00Z",
    keyDrivers: ["Taiwan strait tensions", "Technology export controls", "Supply chain decoupling", "South China Sea militarization"],
  },
  { id: "GR-002", country: "Russia", region: "Eastern Europe", overallScore: 92, trend: "stable",
    factors: { political: 95, economic: 88, regulatory: 90, conflict: 96, sanctions: 94 },
    affectedAssets: [
      { type: "Maritime Routes", count: 3, exposure: 15_000_000 },
      { type: "Legal Matters", count: 5, exposure: 3_000_000 },
      { type: "Client Engagements", count: 2, exposure: 1_200_000 },
    ],
    lastUpdated: "2024-03-15T14:00:00Z",
    keyDrivers: ["Ukraine conflict continuation", "SWIFT sanctions expansion", "Energy market weaponization", "Arctic route militarization"],
  },
  { id: "GR-003", country: "Iran", region: "Middle East", overallScore: 85, trend: "escalating",
    factors: { political: 88, economic: 82, regulatory: 78, conflict: 92, sanctions: 86 },
    affectedAssets: [
      { type: "Maritime Routes", count: 5, exposure: 30_000_000 },
      { type: "Insurance Exposure", count: 8, exposure: 12_000_000 },
    ],
    lastUpdated: "2024-03-15T14:00:00Z",
    keyDrivers: ["Houthi proxy attacks on Red Sea shipping", "Nuclear program escalation", "Regional destabilization", "IRGC cyber operations"],
  },
  { id: "GR-004", country: "United States", region: "North America", overallScore: 35, trend: "stable",
    factors: { political: 42, economic: 28, regulatory: 45, conflict: 18, sanctions: 22 },
    affectedAssets: [
      { type: "Portfolio Companies", count: 12, exposure: 450_000_000 },
      { type: "Real Estate", count: 34, exposure: 280_000_000 },
      { type: "Legal Matters", count: 47, exposure: 15_000_000 },
    ],
    lastUpdated: "2024-03-15T14:00:00Z",
    keyDrivers: ["Election year policy uncertainty", "Federal Reserve rate trajectory", "SEC regulatory expansion", "Tech antitrust actions"],
  },
  { id: "GR-005", country: "EU Zone", region: "Western Europe", overallScore: 42, trend: "escalating",
    factors: { political: 38, economic: 48, regulatory: 55, conflict: 30, sanctions: 40 },
    affectedAssets: [
      { type: "Portfolio Companies", count: 6, exposure: 95_000_000 },
      { type: "Real Estate", count: 8, exposure: 65_000_000 },
      { type: "Maritime Routes", count: 4, exposure: 20_000_000 },
    ],
    lastUpdated: "2024-03-15T14:00:00Z",
    keyDrivers: ["CBAM carbon tax expansion", "AI Act implementation", "Energy transition costs", "Migration-driven political shifts"],
  },
];

const scoreColor = (s: number) => s >= 75 ? RED : s >= 50 ? ACCENT : s >= 25 ? BLUE : GREEN;
const trendIcon = (t: string) => t === "escalating" ? TrendingUp : t === "de-escalating" ? TrendingDown : Minus;
const trendColor = (t: string) => t === "escalating" ? RED : t === "de-escalating" ? GREEN : DS.text.muted;
const fmt = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(0)}M` : `$${(n / 1_000).toFixed(0)}K`;

export default function GeopoliticalRiskScoringPage() {
  const [selectedId, setSelectedId] = useState(COUNTRIES[0].id);
  const selected = useMemo(() => COUNTRIES.find(c => c.id === selectedId) ?? COUNTRIES[0], [selectedId]);

  const globalAvg = Math.round(COUNTRIES.reduce((s, c) => s + c.overallScore, 0) / COUNTRIES.length);
  const escalatingCount = COUNTRIES.filter(c => c.trend === "escalating").length;
  const totalExposure = COUNTRIES.reduce((s, c) => s + c.affectedAssets.reduce((a, b) => a + b.exposure, 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white tracking-tight">Geopolitical Risk Scoring</h1>
        <p className="text-[11px] mt-1" style={{ color: DS.text.muted }}>Real-time country and region-level risk assessment with cascading impact to portfolio assets, maritime routes, and legal matters</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Global Risk Index", value: `${globalAvg}/100`, icon: Globe, color: scoreColor(globalAvg) },
          { label: "Escalating Regions", value: escalatingCount.toString(), icon: TrendingUp, color: RED },
          { label: "Countries Monitored", value: COUNTRIES.length.toString(), icon: Shield, color: BLUE },
          { label: "Total Exposure", value: fmt(totalExposure), icon: BarChart3, color: ACCENT },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4" style={{ background: DS.surface, border: `1px solid ${DS.border}` }}>
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="h-3.5 w-3.5" style={{ color: s.color }} />
              <span className="text-[9px] uppercase tracking-wider" style={{ color: DS.text.muted }}>{s.label}</span>
            </div>
            <p className="text-xl font-semibold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-5 space-y-2">
          <h3 className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: DS.text.muted }}>Risk Rankings</h3>
          {COUNTRIES.sort((a, b) => b.overallScore - a.overallScore).map(c => {
            const TIcon = trendIcon(c.trend);
            return (
              <button key={c.id} onClick={() => setSelectedId(c.id)} aria-label={`Select ${c.country}`}
                className="w-full text-left rounded-xl p-4 transition" style={{ background: selectedId === c.id ? "rgba(255,255,255,0.04)" : DS.surface, border: `1px solid ${selectedId === c.id ? "rgba(255,255,255,0.12)" : DS.border}` }}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center text-lg font-bold" style={{ background: scoreColor(c.overallScore) + "15", color: scoreColor(c.overallScore) }}>
                    {c.overallScore}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{c.country}</p>
                    <p className="text-[9px]" style={{ color: DS.text.muted }}>{c.region}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <TIcon className="h-3 w-3" style={{ color: trendColor(c.trend) }} />
                    <span className="text-[9px] font-semibold" style={{ color: trendColor(c.trend) }}>{c.trend}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="col-span-7 space-y-4">
          <div className="rounded-xl p-5" style={{ background: DS.surface, border: `1px solid ${DS.border}` }}>
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-4 w-4" style={{ color: scoreColor(selected.overallScore) }} />
              <h3 className="text-lg font-semibold text-white">{selected.country}</h3>
              <span className="text-[9px] font-semibold rounded-full px-2.5 py-0.5" style={{ background: scoreColor(selected.overallScore) + "15", color: scoreColor(selected.overallScore) }}>
                Risk Score: {selected.overallScore}/100
              </span>
            </div>

            <h4 className="text-[9px] uppercase tracking-wider font-semibold mb-3" style={{ color: DS.text.muted }}>Risk Factor Breakdown</h4>
            <div className="space-y-2 mb-4">
              {Object.entries(selected.factors).map(([key, val]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-[10px] w-24 capitalize" style={{ color: DS.text.secondary }}>{key}</span>
                  <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${val}%`, background: scoreColor(val) }} />
                  </div>
                  <span className="text-[10px] font-mono font-semibold w-8 text-right" style={{ color: scoreColor(val) }}>{val}</span>
                </div>
              ))}
            </div>

            <h4 className="text-[9px] uppercase tracking-wider font-semibold mb-2" style={{ color: DS.text.muted }}>Key Drivers</h4>
            <div className="space-y-1 mb-4">
              {selected.keyDrivers.map(d => (
                <div key={d} className="flex items-center gap-2">
                  <AlertTriangle className="h-2.5 w-2.5 flex-shrink-0" style={{ color: ACCENT }} />
                  <span className="text-[10px]" style={{ color: DS.text.secondary }}>{d}</span>
                </div>
              ))}
            </div>

            <h4 className="text-[9px] uppercase tracking-wider font-semibold mb-2" style={{ color: DS.text.muted }}>Affected Portfolio Assets</h4>
            <div className="space-y-1.5">
              {selected.affectedAssets.map(a => (
                <div key={a.type} className="flex items-center justify-between rounded-lg p-2.5" style={{ background: "rgba(255,255,255,0.015)", border: `1px solid ${DS.border}` }}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-white">{a.type}</span>
                    <span className="text-[9px] rounded-full px-1.5 py-0.5" style={{ background: "rgba(255,255,255,0.04)", color: DS.text.muted }}>{a.count} items</span>
                  </div>
                  <span className="text-[10px] font-semibold" style={{ color: ACCENT }}>{fmt(a.exposure)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
