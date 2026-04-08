import { useState, useMemo } from "react";
import { AlertTriangle, Wrench, Anchor, TrendingDown, BarChart3, Activity, ChevronRight, Info } from "lucide-react";

const ACCENT = "hsl(205 70% 50%)";

type DragFactor = {
  id: string;
  vesselName: string;
  issueType: "maintenance" | "exception" | "compliance" | "crew";
  title: string;
  urgencyScore: number;
  cascadeScore: number;
  voyagesImpacted: number;
  revenueAtRisk: number;
  fleetCascadeEffect: string;
  status: "critical" | "high" | "medium" | "low";
};

const DRAG_COLOR = {
  critical: { text: "#ef4444", bg: "#ef444415", border: "#ef444430" },
  high: { text: "#f97316", bg: "#f9731615", border: "#f9731630" },
  medium: { text: "#f59e0b", bg: "#f59e0b15", border: "#f59e0b30" },
  low: { text: "#22c55e", bg: "#22c55e15", border: "#22c55e30" },
};

const TYPE_ICON: Record<string, React.ElementType> = {
  maintenance: Wrench,
  exception: AlertTriangle,
  compliance: Anchor,
  crew: Activity,
};

const DRAG_FACTORS: DragFactor[] = [
  {
    id: "df-001",
    vesselName: "MV NOVA ATLAS",
    issueType: "maintenance",
    title: "Main engine inspection overdue — 180h past window",
    urgencyScore: 82,
    cascadeScore: 94,
    voyagesImpacted: 3,
    revenueAtRisk: 1_240_000,
    fleetCascadeEffect: "Next vessel in rotation (PACIFIC HERALD) has no dry dock slot available for 3 weeks. Delays cascade into Q3 charter obligations.",
    status: "critical",
  },
  {
    id: "df-002",
    vesselName: "MT BOREAL SEA",
    issueType: "compliance",
    title: "Sulphur certificate expired — ECA transit blocked",
    urgencyScore: 91,
    cascadeScore: 87,
    voyagesImpacted: 2,
    revenueAtRisk: 780_000,
    fleetCascadeEffect: "Dover Strait ECA entry blocked until resolution. Cargo must be rerouted or held, triggering demurrage exposure on next 2 voyages.",
    status: "critical",
  },
  {
    id: "df-003",
    vesselName: "CV SOLANO STAR",
    issueType: "exception",
    title: "Port congestion at Rotterdam — 38h delay expected",
    urgencyScore: 65,
    cascadeScore: 78,
    voyagesImpacted: 2,
    revenueAtRisk: 560_000,
    fleetCascadeEffect: "Downstream vessel (STELLARIS PRIME) queued for the same berth. 38h delay cascades to 52h total disruption across both voyages.",
    status: "high",
  },
  {
    id: "df-004",
    vesselName: "LNG ARTEMIS",
    issueType: "crew",
    title: "Chief Engineer rotation overdue — fatigue risk rising",
    urgencyScore: 71,
    cascadeScore: 72,
    voyagesImpacted: 1,
    revenueAtRisk: 320_000,
    fleetCascadeEffect: "No qualified replacement available in current port. Next voyage to Singapore is 18-day passage — maritime fatigue regulations will be breached mid-transit.",
    status: "high",
  },
  {
    id: "df-005",
    vesselName: "MV CAPE MERIDIAN",
    issueType: "maintenance",
    title: "Ballast water treatment system fault",
    urgencyScore: 55,
    cascadeScore: 61,
    voyagesImpacted: 1,
    revenueAtRisk: 220_000,
    fleetCascadeEffect: "Next port of call (Port of Los Angeles) has strict BWTS requirements. Denial of entry would strand cargo and trigger charterer penalty.",
    status: "medium",
  },
  {
    id: "df-006",
    vesselName: "MT ARCTIC PIONEER",
    issueType: "exception",
    title: "AIS signal lost — 14h silence in contested waters",
    urgencyScore: 88,
    cascadeScore: 58,
    voyagesImpacted: 1,
    revenueAtRisk: 180_000,
    fleetCascadeEffect: "Isolated event — no direct cascade but insurance liability exposure increases with each hour of silence in this zone.",
    status: "medium",
  },
  {
    id: "df-007",
    vesselName: "CV HARBOUR GATE",
    issueType: "compliance",
    title: "PSC inspection flag — minor deficiency pending closure",
    urgencyScore: 42,
    cascadeScore: 38,
    voyagesImpacted: 0,
    revenueAtRisk: 45_000,
    fleetCascadeEffect: "Low cascade potential. Port detention risk only if flag remains open past next port call.",
    status: "low",
  },
];

