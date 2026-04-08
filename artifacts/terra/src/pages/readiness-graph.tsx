import { useState, useMemo } from "react";
import {
  GitBranch, AlertTriangle, CheckCircle, Clock,
  ChevronDown, ChevronRight, User, DollarSign, Zap, Target,
  Wrench
} from "lucide-react";
import {
  readinessGraphs,
  vendors,
  getVendorById,
  getVendorReliabilityScore,
  type ReadinessBlocker,
  type ReadinessGoal,
} from "@/data/readiness-graph";

const ACCENT = "#40856a";
const DEMO_BADGE = (
  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded font-mono uppercase tracking-widest"
    style={{ background: "rgba(184,148,60,0.12)", color: "#b8943c", border: "1px solid rgba(184,148,60,0.2)" }}>
    Simulated Data
  </span>
);

const GOAL_LABELS: Record<string, string> = {
  buy: "Acquire / Buy",
  sell: "Sell / Dispose",
  lease: "Lease / Stabilize",
  occupy: "Occupy",
  service: "Service / Manage",
};

const GOAL_COLORS: Record<string, string> = {
  buy: "#3a7ad4",
  sell: "#b8943c",
  lease: "#40856a",
  occupy: "#8b5cf6",
  service: "rgba(255,255,255,0.4)",
};

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: React.ElementType }> = {
  resolved: { color: "#40856a", label: "Resolved", icon: CheckCircle },
  in_progress: { color: "#3a7ad4", label: "In Progress", icon: Clock },
  open: { color: "#c04a2a", label: "Open", icon: AlertTriangle },
  waived: { color: "rgba(255,255,255,0.25)", label: "Waived", icon: CheckCircle },
};

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#c04a2a",
  high: "#b8943c",
  medium: "#4a7dc8",
  low: "rgba(255,255,255,0.3)",
};

function VendorPill({ vendorId }: { vendorId?: string }) {
  const vendor = vendorId ? getVendorById(vendorId) : null;
  if (!vendor) return null;
  const score = getVendorReliabilityScore(vendor);
  const scoreColor = score >= 80 ? ACCENT : score >= 60 ? "#b8943c" : "#c04a2a";
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px]"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <Wrench className="w-3 h-3" style={{ color: "rgba(255,255,255,0.3)" }} />
      <span style={{ color: "rgba(255,255,255,0.6)" }}>{vendor.name}</span>
      <span className="font-bold font-mono" style={{ color: scoreColor }}>{score}%</span>
      <span style={{ color: "rgba(255,255,255,0.2)" }}>reliable</span>
    </div>
  );
}

