import { useState } from "react";
import { AlertTriangle, CheckCircle, Clock, Zap, X, ChevronDown, ChevronUp } from "lucide-react";

export type SituationState = "emerging" | "active" | "resolving" | "resolved";

export interface SituationRoom {
  id: string;
  title: string;
  state: SituationState;
  domains: string[];
  summary: string;
  aiNarration: string;
  pendingActions: string[];
  createdAt: string;
  resolvedAt?: string;
  affectedNodes: string[];
  financialExposure: string;
}

const DEMO_ROOMS: SituationRoom[] = [
  {
    id: "sr-001",
    title: "Rotterdam Port Disruption Cascade",
    state: "active",
    domains: ["vessels", "prism", "terra"],
    summary: "Port congestion at Rotterdam blocking MV Athena, triggering cargo contract penalties and impacting Ashworth estate sale timeline.",
    aiNarration: "Cross-domain correlation detected at 06:42 UTC. Vessel MV Athena is 14 hours delayed at Rotterdam. Port Authorization case #PR-2847 in PRISM remains pending (burning $4,200/hr). Ashworth estate sale requires cargo clearance certificate — now at risk. Three domains affected. Recommend immediate legal escalation.",
    pendingActions: ["Approve Port Authorization PR-2847", "Notify Ashworth counterparty", "Reroute MV Rotterdam as contingency"],
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    affectedNodes: ["v1", "p2", "t1", "a1"],
    financialExposure: "$4.2M",
  },
  {
    id: "sr-002",
    title: "Sanctions Screening Flag — Vessel MV-332",
    state: "emerging",
    domains: ["aegis", "vessels", "prism"],
    summary: "New sanctions list update flagged MV-332 counterparty. Legal review required before next port call in 18 hours.",
    aiNarration: "OFAC list update at 04:15 UTC triggered match against Vessel MV-332 charterer. Confidence: 73%. Cargo contract #P-1192 may be affected. 18 hours to next port call. Legal team notified but no response yet.",
    pendingActions: ["Legal review: sanctions match #FL-2024-0319", "Confirm charterer identity", "Prepare contingency charter"],
    createdAt: new Date(Date.now() - 1.5 * 3600000).toISOString(),
    affectedNodes: ["v3", "a2", "p1", "pe2"],
    financialExposure: "$1.8M",
  },
  {
    id: "sr-003",
    title: "Q2 Fleet Maintenance Coordination",
    state: "resolving",
    domains: ["vessels", "lyte"],
    summary: "Scheduled maintenance for 3 vessels coordinated across fleet ops pipeline. 2 of 3 complete.",
    aiNarration: "Fleet maintenance coordination initiated 3 days ago. MV Meridian and MV Cape Town complete. MV Atlantic scheduled tomorrow. No revenue impact projected. Lyte pipeline tracking on schedule.",
    pendingActions: ["Confirm MV Atlantic dock reservation"],
    createdAt: new Date(Date.now() - 72 * 3600000).toISOString(),
    affectedNodes: ["v2", "v3", "l1"],
    financialExposure: "$240K",
  },
];

