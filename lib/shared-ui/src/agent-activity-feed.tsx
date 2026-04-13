import React, { useState, useEffect, useCallback, useRef } from "react";
import { colors, typography } from "./tokens";
import { apiFetch } from "./api-fetch";

export type ActivityEventType =
  | "skill_invoked" | "skill_completed" | "skill_failed"
  | "tool_called" | "tool_completed" | "tool_failed"
  | "a2a_delegation_started" | "a2a_delegation_completed" | "a2a_delegation_failed"
  | "approval_requested" | "approval_granted" | "approval_rejected"
  | "composition_started" | "composition_step_completed" | "composition_completed" | "composition_failed"
  | "insight_surfaced" | "action_queued" | "action_executed"
  | "autonomy_level_changed";

export interface AgentActivityEvent {
  eventId: string;
  eventType: ActivityEventType;
  agentId: string;
  agentName?: string;
  skillId?: string;
  skillLabel?: string;
  toolName?: string;
  domain?: string;
  userId?: string;
  runId?: string;
  compositionId?: string;
  fromAgentId?: string;
  toAgentId?: string;
  reasoning?: string;
  latencyMs?: number;
  autonomyLevel?: string;
  requiresApproval?: boolean;
  approvalStatus?: "pending" | "approved" | "rejected";
  metadata?: Record<string, unknown>;
  occurredAt: string;
}

const EVENT_TYPE_META: Record<string, { label: string; icon: string; color: string; bgColor: string }> = {
  skill_invoked:        { label: "Skill Invoked",        icon: "⚡", color: "#818cf8", bgColor: "rgba(129,140,248,0.1)" },
  skill_completed:      { label: "Skill Completed",      icon: "✓",  color: "#22c55e", bgColor: "rgba(34,197,94,0.08)" },
  skill_failed:         { label: "Skill Failed",         icon: "✗",  color: "#ef4444", bgColor: "rgba(239,68,68,0.08)" },
  tool_called:          { label: "Tool Called",          icon: "🔧", color: "#64748b", bgColor: "rgba(100,116,139,0.08)" },
  tool_completed:       { label: "Tool Completed",       icon: "✓",  color: "#22c55e", bgColor: "rgba(34,197,94,0.06)" },
  tool_failed:          { label: "Tool Failed",          icon: "✗",  color: "#ef4444", bgColor: "rgba(239,68,68,0.06)" },
  a2a_delegation_started:   { label: "Delegation →",    icon: "🤝", color: "#a78bfa", bgColor: "rgba(167,139,250,0.1)" },
  a2a_delegation_completed: { label: "Delegation ✓",   icon: "🤝", color: "#22c55e", bgColor: "rgba(34,197,94,0.08)" },
  a2a_delegation_failed:    { label: "Delegation ✗",   icon: "🤝", color: "#ef4444", bgColor: "rgba(239,68,68,0.08)" },
  approval_requested:   { label: "Approval Requested",  icon: "⏸",  color: "#f59e0b", bgColor: "rgba(245,158,11,0.12)" },
  approval_granted:     { label: "Approval Granted",    icon: "✅", color: "#22c55e", bgColor: "rgba(34,197,94,0.1)" },
  approval_rejected:    { label: "Approval Rejected",   icon: "❌", color: "#ef4444", bgColor: "rgba(239,68,68,0.1)" },
  composition_started:  { label: "Workflow Started",    icon: "▶",  color: "#818cf8", bgColor: "rgba(129,140,248,0.08)" },
  composition_step_completed: { label: "Step Done",     icon: "→",  color: "#6ee7b7", bgColor: "rgba(110,231,183,0.06)" },
  composition_completed:{ label: "Workflow Complete",   icon: "🎯", color: "#22c55e", bgColor: "rgba(34,197,94,0.1)" },
  composition_failed:   { label: "Workflow Failed",     icon: "💥", color: "#ef4444", bgColor: "rgba(239,68,68,0.1)" },
  insight_surfaced:     { label: "Insight",             icon: "💡", color: "#fbbf24", bgColor: "rgba(251,191,36,0.08)" },
  action_queued:        { label: "Action Queued",       icon: "⏳", color: "#94a3b8", bgColor: "rgba(148,163,184,0.08)" },
  action_executed:      { label: "Action Executed",     icon: "⚡", color: "#818cf8", bgColor: "rgba(129,140,248,0.1)" },
  autonomy_level_changed: { label: "Autonomy Changed",  icon: "🎛️", color: "#a78bfa", bgColor: "rgba(167,139,250,0.08)" },
};

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  return date.toLocaleDateString();
}

