import React, { useState, useCallback, useEffect } from "react";
import { typography, colors } from "./tokens";

export interface AIAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  category: string;
  destructive?: boolean;
  requiresApproval?: boolean;
}

export interface ActionHistoryEntry {
  id: string;
  actionId: string;
  label: string;
  status: "pending" | "running" | "completed" | "failed" | "awaiting_approval";
  startedAt: string;
  completedAt?: string;
  result?: string;
  error?: string;
  triggeredBy?: "user" | "workflow" | "scheduled";
}

export interface WorkflowStatus {
  id: string;
  name: string;
  status: "active" | "paused" | "error";
  lastRun?: string;
  nextRun?: string;
  runsToday?: number;
}

export interface AIActionsPanelProps {
  domain: string;
  actions: AIAction[];
  accentColor: string;
  onRunAction?: (action: AIAction) => Promise<string>;
  compact?: boolean;
}

const STATUS_COLORS = {
  pending: "#d4a054",
  running: "#4a90b8",
  completed: "#6b8f71",
  failed: "#c45a4a",
  awaiting_approval: "#8b7ac8",
};

const STATUS_ICONS = {
  pending: "⏳",
  running: "⚡",
  completed: "✓",
  failed: "✗",
  awaiting_approval: "👤",
};

function formatRelativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function ActionRow({
  action,
  accentColor,
  onRun,
  isRunning,
}: {
  action: AIAction;
  accentColor: string;
  onRun: (action: AIAction) => void;
  isRunning: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "9px 12px",
        borderRadius: "8px",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = `${accentColor}30`)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)")}
    >
      <span style={{ fontSize: "16px", flexShrink: 0 }}>{action.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.85)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {action.label}
        </div>
        <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", marginTop: "1px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {action.description}
        </div>
      </div>
      <button
        onClick={() => onRun(action)}
        disabled={isRunning}
        style={{
          flexShrink: 0,
          padding: "4px 10px",
          borderRadius: "6px",
          background: action.destructive ? "rgba(196,90,74,0.15)" : `${accentColor}15`,
          border: `1px solid ${action.destructive ? "rgba(196,90,74,0.3)" : `${accentColor}30`}`,
          color: action.destructive ? "#c45a4a" : accentColor,
          fontSize: "10px",
          fontWeight: 700,
          cursor: isRunning ? "not-allowed" : "pointer",
          opacity: isRunning ? 0.5 : 1,
          fontFamily: typography.fontFamily.body,
          transition: "all 0.15s",
          letterSpacing: "0.2px",
        }}
      >
        {action.requiresApproval ? "Request" : "Run"}
      </button>
    </div>
  );
}

function HistoryRow({ entry }: { entry: ActionHistoryEntry }) {
  const statusColor = STATUS_COLORS[entry.status];
  const statusIcon = STATUS_ICONS[entry.status];
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <span style={{ fontSize: "12px", marginTop: "1px", flexShrink: 0 }}>{statusIcon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.75)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {entry.label}
        </div>
        {entry.result && (
          <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", marginTop: "2px", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {entry.result}
          </div>
        )}
        {entry.error && (
          <div style={{ fontSize: "10px", color: "#c45a4a", marginTop: "2px" }}>{entry.error}</div>
        )}
      </div>
      <div style={{ flexShrink: 0, textAlign: "right" }}>
        <span style={{ fontSize: "9px", color: statusColor, fontWeight: 700, letterSpacing: "0.3px", textTransform: "uppercase" }}>{entry.status.replace("_", " ")}</span>
        <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.25)", marginTop: "2px" }}>
          {formatRelativeTime(entry.startedAt)}
        </div>
      </div>
    </div>
  );
}

function generateDemoHistory(actions: AIAction[]): ActionHistoryEntry[] {
  const statuses: ActionHistoryEntry["status"][] = ["completed", "completed", "failed", "completed", "running"];
  const results: Record<string, string> = {
    completed: "Action completed successfully. Output saved to audit log.",
    failed: "Action failed: API rate limit exceeded. Retry in 60s.",
    running: "In progress...",
  };
  return actions.slice(0, 5).map((a, i) => ({
    id: `hist-${i}`,
    actionId: a.id,
    label: a.label,
    status: statuses[i] ?? "completed",
    startedAt: new Date(Date.now() - (i + 1) * 8 * 60000).toISOString(),
    completedAt: statuses[i] !== "running" ? new Date(Date.now() - i * 8 * 60000).toISOString() : undefined,
    result: results[statuses[i] ?? "completed"],
    triggeredBy: i % 2 === 0 ? "user" : "workflow",
  }));
}

