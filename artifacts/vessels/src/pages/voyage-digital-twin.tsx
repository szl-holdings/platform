import { useState } from "react";
import {
  Ship, Fuel, CloudLightning, GitBranch, Play, Pause, RotateCcw,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, ChevronRight,
  Anchor, Navigation, Clock, DollarSign, Wind, Zap, Eye, Shield
} from "lucide-react";

const ACCENT = "hsl(205 70% 50%)";
const BG = { page: "#060e1a", surface: "#08121f", elevated: "#0c1628" } as const;
const BORDER = { subtle: "rgba(255,255,255,0.05)", muted: "rgba(255,255,255,0.09)" } as const;
const TEXT = {
  primary: "rgba(255,255,255,0.90)",
  secondary: "rgba(255,255,255,0.55)",
  tertiary: "rgba(255,255,255,0.28)",
} as const;

type ScenarioId = "baseline" | "divert_storm" | "speed_up" | "port_swap";

interface TimelinePoint {
  hour: number;
  label: string;
  fuelBurn: number;
  speedKnots: number;
  weatherRisk: number;
  position: string;
}

interface Scenario {
  id: ScenarioId;
  label: string;
  description: string;
  color: string;
  fuelDelta: number;
  timeDelta: number;
  costDelta: number;
  riskDelta: number;
  confidence: number;
  timeline: TimelinePoint[];
}