function EventRow({ event, onExpand, accentColor }: {
  event: AgentActivityEvent;
  onExpand: (eventId: string) => void;
  accentColor: string;
}) {
  const meta = EVENT_TYPE_META[event.eventType] ?? {
    label: event.eventType, icon: "•", color: "#94a3b8", bgColor: "rgba(148,163,184,0.06)"
  };
  const isA2A = event.eventType.startsWith("a2a_");

  return (
    <div
      onClick={() => onExpand(event.eventId)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "8px",
        padding: "6px 10px",
        borderRadius: "6px",
        background: meta.bgColor,
        border: `1px solid ${meta.color}20`,
        cursor: "pointer",
        transition: "all 0.15s",
        marginBottom: "4px",
      }}
      onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
      onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
    >
      <span style={{ fontSize: "13px", flexShrink: 0, marginTop: "1px" }}>{meta.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: meta.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {meta.label}
          </span>
          {event.skillLabel && (
            <span style={{
              fontSize: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "4px", padding: "0 5px", color: "rgba(255,255,255,0.6)",
            }}>
              {event.skillLabel}
            </span>
          )}
          {event.toolName && (
            <span style={{
              fontSize: "10px", fontFamily: typography.fontFamily.mono,
              color: "rgba(255,255,255,0.4)",
            }}>
              {event.toolName}
            </span>
          )}
          {isA2A && event.fromAgentId && event.toAgentId && (
            <span style={{ fontSize: "10px", color: "rgba(167,139,250,0.8)" }}>
              {event.fromAgentId} → {event.toAgentId}
            </span>
          )}
          {event.requiresApproval && event.approvalStatus === "pending" && (
            <span style={{
              fontSize: "9px", background: "rgba(245,158,11,0.15)", color: "#f59e0b",
              border: "1px solid rgba(245,158,11,0.3)", borderRadius: "3px",
              padding: "1px 5px", letterSpacing: "0.06em", textTransform: "uppercase",
            }}>
              Awaiting Approval
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
          <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>
            {event.agentName ?? event.agentId}
          </span>
          {event.domain && (
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)" }}>· {event.domain}</span>
          )}
          {event.latencyMs !== undefined && (
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)" }}>· {event.latencyMs}ms</span>
          )}
          <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)", marginLeft: "auto" }}>
            {formatTime(event.occurredAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

function EventDetail({ event, onClose, accentColor }: {
  event: AgentActivityEvent;
  onClose: () => void;
  accentColor: string;
}) {
  const meta = EVENT_TYPE_META[event.eventType] ?? { label: event.eventType, icon: "•", color: accentColor, bgColor: "rgba(0,0,0,0.1)" };
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: `1px solid ${meta.color}30`,
      borderRadius: "8px",
      padding: "12px",
      marginBottom: "8px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "14px" }}>{meta.icon}</span>
          <span style={{ fontSize: "12px", fontWeight: 700, color: meta.color }}>
            {meta.label}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "14px", padding: "0 4px" }}
        >
          ×
        </button>
      </div>

      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginBottom: "8px" }}>
        <strong>Event ID:</strong> <code style={{ fontFamily: typography.fontFamily.mono, fontSize: "10px" }}>{event.eventId}</code>
      </div>

      {event.agentId && (
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginBottom: "4px" }}>
          <strong>Agent:</strong> {event.agentName ?? event.agentId}
        </div>
      )}
      {event.skillLabel && (
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginBottom: "4px" }}>
          <strong>Skill:</strong> {event.skillLabel} ({event.skillId})
        </div>
      )}
      {event.domain && (
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginBottom: "4px" }}>
          <strong>Domain:</strong> {event.domain}
        </div>
      )}
      {event.autonomyLevel && (
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginBottom: "4px" }}>
          <strong>Autonomy:</strong> {event.autonomyLevel}
        </div>
      )}
      {event.fromAgentId && event.toAgentId && (
        <div style={{ fontSize: "11px", color: "rgba(167,139,250,0.8)", marginBottom: "4px" }}>
          <strong>Delegation:</strong> {event.fromAgentId} → {event.toAgentId}
        </div>
      )}
      {event.latencyMs !== undefined && (
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginBottom: "4px" }}>
          <strong>Latency:</strong> {event.latencyMs}ms
        </div>
      )}
      {event.reasoning && (
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginBottom: "4px" }}>
          <strong>Reasoning:</strong>
          <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.5)", fontStyle: "italic" }}>{event.reasoning}</p>
        </div>
      )}
      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginTop: "8px" }}>
        {new Date(event.occurredAt).toLocaleString()}
      </div>
    </div>
  );
}