export function AIActionsPanel({
  domain,
  actions,
  accentColor,
  onRunAction,
  compact = false,
}: AIActionsPanelProps) {
  const [tab, setTab] = useState<"actions" | "history">("actions");
  const [runningId, setRunningId] = useState<string | null>(null);
  const [history, setHistory] = useState<ActionHistoryEntry[]>(() => generateDemoHistory(actions));
  const [approvalPending, setApprovalPending] = useState<AIAction | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const categories = Array.from(new Set(actions.map(a => a.category)));

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  }, []);

  const handleRun = useCallback(async (action: AIAction) => {
    if (runningId) return;
    if (action.requiresApproval) {
      setApprovalPending(action);
      return;
    }
    executeAction(action);
  }, [runningId]);

  const executeAction = useCallback(async (action: AIAction) => {
    setRunningId(action.id);
    setApprovalPending(null);

    const entry: ActionHistoryEntry = {
      id: `run-${Date.now()}`,
      actionId: action.id,
      label: action.label,
      status: "running",
      startedAt: new Date().toISOString(),
      triggeredBy: "user",
    };
    setHistory(h => [entry, ...h]);

    try {
      let result = "Action completed successfully.";
      if (onRunAction) {
        result = await onRunAction(action);
      } else {
        await new Promise(r => setTimeout(r, 1800 + Math.random() * 800));
      }
      setHistory(h => h.map(e => e.id === entry.id ? { ...e, status: "completed", completedAt: new Date().toISOString(), result } : e));
      showNotification(`✓ ${action.label} completed`);
    } catch (err) {
      const error = err instanceof Error ? err.message : "Unknown error";
      setHistory(h => h.map(e => e.id === entry.id ? { ...e, status: "failed", completedAt: new Date().toISOString(), error } : e));
      showNotification(`✗ ${action.label} failed`);
    } finally {
      setRunningId(null);
    }
  }, [onRunAction, showNotification]);

  const containerStyle: React.CSSProperties = {
    background: "rgba(10,12,20,0.6)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: compact ? "12px" : "16px",
    overflow: "hidden",
    fontFamily: typography.fontFamily.body,
    display: "flex",
    flexDirection: "column",
    maxHeight: compact ? "380px" : "520px",
  };

  return (
    <div style={containerStyle}>
      {notification && (
        <div style={{
          position: "absolute",
          bottom: "12px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(20,25,40,0.96)",
          border: `1px solid ${accentColor}40`,
          borderRadius: "8px",
          padding: "8px 14px",
          fontSize: "11px",
          color: "rgba(255,255,255,0.85)",
          zIndex: 100,
          whiteSpace: "nowrap",
          pointerEvents: "none",
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        }}>
          {notification}
        </div>
      )}

      <div style={{ padding: "12px 14px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
          <span style={{ fontSize: "14px" }}>⚡</span>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>AI Actions</span>
          <span style={{ marginLeft: "auto", fontSize: "9px", color: accentColor, background: `${accentColor}15`, border: `1px solid ${accentColor}25`, borderRadius: "4px", padding: "1px 6px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {domain}
          </span>
        </div>
        <div style={{ display: "flex", gap: "2px" }}>
          {(["actions", "history"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "5px 12px",
                borderRadius: "6px 6px 0 0",
                background: tab === t ? "rgba(255,255,255,0.06)" : "transparent",
                border: "none",
                borderBottom: tab === t ? `2px solid ${accentColor}` : "2px solid transparent",
                color: tab === t ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.35)",
                fontSize: "11px",
                fontWeight: tab === t ? 700 : 500,
                cursor: "pointer",
                fontFamily: typography.fontFamily.body,
                transition: "all 0.15s",
                textTransform: "capitalize",
              }}
            >
              {t}
              {t === "history" && history.length > 0 && (
                <span style={{ marginLeft: "4px", background: `${accentColor}25`, color: accentColor, borderRadius: "4px", padding: "0 4px", fontSize: "9px", fontWeight: 800 }}>
                  {history.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
        {tab === "actions" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {categories.map(cat => (
              <div key={cat}>
                <div style={{ fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>
                  {cat}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {actions.filter(a => a.category === cat).map(action => (
                    <ActionRow
                      key={action.id}
                      action={action}
                      accentColor={accentColor}
                      onRun={handleRun}
                      isRunning={runningId === action.id}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "history" && (
          <div>
            {history.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: "12px" }}>
                No actions run yet
              </div>
            ) : (
              history.map(entry => <HistoryRow key={entry.id} entry={entry} />)
            )}
          </div>
        )}
      </div>

      {approvalPending && (
        <div style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 50,
          padding: "20px",
        }}>
          <div style={{
            background: "rgba(15,18,30,0.98)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "14px",
            padding: "24px",
            maxWidth: "320px",
            width: "100%",
          }}>
            <div style={{ fontSize: "24px", textAlign: "center", marginBottom: "12px" }}>⚠️</div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.9)", textAlign: "center", marginBottom: "8px" }}>
              Approval Required
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", textAlign: "center", marginBottom: "20px", lineHeight: 1.6 }}>
              <strong style={{ color: "rgba(255,255,255,0.8)" }}>{approvalPending.label}</strong> requires human approval before execution.
              <br />{approvalPending.description}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setApprovalPending(null)}
                style={{ flex: 1, padding: "9px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: "12px", cursor: "pointer", fontFamily: typography.fontFamily.body }}
              >
                Cancel
              </button>
              <button
                onClick={() => executeAction(approvalPending)}
                style={{ flex: 1, padding: "9px", borderRadius: "8px", background: `${accentColor}20`, border: `1px solid ${accentColor}50`, color: accentColor, fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: typography.fontFamily.body }}
              >
                Approve & Run
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const DOMAIN_ACTIONS: Record<string, AIAction[]> = {
  legal: [
    { id: "summarize-matter", label: "Summarize Matter", description: "AI summary of active case and key dates", icon: "📋", category: "Analysis" },
    { id: "extract-obligations", label: "Extract Obligations", description: "Pull all obligations and deadlines from documents", icon: "📌", category: "Analysis" },
    { id: "draft-brief", label: "Draft Legal Brief", description: "Generate a brief outline for review", icon: "✍️", category: "Drafting" },
    { id: "deadline-check", label: "Deadline Risk Check", description: "Flag upcoming filing deadlines at risk", icon: "⏰", category: "Compliance" },
    { id: "conflict-check", label: "Conflict Check", description: "Run NLP conflict-of-interest scan", icon: "🔍", category: "Compliance" },
    { id: "close-matter", label: "Close Matter", description: "Archive matter and notify parties", icon: "🗂️", category: "Operations", requiresApproval: true, destructive: true },
  ],
  property: [
    { id: "property-report", label: "Property Intelligence Report", description: "Full AI analysis for a parcel or address", icon: "🏠", category: "Analysis" },
    { id: "comp-analysis", label: "Comparable Sales Analysis", description: "Find and rank recent comparable sales", icon: "📊", category: "Valuation" },
    { id: "risk-assessment", label: "Environmental Risk Assessment", description: "Flag flood, zoning, and hazard risks", icon: "⚠️", category: "Risk" },
    { id: "lease-summary", label: "Summarize Lease", description: "Extract key terms, parties, and renewal dates", icon: "📄", category: "Analysis" },
    { id: "market-brief", label: "Market Brief", description: "Generate local market conditions summary", icon: "📈", category: "Valuation" },
  ],
  maritime: [
    { id: "vessel-brief", label: "Vessel Intelligence Brief", description: "Full vessel history and risk profile", icon: "⚓", category: "Intelligence" },
    { id: "cargo-risk", label: "Cargo Risk Analysis", description: "Assess sanctions, routing, and cargo flags", icon: "📦", category: "Risk" },
    { id: "route-optimize", label: "Route Optimization", description: "Suggest optimal routing with weather and risk", icon: "🗺️", category: "Operations" },
    { id: "manifest-extract", label: "Extract Manifest Data", description: "Parse manifest and flag anomalies", icon: "📋", category: "Compliance" },
    { id: "sanctions-check", label: "Sanctions Screen", description: "Cross-reference parties against OFAC/UN lists", icon: "🔍", category: "Compliance" },
    { id: "incident-report", label: "Generate Incident Report", description: "Create structured incident report", icon: "⚡", category: "Operations", requiresApproval: true },
  ],
  defense: [
    { id: "threat-brief", label: "Generate Threat Brief", description: "Synthesize current threat landscape", icon: "🛡️", category: "Intelligence" },
    { id: "ioc-extract", label: "Extract IOCs", description: "Pull indicators of compromise from reports", icon: "🎯", category: "Analysis" },
    { id: "mitre-map", label: "Map to MITRE ATT&CK", description: "Map TTPs to MITRE framework automatically", icon: "🗂️", category: "Analysis" },
    { id: "alert-triage", label: "Triage Alert Queue", description: "AI-prioritized alert triage with reasoning", icon: "🚨", category: "Operations" },
    { id: "containment", label: "Initiate Containment", description: "Start automated containment workflow", icon: "🔒", category: "Response", requiresApproval: true, destructive: true },
    { id: "board-brief", label: "Executive Board Brief", description: "Generate executive-ready threat summary", icon: "📊", category: "Intelligence" },
  ],
  general: [
    { id: "summarize", label: "Summarize Content", description: "AI summary of current context", icon: "📋", category: "Analysis" },
    { id: "generate-report", label: "Generate Report", description: "Create structured report from data", icon: "📄", category: "Reporting" },
    { id: "extract-data", label: "Extract Key Data", description: "Pull structured data from documents", icon: "🔍", category: "Analysis" },
  ],
};
