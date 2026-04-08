import { useState } from "react";
import { Anchor, Clock, TrendingDown, AlertTriangle, Map, History, Lightbulb } from "lucide-react";

const ACCENT = "hsl(205 70% 50%)";

type PortRiskLevel = "low" | "moderate" | "elevated" | "high";

interface PortFrictionRecord {
  portCode: string;
  portName: string;
  country: string;
  riskLevel: PortRiskLevel;
  avgDelayHours: number;
  delayVolatility: number;
  avgBerthWait: number;
  recoveryHours: number;
  visitCount: number;
  lastVisited: string;
  frictionPatterns: string[];
  recoveryPatterns: string[];
  predictedDelay: number;
  confidence: number;
  activeVessel: string | null;
  historicalIncidents: Array<{
    date: string;
    delayHours: number;
    cause: string;
    resolved: boolean;
  }>;
}

const RISK_COLORS: Record<PortRiskLevel, { text: string; bg: string; border: string; label: string }> = {
  low: { text: "#22c55e", bg: "#22c55e12", border: "#22c55e30", label: "Low friction" },
  moderate: { text: "#f59e0b", bg: "#f59e0b12", border: "#f59e0b30", label: "Moderate friction" },
  elevated: { text: "#f97316", bg: "#f9731612", border: "#f9731630", label: "Elevated friction" },
  high: { text: "#ef4444", bg: "#ef444412", border: "#ef444430", label: "High friction" },
};

const PORT_FRICTION_DATA: PortFrictionRecord[] = [
  {
    portCode: "SGSIN",
    portName: "Port of Singapore",
    country: "Singapore",
    riskLevel: "elevated",
    avgDelayHours: 9.2,
    delayVolatility: 4.1,
    avgBerthWait: 6.3,
    recoveryHours: 11,
    visitCount: 47,
    lastVisited: "2026-04-01",
    activeVessel: "CV STELLARIS",
    frictionPatterns: [
      "Berth congestion peaks Tuesday–Thursday 06:00–14:00 UTC",
      "Recurring anchorage queue of 12–18 vessels during peak months",
      "Customs pre-clearance delays when documentation arrives < 24h before arrival",
    ],
    recoveryPatterns: [
      "Early-morning arrivals (02:00–05:00 local) consistently bypass queue",
      "PSA alternate terminal reduces average wait by 3.4h",
      "Pre-filing via single window reduces customs delay by avg 68%",
    ],
    predictedDelay: 8.5,
    confidence: 82,
    historicalIncidents: [
      { date: "2026-03-15", delayHours: 14, cause: "Port-wide IT outage — manifest processing halted", resolved: true },
      { date: "2026-02-28", delayHours: 9, cause: "Berth 22 blockage — vessel breakdown", resolved: true },
      { date: "2026-01-12", delayHours: 6, cause: "Customs staffing reduced — national holiday", resolved: true },
    ],
  },
  {
    portCode: "NLRTM",
    portName: "Port of Rotterdam",
    country: "Netherlands",
    riskLevel: "moderate",
    avgDelayHours: 4.8,
    delayVolatility: 2.8,
    avgBerthWait: 3.1,
    recoveryHours: 5,
    visitCount: 63,
    lastVisited: "2026-04-03",
    activeVessel: null,
    frictionPatterns: [
      "Weather-related delays concentrate in November–February (North Sea swells)",
      "Maasvlakte II gate queue builds after 16:00 local — avg +2.1h",
      "Dangerous goods documentation frequently requires re-submission",
    ],
    recoveryPatterns: [
      "APM Terminals consistently performs 0.8h faster than ECT Delta",
      "Winter arrivals should add 6h buffer for weather holds",
      "Advance booking via Port Community System reduces waiting by avg 41%",
    ],
    predictedDelay: 4.2,
    confidence: 91,
    historicalIncidents: [
      { date: "2026-03-22", delayHours: 11, cause: "North Sea storm — all vessel movements suspended 9h", resolved: true },
      { date: "2026-02-08", delayHours: 5, cause: "Longshoremen action — reduced crew at ECT", resolved: true },
    ],
  },
  {
    portCode: "AEJEA",
    portName: "Jebel Ali",
    country: "UAE",
    riskLevel: "low",
    avgDelayHours: 2.4,
    delayVolatility: 1.2,
    avgBerthWait: 1.8,
    recoveryHours: 3,
    visitCount: 31,
    lastVisited: "2026-03-18",
    activeVessel: null,
    frictionPatterns: [
      "Ramadan period — customs clearance slows significantly mid-afternoon",
      "Sandstorm advisories occasionally delay crane operations by 1–3h",
    ],
    recoveryPatterns: [
      "Consistent performance — one of lowest-friction ports in portfolio",
      "DP World pre-arrival planning integration reduces all delays by avg 55%",
    ],
    predictedDelay: 2.1,
    confidence: 88,
    historicalIncidents: [
      { date: "2026-01-28", delayHours: 4, cause: "Sandstorm advisory — crane ops suspended 4h", resolved: true },
    ],
  },
  {
    portCode: "USLAX",
    portName: "Port of Los Angeles",
    country: "USA",
    riskLevel: "high",
    avgDelayHours: 22.4,
    delayVolatility: 11.2,
    avgBerthWait: 16.8,
    recoveryHours: 28,
    visitCount: 18,
    lastVisited: "2026-03-28",
    activeVessel: "MV CAPE MERIDIAN",
    frictionPatterns: [
      "Anchorage queue of 20–45 vessels during peak season (Oct–Jan)",
      "Chassis availability is the single biggest operational constraint",
      "BWTS inspection frequently triggered for vessels arriving from Asia",
      "CBP secondary inspections add avg 8–16h for flagged vessels",
    ],
    recoveryPatterns: [
      "Express lane available for vessels with perfect documentation — saves avg 14h",
      "Port Optimizer platform gives 6h advantage on berth slot allocation",
      "Off-peak arrival (Sunday 00:00–06:00 local) significantly reduces queue time",
    ],
    predictedDelay: 19.5,
    confidence: 74,
    historicalIncidents: [
      { date: "2026-04-01", delayHours: 38, cause: "Labor action — ILWU slowdown for 2 days", resolved: true },
      { date: "2026-03-14", delayHours: 22, cause: "Peak congestion — 43-vessel anchor queue", resolved: true },
      { date: "2026-02-10", delayHours: 18, cause: "CBP enhanced inspection sweep — 12 vessels held", resolved: true },
    ],
  },
  {
    portCode: "CNSHA",
    portName: "Port of Shanghai",
    country: "China",
    riskLevel: "moderate",
    avgDelayHours: 6.1,
    delayVolatility: 3.4,
    avgBerthWait: 4.3,
    recoveryHours: 7,
    visitCount: 29,
    lastVisited: "2026-03-31",
    activeVessel: null,
    frictionPatterns: [
      "Spring Festival shutdown creates significant post-holiday backlog (Feb–Mar)",
      "Zero-Covid legacy: random COVID-19 inspections still occasionally imposed",
      "Customs clearance requires dedicated local agent — impromptu arrivals cause delays",
    ],
    recoveryPatterns: [
      "SIPG Fast Lane for established operators reduces gate time by avg 40%",
      "Yangshan Deep Water Port outperforms Waigaoqiao on processing speed",
    ],
    predictedDelay: 5.4,
    confidence: 79,
    historicalIncidents: [
      { date: "2026-02-18", delayHours: 31, cause: "Post-holiday backlog — Spring Festival resumption rush", resolved: true },
      { date: "2026-01-22", delayHours: 8, cause: "Customs system maintenance — reduced clearance throughput", resolved: true },
    ],
  },
];