export interface AgentActivityFeedProps {
  domain?: string;
  agentId?: string;
  maxEvents?: number;
  pollIntervalMs?: number;
  accentColor?: string;
  compact?: boolean;
  showFilters?: boolean;
  apiBaseUrl?: string;
}

export function AgentActivityFeed({
  domain,
  agentId,
  maxEvents = 30,
  pollIntervalMs = 10000,
  accentColor = "#818cf8",
  compact = false,
  showFilters = true,
  apiBaseUrl = "",
}: AgentActivityFeedProps) {
  const [events, setEvents] = useState<AgentActivityEvent[]>([]);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "skills" | "delegations" | "approvals">("all");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: String(maxEvents) });
      if (domain) params.set("domain", domain);
      if (agentId) params.set("agentId", agentId);
      const response = await apiFetch<{ data: { events: AgentActivityEvent[] } }>(
        `${apiBaseUrl}/api/skills/activity/feed?${params}`
      );
      setEvents(response.data?.events ?? []);
    } catch {}
  }, [domain, agentId, maxEvents, apiBaseUrl]);

  useEffect(() => {
    setLoading(true);
    fetchEvents().finally(() => setLoading(false));

    pollRef.current = setInterval(fetchEvents, pollIntervalMs);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchEvents, pollIntervalMs]);

  const filteredEvents = events.filter(e => {
    if (filter === "skills") return e.eventType.startsWith("skill_") || e.eventType.startsWith("composition_");
    if (filter === "delegations") return e.eventType.startsWith("a2a_");
    if (filter === "approvals") return e.eventType.startsWith("approval_");
    return true;
  });

  const expandedEvent = expandedEventId ? events.find(e => e.eventId === expandedEventId) : null;

  return (
    <div style={{ fontFamily: typography.fontFamily.body }}>
      {showFilters && (
        <div style={{ display: "flex", gap: "4px", marginBottom: "10px" }}>
          {(["all", "skills", "delegations", "approvals"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "3px 10px",
                borderRadius: "4px",
                border: `1px solid ${filter === f ? accentColor : "rgba(255,255,255,0.1)"}`,
                background: filter === f ? `${accentColor}20` : "transparent",
                color: filter === f ? accentColor : "rgba(255,255,255,0.4)",
                fontSize: "10px",
                fontWeight: 600,
                cursor: "pointer",
                textTransform: "capitalize",
                letterSpacing: "0.04em",
              }}
            >
              {f}
            </button>
          ))}
          <button
            onClick={() => fetchEvents()}
            style={{
              marginLeft: "auto",
              padding: "3px 8px",
              borderRadius: "4px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent",
              color: "rgba(255,255,255,0.3)",
              fontSize: "10px",
              cursor: "pointer",
            }}
          >
            ↻
          </button>
        </div>
      )}

      {loading && events.length === 0 && (
        <div style={{ textAlign: "center", padding: "20px", color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>
          Loading activity feed…
        </div>
      )}

      {!loading && filteredEvents.length === 0 && (
        <div style={{ textAlign: "center", padding: "20px", color: "rgba(255,255,255,0.25)", fontSize: "11px" }}>
          No agent activity yet
        </div>
      )}

      {expandedEvent && (
        <EventDetail
          event={expandedEvent}
          onClose={() => setExpandedEventId(null)}
          accentColor={accentColor}
        />
      )}

      <div style={{ maxHeight: compact ? "200px" : "400px", overflowY: "auto" }}>
        {filteredEvents.map(event => (
          <EventRow
            key={event.eventId}
            event={event}
            onExpand={(id) => setExpandedEventId(expandedEventId === id ? null : id)}
            accentColor={accentColor}
          />
        ))}
      </div>
    </div>
  );
}

