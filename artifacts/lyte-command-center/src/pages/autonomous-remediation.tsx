import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, CheckCircle2, XCircle, AlertTriangle, Clock, ChevronDown, ChevronRight,
  Database, Server, Shield, Activity, Edit3, Play, X, GitBranch, BarChart3,
} from "lucide-react";

const BG = { page: "#080c14", surface: "#0c1018", elevated: "#10141e", panel: "#0e1219" };
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.07)" };
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)", muted: "rgba(255,255,255,0.14)" };
const GOLD = "#d4a054";

type RemediationStatus = "proposed" | "approved" | "executing" | "done" | "rejected" | "modified";
type Severity = "critical" | "high" | "medium";

interface RemediationAction {
  id: string;
  title: string;
  trigger: string;
  proposedAction: string;
  modifiedAction?: string;
  severity: Severity;
  status: RemediationStatus;
  system: string;
  systemIcon: React.ElementType;
  systemColor: string;
  impact: string;
  riskScore: number;
  confidence: number;
  proposedAt: string;
  resolvedAt?: string;
  steps: string[];
  approver?: string;
}

const severityConfig: Record<Severity, { color: string; bg: string; label: string }> = {
  critical: { color: "#f87171", bg: "rgba(248,113,113,0.08)", label: "Critical" },
  high: { color: GOLD, bg: "rgba(212,160,84,0.08)", label: "High" },
  medium: { color: "#60a5fa", bg: "rgba(96,165,250,0.08)", label: "Medium" },
};

const statusConfig: Record<RemediationStatus, { color: string; label: string }> = {
  proposed: { color: GOLD, label: "Awaiting Approval" },
  approved: { color: "#34d399", label: "Approved" },
  executing: { color: "#38bdf8", label: "Executing" },
  done: { color: "rgba(255,255,255,0.35)", label: "Resolved" },
  rejected: { color: "#f87171", label: "Rejected" },
  modified: { color: "#a78bfa", label: "Modified & Approved" },
};

const ACTIONS: RemediationAction[] = [
  {
    id: "r1",
    title: "Database connection pool exhausted",
    trigger: "Connection pool at 100% capacity for 4m12s. 847 queued requests. P99 latency: 8.2s.",
    proposedAction: "Scale connection pool from 20 to 50 connections on db-primary-us-east-1",
    severity: "critical",
    status: "proposed",
    system: "PostgreSQL", systemIcon: Database, systemColor: "#60a5fa",
    impact: "Immediate queue drain. P99 latency returns to <200ms within 2 minutes.",
    riskScore: 12,
    confidence: 94,
    proposedAt: "2m ago",
    steps: [
      "Snapshot current pool configuration",
      "Update max_connections parameter to 50",
      "Apply change without restart (hot reload)",
      "Monitor queue drain and latency recovery",
      "Alert if queue does not clear within 5 minutes",
    ],
  },
  {
    id: "r2",
    title: "Terra search endpoint — N+1 query pattern",
    trigger: "P95 latency 450ms (+23% vs 7-day avg). Root cause traced to terra-search v2.3.1, deployed Tue 09:14.",
    proposedAction: "Roll back terra-search service to v2.3.0 and open incident ticket for N+1 fix",
    severity: "high",
    status: "modified",
    modifiedAction: "Hot-patch terra-search v2.3.1 with eager-load fix (patch prepared by on-call team) — skip rollback",
    system: "Terra API", systemIcon: Server, systemColor: "#34d399",
    impact: "P95 returns to <200ms. Avoid data inconsistency risk of rollback during active leases.",
    riskScore: 28,
    confidence: 87,
    proposedAt: "18m ago",
    resolvedAt: "8m ago",
    approver: "Ops Lead",
    steps: [
      "Apply eager-load patch to terra-search v2.3.1",
      "Verify query plan on staging",
      "Blue-green deploy patched version",
      "Confirm P95 recovery on production",
    ],
  },
  {
    id: "r3",
    title: "Aegis API cert expiry in 6 hours",
    trigger: "TLS certificate for aegis-api.szlholdings.com expires in 6h 14m. Auto-renewal failed (ACME DNS challenge timeout).",
    proposedAction: "Trigger manual certificate renewal via Cloudflare DNS validation + redeploy ingress",
    severity: "critical",
    status: "executing",
    system: "Aegis API", systemIcon: Shield, systemColor: "#f87171",
    impact: "Prevents complete API outage at cert expiry. Zero downtime with ingress redeploy.",
    riskScore: 8,
    confidence: 99,
    proposedAt: "34m ago",
    steps: [
      "✓ Initiate ACME certificate request via Cloudflare DNS API",
      "✓ DNS challenge record deployed (TTL: 60s)",
      "⟳ Waiting for ACME validation (est. 45s remaining)",
      "→ Install new certificate to secrets store",
      "→ Rolling restart of ingress pods",
    ],
    approver: "Auto-approved (policy: cert_renewal_auto_approve)",
  },
  {
    id: "r4",
    title: "Vessels service memory leak — worker pods",
    trigger: "vessels-worker pod memory climbing 12MB/h. Current: 1.8GB/2GB limit. OOM kill predicted in 10 minutes.",
    proposedAction: "Graceful rolling restart of vessels-worker deployment (4 pods, 30s stagger)",
    severity: "high",
    status: "done",
    system: "Vessels", systemIcon: Activity, systemColor: "#38bdf8",
    impact: "Immediate memory reset. Service continuity maintained during rolling restart.",
    riskScore: 15,
    confidence: 98,
    proposedAt: "1h 12m ago",
    resolvedAt: "1h 5m ago",
    approver: "SRE Team",
    steps: [
      "✓ Cordon pod vessels-worker-0 (drain traffic)",
      "✓ Restart vessels-worker-0 (memory: 1.8GB → 210MB)",
      "✓ Restart vessels-worker-1 (memory: 1.7GB → 198MB)",
      "✓ Restart vessels-worker-2 (memory: 1.9GB → 215MB)",
      "✓ Restart vessels-worker-3 (memory: 1.6GB → 204MB)",
    ],
  },
];

