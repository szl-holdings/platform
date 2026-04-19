/**
 * Shared Operational Primitives
 *
 * Standardized types, components, and utilities for operational entities
 * across Alloy, Lyte, Terra, Aegis, and Vessels.
 *
 * These primitives are the canonical pattern for all lanes.
 * Every operational surface inherits from this module.
 */

import React from "react";

// ─── Core Type Definitions ─────────────────────────────────────────────────────

export type OperationalStatus =
  | "draft" | "pending" | "waiting_approval" | "approved"
  | "running" | "executing"
  | "completed" | "succeeded"
  | "failed" | "cancelled" | "rejected"
  | "open" | "investigating" | "contained" | "resolved" | "closed"
  | "new" | "triaged" | "suppressed"
  | "in_progress" | "escalated";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type ApprovalState = "none" | "pending" | "approved" | "rejected" | "expired";

export type ActorType = "user" | "system" | "agent";

export interface OperationalOwner {
  userId?: string | number;
  name?: string;
  email?: string;
  role?: string;
  assignedAt?: string;
}

export interface EvidenceItem {
  id: string;
  label: string;
  value: string;
  source?: string;
  confidence?: number;
  timestamp?: string;
}

export interface AuditHistoryEntry {
  id: string;
  action: string;
  actor: string;
  actorType: ActorType;
  previousState?: string;
  newState?: string;
  notes?: string;
  timestamp: string;
}

export interface EscalationPath {
  id: string;
  level: number;
  label: string;
  targetRole: string;
  targetUserId?: string | number;
  notifyChannels: string[];
  triggeredAt?: string;
  resolvedAt?: string;
  active: boolean;
}

export interface NextAction {
  label: string;
  actionType: "approve" | "reject" | "escalate" | "assign" | "execute" | "review" | "resolve" | "cancel";
  urgent?: boolean;
  dueAt?: string;
}

/**
 * The canonical operational entity interface.
 * All domain entities (signals, incidents, workflows, actions) implement this.
 */
