import { useState } from "react";
import { Anchor, TrendingUp, TrendingDown, Clock, Ship, AlertTriangle, CheckCircle2, BarChart3, Calendar, ChevronRight, RefreshCw } from "lucide-react";

const ACCENT = "hsl(205 70% 50%)";
const BG = { page: "#060e1a", surface: "#08121f", elevated: "#0c1628" } as const;
const BORDER = { subtle: "rgba(255,255,255,0.05)", muted: "rgba(255,255,255,0.09)" } as const;
const TEXT = { primary: "rgba(255,255,255,0.90)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)" } as const;

type CongestionLevel = "clear" | "moderate" | "elevated" | "critical";

interface HourForecast {
  hour: number;
  label: string;
  congestion: number;
  vessels: number;
  avgWait: number;
}

interface Port {
  id: string;
  name: string;
  country: string;
  code: string;
  currentCongestion: number;
  currentLevel: CongestionLevel;
  forecast72h: HourForecast[];
  optimalWindow: { start: string; end: string; savings: number };
  queueCount: number;
  avgProcessingH: number;
  berthsTotal: number;
  berthsOccupied: number;
  throughputRank: string;
  trend: "improving" | "worsening" | "stable";
  lastUpdated: string;
  fleetVesselsEnRoute: { name: string; eta: string; risk: CongestionLevel }[];
}

const CONGESTION_CONFIG: Record<CongestionLevel, { color: string; bg: string; label: string }> = {
  clear: { color: "#22c55e", bg: "#22c55e15", label: "Clear" },
  moderate: { color: "#f59e0b", bg: "#f59e0b15", label: "Moderate" },
  elevated: { color: "#f97316", bg: "#f9731615", label: "Elevated" },
  critical: { color: "#ef4444", bg: "#ef444415", label: "Critical" },
};

function genForecast(base: number, variance: number): HourForecast[] {
  const result: HourForecast[] = [];
  let v = base;
  const hours = [0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72];
  const labels = ["Now", "+6h", "+12h", "+18h", "+24h", "+30h", "+36h", "+42h", "+48h", "+54h", "+60h", "+66h", "+72h"];
  for (let i = 0; i < hours.length; i++) {
    v = Math.max(5, Math.min(99, v + (Math.random() - 0.48) * variance));
    result.push({ hour: hours[i], label: labels[i], congestion: Math.round(v), vessels: Math.round(8 + v / 10), avgWait: Math.round(1 + v / 20) });
  }
  return result;
}

const PORTS: Port[] = [
  {
    id: "sgp", name: "Port of Singapore", country: "Singapore", code: "SGP", currentCongestion: 94, currentLevel: "critical",
    forecast72h: genForecast(94, 18),
    optimalWindow: { start: "Fri 06:00", end: "Fri 09:30", savings: 14 },
    queueCount: 22, avgProcessingH: 9.2, berthsTotal: 64, berthsOccupied: 61, throughputRank: "#1 Global",
    trend: "worsening", lastUpdated: "3 min ago",
    fleetVesselsEnRoute: [
      { name: "CV STELLARIS", eta: "14h", risk: "critical" },
      { name: "MV ATLANTIS COMMAND", eta: "38h", risk: "elevated" },
    ],
  },
  {
    id: "rot", name: "Port of Rotterdam", country: "Netherlands", code: "RTM", currentCongestion: 58, currentLevel: "moderate",
    forecast72h: genForecast(58, 14),
    optimalWindow: { start: "Thu 22:00", end: "Fri 04:00", savings: 6 },
    queueCount: 8, avgProcessingH: 4.1, berthsTotal: 98, berthsOccupied: 58, throughputRank: "#2 Europe",
    trend: "improving", lastUpdated: "8 min ago",
    fleetVesselsEnRoute: [
      { name: "MT BOREAL SEA", eta: "96h", risk: "moderate" },
    ],
  },
  {
    id: "sha", name: "Port of Shanghai", country: "China", code: "CNSHA", currentCongestion: 76, currentLevel: "elevated",
    forecast72h: genForecast(76, 20),
    optimalWindow: { start: "Sat 00:00", end: "Sat 06:00", savings: 11 },
    queueCount: 15, avgProcessingH: 7.6, berthsTotal: 120, berthsOccupied: 91, throughputRank: "#1 Global TEU",
    trend: "stable", lastUpdated: "5 min ago",
    fleetVesselsEnRoute: [
      { name: "MV NOVA ATLAS", eta: "72h", risk: "elevated" },
    ],
  },
  {
    id: "hbg", name: "Port of Hamburg", country: "Germany", code: "DEHAM", currentCongestion: 32, currentLevel: "clear",
    forecast72h: genForecast(32, 12),
    optimalWindow: { start: "Thu 14:00", end: "Thu 20:00", savings: 3 },
    queueCount: 3, avgProcessingH: 2.8, berthsTotal: 42, berthsOccupied: 14, throughputRank: "#3 Europe",
    trend: "stable", lastUpdated: "12 min ago",
    fleetVesselsEnRoute: [
      { name: "CV STELLARIS", eta: "72h (transit)", risk: "clear" },
    ],
  },
  {
    id: "dxb", name: "Jebel Ali", country: "UAE", code: "AEJEA", currentCongestion: 48, currentLevel: "moderate",
    forecast72h: genForecast(48, 16),
    optimalWindow: { start: "Fri 02:00", end: "Fri 08:00", savings: 7 },
    queueCount: 6, avgProcessingH: 3.9, berthsTotal: 67, berthsOccupied: 33, throughputRank: "#9 Global",
    trend: "improving", lastUpdated: "6 min ago",
    fleetVesselsEnRoute: [],
  },
];