const STATE_CONFIG: Record<SituationState, { color: string; bg: string; border: string; label: string; icon: React.ReactNode; pulse?: boolean }> = {
  emerging: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", label: "Emerging", icon: <AlertTriangle className="w-3 h-3" />, pulse: true },
  active: { color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", label: "Active", icon: <Zap className="w-3 h-3" />, pulse: true },
  resolving: { color: "#3b82f6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)", label: "Resolving", icon: <Clock className="w-3 h-3" /> },
  resolved: { color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)", label: "Resolved", icon: <CheckCircle className="w-3 h-3" /> },
};

const DOMAIN_COLORS: Record<string, string> = {
  vessels: "#38bdf8",
  terra: "#86efac",
  aegis: "#818cf8",
  prism: "#fbbf24",
  lyte: "#2dd4bf",
  alloy: "#c084fc",
};

function formatRelative(ts: string) {
  const ms = Date.now() - new Date(ts).getTime();
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return `${Math.floor(ms / 86400000)}d ago`;
}

function SituationCard({ room, onHighlight, onClose }: {
  room: SituationRoom;
  onHighlight?: (nodeIds: Set<string>) => void;
  onClose?: () => void;
}) {
  const [expanded, setExpanded] = useState(room.state === "active" || room.state === "emerging");
  const cfg = STATE_CONFIG[room.state];

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all"
      style={{ borderColor: cfg.border, background: "rgba(10,14,24,0.95)" }}
      onMouseEnter={() => onHighlight?.(new Set(room.affectedNodes))}
      onMouseLeave={() => onHighlight?.(new Set())}
    >
      <div
        className="px-3 py-2.5 flex items-start gap-2 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-1.5 mt-0.5 shrink-0" style={{ color: cfg.color }}>
          {cfg.icon}
          {cfg.pulse && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: cfg.color }} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border" style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
                  {cfg.label}
                </span>
                {room.domains.map(d => (
                  <span key={d} className="text-[8px] font-medium px-1 py-0.5 rounded capitalize" style={{ color: DOMAIN_COLORS[d] ?? "rgba(255,255,255,0.4)", background: `${DOMAIN_COLORS[d] ?? "rgba(255,255,255,0.1)"}15` }}>
                    {d}
                  </span>
                ))}
              </div>
              <p className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>{room.title}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>{formatRelative(room.createdAt)}</span>
              {expanded ? <ChevronUp className="w-3 h-3" style={{ color: "rgba(255,255,255,0.3)" }} /> : <ChevronDown className="w-3 h-3" style={{ color: "rgba(255,255,255,0.3)" }} />}
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="rounded-lg p-2.5 mt-2" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="text-[9px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>AI Narration</div>
            <p className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{room.aiNarration}</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-[9px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>Financial Exposure</span>
              <div className="text-sm font-bold font-mono" style={{ color: "#ef4444" }}>{room.financialExposure}</div>
            </div>
            <div className="text-right">
              <span className="text-[9px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>Actions Required</span>
              <div className="text-sm font-bold font-mono" style={{ color: cfg.color }}>{room.pendingActions.length}</div>
            </div>
          </div>

          {room.pendingActions.length > 0 && (
            <div className="space-y-1">
              {room.pendingActions.map((action, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg px-2.5 py-1.5 border" style={{ borderColor: cfg.border, background: cfg.bg }}>
                  <span className="text-[8px] font-mono shrink-0 mt-0.5" style={{ color: cfg.color }}>→</span>
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.65)" }}>{action}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface SituationRoomsProps {
  onHighlightNodes?: (nodeIds: Set<string>) => void;
}

export function SituationRooms({ onHighlightNodes }: SituationRoomsProps) {
  const [filter, setFilter] = useState<SituationState | "all">("all");
  const rooms = DEMO_ROOMS;
  const filtered = filter === "all" ? rooms : rooms.filter(r => r.state === filter);

  const activeCritical = rooms.filter(r => r.state === "active" || r.state === "emerging").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>Situation Rooms</h3>
            {activeCritical > 0 && (
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full animate-pulse" style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444" }}>
                {activeCritical} LIVE
              </span>
            )}
          </div>
          <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>Multi-domain event clusters</p>
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {(["all", "active", "emerging", "resolving", "resolved"] as const).map(f => {
          const cfg = f === "all" ? null : STATE_CONFIG[f];
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="text-[9px] px-2 py-1 rounded-lg border capitalize transition-all"
              style={{
                background: filter === f ? (cfg?.bg ?? "rgba(75,139,219,0.08)") : "rgba(255,255,255,0.02)",
                borderColor: filter === f ? (cfg?.border ?? "rgba(75,139,219,0.3)") : "rgba(255,255,255,0.06)",
                color: filter === f ? (cfg?.color ?? "#4B8BDB") : "rgba(255,255,255,0.35)",
              }}
            >
              {f}
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        {filtered.map(room => (
          <SituationCard
            key={room.id}
            room={room}
            onHighlight={onHighlightNodes}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-6 text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
            No situation rooms matching filter.
          </div>
        )}
      </div>
    </div>
  );
}