export interface OperationalEntity {
  id: string | number;
  title?: string;
  status?: OperationalStatus | string;
  riskLevel?: RiskLevel;
  riskScore?: number;
  owner?: OperationalOwner;
  nextAction?: string | NextAction;
  evidence?: EvidenceItem[];
  rationale?: string;
  auditHistory?: AuditHistoryEntry[];
  escalationPaths?: EscalationPath[];
  approvalState?: ApprovalState;
  requiresApproval?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Status Configuration ──────────────────────────────────────────────────────

export interface StatusConfig {
  label: string;
  color: string;
  bg: string;
  dotColor?: string;
  terminal?: boolean;
}

export const STATUS_CONFIGS: Record<string, StatusConfig> = {
  // Workflow states
  draft:            { label: "Draft",            color: "#7c85a0", bg: "rgba(124,133,160,0.1)" },
  pending:          { label: "Pending",           color: "#7c85a0", bg: "rgba(124,133,160,0.1)" },
  waiting_approval: { label: "Awaiting Approval", color: "#8b7ac8", bg: "rgba(139,122,200,0.12)" },
  approved:         { label: "Approved",          color: "#4a90b8", bg: "rgba(74,144,184,0.12)" },
  running:          { label: "Running",           color: "#d4a054", bg: "rgba(212,160,84,0.12)" },
  executing:        { label: "Executing",         color: "#d4a054", bg: "rgba(212,160,84,0.12)" },
  completed:        { label: "Completed",         color: "#6b8f71", bg: "rgba(107,143,113,0.12)", terminal: true },
  succeeded:        { label: "Succeeded",         color: "#6b8f71", bg: "rgba(107,143,113,0.12)", terminal: true },
  failed:           { label: "Failed",            color: "#c45a4a", bg: "rgba(196,90,74,0.12)", terminal: true },
  cancelled:        { label: "Cancelled",         color: "#6b7280", bg: "rgba(107,114,128,0.08)", terminal: true },
  rejected:         { label: "Rejected",          color: "#c45a4a", bg: "rgba(196,90,74,0.08)", terminal: true },
  // Incident states
  open:             { label: "Open",              color: "#c45a4a", bg: "rgba(196,90,74,0.12)" },
  investigating:    { label: "Investigating",     color: "#d4a054", bg: "rgba(212,160,84,0.12)" },
  contained:        { label: "Contained",         color: "#4a90b8", bg: "rgba(74,144,184,0.12)" },
  resolved:         { label: "Resolved",          color: "#6b8f71", bg: "rgba(107,143,113,0.12)", terminal: true },
  closed:           { label: "Closed",            color: "#6b7280", bg: "rgba(107,114,128,0.08)", terminal: true },
  // Signal states
  new:              { label: "New",               color: "#c45a4a", bg: "rgba(196,90,74,0.12)" },
  triaged:          { label: "Triaged",           color: "#d4a054", bg: "rgba(212,160,84,0.12)" },
  suppressed:       { label: "Suppressed",        color: "#6b7280", bg: "rgba(107,114,128,0.08)" },
  // Action states
  in_progress:      { label: "In Progress",       color: "#d4a054", bg: "rgba(212,160,84,0.12)" },
  escalated:        { label: "Escalated",         color: "#c8953c", bg: "rgba(200,149,60,0.12)" },
};

export const RISK_CONFIGS: Record<RiskLevel, { label: string; color: string; bg: string; score: number }> = {
  low:      { label: "Low",      color: "#6b8f71", bg: "rgba(107,143,113,0.1)",  score: 0.25 },
  medium:   { label: "Medium",   color: "#c8953c", bg: "rgba(200,149,60,0.1)",   score: 0.5  },
  high:     { label: "High",     color: "#d4a054", bg: "rgba(212,160,84,0.12)",  score: 0.75 },
  critical: { label: "Critical", color: "#c45a4a", bg: "rgba(196,90,74,0.12)",   score: 0.95 },
};

export const APPROVAL_CONFIGS: Record<ApprovalState, { label: string; color: string; bg: string }> = {
  none:     { label: "N/A",      color: "#6b7280", bg: "rgba(107,114,128,0.05)" },
  pending:  { label: "Pending",  color: "#8b7ac8", bg: "rgba(139,122,200,0.12)" },
  approved: { label: "Approved", color: "#6b8f71", bg: "rgba(107,143,113,0.12)" },
  rejected: { label: "Rejected", color: "#c45a4a", bg: "rgba(196,90,74,0.12)"   },
  expired:  { label: "Expired",  color: "#6b7280", bg: "rgba(107,114,128,0.08)" },
};

// ─── Utility Functions ─────────────────────────────────────────────────────────

export function getStatusConfig(status: string): StatusConfig {
  return STATUS_CONFIGS[status] ?? { label: status, color: "#7c85a0", bg: "rgba(124,133,160,0.08)" };
}

export function getRiskConfig(level: RiskLevel | string): typeof RISK_CONFIGS[RiskLevel] {
  return RISK_CONFIGS[level as RiskLevel] ?? RISK_CONFIGS.low;
}

export function getApprovalConfig(state: ApprovalState | string): typeof APPROVAL_CONFIGS[ApprovalState] {
  return APPROVAL_CONFIGS[state as ApprovalState] ?? APPROVAL_CONFIGS.none;
}

export function riskScoreToLevel(score: number): RiskLevel {
  if (score >= 0.85) return "critical";
  if (score >= 0.65) return "high";
  if (score >= 0.35) return "medium";
  return "low";
}

export function severityToRiskLevel(severity: string): RiskLevel {
  const map: Record<string, RiskLevel> = { critical: "critical", high: "high", medium: "medium", low: "low" };
  return map[severity] ?? "low";
}

export function isTerminalStatus(status: string): boolean {
  return STATUS_CONFIGS[status]?.terminal ?? false;
}

export function formatAgo(iso?: string): string {
  if (!iso) return "—";
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

export function formatDuration(startedAt?: string, completedAt?: string): string {
  if (!startedAt || !completedAt) return "—";
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

// ─── React Components ──────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: string;
  size?: "xs" | "sm" | "md";
  pulse?: boolean;
  className?: string;
}

export function OperationalStatusBadge({ status, size = "sm", pulse = false, className = "" }: StatusBadgeProps) {
  const cfg = getStatusConfig(status);
  const sizeClass = size === "xs" ? "text-[8px] px-1.5 py-px" : size === "md" ? "text-[12px] px-2.5 py-1" : "text-[9px] px-2 py-0.5";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-mono font-semibold uppercase tracking-wider ${sizeClass} ${className}`}
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}25` }}
    >
      {pulse && <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ background: cfg.color }} />}
      {cfg.label}
    </span>
  );
}

interface RiskBadgeProps {
  level?: RiskLevel | string;
  score?: number;
  size?: "xs" | "sm" | "md";
  showScore?: boolean;
}

