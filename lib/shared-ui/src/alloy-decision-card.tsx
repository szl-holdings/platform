import * as React from "react";

const BG = { surface: "#0c1018", elevated: "#10141e" };
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.07)" };
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)", muted: "rgba(255,255,255,0.14)" };

const RISK_COLORS: Record<string, string> = {
  critical: "#c45a4a",
  high: "#c8953c",
  medium: "#d4a054",
  low: "#6b8f71",
  negligible: "#7c85a0",
};

const PRIORITY_COLORS: Record<string, string> = {
  P0: "#c45a4a",
  P1: "#c8953c",
  P2: "#d4a054",
  P3: "#4a90b8",
  P4: "#7c85a0",
};

const ACTION_COLORS: Record<string, string> = {
  approve: "#6b8f71",
  escalate: "#c45a4a",
  defer: "#c8953c",
  route: "#4a90b8",
  close: "#7c85a0",
  investigate: "#8b7ac8",
};

export function ConfidenceBand({ value, size = "sm", showLabel = true }: {
  value: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? "#6b8f71" : pct >= 50 ? "#c8953c" : "#c45a4a";
  const widths = { sm: "w-10", md: "w-16", lg: "w-24" };
  const heights = { sm: "h-1.5", md: "h-2", lg: "h-2.5" };
  const fonts = { sm: "text-[8px]", md: "text-[9px]", lg: "text-[10px]" };

  return (
    <div className="flex items-center gap-1.5">
      <div className={`${widths[size]} ${heights[size]} rounded-full overflow-hidden`} style={{ background: "rgba(255,255,255,0.05)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      {showLabel && <span className={`${fonts[size]} font-mono`} style={{ color }}>{pct}%</span>}
    </div>
  );
}

export interface EvidenceItem {
  source: string;
  sourceType: string;
  content: string;
  relevanceScore: number;
}

export function EvidencePanel({ evidence, collapsible = false }: {
  evidence: EvidenceItem[];
  collapsible?: boolean;
}) {
  const [collapsed, setCollapsed] = React.useState(collapsible);

  if (!evidence?.length) return null;

  return (
    <div className="space-y-1.5 mt-2">
      <button
        onClick={() => collapsible && setCollapsed(!collapsed)}
        className="flex items-center gap-1.5"
        style={{ cursor: collapsible ? "pointer" : "default" }}
      >
        <div className="text-[8px] uppercase tracking-widest font-mono" style={{ color: TEXT.muted }}>
          Evidence Sources ({evidence.length})
        </div>
        {collapsible && (
          <span className="text-[8px]" style={{ color: TEXT.muted }}>
            {collapsed ? "+" : "-"}
          </span>
        )}
      </button>
      {!collapsed && evidence.map((e, i) => (
        <div key={i} className="rounded px-2.5 py-2" style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[8px] font-mono px-1.5 py-px rounded" style={{
              color: "#8b7ac8",
              background: "rgba(139,122,200,0.08)",
              border: "1px solid rgba(139,122,200,0.15)",
            }}>
              {e.sourceType}
            </span>
            <span className="text-[9px] font-medium" style={{ color: TEXT.secondary }}>{e.source}</span>
            <ConfidenceBand value={e.relevanceScore} />
          </div>
          <p className="text-[9px] leading-relaxed line-clamp-2" style={{ color: TEXT.tertiary }}>{e.content}</p>
        </div>
      ))}
    </div>
  );
}

export function ApprovalBadge({ level, required }: {
  level: string;
  required: boolean;
}) {
  if (!required) {
    return (
      <span className="text-[7px] font-mono px-1.5 py-px rounded inline-flex items-center gap-1" style={{
        color: "#6b8f71",
        background: "rgba(107,143,113,0.08)",
        border: "1px solid rgba(107,143,113,0.15)",
      }}>
        Auto-approved
      </span>
    );
  }

  return (
    <span className="text-[7px] font-mono px-1.5 py-px rounded inline-flex items-center gap-1" style={{
      color: "#c8953c",
      background: "rgba(200,149,60,0.06)",
      border: "1px solid rgba(200,149,60,0.12)",
    }}>
      {level} approval required
    </span>
  );
}

export function HumanReviewBadge({ required }: { required: boolean }) {
  if (!required) return null;

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{
      background: "rgba(200,149,60,0.06)",
      border: "1px solid rgba(200,149,60,0.12)",
    }}>
      <span className="text-[8px] font-mono" style={{ color: "#c8953c" }}>Human Review Required</span>
    </div>
  );
}