function MiniCongestionChart({ forecast, color }: { forecast: HourForecast[]; color: string }) {
  const H = 36;
  const W = 200;
  const pad = 4;
  const innerH = H - pad * 2;
  const innerW = W - pad * 2;
  const max = Math.max(...forecast.map(f => f.congestion));
  const xs = forecast.map((_, i) => pad + (i / (forecast.length - 1)) * innerW);
  const ys = forecast.map(f => pad + innerH - (f.congestion / max) * innerH);
  const path = forecast.map((_, i) => `${i === 0 ? "M" : "L"} ${xs[i]},${ys[i]}`).join(" ");
  const fill = `${path} L ${xs[xs.length - 1]},${H - pad} L ${xs[0]},${H - pad} Z`;

  // Find optimal window (lowest congestion stretch)
  const minIdx = forecast.reduce((mi, f, i) => f.congestion < forecast[mi].congestion ? i : mi, 0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H }}>
      <defs>
        <linearGradient id={`cg-${color.replace(/[^a-z0-9]/gi, "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#cg-${color.replace(/[^a-z0-9]/gi, "")})`} />
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} />
      {/* Optimal window marker */}
      <circle cx={xs[minIdx]} cy={ys[minIdx]} r={3} fill="#22c55e" />
    </svg>
  );
}