function CascadeBar({ cascade, urgency }: { cascade: number; urgency: number }) {
  return (
    <div className="space-y-1.5">
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>Cascade score</span>
          <span className="text-[11px] font-bold font-mono" style={{ color: cascade >= 80 ? "#ef4444" : cascade >= 60 ? "#f97316" : cascade >= 40 ? "#f59e0b" : "#22c55e" }}>{cascade}</span>
        </div>
        <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="h-full rounded-full" style={{
            width: `${cascade}%`,
            background: cascade >= 80 ? "linear-gradient(90deg,#ef4444,#f97316)" : cascade >= 60 ? "linear-gradient(90deg,#f97316,#f59e0b)" : "#f59e0b"
          }} />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>Urgency</span>
          <span className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>{urgency}</span>
        </div>
        <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="h-full rounded-full bg-sky-500/60" style={{ width: `${urgency}%` }} />
        </div>
      </div>
    </div>
  );
}

function DragCard({ factor, rank, expanded, onExpand }: {
  factor: DragFactor;
  rank: number;
  expanded: boolean;
  onExpand: () => void;
}) {
  const dc = DRAG_COLOR[factor.status];
  const Icon = TYPE_ICON[factor.issueType] ?? AlertTriangle;

  return (
    <div className="rounded-xl border overflow-hidden transition-all" style={{ borderColor: dc.border, background: "rgba(10,22,40,0.8)" }}>
      <button className="w-full text-left px-4 py-4 flex items-start gap-4 hover:bg-white/5 transition-colors" onClick={onExpand}>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-3xl font-black w-8 text-right" style={{ color: dc.text, opacity: 0.5 }}>{rank}</div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: dc.bg, border: `1px solid ${dc.border}` }}>
            <Icon size={16} style={{ color: dc.text }} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{factor.vesselName}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded capitalize" style={{ background: dc.bg, color: dc.text, border: `1px solid ${dc.border}` }}>{factor.status}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded capitalize" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>{factor.issueType}</span>
          </div>
          <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>{factor.title}</p>
          <div className="flex items-center gap-4 mt-2 text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            <span>{factor.voyagesImpacted} voyage{factor.voyagesImpacted !== 1 ? "s" : ""} impacted</span>
            <span style={{ color: "#ef4444" }}>${(factor.revenueAtRisk / 1000).toFixed(0)}K at risk</span>
          </div>
        </div>
        <div className="flex items-start gap-4 shrink-0 ml-auto">
          <div className="w-32">
            <CascadeBar cascade={factor.cascadeScore} urgency={factor.urgencyScore} />
          </div>
          {expanded ? <ChevronRight size={14} style={{ color: "rgba(255,255,255,0.3)", transform: "rotate(90deg)", marginTop: 2 }} /> : <ChevronRight size={14} style={{ color: "rgba(255,255,255,0.3)", marginTop: 2 }} />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t space-y-3 pt-3" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="text-[9px] uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>Fleet-wide cascade effect</div>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{factor.fleetCascadeEffect}</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Cascade Score", value: factor.cascadeScore, max: 100, color: dc.text },
              { label: "Urgency", value: factor.urgencyScore, max: 100, color: "rgba(14,165,233,0.8)" },
              { label: "Voyages Affected", value: factor.voyagesImpacted, max: 10, color: "#f59e0b" },
              { label: "Revenue at Risk", value: `$${(factor.revenueAtRisk / 1000).toFixed(0)}K`, max: null, color: "#ef4444" },
            ].map(m => (
              <div key={m.label} className="rounded-lg p-2.5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>{m.label}</div>
                <div className="text-sm font-bold font-mono" style={{ color: m.color }}>{m.max !== null ? m.value : m.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FleetCascadeChart({ factors }: { factors: DragFactor[] }) {
  const maxRevenue = Math.max(...factors.map(f => f.revenueAtRisk));
  return (
    <div className="rounded-xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
      <div className="text-[10px] font-mono uppercase tracking-wider mb-4" style={{ color: "rgba(255,255,255,0.3)" }}>
        Cascade Impact · Revenue at risk by issue
      </div>
      <div className="space-y-2.5">
        {factors.map((f, i) => {
          const dc = DRAG_COLOR[f.status];
          const pct = (f.revenueAtRisk / maxRevenue) * 100;
          return (
            <div key={f.id} className="flex items-center gap-3">
              <div className="text-[9px] font-mono w-4 text-right" style={{ color: "rgba(255,255,255,0.25)" }}>{i + 1}</div>
              <div className="w-28 shrink-0">
                <p className="text-[10px] text-sky-100 truncate">{f.vesselName}</p>
              </div>
              <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: dc.text }} />
              </div>
              <div className="w-16 text-right">
                <span className="text-[10px] font-mono" style={{ color: dc.text }}>${(f.revenueAtRisk / 1000).toFixed(0)}K</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ReadinessDragIndexPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<"cascade" | "revenue" | "urgency">("cascade");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const sorted = useMemo(() => {
    let factors = [...DRAG_FACTORS];
    if (filterStatus !== "all") factors = factors.filter(f => f.status === filterStatus);
    if (sortMode === "cascade") return factors.sort((a, b) => b.cascadeScore - a.cascadeScore);
    if (sortMode === "revenue") return factors.sort((a, b) => b.revenueAtRisk - a.revenueAtRisk);
    return factors.sort((a, b) => b.urgencyScore - a.urgencyScore);
  }, [sortMode, filterStatus]);

  const totalRevenue = DRAG_FACTORS.reduce((a, f) => a + f.revenueAtRisk, 0);
  const criticalCount = DRAG_FACTORS.filter(f => f.status === "critical").length;
  const avgCascade = Math.round(DRAG_FACTORS.reduce((a, f) => a + f.cascadeScore, 0) / DRAG_FACTORS.length);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown size={16} style={{ color: ACCENT }} />
            <h1 className="text-xl font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>Readiness Drag Index</h1>
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            Issues ranked by downstream disruption potential — cascade score, not just urgency
          </p>
        </div>
        <div className="text-[10px] font-mono px-2 py-1 rounded" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <Info size={10} className="inline mr-1" />
          Cascade = downstream fleet impact, not urgency alone
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total revenue at risk", value: `$${(totalRevenue / 1_000_000).toFixed(1)}M`, color: "#ef4444", icon: TrendingDown },
          { label: "Critical cascade issues", value: criticalCount, color: "#f97316", icon: AlertTriangle },
          { label: "Avg cascade score", value: `${avgCascade}/100`, color: "#f59e0b", icon: BarChart3 },
        ].map(m => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="rounded-xl border p-4 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
              <Icon size={18} style={{ color: m.color }} />
              <div>
                <div className="text-xl font-bold font-mono" style={{ color: m.color }}>{m.value}</div>
                <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{m.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-8 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {(["cascade", "revenue", "urgency"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSortMode(s)}
                  className="text-[10px] px-2.5 py-1 rounded-lg capitalize transition-colors"
                  style={{
                    background: sortMode === s ? "hsl(205 70% 38% / 0.15)" : "rgba(255,255,255,0.04)",
                    color: sortMode === s ? ACCENT : "rgba(255,255,255,0.4)",
                    border: `1px solid ${sortMode === s ? "hsl(205 70% 38% / 0.3)" : "rgba(255,255,255,0.06)"}`,
                  }}
                >
                  Sort: {s}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 ml-auto">
              {(["all", "critical", "high", "medium", "low"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className="text-[10px] px-2 py-1 rounded capitalize transition-colors"
                  style={{
                    background: filterStatus === s ? "rgba(255,255,255,0.06)" : "transparent",
                    color: filterStatus === s ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)",
                    border: `1px solid ${filterStatus === s ? "rgba(255,255,255,0.1)" : "transparent"}`,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {sorted.map((factor, i) => (
              <DragCard
                key={factor.id}
                factor={factor}
                rank={i + 1}
                expanded={expandedId === factor.id}
                onExpand={() => setExpandedId(prev => prev === factor.id ? null : factor.id)}
              />
            ))}
          </div>
        </div>

        <div className="col-span-4 space-y-4">
          <FleetCascadeChart factors={[...DRAG_FACTORS].sort((a, b) => b.revenueAtRisk - a.revenueAtRisk)} />

          <div className="rounded-xl border p-4" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="text-[10px] font-mono uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>How cascade score is calculated</div>
            <div className="space-y-2.5 text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>
              {[
                "Downstream vessel chain impact — vessels waiting on slots freed by this vessel",
                "Charter party obligations — demurrage clause exposure and deadline proximity",
                "Port congestion amplification — berth availability at destination",
                "Crew and compliance regulatory windows that close if issue persists",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(14,165,233,0.1)", color: "rgba(14,165,233,0.6)" }}>{i + 1}</div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