const SCENARIOS: Record<ScenarioId, Scenario> = {
  baseline: {
    id: "baseline",
    label: "Current Route",
    description: "Planned voyage as filed with authorities. Direct route through Gulf of Aden with scheduled port calls.",
    color: ACCENT,
    fuelDelta: 0,
    timeDelta: 0,
    costDelta: 0,
    riskDelta: 0,
    confidence: 94,
    timeline: [
      { hour: 0, label: "Departure", fuelBurn: 0, speedKnots: 0, weatherRisk: 5, position: "Port Salalah" },
      { hour: 6, label: "Open Sea", fuelBurn: 48, speedKnots: 14.2, weatherRisk: 12, position: "Arabian Sea" },
      { hour: 12, label: "Gulf Entry", fuelBurn: 96, speedKnots: 13.8, weatherRisk: 28, position: "Gulf of Aden Entry" },
      { hour: 18, label: "Narrow Passage", fuelBurn: 143, speedKnots: 12.5, weatherRisk: 45, position: "Gulf of Aden — Corridor" },
      { hour: 24, label: "Bab al-Mandab", fuelBurn: 188, speedKnots: 14.0, weatherRisk: 62, position: "Bab al-Mandab Strait" },
      { hour: 30, label: "Red Sea Entry", fuelBurn: 234, speedKnots: 14.5, weatherRisk: 38, position: "Red Sea — South" },
      { hour: 36, label: "Mid Red Sea", fuelBurn: 279, speedKnots: 14.2, weatherRisk: 22, position: "Red Sea — Middle" },
      { hour: 42, label: "Suez Approach", fuelBurn: 323, speedKnots: 13.5, weatherRisk: 15, position: "Port Said Approach" },
      { hour: 48, label: "Arrival", fuelBurn: 368, speedKnots: 0, weatherRisk: 8, position: "Port Said" },
    ],
  },
  divert_storm: {
    id: "divert_storm",
    label: "Storm Diversion",
    description: "Reroute south of the cyclone track forming in the Gulf of Aden. Adds 14h but avoids 65% of weather risk.",
    color: "#f97316",
    fuelDelta: 18,
    timeDelta: 14,
    costDelta: 24600,
    riskDelta: -65,
    confidence: 87,
    timeline: [
      { hour: 0, label: "Departure", fuelBurn: 0, speedKnots: 0, weatherRisk: 5, position: "Port Salalah" },
      { hour: 6, label: "Diversion Point", fuelBurn: 50, speedKnots: 14.8, weatherRisk: 10, position: "Arabian Sea" },
      { hour: 12, label: "Southern Arc", fuelBurn: 102, speedKnots: 15.0, weatherRisk: 8, position: "Southern Bypass" },
      { hour: 18, label: "Clear of System", fuelBurn: 154, speedKnots: 14.5, weatherRisk: 12, position: "South Yemen Coast" },
      { hour: 24, label: "Bab al-Mandab", fuelBurn: 204, speedKnots: 14.0, weatherRisk: 18, position: "Bab al-Mandab" },
      { hour: 30, label: "Red Sea Entry", fuelBurn: 252, speedKnots: 14.2, weatherRisk: 22, position: "Red Sea South" },
      { hour: 36, label: "Mid Red Sea", fuelBurn: 300, speedKnots: 14.0, weatherRisk: 20, position: "Red Sea Middle" },
      { hour: 42, label: "Northern Red Sea", fuelBurn: 347, speedKnots: 13.8, weatherRisk: 15, position: "Red Sea North" },
      { hour: 48, label: "Extended Transit", fuelBurn: 394, speedKnots: 13.5, weatherRisk: 12, position: "Suez Approach" },
      { hour: 62, label: "Arrival", fuelBurn: 433, speedKnots: 0, weatherRisk: 8, position: "Port Said" },
    ],
  },
  speed_up: {
    id: "speed_up",
    label: "Accelerated Arrival",
    description: "Push to 16 knots to arrive 8h early for priority berth. 28% higher fuel burn but secures premium slot.",
    color: "#22c55e",
    fuelDelta: 28,
    timeDelta: -8,
    costDelta: 38400,
    riskDelta: 15,
    confidence: 91,
    timeline: [
      { hour: 0, label: "Departure", fuelBurn: 0, speedKnots: 0, weatherRisk: 5, position: "Port Salalah" },
      { hour: 5, label: "Full Speed", fuelBurn: 56, speedKnots: 16.2, weatherRisk: 14, position: "Arabian Sea" },
      { hour: 10, label: "Gulf Entry", fuelBurn: 114, speedKnots: 16.0, weatherRisk: 32, position: "Gulf of Aden Entry" },
      { hour: 15, label: "Corridor", fuelBurn: 170, speedKnots: 15.8, weatherRisk: 52, position: "Gulf of Aden" },
      { hour: 20, label: "Bab al-Mandab", fuelBurn: 224, speedKnots: 16.0, weatherRisk: 58, position: "Bab al-Mandab" },
      { hour: 25, label: "Red Sea", fuelBurn: 280, speedKnots: 16.2, weatherRisk: 42, position: "Red Sea South" },
      { hour: 30, label: "Mid Red Sea", fuelBurn: 334, speedKnots: 15.8, weatherRisk: 28, position: "Red Sea Middle" },
      { hour: 35, label: "Suez Approach", fuelBurn: 388, speedKnots: 15.5, weatherRisk: 18, position: "Suez Approach" },
      { hour: 40, label: "Arrival", fuelBurn: 430, speedKnots: 0, weatherRisk: 8, position: "Port Said" },
    ],
  },
  port_swap: {
    id: "port_swap",
    label: "Port Swap — Sokhna",
    description: "Divert to Port of Sokhna instead of Port Said. Avoids 16-vessel queue. 6h additional transit but same-day processing guaranteed.",
    color: "#a78bfa",
    fuelDelta: 8,
    timeDelta: -2,
    costDelta: -14200,
    riskDelta: -22,
    confidence: 82,
    timeline: [
      { hour: 0, label: "Departure", fuelBurn: 0, speedKnots: 0, weatherRisk: 5, position: "Port Salalah" },
      { hour: 6, label: "Open Sea", fuelBurn: 49, speedKnots: 14.5, weatherRisk: 12, position: "Arabian Sea" },
      { hour: 12, label: "Gulf Entry", fuelBurn: 98, speedKnots: 14.0, weatherRisk: 28, position: "Gulf of Aden Entry" },
      { hour: 18, label: "Corridor", fuelBurn: 147, speedKnots: 13.8, weatherRisk: 44, position: "Gulf of Aden" },
      { hour: 24, label: "Bab al-Mandab", fuelBurn: 194, speedKnots: 14.2, weatherRisk: 48, position: "Bab al-Mandab" },
      { hour: 30, label: "Red Sea", fuelBurn: 242, speedKnots: 14.5, weatherRisk: 32, position: "Red Sea South" },
      { hour: 36, label: "Sokhna Approach", fuelBurn: 290, speedKnots: 14.0, weatherRisk: 18, position: "Red Sea North" },
      { hour: 46, label: "Arrival", fuelBurn: 328, speedKnots: 0, weatherRisk: 6, position: "Port of Sokhna" },
    ],
  },
};