export function OperationalRiskBadge({ level, score, size = "sm", showScore = false }: RiskBadgeProps) {
  const resolvedLevel = level ? (level as RiskLevel) : riskScoreToLevel(score ?? 0);
  const cfg = getRiskConfig(resolvedLevel);
  const sizeClass = size === "xs" ? "text-[8px] px-1.5 py-px" : size === "md" ? "text-[12px] px-2.5 py-1" : "text-[9px] px-2 py-0.5";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-mono font-semibold uppercase tracking-wider ${sizeClass}`}
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}25` }}
    >
      {cfg.label}
      {showScore && score !== undefined && <span className="opacity-70">({(score * 100).toFixed(0)})</span>}
    </span>
  );
}

interface ApprovalBadgeProps {
  state?: ApprovalState | string;
  size?: "xs" | "sm" | "md";
}

export function OperationalApprovalBadge({ state = "none", size = "sm" }: ApprovalBadgeProps) {
  const cfg = getApprovalConfig(state);
  const sizeClass = size === "xs" ? "text-[8px] px-1.5 py-px" : size === "md" ? "text-[12px] px-2.5 py-1" : "text-[9px] px-2 py-0.5";
  if (state === "none") return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-mono font-semibold ${sizeClass}`}
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}25` }}
    >
      {state === "pending" && <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ background: cfg.color }} />}
      {cfg.label}
    </span>
  );
}

interface OwnerChipProps {
  owner?: OperationalOwner;
  size?: "xs" | "sm";
  unassignedLabel?: string;
}

export function OperationalOwnerChip({ owner, size = "sm", unassignedLabel = "Unassigned" }: OwnerChipProps) {
  const TEXT_SECONDARY = "rgba(255,255,255,0.55)";
  const TEXT_MUTED = "rgba(255,255,255,0.28)";
  if (!owner?.name) {
    return (
      <span className="text-[9px] font-mono italic" style={{ color: TEXT_MUTED }}>{unassignedLabel}</span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px]" style={{ color: TEXT_SECONDARY }}>
      <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[8px] font-bold text-white/60 shrink-0">
        {owner.name.charAt(0).toUpperCase()}
      </span>
      {owner.name}
      {owner.role && <span className="text-[8px] font-mono" style={{ color: TEXT_MUTED }}>· {owner.role}</span>}
    </span>
  );
}

interface EvidencePanelProps {
  items: EvidenceItem[];
  rationale?: string;
  compact?: boolean;
}

