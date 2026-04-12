import { useState } from "react";
import { TrendingUp, TrendingDown, Layers, MapPin, BarChart3, Building, Users, Zap, RefreshCw, ChevronRight, AlertTriangle, ArrowUpRight } from "lucide-react";

const ACCENT = "#c8a060";
const BG = { page: "#060a07", surface: "#0a0e08", elevated: "#0e1209" } as const;
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.08)" } as const;
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)" } as const;

type LayerType = "rent_velocity" | "permits" | "demographics" | "gentrification";

interface NeighborhoodData {
  id: string;
  name: string;
  borough: string;
  rentGrowth1yr: number;
  permitVolume: number;
  gentrificationScore: number;
  populationGrowth: number;
  incomeGrowthPct: number;
  rentalVacancy: number;
  newConstruction: number;
  medianRent: number;
  rentVelocityRank: number;
  signal: "hot" | "warming" | "stable" | "cooling";
  blocks: { id: string; lat: number; lng: number; score: number; signal: string }[];
}

const SIGNAL_CONFIG = {
  hot: { color: "#ef4444", bg: "#ef444418", label: "🔥 Hot", description: "Rapid appreciation / high activity" },
  warming: { color: "#f97316", bg: "#f9731618", label: "↑ Warming", description: "Accelerating above trend" },
  stable: { color: "#f59e0b", bg: "#f59e0b18", label: "→ Stable", description: "Near-trend performance" },
  cooling: { color: "#7ba3d4", bg: "#7ba3d418", label: "↓ Cooling", description: "Decelerating" },
};

const LAYER_CONFIG: Record<LayerType, { label: string; color: string; icon: React.ElementType; description: string }> = {
  rent_velocity: { label: "Rent Velocity", color: ACCENT, icon: TrendingUp, description: "Year-over-year rent growth rate by block" },
  permits: { label: "Construction Permits", color: "#7ba3d4", icon: Building, description: "New permit filings — leading indicator of supply" },
  demographics: { label: "Demographic Shift", color: "#22c55e", icon: Users, description: "Income and population change velocity" },
  gentrification: { label: "Gentrification Vector", color: "#f97316", icon: Zap, description: "Composite score: rent + income + permits + retail change" },
};

const NEIGHBORHOODS: NeighborhoodData[] = [
  {
    id: "eh", name: "East Harlem", borough: "Manhattan", rentGrowth1yr: 12.4, permitVolume: 148, gentrificationScore: 89,
    populationGrowth: 4.8, incomeGrowthPct: 14.2, rentalVacancy: 2.1, newConstruction: 312, medianRent: 2480,
    rentVelocityRank: 1, signal: "hot",
    blocks: [{ id: "b1", lat: 40.795, lng: -73.939, score: 94, signal: "hot" }, { id: "b2", lat: 40.792, lng: -73.936, score: 87, signal: "hot" }],
  },
  {
    id: "bsh", name: "Bed-Stuy", borough: "Brooklyn", rentGrowth1yr: 9.8, permitVolume: 220, gentrificationScore: 82,
    populationGrowth: 6.2, incomeGrowthPct: 18.4, rentalVacancy: 1.8, newConstruction: 520, medianRent: 2240,
    rentVelocityRank: 2, signal: "hot",
    blocks: [{ id: "b3", lat: 40.683, lng: -73.934, score: 88, signal: "hot" }, { id: "b4", lat: 40.685, lng: -73.930, score: 76, signal: "warming" }],
  },
  {
    id: "mor", name: "Mott Haven", borough: "Bronx", rentGrowth1yr: 8.2, permitVolume: 96, gentrificationScore: 74,
    populationGrowth: 3.4, incomeGrowthPct: 11.8, rentalVacancy: 3.2, newConstruction: 180, medianRent: 1840,
    rentVelocityRank: 3, signal: "warming",
    blocks: [{ id: "b5", lat: 40.806, lng: -73.923, score: 72, signal: "warming" }],
  },
  {
    id: "wbg", name: "Williamsburg", borough: "Brooklyn", rentGrowth1yr: 6.4, permitVolume: 310, gentrificationScore: 68,
    populationGrowth: 1.8, incomeGrowthPct: 8.2, rentalVacancy: 3.8, newConstruction: 840, medianRent: 3240,
    rentVelocityRank: 4, signal: "warming",
    blocks: [{ id: "b6", lat: 40.713, lng: -73.954, score: 65, signal: "stable" }],
  },
  {
    id: "jh", name: "Jackson Heights", borough: "Queens", rentGrowth1yr: 5.1, permitVolume: 44, gentrificationScore: 55,
    populationGrowth: 2.1, incomeGrowthPct: 7.4, rentalVacancy: 4.2, newConstruction: 88, medianRent: 1980,
    rentVelocityRank: 5, signal: "stable",
    blocks: [{ id: "b7", lat: 40.745, lng: -73.884, score: 54, signal: "stable" }],
  },
  {
    id: "fh", name: "Flushing", borough: "Queens", rentGrowth1yr: 3.8, permitVolume: 28, gentrificationScore: 42,
    populationGrowth: 0.8, incomeGrowthPct: 4.2, rentalVacancy: 5.8, newConstruction: 42, medianRent: 1720,
    rentVelocityRank: 6, signal: "cooling",
    blocks: [{ id: "b8", lat: 40.767, lng: -73.833, score: 40, signal: "cooling" }],
  },
];