const VESSELS = [
  { id: "mv-atlantis", name: "MV ATLANTIS COMMAND", type: "Container", flag: "🇬🇧", origin: "Port Salalah", destination: "Port Said", imo: "9734219", eta: "48h", progress: 0.28 },
  { id: "mt-boreal", name: "MT BOREAL SEA", type: "Tanker", flag: "🇳🇴", origin: "Jebel Ali", destination: "Rotterdam", imo: "9642108", eta: "96h", progress: 0.12 },
  { id: "cv-stellaris", name: "CV STELLARIS", type: "Container", flag: "🇵🇦", origin: "Shanghai", destination: "Hamburg", imo: "9812744", eta: "72h", progress: 0.44 },
];

function FuelChart({ scenario, playing, tick }: { scenario: Scenario; playing: boolean; tick: number }) {
  const pts = scenario.timeline;
  const maxFuel = Math.max(...pts.map(p => p.fuelBurn));
  const maxHour = pts[pts.length - 1].hour;
  const W = 520;
  const H = 80;
  const pad = { l: 8, r: 8, t: 8, b: 8 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const xs = pts.map(p => pad.l + (p.hour / maxHour) * innerW);
  const ys = pts.map(p => pad.t + innerH - (p.fuelBurn / maxFuel) * innerH);
  const path = pts.map((_, i) => `${i === 0 ? "M" : "L"} ${xs[i]},${ys[i]}`).join(" ");
  const fill = `${path} L ${xs[xs.length - 1]},${H - pad.b} L ${xs[0]},${H - pad.b} Z`;
  const progressX = pad.l + Math.min(tick / 100, 1) * innerW;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 80 }}>
      <defs>
        <linearGradient id="fuelGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={scenario.color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={scenario.color} stopOpacity="0.02" />
        </linearGradient>
        <clipPath id="progressClip">
          <rect x={0} y={0} width={progressX} height={H} />
        </clipPath>
      </defs>
      <path d={fill} fill="url(#fuelGrad)" clipPath="url(#progressClip)" />
      <path d={path} fill="none" stroke={scenario.color} strokeWidth={1.5} strokeOpacity={0.6} />
      <path d={path} fill="none" stroke={scenario.color} strokeWidth={2} clipPath="url(#progressClip)" />
      {playing && (
        <line x1={progressX} y1={pad.t} x2={progressX} y2={H - pad.b} stroke={scenario.color} strokeWidth={1} strokeOpacity={0.8} strokeDasharray="3,2" />
      )}
    </svg>
  );
}