export function OperationalEvidencePanel({ items, rationale, compact = false }: EvidencePanelProps) {
  const BG_SURFACE = "#0c1018";
  const BORDER_MUTED = "rgba(255,255,255,0.07)";
  const TEXT_PRIMARY = "rgba(255,255,255,0.88)";
  const TEXT_SECONDARY = "rgba(255,255,255,0.55)";
  const TEXT_MUTED = "rgba(255,255,255,0.28)";
  const ACCENT = "#d4a054";

  if (items.length === 0 && !rationale) return null;
  return (
    <div className="space-y-2">
      {rationale && (
        <div className="rounded px-3 py-2.5" style={{ background: "rgba(212,160,84,0.04)", border: "1px solid rgba(212,160,84,0.1)" }}>
          <p className="text-[9px] uppercase tracking-wider font-semibold mb-1" style={{ color: ACCENT }}>Rationale</p>
          <p className="text-[11px] leading-relaxed" style={{ color: TEXT_SECONDARY }}>{rationale}</p>
        </div>
      )}
      {items.length > 0 && (
        <div className="rounded overflow-hidden" style={{ border: `1px solid ${BORDER_MUTED}` }}>
          <div className="px-3 py-1.5" style={{ background: "#10141e", borderBottom: `1px solid ${BORDER_MUTED}` }}>
            <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: TEXT_MUTED }}>Evidence ({items.length})</span>
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {items.map(item => (
              <div key={item.id} className="px-3 py-2 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] font-semibold mb-0.5" style={{ color: TEXT_SECONDARY }}>{item.label}</div>
                  <div className="text-[10px] font-mono" style={{ color: TEXT_PRIMARY }}>{item.value}</div>
                  {item.source && <div className="text-[8px] mt-0.5" style={{ color: TEXT_MUTED }}>{item.source}</div>}
                </div>
                {item.confidence !== undefined && (
                  <span className="text-[9px] font-mono shrink-0" style={{ color: item.confidence >= 0.8 ? "#6b8f71" : item.confidence >= 0.6 ? "#d4a054" : "#c45a4a" }}>
                    {(item.confidence * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface AuditTimelineProps {
  entries: AuditHistoryEntry[];
  compact?: boolean;
  maxEntries?: number;
}

export function OperationalAuditTimeline({ entries, compact = false, maxEntries }: AuditTimelineProps) {
  const BORDER_MUTED = "rgba(255,255,255,0.07)";
  const TEXT_PRIMARY = "rgba(255,255,255,0.88)";
  const TEXT_SECONDARY = "rgba(255,255,255,0.55)";
  const TEXT_MUTED = "rgba(255,255,255,0.28)";
  const BORDER_SUBTLE = "rgba(255,255,255,0.04)";

  const displayEntries = maxEntries ? entries.slice(0, maxEntries) : entries;
  if (displayEntries.length === 0) {
    return <p className="text-[10px] italic" style={{ color: TEXT_MUTED }}>No audit history</p>;
  }
  return (
    <div className="space-y-0 relative">
      <div className="absolute left-[11px] top-2 bottom-2 w-px" style={{ background: BORDER_SUBTLE }} />
      {displayEntries.map((entry, i) => {
        const actorColor = entry.actorType === "user" ? "#4a90b8" : entry.actorType === "agent" ? "#d4a054" : TEXT_MUTED;
        return (
          <div key={entry.id} className="flex items-start gap-3 py-2 relative">
            <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center z-10" style={{ background: "#10141e", border: `1px solid ${BORDER_MUTED}` }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: actorColor }} />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-medium" style={{ color: TEXT_PRIMARY }}>{entry.action}</span>
                <span className="text-[9px] font-mono" style={{ color: actorColor }}>{entry.actor}</span>
                <span className="text-[8px] font-mono ml-auto" style={{ color: TEXT_MUTED }}>{formatAgo(entry.timestamp)}</span>
              </div>
              {entry.notes && <p className="text-[9px] mt-0.5 leading-relaxed" style={{ color: TEXT_SECONDARY }}>{entry.notes}</p>}
              {entry.previousState && entry.newState && !compact && (
                <div className="mt-1 flex items-center gap-1.5 text-[8px] font-mono" style={{ color: TEXT_MUTED }}>
                  <span style={{ color: "#c45a4a" }}>{entry.previousState}</span>
                  <span>→</span>
                  <span style={{ color: "#6b8f71" }}>{entry.newState}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface EscalationPanelProps {
  paths: EscalationPath[];
  compact?: boolean;
}

export function OperationalEscalationPanel({ paths, compact = false }: EscalationPanelProps) {
  const TEXT_SECONDARY = "rgba(255,255,255,0.55)";
  const TEXT_MUTED = "rgba(255,255,255,0.28)";
  const BORDER_MUTED = "rgba(255,255,255,0.07)";

  const active = paths.filter(p => p.active);
  if (active.length === 0) return null;
  return (
    <div className="space-y-1.5">
      {active.map(path => (
        <div key={path.id} className="rounded px-3 py-2" style={{ background: "rgba(200,149,60,0.06)", border: "1px solid rgba(200,149,60,0.15)" }}>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono font-bold" style={{ color: "#c8953c" }}>L{path.level}</span>
            <span className="text-[10px] font-medium" style={{ color: "#c8953c" }}>{path.label}</span>
            <span className="ml-auto text-[8px] font-mono" style={{ color: TEXT_MUTED }}>{formatAgo(path.triggeredAt)}</span>
          </div>
          {!compact && (
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <span className="text-[9px]" style={{ color: TEXT_SECONDARY }}>→ {path.targetRole}</span>
              {path.notifyChannels.map(ch => (
                <span key={ch} className="text-[8px] font-mono px-1.5 py-px rounded" style={{ color: TEXT_MUTED, border: `1px solid rgba(255,255,255,0.06)` }}>{ch}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

interface OperationalDetailPaneProps {
  entity: OperationalEntity;
  title?: string;
  children?: React.ReactNode;
}

export function OperationalDetailPane({ entity, title, children }: OperationalDetailPaneProps) {
  const BG_SURFACE = "#0c1018";
  const BG_ELEVATED = "#10141e";
  const BORDER_MUTED = "rgba(255,255,255,0.07)";
  const TEXT_PRIMARY = "rgba(255,255,255,0.88)";
  const TEXT_SECONDARY = "rgba(255,255,255,0.55)";
  const TEXT_MUTED = "rgba(255,255,255,0.28)";
  const ACCENT = "#d4a054";

  return (
    <div className="space-y-4" style={{ background: BG_SURFACE }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-[13px] font-semibold text-white leading-tight">{title ?? entity.title ?? `Entity #${entity.id}`}</h2>
          <div className="flex items-center gap-2 flex-wrap mt-1.5">
            {entity.status && <OperationalStatusBadge status={entity.status} size="xs" />}
            {(entity.riskLevel || entity.riskScore !== undefined) && (
              <OperationalRiskBadge {...(entity.riskLevel !== undefined ? { level: entity.riskLevel } : {})} {...(entity.riskScore !== undefined ? { score: entity.riskScore } : {})} size="xs" showScore />
            )}
            {entity.approvalState && entity.approvalState !== "none" && (
              <OperationalApprovalBadge state={entity.approvalState} size="xs" />
            )}
          </div>
        </div>
      </div>

      {/* Owner + Next Action */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded px-3 py-2.5" style={{ background: BG_ELEVATED, border: `1px solid ${BORDER_MUTED}` }}>
          <p className="text-[8px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: TEXT_MUTED }}>Owner</p>
          <OperationalOwnerChip {...(entity.owner !== undefined ? { owner: entity.owner } : {})} />
        </div>
        <div className="rounded px-3 py-2.5" style={{ background: BG_ELEVATED, border: `1px solid ${BORDER_MUTED}` }}>
          <p className="text-[8px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: TEXT_MUTED }}>Next Action</p>
          <p className="text-[10px]" style={{ color: entity.nextAction ? ACCENT : TEXT_MUTED }}>
            {typeof entity.nextAction === "string" ? entity.nextAction : entity.nextAction?.label ?? "No action queued"}
          </p>
        </div>
      </div>

      {/* Evidence + Rationale */}
      {((entity.evidence && entity.evidence.length > 0) || entity.rationale) && (
        <OperationalEvidencePanel items={entity.evidence ?? []} {...(entity.rationale !== undefined ? { rationale: entity.rationale } : {})} />
      )}

      {/* Escalation Paths */}
      {entity.escalationPaths && entity.escalationPaths.length > 0 && (
        <div>
          <p className="text-[9px] uppercase tracking-wider font-semibold mb-2" style={{ color: TEXT_MUTED }}>Active Escalations</p>
          <OperationalEscalationPanel paths={entity.escalationPaths} />
        </div>
      )}

      {/* Custom slot */}
      {children}

      {/* Audit Timeline */}
      {entity.auditHistory && entity.auditHistory.length > 0 && (
        <div>
          <p className="text-[9px] uppercase tracking-wider font-semibold mb-2" style={{ color: TEXT_MUTED }}>Audit History</p>
          <OperationalAuditTimeline entries={entity.auditHistory} maxEntries={10} />
        </div>
      )}
    </div>
  );
}

// ─── Operational Queue Row ─────────────────────────────────────────────────────

interface QueueRowProps {
  entity: OperationalEntity & { entityType?: string };
  onClick?: () => void;
  selected?: boolean;
}

export function OperationalQueueRow({ entity, onClick, selected = false }: QueueRowProps) {
  const BG_SURFACE = "#0c1018";
  const BORDER_MUTED = "rgba(255,255,255,0.07)";
  const TEXT_PRIMARY = "rgba(255,255,255,0.88)";
  const TEXT_SECONDARY = "rgba(255,255,255,0.55)";
  const TEXT_MUTED = "rgba(255,255,255,0.28)";
  const ACCENT = "#d4a054";

  return (
    <div
      onClick={onClick}
      className={`px-3 py-2.5 flex items-center gap-3 cursor-pointer transition-colors ${onClick ? "hover:bg-white/[0.02]" : ""}`}
      style={{
        background: selected ? "rgba(212,160,84,0.06)" : BG_SURFACE,
        borderLeft: selected ? `2px solid ${ACCENT}` : "2px solid transparent",
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          {entity.entityType && (
            <span className="text-[8px] font-mono uppercase tracking-wider" style={{ color: TEXT_MUTED }}>{entity.entityType}</span>
          )}
          <span className="text-[11px] font-medium truncate" style={{ color: TEXT_PRIMARY }}>{entity.title ?? `Entity #${entity.id}`}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {entity.status && <OperationalStatusBadge status={entity.status} size="xs" />}
          {(entity.riskLevel || entity.riskScore !== undefined) && (
            <OperationalRiskBadge {...(entity.riskLevel !== undefined ? { level: entity.riskLevel } : {})} {...(entity.riskScore !== undefined ? { score: entity.riskScore } : {})} size="xs" />
          )}
          <OperationalOwnerChip {...(entity.owner !== undefined ? { owner: entity.owner } : {})} size="xs" unassignedLabel="" />
          {entity.nextAction && (
            <span className="text-[9px] truncate ml-auto" style={{ color: ACCENT }}>
              {typeof entity.nextAction === "string" ? entity.nextAction : entity.nextAction.label}
            </span>
          )}
        </div>
      </div>
      <div className="shrink-0 text-[8px] font-mono" style={{ color: TEXT_MUTED }}>
        {formatAgo(entity.updatedAt ?? entity.createdAt)}
      </div>
    </div>
  );
}