export function RiskBadge({ level }: { level: string }) {
  const color = RISK_COLORS[level] || TEXT.tertiary;
  return (
    <span className="text-[7px] font-mono uppercase px-1.5 py-px rounded" style={{
      color,
      background: `${color}12`,
      border: `1px solid ${color}22`,
    }}>
      {level} risk
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const color = PRIORITY_COLORS[priority] || TEXT.tertiary;
  return (
    <span className="text-[9px] font-bold font-mono px-1.5 py-px rounded" style={{
      color,
      background: `${color}14`,
      border: `1px solid ${color}2a`,
    }}>
      {priority}
    </span>
  );
}

export function ActionTypeBadge({ actionType }: { actionType: string }) {
  const color = ACTION_COLORS[actionType] || TEXT.tertiary;
  return (
    <span className="text-[9px] font-bold font-mono px-1.5 py-px rounded" style={{
      color,
      background: `${color}14`,
      border: `1px solid ${color}2a`,
    }}>
      {actionType}
    </span>
  );
}

export function EnvironmentLabel({ environment }: {
  environment: "live" | "pilot" | "demo" | "seeded" | "simulated";
}) {
  const configs: Record<string, { color: string; label: string }> = {
    live: { color: "#6b8f71", label: "LIVE" },
    pilot: { color: "#4a90b8", label: "PILOT" },
    demo: { color: "#d4a054", label: "DEMO" },
    seeded: { color: "#d4a054", label: "SEEDED DATA" },
    simulated: { color: "#d4a054", label: "SIMULATED" },
  };
  const cfg = (configs[environment] || configs.demo) as { color: string; label: string };

  return (
    <span className="text-[8px] font-mono font-semibold tracking-wider px-2 py-0.5 rounded" style={{
      color: cfg.color,
      background: `${cfg.color}10`,
      border: `1px solid ${cfg.color}22`,
    }}>
      {cfg.label}
    </span>
  );
}

export function DegradedModeBanner({ message }: { message?: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded" style={{
      background: "rgba(200,149,60,0.06)",
      border: "1px solid rgba(200,149,60,0.12)",
    }}>
      <span className="text-[9px] font-mono font-semibold" style={{ color: "#c8953c" }}>DEGRADED MODE</span>
      <span className="text-[9px]" style={{ color: TEXT.secondary }}>{message || "AI provider unavailable. System operating with safe fallbacks."}</span>
    </div>
  );
}

export function SafeFallbackState({ reason }: { reason?: string }) {
  return (
    <div className="rounded px-3 py-2" style={{
      background: "rgba(196,90,74,0.06)",
      border: "1px solid rgba(196,90,74,0.12)",
    }}>
      <div className="text-[9px] font-mono font-semibold mb-1" style={{ color: "#c45a4a" }}>Safe Fallback Active</div>
      <p className="text-[9px]" style={{ color: TEXT.secondary }}>
        {reason || "AI decision could not be produced with sufficient confidence. Manual review required."}
      </p>
    </div>
  );
}

export interface DecisionCardProps {
  decisionType: string;
  headline: string;
  summary: string;
  confidence: number;
  riskLevel?: string;
  priority?: string;
  actionType?: string;
  approvalRequired?: boolean;
  approvalLevel?: string;
  requiresHumanReview?: boolean;
  evidence?: EvidenceItem[];
  modelRoute?: string;
  latencyMs?: number;
  timestamp?: string;
  children?: React.ReactNode;
}