function WeatherRiskBar({ points, color }: { points: TimelinePoint[]; color: string }) {
  const maxH = Math.max(...points.map(p => p.weatherRisk));
  return (
    <div className="flex items-end gap-0.5" style={{ height: 32 }}>
      {points.map((p, i) => (
        <div
          key={i}
          title={`${p.label}: ${p.weatherRisk}% risk`}
          style={{
            flex: 1,
            height: `${(p.weatherRisk / maxH) * 100}%`,
            background: p.weatherRisk > 50 ? `rgba(239,68,68,0.6)` : p.weatherRisk > 25 ? `rgba(249,115,22,0.5)` : `${color}50`,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}

export default function VoyageDigitalTwin() {
  const [activeVessel, setActiveVessel] = useState(VESSELS[0]);
  const [activeScenario, setActiveScenario] = useState<ScenarioId>("baseline");
  const [compareScenario, setCompareScenario] = useState<ScenarioId | null>(null);
  const [playing, setPlaying] = useState(false);
  const [tick, setTick] = useState(28);

  const scenario = SCENARIOS[activeScenario];
  const compare = compareScenario ? SCENARIOS[compareScenario] : null;

  function togglePlay() {
    setPlaying(p => {
      if (!p) {
        const id = setInterval(() => {
          setTick(t => {
            if (t >= 100) { clearInterval(id); return 100; }
            return t + 1;
          });
        }, 80);
      }
      return !p;
    });
  }

  function reset() {
    setPlaying(false);
    setTick(0);
  }

  const baseFuel = scenario.timeline[scenario.timeline.length - 1].fuelBurn;
  const arrivalHour = scenario.timeline[scenario.timeline.length - 1].hour;
  const currentPtIdx = Math.round((tick / 100) * (scenario.timeline.length - 1));
  const currentPt = scenario.timeline[Math.min(currentPtIdx, scenario.timeline.length - 1)];

  return (
    <div style={{ background: BG.page, minHeight: "100vh", color: TEXT.primary }}>
      <div style={{ borderBottom: `1px solid ${BORDER.subtle}`, padding: "20px 28px 16px" }}>
        <div className="flex items-center gap-3 mb-4">
          <div style={{ width: 36, height: 36, borderRadius: 8, background: `${ACCENT}18`, border: `1px solid ${ACCENT}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Ship style={{ color: ACCENT, width: 18, height: 18 }} />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: TEXT.primary, letterSpacing: "-0.01em" }}>Voyage Digital Twin</h1>
            <p style={{ fontSize: 12, color: TEXT.tertiary, marginTop: 2 }}>Real-time simulation · Scenario branching · Fuel & weather modeling</p>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {VESSELS.map(v => (
            <button
              key={v.id}
              onClick={() => setActiveVessel(v)}
              style={{
                padding: "8px 14px", borderRadius: 8, border: `1px solid ${activeVessel.id === v.id ? ACCENT + "40" : BORDER.muted}`,
                background: activeVessel.id === v.id ? `${ACCENT}10` : BG.surface, cursor: "pointer", flexShrink: 0,
                transition: "all 0.15s",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: activeVessel.id === v.id ? ACCENT : TEXT.primary, whiteSpace: "nowrap" }}>{v.flag} {v.name}</div>
              <div style={{ fontSize: 10, color: TEXT.tertiary, marginTop: 2 }}>{v.origin} → {v.destination}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 0, height: "calc(100vh - 136px)" }}>
        {/* Main simulation panel */}
        <div style={{ padding: "20px 24px", borderRight: `1px solid ${BORDER.subtle}`, overflowY: "auto" }}>
          {/* Voyage route visualization */}
          <div style={{ background: BG.surface, borderRadius: 12, border: `1px solid ${BORDER.subtle}`, padding: "16px 20px", marginBottom: 16 }}>
            <div className="flex items-center justify-between mb-3">
              <div style={{ fontSize: 11, fontWeight: 600, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Voyage Route Simulation
              </div>
              <div className="flex items-center gap-2">
                <div style={{ fontSize: 10, color: TEXT.tertiary, padding: "2px 8px", borderRadius: 4, border: `1px solid ${BORDER.muted}`, background: BG.elevated }}>
                  {activeVessel.progress * 100 | 0}% complete
                </div>
                <button
                  onClick={reset}
                  style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${BORDER.muted}`, background: BG.elevated, cursor: "pointer", color: TEXT.secondary, fontSize: 11 }}
                >
                  <RotateCcw style={{ width: 12, height: 12 }} />
                </button>
                <button
                  onClick={togglePlay}
                  style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${scenario.color}40`, background: `${scenario.color}15`, cursor: "pointer", color: scenario.color, fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}
                >
                  {playing ? <Pause style={{ width: 12, height: 12 }} /> : <Play style={{ width: 12, height: 12 }} />}
                  {playing ? "Pause" : "Simulate"}
                </button>
              </div>
            </div>
            {/* Route waypoints */}
            <div style={{ position: "relative", padding: "8px 0", marginBottom: 12 }}>
              <div style={{ position: "absolute", top: 24, left: 16, right: 16, height: 2, background: `linear-gradient(90deg, ${scenario.color}60, ${scenario.color}20)`, borderRadius: 2 }} />
              <div style={{ position: "absolute", top: 24, left: 16, width: `${tick}%`, maxWidth: "calc(100% - 32px)", height: 2, background: scenario.color, borderRadius: 2, transition: "width 0.1s" }} />
              <div className="flex justify-between" style={{ position: "relative", zIndex: 1 }}>
                {scenario.timeline.filter((_, i) => i % 2 === 0 || i === scenario.timeline.length - 1).map((pt, i, arr) => (
                  <div key={i} className="flex flex-col items-center" style={{ flex: "0 0 auto" }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: "50%",
                      background: (tick / 100) >= (i / (arr.length - 1)) ? scenario.color : BG.elevated,
                      border: `2px solid ${(tick / 100) >= (i / (arr.length - 1)) ? scenario.color : BORDER.muted}`,
                      marginBottom: 6,
                    }} />
                    <div style={{ fontSize: 9, color: TEXT.tertiary, whiteSpace: "nowrap", maxWidth: 60, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis" }}>{pt.position}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live position readout */}
            <div style={{ background: `${scenario.color}08`, border: `1px solid ${scenario.color}20`, borderRadius: 8, padding: "10px 14px", display: "flex", gap: 24 }}>
              <div>
                <div style={{ fontSize: 9, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Current Position</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: TEXT.primary }}>{currentPt.position}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Speed</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: scenario.color, fontVariantNumeric: "tabular-nums" }}>{currentPt.speedKnots} kn</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Fuel Burn</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: TEXT.primary, fontVariantNumeric: "tabular-nums" }}>{currentPt.fuelBurn} t</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Weather Risk</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: currentPt.weatherRisk > 50 ? "#ef4444" : currentPt.weatherRisk > 25 ? "#f97316" : "#22c55e", fontVariantNumeric: "tabular-nums" }}>{currentPt.weatherRisk}%</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>ETA</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: TEXT.primary }}>{arrivalHour}h</div>
              </div>
            </div>
          </div>

          {/* Fuel burn chart */}
          <div style={{ background: BG.surface, borderRadius: 12, border: `1px solid ${BORDER.subtle}`, padding: "14px 18px", marginBottom: 16 }}>
            <div className="flex items-center justify-between mb-3">
              <div style={{ fontSize: 11, fontWeight: 600, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 6 }}>
                <Fuel style={{ width: 12, height: 12, color: scenario.color }} />
                Fuel Burn Projection
              </div>
              <div style={{ fontSize: 10, color: scenario.color }}>Total: {baseFuel}t · ${(baseFuel * 680).toLocaleString()}</div>
            </div>
            <FuelChart scenario={scenario} playing={playing} tick={tick} />
            {compare && (
              <>
                <div style={{ borderTop: `1px solid ${BORDER.subtle}`, margin: "10px 0" }} />
                <FuelChart scenario={compare} playing={playing} tick={tick} />
                <div className="flex items-center gap-3 mt-2">
                  <div style={{ width: 12, height: 2, background: scenario.color, borderRadius: 1 }} />
                  <span style={{ fontSize: 10, color: TEXT.secondary }}>{scenario.label}</span>
                  <div style={{ width: 12, height: 2, background: compare.color, borderRadius: 1 }} />
                  <span style={{ fontSize: 10, color: TEXT.secondary }}>{compare.label}</span>
                </div>
              </>
            )}
          </div>

          {/* Weather risk bars */}
          <div style={{ background: BG.surface, borderRadius: 12, border: `1px solid ${BORDER.subtle}`, padding: "14px 18px" }}>
            <div className="flex items-center gap-2 mb-3">
              <CloudLightning style={{ width: 12, height: 12, color: "#f97316" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em" }}>Weather Impact by Waypoint</span>
            </div>
            <WeatherRiskBar points={scenario.timeline} color={scenario.color} />
            <div className="flex justify-between mt-1">
              <span style={{ fontSize: 9, color: TEXT.tertiary }}>{scenario.timeline[0].label}</span>
              <span style={{ fontSize: 9, color: TEXT.tertiary }}>{scenario.timeline[scenario.timeline.length - 1].label}</span>
            </div>
          </div>
        </div>

        {/* Scenario panel */}
        <div style={{ padding: "20px 20px", overflowY: "auto", background: BG.surface }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <GitBranch style={{ width: 12, height: 12 }} />
            What-If Scenarios
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {(Object.values(SCENARIOS) as Scenario[]).map(sc => {
              const isActive = sc.id === activeScenario;
              const isCompare = sc.id === compareScenario;
              return (
                <div
                  key={sc.id}
                  style={{
                    background: isActive ? `${sc.color}10` : BG.elevated,
                    border: `1px solid ${isActive ? sc.color + "35" : isCompare ? sc.color + "25" : BORDER.subtle}`,
                    borderRadius: 10, padding: "12px 14px", cursor: "pointer", transition: "all 0.15s",
                  }}
                  onClick={() => setActiveScenario(sc.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? sc.color : TEXT.primary }}>{sc.label}</div>
                    <div className="flex items-center gap-1">
                      {isActive && <div style={{ fontSize: 9, color: sc.color, background: `${sc.color}15`, padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>ACTIVE</div>}
                      <button
                        onClick={e => { e.stopPropagation(); setCompareScenario(isCompare ? null : sc.id); }}
                        style={{ fontSize: 9, color: isCompare ? sc.color : TEXT.tertiary, background: isCompare ? `${sc.color}15` : "transparent", border: `1px solid ${isCompare ? sc.color + "30" : BORDER.subtle}`, padding: "2px 6px", borderRadius: 4, cursor: "pointer" }}
                      >
                        {isCompare ? "Comparing" : "Compare"}
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: 11, color: TEXT.secondary, lineHeight: 1.5, marginBottom: 10 }}>{sc.description}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {[
                      { label: "Fuel Δ", value: sc.fuelDelta === 0 ? "Baseline" : `${sc.fuelDelta > 0 ? "+" : ""}${sc.fuelDelta}%`, color: sc.fuelDelta > 20 ? "#ef4444" : sc.fuelDelta > 0 ? "#f97316" : sc.fuelDelta < 0 ? "#22c55e" : TEXT.secondary },
                      { label: "Time Δ", value: sc.timeDelta === 0 ? "On schedule" : `${sc.timeDelta > 0 ? "+" : ""}${sc.timeDelta}h`, color: sc.timeDelta > 0 ? "#f97316" : sc.timeDelta < 0 ? "#22c55e" : TEXT.secondary },
                      { label: "Cost Δ", value: sc.costDelta === 0 ? "Baseline" : `${sc.costDelta > 0 ? "+" : ""}$${Math.abs(sc.costDelta).toLocaleString()}`, color: sc.costDelta > 0 ? "#ef4444" : sc.costDelta < 0 ? "#22c55e" : TEXT.secondary },
                      { label: "Risk Δ", value: sc.riskDelta === 0 ? "Baseline" : `${sc.riskDelta > 0 ? "+" : ""}${sc.riskDelta}%`, color: sc.riskDelta > 0 ? "#ef4444" : sc.riskDelta < 0 ? "#22c55e" : TEXT.secondary },
                    ].map(m => (
                      <div key={m.label} style={{ background: BG.page, borderRadius: 6, padding: "6px 8px" }}>
                        <div style={{ fontSize: 9, color: TEXT.tertiary, marginBottom: 2 }}>{m.label}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: m.color, fontVariantNumeric: "tabular-nums" }}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ flex: 1, height: 3, borderRadius: 2, background: BORDER.muted }}>
                      <div style={{ width: `${sc.confidence}%`, height: "100%", borderRadius: 2, background: sc.color }} />
                    </div>
                    <span style={{ fontSize: 9, color: TEXT.tertiary, flexShrink: 0 }}>{sc.confidence}% confidence</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* KPIs */}
          <div style={{ marginTop: 16, background: BG.elevated, borderRadius: 10, border: `1px solid ${BORDER.subtle}`, padding: "14px 16px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Active Scenario KPIs</div>
            {[
              { icon: Clock, label: "ETA", value: `${arrivalHour}h`, sub: activeVessel.destination },
              { icon: Fuel, label: "Projected Fuel", value: `${baseFuel}t`, sub: `$${(baseFuel * 680).toLocaleString()}` },
              { icon: DollarSign, label: "Voyage P&L", value: "$1.84M", sub: scenario.costDelta !== 0 ? `Δ $${Math.abs(scenario.costDelta).toLocaleString()}` : "On budget" },
              { icon: Shield, label: "Risk Score", value: `${42 + scenario.riskDelta}%`, sub: scenario.riskDelta < 0 ? "↓ Reduced" : scenario.riskDelta > 0 ? "↑ Elevated" : "Unchanged" },
            ].map(k => (
              <div key={k.label} className="flex items-center gap-10 py-2" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
                <k.icon style={{ width: 14, height: 14, color: ACCENT, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: TEXT.tertiary }}>{k.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TEXT.primary, fontVariantNumeric: "tabular-nums" }}>{k.value}</div>
                </div>
                <div style={{ fontSize: 10, color: TEXT.tertiary, textAlign: "right" }}>{k.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