function HeatCell({ score, label, color }: { score: number; label: string; color: string }) {
  const opacity = 0.1 + (score / 100) * 0.5;
  return (
    <div
      title={`${label}: ${score}`}
      style={{
        width: "100%", aspectRatio: "1", borderRadius: 3, cursor: "default",
        background: `rgba(${color}, ${opacity})`,
        border: `1px solid rgba(${color}, ${opacity * 1.5})`,
      }}
    />
  );
}

function MiniBarChart({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 32 }}>
      {values.map((v, i) => (
        <div
          key={i}
          style={{
            flex: 1, height: `${(v / max) * 100}%`,
            background: i === values.length - 1 ? color : `${color}60`,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}

export default function MarketPulse() {
  const [activeLayer, setActiveLayer] = useState<LayerType>("gentrification");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<NeighborhoodData | null>(NEIGHBORHOODS[0]);
  const [sortBy, setSortBy] = useState<"gentrification" | "rent" | "permits">("gentrification");

  const sorted = [...NEIGHBORHOODS].sort((a, b) => {
    if (sortBy === "gentrification") return b.gentrificationScore - a.gentrificationScore;
    if (sortBy === "rent") return b.rentGrowth1yr - a.rentGrowth1yr;
    return b.permitVolume - a.permitVolume;
  });

  const layerCfg = LAYER_CONFIG[activeLayer];

  function getHeatValue(n: NeighborhoodData): number {
    if (activeLayer === "rent_velocity") return n.rentGrowth1yr * 8;
    if (activeLayer === "permits") return Math.min(99, n.permitVolume / 3.5);
    if (activeLayer === "demographics") return Math.min(99, n.incomeGrowthPct * 5);
    return n.gentrificationScore;
  }

  return (
    <div style={{ background: BG.page, minHeight: "100vh", color: TEXT.primary }}>
      {/* Header */}
      <div style={{ padding: "20px 28px 14px", borderBottom: `1px solid ${BORDER.subtle}` }}>
        <div className="flex items-center gap-3 mb-3">
          <div style={{ width: 36, height: 36, borderRadius: 8, background: `${ACCENT}18`, border: `1px solid ${ACCENT}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Layers style={{ color: ACCENT, width: 18, height: 18 }} />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>Street-Level Market Pulse</h1>
            <p style={{ fontSize: 12, color: TEXT.tertiary, marginTop: 1 }}>Rent velocity · Permits · Demographics · Gentrification vectors · Block-level scoring</p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <RefreshCw style={{ width: 12, height: 12, color: TEXT.tertiary }} />
            <span style={{ fontSize: 11, color: TEXT.tertiary }}>Live · Updated 4 min ago</span>
          </div>
        </div>

        {/* Layer switcher */}
        <div className="flex gap-2">
          {(Object.entries(LAYER_CONFIG) as [LayerType, (typeof LAYER_CONFIG)[LayerType]][]).map(([layer, cfg]) => (
            <button
              key={layer}
              onClick={() => setActiveLayer(layer)}
              style={{
                padding: "7px 14px", borderRadius: 8, border: `1px solid ${activeLayer === layer ? cfg.color + "40" : BORDER.muted}`,
                background: activeLayer === layer ? `${cfg.color}12` : "transparent", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <cfg.icon style={{ width: 12, height: 12, color: activeLayer === layer ? cfg.color : TEXT.tertiary }} />
              <span style={{ fontSize: 11, fontWeight: activeLayer === layer ? 700 : 500, color: activeLayer === layer ? cfg.color : TEXT.secondary }}>{cfg.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", minHeight: "calc(100vh - 130px)" }}>
        {/* Left — neighborhood grid heatmap + list */}
        <div style={{ padding: "20px 24px", borderRight: `1px solid ${BORDER.subtle}`, overflowY: "auto" }}>
          {/* Heatmap grid */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
              {layerCfg.label} Heatmap — NYC Neighborhoods
            </div>
            <div style={{ fontSize: 11, color: TEXT.tertiary, marginBottom: 12 }}>{layerCfg.description}</div>

            {/* Visual heatmap block */}
            <div style={{ background: BG.surface, borderRadius: 12, border: `1px solid ${BORDER.subtle}`, padding: "16px", marginBottom: 16, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 3 }}>
                {Array.from({ length: 96 }, (_, i) => {
                  const nIdx = Math.floor(i / 16) % NEIGHBORHOODS.length;
                  const n = NEIGHBORHOODS[nIdx];
                  const base = getHeatValue(n);
                  const jitter = (Math.sin(i * 17.3) * 0.5 + 0.5) * 20 - 10;
                  const score = Math.max(5, Math.min(99, base + jitter));
                  const isHot = score > 70;
                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedNeighborhood(NEIGHBORHOODS[nIdx])}
                      title={`${n.name}: ${Math.round(score)}`}
                      style={{
                        height: 18, borderRadius: 3, cursor: "pointer",
                        background: isHot ? `rgba(239,68,68,${0.1 + (score / 100) * 0.55})` :
                          score > 50 ? `rgba(249,115,22,${0.1 + (score / 100) * 0.45})` :
                            `rgba(200,160,96,${0.08 + (score / 100) * 0.3})`,
                        border: selectedNeighborhood?.id === NEIGHBORHOODS[nIdx].id ? "1px solid white" : "1px solid transparent",
                      }}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between mt-3">
                <span style={{ fontSize: 9, color: TEXT.tertiary }}>Low Activity</span>
                <div className="flex items-center gap-1">
                  {[0.1, 0.3, 0.5, 0.7, 0.9].map((o, i) => (
                    <div key={i} style={{ width: 18, height: 8, borderRadius: 2, background: `rgba(239,68,68,${o})` }} />
                  ))}
                </div>
                <span style={{ fontSize: 9, color: TEXT.tertiary }}>High Activity</span>
              </div>
            </div>
          </div>

          {/* Neighborhood ranking */}
          <div>
            <div className="flex items-center justify-between mb-10">
              <div style={{ fontSize: 11, fontWeight: 600, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em" }}>Neighborhood Rankings</div>
              <div className="flex gap-2">
                {(["gentrification", "rent", "permits"] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s)}
                    style={{
                      padding: "3px 8px", borderRadius: 5, fontSize: 10, cursor: "pointer",
                      border: `1px solid ${sortBy === s ? ACCENT + "40" : BORDER.muted}`,
                      background: sortBy === s ? `${ACCENT}12` : "transparent",
                      color: sortBy === s ? ACCENT : TEXT.tertiary,
                    }}
                  >
                    {s === "gentrification" ? "Gent." : s === "rent" ? "Rent Δ" : "Permits"}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sorted.map((n, rank) => {
                const sigCfg = SIGNAL_CONFIG[n.signal];
                const heatVal = getHeatValue(n);
                const isSelected = selectedNeighborhood?.id === n.id;
                return (
                  <div
                    key={n.id}
                    onClick={() => setSelectedNeighborhood(n)}
                    style={{
                      background: isSelected ? `${sigCfg.color}08` : BG.surface,
                      border: `1px solid ${isSelected ? sigCfg.color + "30" : BORDER.subtle}`,
                      borderRadius: 10, padding: "12px 14px", cursor: "pointer",
                      display: "grid", gridTemplateColumns: "28px 1fr auto auto auto auto auto",
                      alignItems: "center", gap: 10,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: rank < 2 ? sigCfg.color : TEXT.tertiary, textAlign: "center" }}>#{rank + 1}</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: TEXT.primary }}>{n.name}</div>
                      <div style={{ fontSize: 10, color: TEXT.tertiary }}>{n.borough}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT }}>{n.rentGrowth1yr}%</div>
                      <div style={{ fontSize: 9, color: TEXT.tertiary }}>Rent Δ</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: TEXT.primary }}>{n.permitVolume}</div>
                      <div style={{ fontSize: 9, color: TEXT.tertiary }}>Permits</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: sigCfg.color }}>{n.gentrificationScore}</div>
                      <div style={{ fontSize: 9, color: TEXT.tertiary }}>Gent.</div>
                    </div>
                    <div>
                      <div style={{ height: 4, width: 60, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                        <div style={{ width: `${heatVal}%`, height: "100%", borderRadius: 2, background: sigCfg.color }} />
                      </div>
                    </div>
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: sigCfg.bg, color: sigCfg.color, fontWeight: 600, whiteSpace: "nowrap" }}>{sigCfg.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right — detail panel */}
        {selectedNeighborhood && (
          <div style={{ padding: "20px 20px", overflowY: "auto", background: BG.surface }}>
            <div style={{ marginBottom: 16 }}>
              <div className="flex items-center gap-2 mb-1">
                <div style={{ fontSize: 15, fontWeight: 700, color: TEXT.primary }}>{selectedNeighborhood.name}</div>
                <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: SIGNAL_CONFIG[selectedNeighborhood.signal].bg, color: SIGNAL_CONFIG[selectedNeighborhood.signal].color, fontWeight: 700 }}>{SIGNAL_CONFIG[selectedNeighborhood.signal].label}</span>
              </div>
              <div style={{ fontSize: 11, color: TEXT.tertiary }}>{selectedNeighborhood.borough} · #{selectedNeighborhood.rentVelocityRank} rent velocity ranking</div>
            </div>

            {/* Key metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
              {[
                { label: "Rent Growth", value: `+${selectedNeighborhood.rentGrowth1yr}%`, color: ACCENT, sub: "Year-over-year" },
                { label: "Permit Volume", value: selectedNeighborhood.permitVolume, color: "#7ba3d4", sub: "Active permits" },
                { label: "Income Growth", value: `+${selectedNeighborhood.incomeGrowthPct}%`, color: "#22c55e", sub: "3yr median income Δ" },
                { label: "Gentrification", value: selectedNeighborhood.gentrificationScore, color: "#f97316", sub: "Composite score" },
                { label: "Median Rent", value: `$${selectedNeighborhood.medianRent.toLocaleString()}`, color: TEXT.primary, sub: "Per month" },
                { label: "Vacancy Rate", value: `${selectedNeighborhood.rentalVacancy}%`, color: selectedNeighborhood.rentalVacancy < 3 ? "#ef4444" : TEXT.secondary, sub: "Rental units" },
              ].map(m => (
                <div key={m.label} style={{ background: BG.elevated, borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: m.color, fontVariantNumeric: "tabular-nums" }}>{m.value}</div>
                  <div style={{ fontSize: 10, color: TEXT.tertiary }}>{m.label}</div>
                  <div style={{ fontSize: 9, color: TEXT.tertiary, marginTop: 1 }}>{m.sub}</div>
                </div>
              ))}
            </div>

            {/* Gentrification vector breakdown */}
            <div style={{ background: BG.elevated, borderRadius: 10, border: `1px solid ${BORDER.subtle}`, padding: "14px 16px", marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Gentrification Vector Breakdown</div>
              {[
                { label: "Rent growth velocity", score: Math.round(selectedNeighborhood.rentGrowth1yr * 7), max: 100, color: ACCENT },
                { label: "Construction permits", score: Math.min(99, Math.round(selectedNeighborhood.permitVolume / 3.5)), max: 100, color: "#7ba3d4" },
                { label: "Income shift", score: Math.min(99, Math.round(selectedNeighborhood.incomeGrowthPct * 5)), max: 100, color: "#22c55e" },
                { label: "Retail/coffee score", score: Math.round(selectedNeighborhood.gentrificationScore * 0.85), max: 100, color: "#f97316" },
                { label: "Vacancy tightening", score: Math.round((6 - selectedNeighborhood.rentalVacancy) / 6 * 99), max: 100, color: "#a78bfa" },
              ].map(v => (
                <div key={v.label} style={{ marginBottom: 8 }}>
                  <div className="flex justify-between mb-1">
                    <span style={{ fontSize: 11, color: TEXT.secondary }}>{v.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: v.color, fontVariantNumeric: "tabular-nums" }}>{v.score}</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{ width: `${v.score}%`, height: "100%", borderRadius: 3, background: v.color }} />
                  </div>
                </div>
              ))}
            </div>

            {/* 12-month rent trend mini chart */}
            <div style={{ background: BG.elevated, borderRadius: 10, border: `1px solid ${BORDER.subtle}`, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Rent Trend (12 months)</div>
              <MiniBarChart
                values={Array.from({ length: 12 }, (_, i) => selectedNeighborhood.medianRent * (1 + (i / 12) * selectedNeighborhood.rentGrowth1yr / 100))}
                color={ACCENT}
              />
              <div className="flex justify-between mt-2">
                <span style={{ fontSize: 9, color: TEXT.tertiary }}>12mo ago</span>
                <span style={{ fontSize: 10, color: ACCENT, fontWeight: 600 }}>+{selectedNeighborhood.rentGrowth1yr}% YoY</span>
                <span style={{ fontSize: 9, color: TEXT.tertiary }}>Now</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