function CongestionGauge({ value, level }: { value: number; level: CongestionLevel }) {
  const cfg = CONGESTION_CONFIG[level];
  const angle = (value / 100) * 180 - 90;
  const r = 36;
  const cx = 50;
  const cy = 50;
  const toXY = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const start = toXY(-90);
  const end = toXY(angle);
  const largeArc = value > 50 ? 1 : 0;

  return (
    <svg viewBox="0 0 100 60" style={{ width: 80, height: 50 }}>
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5} strokeLinecap="round" />
      <path d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`} fill="none" stroke={cfg.color} strokeWidth={5} strokeLinecap="round" />
      <text x={cx} y={cy - 4} textAnchor="middle" fill={cfg.color} fontSize={14} fontWeight={700}>{value}%</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={7}>{cfg.label}</text>
    </svg>
  );
}

export default function PredictiveCongestion() {
  const [selectedPort, setSelectedPort] = useState<Port>(PORTS[0]);

  return (
    <div style={{ background: BG.page, minHeight: "100vh", color: TEXT.primary }}>
      <div style={{ padding: "20px 28px 14px", borderBottom: `1px solid ${BORDER.subtle}` }}>
        <div className="flex items-center gap-3 mb-1">
          <div style={{ width: 36, height: 36, borderRadius: 8, background: `${ACCENT}18`, border: `1px solid ${ACCENT}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Anchor style={{ color: ACCENT, width: 18, height: 18 }} />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>Predictive Congestion Engine</h1>
            <p style={{ fontSize: 12, color: TEXT.tertiary, marginTop: 1 }}>72-hour port congestion forecasts · Optimal arrival windows · Fleet routing optimization</p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: TEXT.tertiary }}>
            <RefreshCw style={{ width: 11, height: 11 }} />
            Updated 3 min ago
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 0, minHeight: "calc(100vh - 90px)" }}>
        {/* Port list */}
        <div style={{ padding: "20px 24px", borderRight: `1px solid ${BORDER.subtle}`, overflowY: "auto" }}>
          {/* Summary stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
            {[
              { label: "Critical Ports", value: PORTS.filter(p => p.currentLevel === "critical").length, color: "#ef4444", icon: AlertTriangle },
              { label: "Elevated", value: PORTS.filter(p => p.currentLevel === "elevated").length, color: "#f97316", icon: TrendingUp },
              { label: "Fleet En Route", value: PORTS.reduce((a, p) => a + p.fleetVesselsEnRoute.length, 0), color: ACCENT, icon: Ship },
              { label: "Avg Savings/Vessel", value: "8.4h", color: "#22c55e", icon: Clock },
            ].map(s => (
              <div key={s.label} style={{ background: BG.surface, borderRadius: 10, border: `1px solid ${BORDER.subtle}`, padding: "12px 14px" }}>
                <s.icon style={{ width: 14, height: 14, color: s.color, marginBottom: 6 }} />
                <div style={{ fontSize: 18, fontWeight: 700, color: s.color, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
                <div style={{ fontSize: 10, color: TEXT.tertiary, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Port cards */}
          <div style={{ display: "grid", gap: 12 }}>
            {PORTS.map(port => {
              const cfg = CONGESTION_CONFIG[port.currentLevel];
              const isSelected = selectedPort.id === port.id;
              return (
                <div
                  key={port.id}
                  onClick={() => setSelectedPort(port)}
                  style={{
                    background: isSelected ? `${cfg.color}08` : BG.surface,
                    borderRadius: 12, border: `1px solid ${isSelected ? cfg.color + "30" : BORDER.subtle}`,
                    padding: "14px 18px", cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  <div className="flex items-start gap-12">
                    <CongestionGauge value={port.currentCongestion} level={port.currentLevel} />
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ fontSize: 14, fontWeight: 700, color: TEXT.primary }}>{port.name}</span>
                        <span style={{ fontSize: 10, color: TEXT.tertiary }}>{port.country}</span>
                        <span style={{ fontSize: 10, padding: "1px 5px", borderRadius: 3, background: cfg.bg, color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
                        {port.trend === "worsening" && <TrendingUp style={{ width: 11, height: 11, color: "#ef4444" }} />}
                        {port.trend === "improving" && <TrendingDown style={{ width: 11, height: 11, color: "#22c55e" }} />}
                      </div>
                      <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
                        {[
                          { label: "Queue", value: `${port.queueCount} vessels` },
                          { label: "Avg wait", value: `${port.avgProcessingH}h` },
                          { label: "Berths", value: `${port.berthsOccupied}/${port.berthsTotal}` },
                        ].map(m => (
                          <div key={m.label}>
                            <div style={{ fontSize: 9, color: TEXT.tertiary, marginBottom: 1 }}>{m.label}</div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: TEXT.secondary, fontVariantNumeric: "tabular-nums" }}>{m.value}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ width: "100%" }}>
                        <MiniCongestionChart forecast={port.forecast72h} color={cfg.color} />
                        <div className="flex justify-between mt-1">
                          <span style={{ fontSize: 9, color: TEXT.tertiary }}>Now</span>
                          <span style={{ fontSize: 9, color: "#22c55e" }}>● Optimal window: {port.optimalWindow.start}</span>
                          <span style={{ fontSize: 9, color: TEXT.tertiary }}>+72h</span>
                        </div>
                      </div>
                      {port.fleetVesselsEnRoute.length > 0 && (
                        <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                          {port.fleetVesselsEnRoute.map(v => (
                            <div key={v.name} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: `${CONGESTION_CONFIG[v.risk].color}15`, color: CONGESTION_CONFIG[v.risk].color, fontWeight: 500 }}>
                              {v.name} · {v.eta}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Forecast detail panel */}
        <div style={{ padding: "20px 20px", overflowY: "auto", background: BG.surface }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT.primary, marginBottom: 2 }}>{selectedPort.name}</div>
            <div style={{ fontSize: 11, color: TEXT.tertiary }}>{selectedPort.country} · {selectedPort.throughputRank}</div>
          </div>

          {/* Optimal arrival recommendation */}
          <div style={{ background: "#22c55e10", border: "1px solid #22c55e25", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 style={{ width: 14, height: 14, color: "#22c55e" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#22c55e" }}>Optimal Arrival Window</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT.primary, marginBottom: 4 }}>
              {selectedPort.optimalWindow.start} — {selectedPort.optimalWindow.end}
            </div>
            <div style={{ fontSize: 11, color: TEXT.secondary }}>
              Estimated {selectedPort.optimalWindow.savings}h reduction in wait time versus current arrival slot.
              {selectedPort.currentLevel === "critical" && " CRITICAL: Advance arrival strongly recommended."}
            </div>
          </div>

          {/* 72h hourly forecast table */}
          <div style={{ fontSize: 10, fontWeight: 600, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            72-Hour Forecast
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {selectedPort.forecast72h.map((pt, i) => {
              const level: CongestionLevel = pt.congestion >= 85 ? "critical" : pt.congestion >= 65 ? "elevated" : pt.congestion >= 40 ? "moderate" : "clear";
              const cfg = CONGESTION_CONFIG[level];
              const isOptimal = pt.congestion === Math.min(...selectedPort.forecast72h.map(f => f.congestion));
              return (
                <div
                  key={i}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: isOptimal ? "#22c55e0a" : BG.elevated,
                    borderRadius: 7, padding: "8px 10px",
                    border: `1px solid ${isOptimal ? "#22c55e25" : BORDER.subtle}`,
                  }}
                >
                  <span style={{ fontSize: 10, color: TEXT.tertiary, width: 40, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{pt.label}</span>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)" }}>
                    <div style={{ width: `${pt.congestion}%`, height: "100%", borderRadius: 3, background: cfg.color, transition: "width 0.3s" }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, width: 36, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{pt.congestion}%</span>
                  <span style={{ fontSize: 10, color: TEXT.tertiary, width: 50, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{pt.vessels} vessels</span>
                  <span style={{ fontSize: 10, color: TEXT.tertiary, width: 40, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{pt.avgWait}h wait</span>
                  {isOptimal && <CheckCircle2 style={{ width: 12, height: 12, color: "#22c55e", flexShrink: 0 }} />}
                </div>
              );
            })}
          </div>

          {/* Berth utilization */}
          <div style={{ marginTop: 18, background: BG.elevated, borderRadius: 10, border: `1px solid ${BORDER.subtle}`, padding: "14px 16px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Berth Status</div>
            <div className="flex items-center gap-10 mb-3">
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: CONGESTION_CONFIG[selectedPort.currentLevel].color, fontVariantNumeric: "tabular-nums" }}>{selectedPort.berthsOccupied}/{selectedPort.berthsTotal}</div>
                <div style={{ fontSize: 10, color: TEXT.tertiary }}>Berths occupied</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ height: 10, borderRadius: 5, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div style={{
                    width: `${(selectedPort.berthsOccupied / selectedPort.berthsTotal) * 100}%`,
                    height: "100%",
                    borderRadius: 5,
                    background: `linear-gradient(90deg, ${CONGESTION_CONFIG[selectedPort.currentLevel].color}, ${CONGESTION_CONFIG[selectedPort.currentLevel].color}80)`,
                  }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span style={{ fontSize: 9, color: TEXT.tertiary }}>0 berths</span>
                  <span style={{ fontSize: 9, color: TEXT.tertiary }}>{selectedPort.berthsTotal} berths</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