function BlockerCard({
  blocker,
  expanded,
  onToggle,
  onGeneratePlan,
  depth = 0,
}: {
  blocker: ReadinessBlocker;
  expanded: boolean;
  onToggle: () => void;
  onGeneratePlan: (blocker: ReadinessBlocker) => void;
  depth?: number;
}) {
  const cfg = STATUS_CONFIG[blocker.status];
  const Icon = cfg.icon;

  return (
    <div
      className="rounded-xl border transition-all duration-200"
      style={{
        borderColor: blocker.isCriticalPath ? `${SEVERITY_COLOR[blocker.severity]}30` : "rgba(255,255,255,0.06)",
        background: blocker.status === "resolved" ? "rgba(64,133,106,0.04)" : "rgba(255,255,255,0.02)",
        marginLeft: depth * 24,
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/2 transition-colors rounded-xl"
      >
        <div className="flex-shrink-0 mt-0.5">
          <Icon size={16} style={{ color: cfg.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-sm font-medium" style={{ color: blocker.status === "resolved" ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.9)" }}>
              {blocker.label}
            </span>
            {blocker.isCriticalPath && blocker.status !== "resolved" && (
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                style={{ color: "#c04a2a", background: "rgba(192,74,42,0.12)", border: "1px solid rgba(192,74,42,0.2)" }}>
                Critical Path
              </span>
            )}
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{ color: SEVERITY_COLOR[blocker.severity], background: `${SEVERITY_COLOR[blocker.severity]}12` }}>
              {blocker.severity}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            <span className="font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
            {blocker.estimatedDays && <span>~{blocker.estimatedDays}d to resolve</span>}
            {blocker.estimatedCost && (
              <span className="flex items-center gap-0.5">
                <DollarSign className="w-2.5 h-2.5" />
                {blocker.estimatedCost >= 1000
                  ? `$${(blocker.estimatedCost / 1000).toFixed(0)}K`
                  : `$${blocker.estimatedCost}`}
              </span>
            )}
            {blocker.assignedTo && (
              <span className="flex items-center gap-0.5">
                <User className="w-2.5 h-2.5" />
                {blocker.assignedTo}
              </span>
            )}
          </div>
        </div>
        {expanded ? <ChevronDown size={14} style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
          : <ChevronRight size={14} style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }} />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {blocker.description && (
            <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
              {blocker.description}
            </p>
          )}
          {blocker.vendorId && <VendorPill vendorId={blocker.vendorId} />}
          {blocker.dependsOn.length > 0 && (
            <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
              <span className="font-medium">Depends on:</span>{" "}
              <span>blocker{blocker.dependsOn.length > 1 ? "s" : ""} upstream</span>
            </div>
          )}
          {(blocker.status === "open" || blocker.status === "in_progress") && (
            <div className="flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); onGeneratePlan(blocker); }}
                className="text-[10px] px-3 py-1 rounded-lg font-semibold transition-colors"
                style={{ background: ACCENT, color: "white" }}>
                {blocker.status === "in_progress" ? "View Resolution Plan" : "Generate Resolution Plan"}
              </button>
              <button className="text-[10px] px-3 py-1 rounded-lg transition-colors hover:bg-white/5"
                style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                Assign Vendor
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResolutionPlanModal({
  blocker,
  onClose,
}: {
  blocker: ReadinessBlocker;
  onClose: () => void;
}) {
  const vendor = blocker.vendorId ? getVendorById(blocker.vendorId) : null;
  const reliabilityScore = vendor ? getVendorReliabilityScore(vendor) : null;
  const altVendors = blocker.vendorId
    ? vendors.filter(v => v.id !== blocker.vendorId).slice(0, 2)
    : vendors.slice(0, 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-lg rounded-2xl border p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        style={{ background: "#0d1117", borderColor: "rgba(255,255,255,0.1)" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap size={16} style={{ color: ACCENT }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: ACCENT }}>Resolution Plan</span>
              {DEMO_BADGE}
            </div>
            <h3 className="text-base font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>{blocker.label}</h3>
          </div>
          <button onClick={onClose} className="text-[10px] px-3 py-1 rounded-lg hover:bg-white/5 transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
            Close
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Est. Timeline", value: blocker.estimatedDays ? `${blocker.estimatedDays} days` : "TBD" },
            { label: "Est. Cost", value: blocker.estimatedCost ? `$${(blocker.estimatedCost >= 1000 ? (blocker.estimatedCost / 1000).toFixed(0) + "K" : blocker.estimatedCost)}` : "TBD" },
            { label: "Severity", value: blocker.severity.charAt(0).toUpperCase() + blocker.severity.slice(1) },
          ].map(m => (
            <div key={m.label} className="rounded-xl border p-3 text-center"
              style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="text-xs mb-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{m.label}</div>
              <div className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>{m.value}</div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border p-4 space-y-2"
          style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
            Recommended Steps
          </div>
          {[
            `Confirm scope and assign responsible owner to this blocker`,
            blocker.assignedTo ? `${blocker.assignedTo} to lead resolution` : `Assign to available team member`,
            vendor ? `Engage ${vendor.name} (${reliabilityScore}% reliability score)` : `Source qualified vendor for ${blocker.label}`,
            `Set internal deadline ${Math.max(1, (blocker.estimatedDays ?? 7) - 2)} days before target`,
            `Weekly status check until resolved`,
            blocker.isCriticalPath ? `Flag as critical path — escalate immediately if delayed` : `Monitor weekly — not on critical path`,
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-2.5 text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>
              <span className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold mt-0.5"
                style={{ background: `${ACCENT}20`, color: ACCENT }}>
                {i + 1}
              </span>
              {step}
            </div>
          ))}
        </div>

        {(vendor || altVendors.length > 0) && (
          <div className="rounded-xl border p-4"
            style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
              Vendor Options
            </div>
            {vendor && (
              <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                <div>
                  <div className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>{vendor.name}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {vendor.jobsCompleted} jobs · avg {vendor.avgDaysToComplete}d · {vendor.avgCostVariancePct}% cost variance
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded font-mono"
                  style={{ color: reliabilityScore! >= 80 ? ACCENT : reliabilityScore! >= 60 ? "#b8943c" : "#c04a2a", background: "rgba(255,255,255,0.04)" }}>
                  {reliabilityScore}% reliable
                </span>
              </div>
            )}
            {altVendors.slice(0, 1).map(v => {
              const s = getVendorReliabilityScore(v);
              return (
                <div key={v.id} className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{v.name} (alt)</div>
                    <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                      {v.jobsCompleted} jobs · avg {v.avgDaysToComplete}d
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded font-mono"
                    style={{ color: s >= 80 ? ACCENT : s >= 60 ? "#b8943c" : "#c04a2a", background: "rgba(255,255,255,0.04)" }}>
                    {s}% reliable
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const SEVERITY_WEIGHT: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function computeImpactScore(blockerId: string, allBlockers: ReadinessBlocker[]): number {
  const dependents = allBlockers.filter(b => b.dependsOn.includes(blockerId));
  const directWeight = SEVERITY_WEIGHT[allBlockers.find(b => b.id === blockerId)?.severity ?? "low"] ?? 1;
  return directWeight + dependents.length * 2;
}

function toposortLevels(blockers: ReadinessBlocker[]): ReadinessBlocker[][] {
  const idToBlocker = new Map(blockers.map(b => [b.id, b]));
  const level: Map<string, number> = new Map();

  function getLevel(id: string, visited: Set<string>): number {
    if (level.has(id)) return level.get(id)!;
    if (visited.has(id)) return 0;
    visited.add(id);
    const blocker = idToBlocker.get(id);
    if (!blocker || blocker.dependsOn.length === 0) {
      level.set(id, 0);
      return 0;
    }
    const maxParentLevel = Math.max(...blocker.dependsOn.map(pid => getLevel(pid, new Set(visited))));
    level.set(id, maxParentLevel + 1);
    return maxParentLevel + 1;
  }

  blockers.forEach(b => getLevel(b.id, new Set()));

  const maxLevel = Math.max(0, ...Array.from(level.values()));
  const rows: ReadinessBlocker[][] = Array.from({ length: maxLevel + 1 }, () => []);
  blockers.forEach(b => {
    const lv = level.get(b.id) ?? 0;
    rows[lv].push(b);
  });
  return rows;
}

function BlockerDAG({
  blockers,
  activeBlockerIds,
  onToggle,
}: {
  blockers: ReadinessBlocker[];
  activeBlockerIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  const relevantBlockers = blockers.filter(b => activeBlockerIds.has(b.id));
  if (relevantBlockers.length === 0) return null;

  const levels = toposortLevels(relevantBlockers);

  const NODE_W = 160;
  const NODE_H = 64;
  const COL_GAP = 48;
  const ROW_GAP = 16;

  const positions = new Map<string, { x: number; y: number }>();
  levels.forEach((row, colIdx) => {
    row.forEach((b, rowIdx) => {
      positions.set(b.id, {
        x: colIdx * (NODE_W + COL_GAP),
        y: rowIdx * (NODE_H + ROW_GAP),
      });
    });
  });

  const svgW = levels.length * (NODE_W + COL_GAP) - COL_GAP;
  const maxRows = Math.max(...levels.map(r => r.length));
  const svgH = maxRows * (NODE_H + ROW_GAP) - ROW_GAP;

  const edges: { x1: number; y1: number; x2: number; y2: number; critical: boolean }[] = [];
  relevantBlockers.forEach(b => {
    const to = positions.get(b.id);
    if (!to) return;
    b.dependsOn.forEach(pid => {
      const from = positions.get(pid);
      if (!from) return;
      edges.push({
        x1: from.x + NODE_W,
        y1: from.y + NODE_H / 2,
        x2: to.x,
        y2: to.y + NODE_H / 2,
        critical: !!relevantBlockers.find(bl => bl.id === pid)?.isCriticalPath,
      });
    });
  });

  const STATUS_FILL: Record<string, string> = {
    open: "rgba(192,74,42,0.14)",
    in_progress: "rgba(58,122,212,0.14)",
    resolved: "rgba(64,133,106,0.14)",
    waived: "rgba(255,255,255,0.04)",
  };

  return (
    <div className="rounded-xl border overflow-x-auto"
      style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
      <div className="px-4 pt-3 pb-1 flex items-center gap-2">
        <GitBranch size={12} style={{ color: ACCENT }} />
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>
          Dependency DAG — Critical Path & Impact
        </span>
      </div>
      <div className="px-4 pb-4 overflow-x-auto">
        <svg
          width={svgW + 4}
          height={svgH + 4}
          viewBox={`-2 -2 ${svgW + 4} ${svgH + 4}`}
          style={{ display: "block", minWidth: svgW }}
        >
          <defs>
            <marker id="arrowhead" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto">
              <polygon points="0 0, 7 2.5, 0 5" fill="rgba(255,255,255,0.15)" />
            </marker>
            <marker id="arrowhead-crit" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto">
              <polygon points="0 0, 7 2.5, 0 5" fill="rgba(192,74,42,0.5)" />
            </marker>
          </defs>

          {edges.map((e, i) => {
            const mx = (e.x1 + e.x2) / 2;
            const path = `M ${e.x1} ${e.y1} C ${mx} ${e.y1}, ${mx} ${e.y2}, ${e.x2} ${e.y2}`;
            return (
              <path
                key={i}
                d={path}
                fill="none"
                stroke={e.critical ? "rgba(192,74,42,0.4)" : "rgba(255,255,255,0.1)"}
                strokeWidth={e.critical ? 1.5 : 1}
                strokeDasharray={e.critical ? "none" : "4 3"}
                markerEnd={e.critical ? "url(#arrowhead-crit)" : "url(#arrowhead)"}
              />
            );
          })}

          {relevantBlockers.map(b => {
            const pos = positions.get(b.id);
            if (!pos) return null;
            const statusColor = STATUS_CONFIG[b.status].color;
            const impactScore = computeImpactScore(b.id, relevantBlockers);
            const fill = STATUS_FILL[b.status] ?? "rgba(255,255,255,0.04)";
            const isActive = activeBlockerIds.has(b.id);

            return (
              <g
                key={b.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                style={{ cursor: "pointer" }}
                onClick={() => onToggle(b.id)}
              >
                <rect
                  x={0} y={0} width={NODE_W} height={NODE_H} rx={10}
                  fill={fill}
                  stroke={b.isCriticalPath ? `${statusColor}50` : "rgba(255,255,255,0.08)"}
                  strokeWidth={b.isCriticalPath ? 1.5 : 1}
                />
                <foreignObject x={8} y={8} width={NODE_W - 16} height={NODE_H - 16}>
                  <div style={{
                    display: "flex", flexDirection: "column", gap: 3,
                    overflow: "hidden", height: "100%",
                  }}>
                    <div style={{
                      fontSize: 10, fontWeight: 600,
                      color: b.status === "resolved" ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.85)",
                      lineHeight: 1.3,
                      overflow: "hidden", textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}>
                      {b.label}
                    </div>
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <span style={{
                        fontSize: 8, fontWeight: 700, color: statusColor,
                        background: `${statusColor}14`, padding: "1px 4px",
                        borderRadius: 3, textTransform: "uppercase", letterSpacing: 0.5,
                      }}>
                        {STATUS_CONFIG[b.status].label}
                      </span>
                      {impactScore > 3 && (
                        <span style={{
                          fontSize: 8, fontWeight: 700, color: "#c04a2a",
                          background: "rgba(192,74,42,0.12)", padding: "1px 4px",
                          borderRadius: 3,
                        }}>
                          Impact ×{impactScore}
                        </span>
                      )}
                    </div>
                  </div>
                </foreignObject>
                {b.status === "open" && b.isCriticalPath && (
                  <circle cx={NODE_W - 8} cy={8} r={4} fill="#c04a2a" />
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function GoalFlipBar({
  goals,
  activeGoalId,
  onSelect,
}: {
  goals: ReadinessGoal[];
  activeGoalId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] font-semibold uppercase tracking-wider mr-1" style={{ color: "rgba(255,255,255,0.3)" }}>
        Goal:
      </span>
      {goals.map(g => {
        const color = GOAL_COLORS[g.id] ?? ACCENT;
        const active = g.id === activeGoalId;
        return (
          <button
            key={g.id}
            onClick={() => onSelect(g.id)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: active ? `${color}18` : "rgba(255,255,255,0.04)",
              color: active ? color : "rgba(255,255,255,0.4)",
              border: `1px solid ${active ? color + "40" : "rgba(255,255,255,0.06)"}`,
            }}
          >
            <span>{g.icon}</span>
            {g.label}
            <span className="font-mono font-bold text-[10px]">{g.score}</span>
          </button>
        );
      })}
    </div>
  );
}

function GoalScoreRing({ score, goalId }: { score: number; goalId: string }) {
  const color = GOAL_COLORS[goalId] ?? ACCENT;
  const r = 30;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={76} height={76} viewBox="0 0 76 76" className="-rotate-90">
      <circle cx={38} cy={38} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
      <circle
        cx={38} cy={38} r={r} fill="none"
        stroke={color} strokeWidth={8}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - score / 100)}
        strokeLinecap="round"
      />
      <text x={38} y={39} textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize={18} fontWeight="700"
        transform={`rotate(90, 38, 38)`}>
        {score}
      </text>
    </svg>
  );
}

export default function ReadinessGraph() {
  const [selectedPropertyId, setSelectedPropertyId] = useState(readinessGraphs[0]?.propertyId);
  const [activeGoalId, setActiveGoalId] = useState<string>(readinessGraphs[0]?.goals[0]?.id ?? "buy");
  const [expandedBlockers, setExpandedBlockers] = useState<Record<string, boolean>>({});
  const [resolutionBlocker, setResolutionBlocker] = useState<ReadinessBlocker | null>(null);

  const graph = readinessGraphs.find(g => g.propertyId === selectedPropertyId) ?? readinessGraphs[0];
  const activeGoal = graph?.goals.find(g => g.id === activeGoalId) ?? graph?.goals[0];

  const goalColor = GOAL_COLORS[activeGoalId] ?? ACCENT;

  const relevantBlockers = useMemo(() => {
    if (!graph || !activeGoal) return [];
    const requiredIds = new Set(activeGoal.requiredBlockerIds);
    return graph.blockers.filter(b => requiredIds.has(b.id) || b.isCriticalPath);
  }, [graph, activeGoal]);

  const otherBlockers = useMemo(() => {
    if (!graph || !activeGoal) return [];
    const requiredIds = new Set(activeGoal.requiredBlockerIds);
    return graph.blockers.filter(b => !requiredIds.has(b.id) && !b.isCriticalPath);
  }, [graph, activeGoal]);

  const activeBlockerIds = useMemo(() => new Set(relevantBlockers.map(b => b.id)), [relevantBlockers]);

  const toggleBlocker = (id: string) => {
    setExpandedBlockers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openBlockers = graph?.blockers.filter(b => b.status === "open") ?? [];
  const criticalOpenBlockers = openBlockers.filter(b => b.severity === "critical" || b.isCriticalPath);

  if (!graph) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GitBranch size={18} style={{ color: ACCENT }} />
            <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>Property Readiness Graph</h1>
            {DEMO_BADGE}
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            Blocker dependencies, critical path, and resolution paths per property and goal
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {readinessGraphs.map(g => (
          <button
            key={g.propertyId}
            onClick={() => {
              setSelectedPropertyId(g.propertyId);
              setActiveGoalId(g.goals[0]?.id ?? "buy");
            }}
            className="text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: selectedPropertyId === g.propertyId ? `${ACCENT}18` : "rgba(255,255,255,0.04)",
              color: selectedPropertyId === g.propertyId ? ACCENT : "rgba(255,255,255,0.4)",
              border: `1px solid ${selectedPropertyId === g.propertyId ? `${ACCENT}40` : "rgba(255,255,255,0.06)"}`,
            }}
          >
            {g.propertyName}
          </button>
        ))}
      </div>

      <GoalFlipBar
        goals={graph.goals}
        activeGoalId={activeGoalId}
        onSelect={setActiveGoalId}
      />

      {activeGoal && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl border p-5 flex items-center gap-5"
            style={{ borderColor: `${goalColor}25`, background: `${goalColor}08` }}>
            <GoalScoreRing score={activeGoal.score} goalId={activeGoalId} />
            <div>
              <div className="text-xs mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Readiness for {activeGoal.label}</div>
              <div className="text-lg font-bold mb-1" style={{ color: goalColor }}>
                {activeGoal.score >= 80 ? "Ready" : activeGoal.score >= 55 ? "Needs Work" : "Not Ready"}
              </div>
              <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{activeGoal.description}</div>
            </div>
          </div>

          <div className="rounded-2xl border p-5"
            style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
              Blockers for this goal
            </div>
            <div className="space-y-2">
              {[
                { label: "Open", count: relevantBlockers.filter(b => b.status === "open").length, color: "#c04a2a" },
                { label: "In Progress", count: relevantBlockers.filter(b => b.status === "in_progress").length, color: "#3a7ad4" },
                { label: "Resolved", count: relevantBlockers.filter(b => b.status === "resolved").length, color: ACCENT },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between text-xs">
                  <span style={{ color: "rgba(255,255,255,0.45)" }}>{r.label}</span>
                  <span className="font-bold font-mono" style={{ color: r.color }}>{r.count}</span>
                </div>
              ))}
            </div>
          </div>

          {criticalOpenBlockers.length > 0 && (
            <div className="rounded-2xl border p-5"
              style={{ background: "rgba(192,74,42,0.06)", borderColor: "rgba(192,74,42,0.2)" }}>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={13} style={{ color: "#c04a2a" }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#c04a2a" }}>
                  {criticalOpenBlockers.length} Critical Open
                </span>
              </div>
              {criticalOpenBlockers.slice(0, 3).map(b => (
                <div key={b.id} className="text-[10px] py-1 border-b" style={{ borderColor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.55)" }}>
                  {b.label}
                </div>
              ))}
            </div>
          )}

          {criticalOpenBlockers.length === 0 && (
            <div className="rounded-2xl border p-5"
              style={{ background: "rgba(64,133,106,0.06)", borderColor: "rgba(64,133,106,0.2)" }}>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={13} style={{ color: ACCENT }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: ACCENT }}>
                  No critical blockers
                </span>
              </div>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                All critical path items are resolved or in progress for this goal.
              </p>
            </div>
          )}
        </div>
      )}

      {activeGoal?.actionPlan && activeGoal.actionPlan.length > 0 && (
        <div className="rounded-xl border p-5"
          style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
            Recommended Action Plan — {activeGoal.label}
          </div>
          <div className="space-y-2">
            {activeGoal.actionPlan.map((step, i) => (
              <div key={i} className="flex items-start gap-3 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold mt-0.5"
                  style={{ background: `${goalColor}18`, color: goalColor }}>
                  {i + 1}
                </span>
                {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {relevantBlockers.length > 0 && (
        <BlockerDAG
          blockers={graph.blockers}
          activeBlockerIds={activeBlockerIds}
          onToggle={toggleBlocker}
        />
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Target size={14} style={{ color: goalColor }} />
          <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
            Blockers for {activeGoal?.label} ({relevantBlockers.length})
          </span>
        </div>

        {relevantBlockers.length === 0 && (
          <div className="py-8 text-center text-sm rounded-xl border"
            style={{ borderColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }}>
            No blockers required for this goal — ready to proceed.
          </div>
        )}

        {relevantBlockers.map(blocker => (
          <div key={blocker.id} className="space-y-1">
            <BlockerCard
              blocker={blocker}
              expanded={!!expandedBlockers[blocker.id]}
              onToggle={() => toggleBlocker(blocker.id)}
              onGeneratePlan={setResolutionBlocker}
            />
            {blocker.dependsOn.map(depId => {
              const dep = graph.blockers.find(b => b.id === depId);
              if (!dep) return null;
              return (
                <div key={dep.id} className="flex items-center gap-2 ml-4">
                  <div className="w-4 h-4 border-l-2 border-b-2 rounded-bl" style={{ borderColor: "rgba(255,255,255,0.1)" }} />
                  <BlockerCard
                    blocker={dep}
                    expanded={!!expandedBlockers[dep.id]}
                    onToggle={() => toggleBlocker(dep.id)}
                    onGeneratePlan={setResolutionBlocker}
                    depth={0}
                  />
                </div>
              );
            })}
          </div>
        ))}

        {otherBlockers.length > 0 && (
          <details className="group">
            <summary className="cursor-pointer text-xs py-2 px-3 rounded-lg hover:bg-white/4 transition-colors"
              style={{ color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {otherBlockers.length} other blockers (not required for this goal) ▾
            </summary>
            <div className="mt-2 space-y-2">
              {otherBlockers.map(blocker => (
                <BlockerCard
                  key={blocker.id}
                  blocker={blocker}
                  expanded={!!expandedBlockers[blocker.id]}
                  onToggle={() => toggleBlocker(blocker.id)}
                  onGeneratePlan={setResolutionBlocker}
                />
              ))}
            </div>
          </details>
        )}
      </div>

      {resolutionBlocker && (
        <ResolutionPlanModal
          blocker={resolutionBlocker}
          onClose={() => setResolutionBlocker(null)}
        />
      )}
    </div>
  );
}