export interface AutonomyLevelSelectorProps {
  skillId: string;
  currentLevel: "observer" | "advisor" | "operator";
  onLevelChange: (skillId: string, level: "observer" | "advisor" | "operator") => void;
  accentColor?: string;
  compact?: boolean;
}

export function AutonomyLevelSelector({
  skillId,
  currentLevel,
  onLevelChange,
  accentColor = "#818cf8",
  compact = false,
}: AutonomyLevelSelectorProps) {
  const levels: Array<{
    value: "observer" | "advisor" | "operator";
    label: string;
    icon: string;
    description: string;
    color: string;
  }> = [
    {
      value: "observer",
      label: "Observer",
      icon: "👁",
      description: "Watches and surfaces insights only",
      color: "#64748b",
    },
    {
      value: "advisor",
      label: "Advisor",
      icon: "⚠️",
      description: "Suggests actions — you approve each",
      color: "#f59e0b",
    },
    {
      value: "operator",
      label: "Operator",
      icon: "⚡",
      description: "Executes approved action classes autonomously",
      color: "#ef4444",
    },
  ];

  if (compact) {
    return (
      <div style={{ display: "flex", gap: "4px" }}>
        {levels.map(l => (
          <button
            key={l.value}
            onClick={() => onLevelChange(skillId, l.value)}
            title={l.description}
            style={{
              padding: "3px 8px",
              borderRadius: "4px",
              border: `1px solid ${currentLevel === l.value ? l.color : "rgba(255,255,255,0.1)"}`,
              background: currentLevel === l.value ? `${l.color}20` : "transparent",
              color: currentLevel === l.value ? l.color : "rgba(255,255,255,0.35)",
              fontSize: "10px",
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "0.04em",
            }}
          >
            {l.icon} {l.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {levels.map(l => (
        <button
          key={l.value}
          onClick={() => onLevelChange(skillId, l.value)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 12px",
            borderRadius: "6px",
            border: `1px solid ${currentLevel === l.value ? l.color : "rgba(255,255,255,0.08)"}`,
            background: currentLevel === l.value ? `${l.color}15` : "rgba(255,255,255,0.02)",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <span style={{ fontSize: "14px", flexShrink: 0 }}>{l.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: currentLevel === l.value ? l.color : "rgba(255,255,255,0.7)" }}>
              {l.label}
            </div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", marginTop: "1px" }}>
              {l.description}
            </div>
          </div>
          {currentLevel === l.value && (
            <span style={{ fontSize: "12px", color: l.color, flexShrink: 0 }}>●</span>
          )}
        </button>
      ))}
    </div>
  );
}