function ConfidenceIndicator({ value }: { value: number }) {
  const color = value >= 85 ? "#22c55e" : value >= 70 ? "#f59e0b" : "#f97316";
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-1.5 h-3.5 rounded-sm" style={{ background: i < Math.round(value / 20) ? color : "rgba(255,255,255,0.08)" }} />
        ))}
      </div>
      <span className="text-[10px] font-mono" style={{ color }}>{value}%</span>
    </div>
  );
}

function PortCard({ port, selected, onClick }: { port: PortFrictionRecord; selected: boolean; onClick: () => void }) {
  const rc = RISK_COLORS[port.riskLevel];
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border p-4 transition-all"
      style={{
        background: selected ? `${rc.bg}` : "rgba(255,255,255,0.02)",
        borderColor: selected ? rc.border : "rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{port.portName}</div>
          <div className="text-[10px] mt-0.5 font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>{port.portCode} · {port.country}</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold font-mono" style={{ color: rc.text }}>{port.avgDelayHours}h avg</div>
          <div className="text-[9px] mt-0.5 px-1.5 py-0.5 rounded" style={{ background: rc.bg, color: rc.text, border: `1px solid ${rc.border}` }}>{rc.label}</div>
        </div>
      </div>
      <div className="flex items-center gap-3 text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
        <span>{port.visitCount} visits recorded</span>
        {port.activeVessel && (
          <span className="flex items-center gap-1" style={{ color: "#f59e0b" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            {port.activeVessel} approaching
          </span>
        )}
      </div>
    </button>
  );
}

function PortDetailPanel({ port }: { port: PortFrictionRecord }) {
  const rc = RISK_COLORS[port.riskLevel];

  return (
    <div className="space-y-5">
      <div className="rounded-xl border p-5" style={{ background: rc.bg, borderColor: rc.border }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Anchor size={16} style={{ color: rc.text }} />
              <h2 className="text-base font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>{port.portName}</h2>
            </div>
            <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>{port.portCode} · {port.country} · {port.visitCount} visits in record</div>
          </div>
          {port.activeVessel && (
            <div className="rounded-lg px-3 py-2 text-[11px] flex items-center gap-2" style={{ background: "#f59e0b15", color: "#f59e0b", border: "1px solid #f59e0b30" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              {port.activeVessel} approaching
            </div>
          )}
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Avg delay", value: `${port.avgDelayHours}h`, color: rc.text },
            { label: "Berth wait", value: `${port.avgBerthWait}h`, color: "rgba(255,255,255,0.7)" },
            { label: "Recovery time", value: `${port.recoveryHours}h`, color: "#f59e0b" },
            { label: "Delay volatility", value: `±${port.delayVolatility}h`, color: "rgba(255,255,255,0.5)" },
          ].map(m => (
            <div key={m.label} className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>{m.label}</div>
              <div className="text-base font-bold font-mono" style={{ color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>
      </div>

      {port.activeVessel && (
        <div className="rounded-xl border p-4" style={{ background: "#f59e0b08", borderColor: "#f59e0b30" }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} style={{ color: "#f59e0b" }} />
            <span className="text-sm font-semibold" style={{ color: "#f59e0b" }}>Port friction alert — {port.activeVessel} inbound</span>
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
            Based on {port.visitCount} historical visits, expect <strong style={{ color: "#f59e0b" }}>{port.predictedDelay}h delay</strong> at this port.
            Model confidence: <strong style={{ color: "#f59e0b" }}>{port.confidence}%</strong>.
            Review friction patterns and recovery tactics below before arrival.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border p-4" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown size={14} style={{ color: "#ef4444" }} />
            <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.75)" }}>Recurring friction patterns</span>
          </div>
          <div className="space-y-2">
            {port.frictionPatterns.map((p, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                <span className="w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5" style={{ background: "#ef444415", color: "#ef4444" }}>{i + 1}</span>
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border p-4" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={14} style={{ color: "#22c55e" }} />
            <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.75)" }}>Recovery tactics that work</span>
          </div>
          <div className="space-y-2">
            {port.recoveryPatterns.map((p, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                <span className="w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5" style={{ background: "#22c55e15", color: "#22c55e" }}>✓</span>
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border p-4" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2 mb-3">
          <History size={14} style={{ color: "rgba(14,165,233,0.6)" }} />
          <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.75)" }}>Historical incident log</span>
          <div className="ml-auto">
            <ConfidenceIndicator value={port.confidence} />
          </div>
        </div>
        <div className="space-y-2">
          {port.historicalIncidents.map((inc, i) => (
            <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <Clock size={12} style={{ color: "rgba(255,255,255,0.3)", marginTop: 1, flexShrink: 0 }} />
              <div className="flex-1 text-[11px]">
                <span className="font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>{inc.date}</span>
                <span className="mx-2" style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
                <span style={{ color: "rgba(255,255,255,0.6)" }}>{inc.cause}</span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-mono font-bold" style={{ color: inc.delayHours >= 12 ? "#ef4444" : "#f59e0b" }}>+{inc.delayHours}h</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PortFrictionMemoryPage() {
  const [selectedPort, setSelectedPort] = useState(PORT_FRICTION_DATA[3]);
  const [search, setSearch] = useState("");

  const filtered = PORT_FRICTION_DATA.filter(p =>
    p.portName.toLowerCase().includes(search.toLowerCase()) ||
    p.portCode.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => b.avgDelayHours - a.avgDelayHours);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Map size={16} style={{ color: ACCENT }} />
            <h1 className="text-xl font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>Port Friction Memory</h1>
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            Learned delays, bottlenecks, and recovery patterns per port — surfaced automatically when a vessel approaches
          </p>
        </div>
        <div className="text-[10px] font-mono px-3 py-1.5 rounded-full" style={{ background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.12)", color: "rgba(14,165,233,0.6)" }}>
          {PORT_FRICTION_DATA.reduce((a, p) => a + p.visitCount, 0)} visits across {PORT_FRICTION_DATA.length} ports
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-4 space-y-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search ports..."
            className="w-full text-xs rounded-lg px-3 py-2 outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)" }}
          />
          <div className="space-y-2">
            {filtered.map(port => (
              <PortCard
                key={port.portCode}
                port={port}
                selected={selectedPort.portCode === port.portCode}
                onClick={() => setSelectedPort(port)}
              />
            ))}
          </div>
        </div>

        <div className="col-span-8">
          <PortDetailPanel port={selectedPort} />
        </div>
      </div>
    </div>
  );
}