export function DecisionCard({
  decisionType,
  headline,
  summary,
  confidence,
  riskLevel,
  priority,
  actionType,
  approvalRequired,
  approvalLevel,
  requiresHumanReview,
  evidence,
  modelRoute,
  latencyMs,
  timestamp,
  children,
}: DecisionCardProps) {
  return (
    <div className="rounded-md overflow-hidden" style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}>
      <div className="h-px" style={{ background: "#d4a054" }} />

      <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
        <span className="text-[8px] font-mono uppercase tracking-wider" style={{ color: "#d4a054" }}>
          {decisionType}
        </span>
        {priority && <PriorityBadge priority={priority} />}
        {actionType && <ActionTypeBadge actionType={actionType} />}
        {riskLevel && <RiskBadge level={riskLevel} />}
        <div className="ml-auto flex items-center gap-2">
          <ConfidenceBand value={confidence} size="md" />
          {approvalRequired != null && (
            <ApprovalBadge level={approvalLevel || "manager"} required={approvalRequired} />
          )}
        </div>
      </div>

      <div className="p-3 space-y-2">
        <p className="text-[10px] font-medium" style={{ color: TEXT.primary }}>{headline}</p>
        <p className="text-[9px] leading-relaxed" style={{ color: TEXT.secondary }}>{summary}</p>

        {requiresHumanReview && <HumanReviewBadge required />}

        {evidence && evidence.length > 0 && (
          <EvidencePanel evidence={evidence} collapsible />
        )}

        {children}

        {(modelRoute || latencyMs || timestamp) && (
          <div className="flex items-center gap-2 pt-1" style={{ borderTop: `1px solid ${BORDER.subtle}` }}>
            {modelRoute && <span className="text-[7px] font-mono" style={{ color: TEXT.muted }}>{modelRoute}</span>}
            {latencyMs && <span className="text-[7px] font-mono" style={{ color: TEXT.muted }}>{latencyMs}ms</span>}
            {timestamp && <span className="text-[7px] font-mono ml-auto" style={{ color: TEXT.muted }}>{timestamp}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export function AuditTrailDrawer({ entries, maxVisible = 10 }: {
  entries: Array<{
    action: string;
    timestamp: string;
    model?: string;
    confidence?: number;
    latencyMs?: number;
  }>;
  maxVisible?: number;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const visible = expanded ? entries : entries.slice(0, maxVisible);

  return (
    <div className="rounded-md overflow-hidden" style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}>
      <div className="h-px" style={{ background: "#d4a054" }} />
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
        <span className="text-[11px] font-semibold" style={{ color: TEXT.primary }}>Audit Trail</span>
        <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>{entries.length} records</span>
      </div>
      <div className="divide-y" style={{ borderColor: BORDER.subtle }}>
        {visible.map((entry, i) => (
          <div key={i} className="px-3 py-2">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[9px] font-mono font-semibold" style={{ color: "#d4a054" }}>{entry.action}</span>
              {entry.model && <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>{entry.model}</span>}
              {entry.latencyMs != null && <span className="text-[7px] font-mono" style={{ color: TEXT.muted }}>{entry.latencyMs}ms</span>}
              <span className="text-[7px] font-mono ml-auto" style={{ color: TEXT.muted }}>{entry.timestamp}</span>
            </div>
            {entry.confidence != null && <ConfidenceBand value={entry.confidence} size="sm" />}
          </div>
        ))}
      </div>
      {entries.length > maxVisible && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-3 py-1.5 text-[8px] font-mono hover:bg-white/[0.02] transition-all"
          style={{ color: TEXT.tertiary, borderTop: `1px solid ${BORDER.subtle}` }}
        >
          {expanded ? "Show less" : `Show ${entries.length - maxVisible} more`}
        </button>
      )}
    </div>
  );
}