function StepList({ steps, status }: { steps: string[]; status: RemediationStatus }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {steps.map((step, i) => {
        const isDone = step.startsWith("✓");
        const isActive = step.startsWith("⟳");
        const isPending = step.startsWith("→") || (!isDone && !isActive);
        return (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <div style={{ marginTop: 2, flexShrink: 0 }}>
              {isDone
                ? <CheckCircle2 size={12} style={{ color: "#34d399" }} />
                : isActive
                ? <div style={{ width: 12, height: 12, borderRadius: "50%", border: `2px solid ${GOLD}`, borderTopColor: "transparent", animation: "lyte-spin 0.9s linear infinite" }} />
                : <div style={{ width: 12, height: 12, borderRadius: "50%", border: `1px solid ${BORDER.muted}` }} />}
            </div>
            <span style={{ fontSize: 11, color: isDone ? TEXT.secondary : isActive ? TEXT.primary : TEXT.tertiary, lineHeight: 1.5 }}>
              {step.replace(/^[✓⟳→]\s?/, "")}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ActionCard({ action }: { action: RemediationAction }) {
  const [expanded, setExpanded] = useState(action.status === "proposed");
  const [localStatus, setLocalStatus] = useState(action.status);
  const [modifyOpen, setModifyOpen] = useState(false);
  const [modifiedText, setModifiedText] = useState(action.proposedAction);
  const sev = severityConfig[action.severity];
  const sta = statusConfig[localStatus];
  const Icon = action.systemIcon;

  const canAct = localStatus === "proposed";

  return (
    <div style={{
      background: BG.surface, border: `1px solid ${BORDER.subtle}`,
      borderRadius: 10, overflow: "hidden",
    }}>
      {action.severity === "critical" && <div style={{ height: 2, background: sev.color }} />}
      <div
        style={{
          padding: "14px 16px", cursor: "pointer",
          display: "flex", alignItems: "flex-start", gap: 12,
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{
          width: 30, height: 30, borderRadius: 7, flexShrink: 0,
          background: `${action.systemColor}12`, border: `1px solid ${action.systemColor}25`,
          display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2,
        }}>
          <Icon size={13} style={{ color: action.systemColor }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: TEXT.primary }}>{action.title}</span>
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
              color: sev.color, background: sev.bg, padding: "2px 6px", borderRadius: 20,
            }}>{sev.label}</span>
            <span style={{
              fontSize: 9, fontWeight: 600, letterSpacing: "0.04em",
              color: sta.color, padding: "2px 6px", borderRadius: 20,
              border: `1px solid ${sta.color}30`,
            }}>{sta.label}</span>
          </div>
          <p style={{ fontSize: 11, color: TEXT.secondary, margin: 0, lineHeight: 1.55 }}>{action.trigger}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: TEXT.muted }}>{action.proposedAt}</span>
          {expanded ? <ChevronDown size={13} style={{ color: TEXT.tertiary }} /> : <ChevronRight size={13} style={{ color: TEXT.tertiary }} />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ borderTop: `1px solid ${BORDER.subtle}`, padding: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: TEXT.muted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 6px" }}>
                    Proposed Action
                  </p>
                  <p style={{ fontSize: 12, color: TEXT.primary, margin: 0, lineHeight: 1.55, padding: "10px 12px", background: BG.elevated, borderRadius: 7, border: `1px solid ${BORDER.muted}` }}>
                    {action.modifiedAction ?? action.proposedAction}
                    {action.modifiedAction && (
                      <span style={{ display: "block", marginTop: 6, fontSize: 10, color: "#a78bfa", fontStyle: "italic" }}>
                        Modified from original proposal
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: TEXT.muted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 6px" }}>
                    Expected Impact
                  </p>
                  <p style={{ fontSize: 12, color: TEXT.secondary, margin: 0, lineHeight: 1.55 }}>{action.impact}</p>
                  <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                    <div>
                      <p style={{ fontSize: 10, color: TEXT.muted, margin: "0 0 2px" }}>Risk score</p>
                      <p style={{ fontSize: 16, fontWeight: 700, color: action.riskScore < 20 ? "#34d399" : action.riskScore < 40 ? GOLD : "#f87171", margin: 0 }}>
                        {action.riskScore}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, color: TEXT.muted, margin: "0 0 2px" }}>Confidence</p>
                      <p style={{ fontSize: 16, fontWeight: 700, color: TEXT.primary, margin: 0 }}>{action.confidence}%</p>
                    </div>
                    {action.approver && (
                      <div>
                        <p style={{ fontSize: 10, color: TEXT.muted, margin: "0 0 2px" }}>Approved by</p>
                        <p style={{ fontSize: 11, fontWeight: 500, color: TEXT.secondary, margin: 0 }}>{action.approver}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {action.steps && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: TEXT.muted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 10px" }}>
                    Execution Steps
                  </p>
                  <StepList steps={action.steps} status={localStatus} />
                </div>
              )}

              {canAct && (
                <div>
                  {modifyOpen && (
                    <div style={{ marginBottom: 12 }}>
                      <textarea
                        value={modifiedText}
                        onChange={e => setModifiedText(e.target.value)}
                        rows={2}
                        style={{
                          width: "100%", background: BG.elevated, border: `1px solid ${BORDER.muted}`,
                          borderRadius: 7, padding: "10px 12px", color: TEXT.primary, fontSize: 12,
                          resize: "none", outline: "none", fontFamily: "inherit", lineHeight: 1.5,
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      onClick={() => setLocalStatus("approved")}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)",
                        borderRadius: 7, padding: "7px 14px", cursor: "pointer", color: "#34d399", fontSize: 12, fontWeight: 500,
                      }}
                    >
                      <CheckCircle2 size={12} /> Approve
                    </button>
                    <button
                      onClick={() => { setModifyOpen(!modifyOpen); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.25)",
                        borderRadius: 7, padding: "7px 14px", cursor: "pointer", color: "#a78bfa", fontSize: 12, fontWeight: 500,
                      }}
                    >
                      <Edit3 size={12} /> Modify
                    </button>
                    <button
                      onClick={() => setLocalStatus("rejected")}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)",
                        borderRadius: 7, padding: "7px 14px", cursor: "pointer", color: "#f87171", fontSize: 12, fontWeight: 500,
                      }}
                    >
                      <XCircle size={12} /> Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AutonomousRemediation() {
  const proposed = ACTIONS.filter(a => a.status === "proposed").length;
  const executing = ACTIONS.filter(a => a.status === "executing").length;
  const done = ACTIONS.filter(a => a.status === "done").length;

  return (
    <div style={{ padding: "20px 20px 60px", background: BG.page, minHeight: "100%", color: TEXT.primary }}>
      <style>{`@keyframes lyte-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Zap size={14} style={{ color: GOLD }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Autonomous Remediation Engine
            </span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: TEXT.primary, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            Remediation Queue
          </h1>
          <p style={{ fontSize: 12, color: TEXT.secondary, margin: 0 }}>
            AI-detected incidents with proposed fixes. Review, modify, or approve each action — then watch execution.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 28 }}>
          {[
            { label: "Awaiting Approval", value: proposed, color: GOLD },
            { label: "Executing", value: executing, color: "#38bdf8" },
            { label: "Resolved Today", value: done, color: "#34d399" },
            { label: "Avg Response Time", value: "4.2m", color: TEXT.secondary },
          ].map(stat => (
            <div key={stat.label} style={{
              background: BG.surface, border: `1px solid ${BORDER.subtle}`,
              borderRadius: 8, padding: "12px 14px",
            }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: stat.color, margin: "0 0 2px", letterSpacing: "-0.03em" }}>{stat.value}</p>
              <p style={{ fontSize: 10, color: TEXT.muted, margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {ACTIONS.map(action => <ActionCard key={action.id} action={action} />)}
        </div>
      </div>
    </div>
  );
}
