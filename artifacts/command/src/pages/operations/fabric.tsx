import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import {
  Activity, AlertTriangle, Bell, Check, CheckSquare, Cpu,
  GitBranch, Globe2, LayoutGrid, Loader2, RefreshCw, Radio, Shield, X,
  Zap, ChevronRight, Wifi, WifiOff, Network, Server,
  TrendingUp,
} from "lucide-react";
import { Toaster } from "@szl-holdings/shared-ui/ui/sonner";
import { toast } from "sonner";
import { RecommendationCard } from "@szl-holdings/design-system/cockpit/recommendation-card";
import { RunTimeline, type RunSpan } from "@szl-holdings/design-system/cockpit/run-timeline";
import { FreshnessChip } from "@szl-holdings/design-system/proof/freshness-chip";
import { ConfidenceMeter } from "@szl-holdings/design-system/proof/confidence-meter";
import { PolicyStateChip, type PolicyState } from "@szl-holdings/design-system/proof/policy-state-chip";
import { ApprovalDialog } from "@szl-holdings/design-system/cockpit/approval-dialog";
import { apiUrl } from "../cognitive/shared";
import { useFabricShell } from "../../lib/fabric-shell-context";
import type { AuditEvent } from "@szl-holdings/design-system/cockpit/audit-rail";
import type { EvidenceItem } from "@szl-holdings/design-system/cockpit/evidence-drawer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Product    { id: string; label: string; color: string; icon: string; status: string; signalCount: number; runCount: number }
interface Signal     { id: string; product: string; domain: string; title: string; severity: string; confidence: number; detectedAt: string; entityId: string; entityType: string }
interface Run        { runId: string; product: string; objective: string; autonomyMode: string; status: string; startedAt: string; policyEvents: number; domain: string }
interface Alert      { alertId: string; product: string; title: string; severity: string; status: string; firedAt: string; runId: string }
interface Rec        { recId: string; product: string; title: string; confidence: number; impact: string; status: string; generatedAt: string; linkedRunId: string; linkedSignalId: string }
interface Approval   { approvalId: string; product: string; title: string; requestedBy: string; requestedAt: string; policy: string; runId: string; urgency: string }
interface Connector  { connectorId: string; label: string; product: string; status: string; lastSyncAt: string; errorRate: number; throughput: number }
interface SysService { status: string; latencyMs: number; uptimePct: number; [k: string]: unknown }
interface SystemHealth { signalMesh: SysService; runEngine: SysService; evidenceGraph: SysService; policyEngine: SysService; connectorHub: SysService; database: SysService }
interface Entity     { id: string; type: string; product: string; label: string }
interface Correlation{ correlationId: string; title: string; description: string; products: string[]; entities: Entity[]; signals: string[]; runs: string[]; strength: number; detectedAt: string }
interface Snapshot {
  generatedAt: string; tick: number;
  products: Product[]; signals: Signal[]; runs: Run[]; alerts: Alert[];
  recommendations: Rec[]; approvals: Approval[]; connectors: Connector[];
  systemHealth: SystemHealth; correlations: Correlation[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const PRODUCT_COLORS: Record<string, string> = {
  lyte: "#d4a054", vessels: "#0ea5e9", terra: "#22c55e",
  prism: "#a855f7", aegis: "#ef4444", carlota: "#f59e0b", pulse: "#8b7ac8",
};
const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444", high: "#f97316", warning: "#f59e0b",
  medium: "#f59e0b", info: "#0ea5e9", low: "#64748b",
};
const STATUS_COLORS: Record<string, string> = {
  healthy: "#22c55e", warning: "#f59e0b", critical: "#ef4444",
  degraded: "#f97316", running: "#0ea5e9", completed: "#22c55e",
  awaiting_approval: "#f59e0b", open: "#ef4444", ack: "#f59e0b",
  resolving: "#0ea5e9", applied: "#22c55e", pending: "#8b7ac8",
  autonomous: "#22c55e", supervised: "#f59e0b", advisory: "#0ea5e9",
};

function Dot({ color, pulse: p = false }: { color: string; pulse?: boolean }) {
  return (
    <span className="relative inline-flex" style={{ width: 8, height: 8 }}>
      <span className="inline-block rounded-full" style={{ width: 8, height: 8, background: color }} />
      {p && <span className="absolute inset-0 rounded-full animate-ping" style={{ background: color, opacity: 0.4 }} />}
    </span>
  );
}

function Badge({ label, color }: { label: string; color?: string }) {
  const c = color ?? "#64748b";
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide"
      style={{ background: `${c}20`, border: `1px solid ${c}40`, color: c }}>
      {label}
    </span>
  );
}

function PanelHeader({ icon: Icon, title, count, accent, right }: {
  icon: typeof Activity; title: string; count?: number; accent?: string; right?: React.ReactNode;
}) {
  const a = accent ?? "#8b7ac8";
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5" style={{ color: a }} />
        <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: a }}>{title}</span>
        {count !== undefined && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${a}18`, color: a }}>{count}</span>
        )}
      </div>
      {right}
    </div>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl flex flex-col overflow-hidden ${className}`}
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel: Products
// ---------------------------------------------------------------------------
function ProductsPanel({ products }: { products: Product[] }) {
  return (
    <Panel>
      <PanelHeader icon={LayoutGrid} title="Products" count={products.length} accent="#8b7ac8" />
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2">
        {products.map((p) => (
          <div key={p.id} className="rounded-lg p-3 flex flex-col gap-1.5 cursor-pointer hover:bg-white/5 transition-colors"
            style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-base">{p.icon}</span>
                <span className="text-[11px] font-semibold" style={{ color: p.color }}>{p.label}</span>
              </div>
              <Dot color={STATUS_COLORS[p.status] ?? "#64748b"} pulse={p.status === "critical"} />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                <span className="font-mono" style={{ color: "rgba(255,255,255,0.7)" }}>{p.signalCount}</span> signals
              </span>
              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                <span className="font-mono" style={{ color: "rgba(255,255,255,0.7)" }}>{p.runCount}</span> runs
              </span>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Panel: Active Signals — uses ConfidenceMeter + FreshnessChip + PolicyStateChip
// ---------------------------------------------------------------------------
function SignalsPanel({ signals, onDrill }: { signals: Signal[]; onDrill: (sig: Signal) => void }) {
  return (
    <Panel>
      <PanelHeader icon={Radio} title="Active Signals" count={signals.length} accent="#0ea5e9" />
      <div className="flex-1 overflow-y-auto divide-y">
        {signals.map((s) => {
          const sc = SEVERITY_COLORS[s.severity] ?? "#64748b";
          const pc = PRODUCT_COLORS[s.product] ?? "#64748b";
          const policyState: PolicyState = s.severity === "critical" ? "requires-approval" : "allowed";
          return (
            <div key={s.id}
              className="px-4 py-2.5 hover:bg-white/5 transition-colors cursor-pointer"
              onClick={() => onDrill(s)}>
              <div className="flex items-start gap-3">
                <Dot color={sc} pulse={s.severity === "critical"} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-white leading-snug truncate">{s.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[9px] font-semibold" style={{ color: pc }}>{s.product}</span>
                    <ConfidenceMeter value={Math.round(s.confidence * 100)} variant="compact" />
                    <FreshnessChip timestamp={s.detectedAt} />
                    <PolicyStateChip state={policyState} />
                  </div>
                </div>
                <Badge label={s.severity} color={sc} />
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Synthetic run spans helper for RunTimeline
// ---------------------------------------------------------------------------
function syntheticSpans(run: Run): RunSpan[] {
  const base: RunSpan[] = [
    { spanId: `${run.runId}-plan`, name: "Plan", kind: "agent", status: "ok", latencyMs: 120, startOffsetMs: 0 },
    { spanId: `${run.runId}-retrieve`, name: "Retrieve evidence", kind: "retrieval", status: "ok", latencyMs: 85, startOffsetMs: 125 },
    { spanId: `${run.runId}-model`, name: "Reason", kind: "model", status: "ok", latencyMs: 420, startOffsetMs: 215, model: "gpt-4o" },
  ];
  if (run.policyEvents > 0) {
    base.push({ spanId: `${run.runId}-policy`, name: "Policy gate", kind: "policy", status: "blocked", latencyMs: 30, startOffsetMs: 640 });
    if (run.status === "awaiting_approval") {
      base.push({ spanId: `${run.runId}-approval`, name: "Awaiting approval", kind: "approval", status: "pending", latencyMs: 0, startOffsetMs: 675 });
    }
  } else {
    base.push({ spanId: `${run.runId}-tool`, name: "Execute action", kind: "tool", status: run.status === "completed" ? "ok" : "pending", latencyMs: run.status === "completed" ? 95 : 0, startOffsetMs: 640 });
  }
  return base;
}

// ---------------------------------------------------------------------------
// Panel: Active Runs — uses RunTimeline
// ---------------------------------------------------------------------------
function RunsPanel({ runs, onDrill }: { runs: Run[]; onDrill: (r: Run) => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  return (
    <Panel>
      <PanelHeader icon={Activity} title="Active Runs" count={runs.filter(r => r.status !== "completed").length} accent="#d4a054" />
      <div className="flex-1 overflow-y-auto divide-y">
        {runs.map((r) => {
          const sc = STATUS_COLORS[r.status] ?? "#64748b";
          const pc = PRODUCT_COLORS[r.product] ?? "#64748b";
          const ac = STATUS_COLORS[r.autonomyMode] ?? "#64748b";
          const isExpanded = expandedId === r.runId;
          return (
            <div key={r.runId}>
              <div
                className="px-4 py-2.5 hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => {
                  setExpandedId(isExpanded ? null : r.runId);
                  onDrill(r);
                }}>
                <div className="flex items-start gap-2">
                  <Dot color={sc} pulse={r.status === "running"} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-white leading-snug">{r.objective}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[9px] font-semibold" style={{ color: pc }}>{r.product}</span>
                      <Badge label={r.autonomyMode} color={ac} />
                      <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>{r.runId}</span>
                      <FreshnessChip timestamp={r.startedAt} />
                      {r.policyEvents > 0 && <Badge label={`${r.policyEvents} policy evt`} color="#f59e0b" />}
                    </div>
                  </div>
                  <Badge label={r.status.replace(/_/g, " ")} color={sc} />
                </div>
              </div>
              {isExpanded && (
                <div className="px-4 pb-3">
                  <RunTimeline spans={syntheticSpans(r)} totalMs={750} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Panel: Alerts
// ---------------------------------------------------------------------------
function AlertsPanel({ alerts, onDrill }: { alerts: Alert[]; onDrill: (a: Alert) => void }) {
  const open = alerts.filter(a => a.status === "open");
  return (
    <Panel>
      <PanelHeader icon={Bell} title="Alerts" count={open.length} accent="#ef4444"
        right={<Link href="/operations/alerts"><a className="text-[10px] flex items-center gap-1 hover:opacity-70 transition-opacity" style={{ color: "rgba(255,255,255,0.3)" }}>All <ChevronRight className="w-3 h-3" /></a></Link>}
      />
      <div className="flex-1 overflow-y-auto divide-y">
        {alerts.map((a) => {
          const sc = SEVERITY_COLORS[a.severity] ?? "#64748b";
          const pc = PRODUCT_COLORS[a.product] ?? "#64748b";
          const stc = STATUS_COLORS[a.status] ?? "#64748b";
          return (
            <div key={a.alertId}
              className="px-4 py-2.5 hover:bg-white/5 transition-colors cursor-pointer flex items-start gap-3"
              onClick={() => onDrill(a)}>
              <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" style={{ color: sc }} />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-white leading-snug truncate">{a.title}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[9px] font-semibold" style={{ color: pc }}>{a.product}</span>
                  <FreshnessChip timestamp={a.firedAt} />
                  <Badge label={a.status} color={stc} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Panel: Recommendations — uses RecommendationCard from design system
// ---------------------------------------------------------------------------
function RecsPanel({ recs, onDrill }: { recs: Rec[]; onDrill: (r: Rec) => void }) {
  return (
    <Panel>
      <PanelHeader icon={TrendingUp} title="Recommendations"
        count={recs.filter(r => r.status === "pending" || r.status === "awaiting_approval").length}
        accent="#22c55e"
        right={<Link href="/operations/recommendations"><a className="text-[10px] flex items-center gap-1 hover:opacity-70 transition-opacity" style={{ color: "rgba(255,255,255,0.3)" }}>All <ChevronRight className="w-3 h-3" /></a></Link>}
      />
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {recs.map((r) => {
          const policyState: PolicyState = r.status === "awaiting_approval" ? "requires-approval" : r.status === "applied" ? "allowed" : "allowed";
          return (
            <RecommendationCard
              key={r.recId}
              recommendationId={r.recId}
              title={r.title}
              summary={`Impact: ${r.impact} · ${r.product}`}
              confidence={Math.round(r.confidence * 100)}
              policyState={policyState}
              domain={r.product}
              generatedAt={r.generatedAt}
              variant="compact"
              onInspect={() => onDrill(r)}
            />
          );
        })}
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Panel: Approvals Waiting — uses ApprovalDialog + PolicyStateChip
// ---------------------------------------------------------------------------
function ApprovalsPanel({
  approvals,
  onDrill,
  onAction,
}: {
  approvals: Approval[];
  onDrill: (a: Approval) => void;
  onAction: (approval: Approval, action: "approve" | "dismiss") => Promise<void>;
}) {
  const [dialogApproval, setDialogApproval] = useState<Approval | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleInline(e: React.MouseEvent, a: Approval, action: "approve" | "dismiss") {
    e.stopPropagation();
    if (pendingId) return;
    setPendingId(a.approvalId);
    try {
      await onAction(a, action);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      <Panel>
        <PanelHeader icon={CheckSquare} title="Approvals Waiting" count={approvals.length} accent="#f59e0b"
          right={<Link href="/operations/approvals"><a className="text-[10px] flex items-center gap-1 hover:opacity-70 transition-opacity" style={{ color: "rgba(255,255,255,0.3)" }}>Review <ChevronRight className="w-3 h-3" /></a></Link>}
        />
        <div className="flex-1 overflow-y-auto divide-y">
          {approvals.length === 0 && (
            <div className="flex items-center justify-center h-20 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>No pending approvals</div>
          )}
          {approvals.map((a) => {
            const uc = { critical: "#ef4444", high: "#f97316", medium: "#f59e0b", low: "#22c55e" }[a.urgency] ?? "#64748b";
            const pc = PRODUCT_COLORS[a.product] ?? "#64748b";
            const isPending = pendingId === a.approvalId;
            return (
              <div key={a.approvalId}
                className="px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => {
                  onDrill(a);
                  setDialogApproval(a);
                }}>
                <div className="flex items-start gap-2">
                  <Dot color={uc} pulse />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-white leading-snug">{a.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                        by <span style={{ color: pc }}>{a.requestedBy}</span>
                      </span>
                      <FreshnessChip timestamp={a.requestedAt} />
                      <PolicyStateChip state="requires-approval" />
                    </div>
                    <p className="text-[9px] mt-0.5 font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>{a.policy}</p>
                  </div>
                  <Badge label={a.urgency} color={uc} />
                </div>
                <div className="flex items-center gap-2 mt-2 pl-4">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={(e) => handleInline(e, a, "approve")}
                    data-testid={`button-approve-${a.approvalId}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)", color: "#22c55e" }}>
                    {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={(e) => handleInline(e, a, "dismiss")}
                    data-testid={`button-dismiss-${a.approvalId}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", color: "#ef4444" }}>
                    {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                    Dismiss
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {dialogApproval && (
        <ApprovalDialog
          open={!!dialogApproval}
          onClose={() => setDialogApproval(null)}
          title={dialogApproval.title}
          description={`Requested by ${dialogApproval.requestedBy} · Policy: ${dialogApproval.policy} · Run: ${dialogApproval.runId}`}
          riskLevel={dialogApproval.urgency as "low" | "medium" | "high" | "critical"}
          policyId={dialogApproval.policy}
          requiredBy={dialogApproval.requestedBy}
          onApprove={() => setDialogApproval(null)}
          onReject={() => setDialogApproval(null)}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Panel: Connector Health — uses FreshnessChip
// ---------------------------------------------------------------------------
function ConnectorsPanel({ connectors }: { connectors: Connector[] }) {
  const degraded = connectors.filter(c => c.status !== "healthy");
  return (
    <Panel>
      <PanelHeader icon={Network} title="Connector Health" accent="#0ea5e9"
        right={degraded.length > 0 ? <Badge label={`${degraded.length} degraded`} color="#f97316" /> : <Badge label="All healthy" color="#22c55e" />}
      />
      <div className="flex-1 overflow-y-auto divide-y">
        {connectors.map((c) => {
          const sc = STATUS_COLORS[c.status] ?? "#22c55e";
          const pc = PRODUCT_COLORS[c.product] ?? "#64748b";
          return (
            <div key={c.connectorId} className="px-4 py-2 flex items-center gap-3">
              {c.status === "healthy" ? <Wifi className="w-3 h-3 shrink-0" style={{ color: sc }} /> : <WifiOff className="w-3 h-3 shrink-0" style={{ color: sc }} />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-white">{c.label}</span>
                  <span className="text-[9px]" style={{ color: pc }}>({c.product})</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>{c.throughput} evt/s</span>
                  {c.errorRate > 0 && <span className="text-[9px] font-mono" style={{ color: "#ef4444" }}>{(c.errorRate * 100).toFixed(0)}% err</span>}
                  <FreshnessChip timestamp={c.lastSyncAt} />
                </div>
              </div>
              <Dot color={sc} pulse={c.status !== "healthy"} />
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Panel: System Health — uses ConfidenceMeter for uptime
// ---------------------------------------------------------------------------
const SYS_LABELS: Record<string, string> = {
  signalMesh: "Signal Mesh", runEngine: "Run Engine", evidenceGraph: "Evidence Graph",
  policyEngine: "Policy Engine", connectorHub: "Connector Hub", database: "Database",
};
const SYS_ICONS: Record<string, typeof Server> = {
  signalMesh: Radio, runEngine: Activity, evidenceGraph: Zap,
  policyEngine: Shield, connectorHub: Network, database: Server,
};

function SystemHealthPanel({ health }: { health: SystemHealth | null }) {
  if (!health) return (
    <Panel>
      <PanelHeader icon={Cpu} title="System Health" accent="#22c55e" />
      <div className="flex items-center justify-center h-24 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Loading…</div>
    </Panel>
  );
  const entries = Object.entries(health) as [string, SysService][];
  const degraded = entries.filter(([, v]) => v.status !== "healthy").length;
  return (
    <Panel>
      <PanelHeader icon={Cpu} title="System Health" accent="#22c55e"
        right={degraded > 0 ? <Badge label={`${degraded} issue${degraded > 1 ? "s" : ""}`} color="#f97316" /> : <Badge label="All systems go" color="#22c55e" />}
      />
      <div className="flex-1 overflow-y-auto divide-y">
        {entries.map(([key, svc]) => {
          const sc = STATUS_COLORS[svc.status] ?? "#22c55e";
          const Icon = SYS_ICONS[key] ?? Server;
          return (
            <div key={key} className="px-4 py-2.5 flex items-center gap-3">
              <Icon className="w-3 h-3 shrink-0" style={{ color: sc }} />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-white">{SYS_LABELS[key] ?? key}</span>
                  <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>{svc.latencyMs}ms</span>
                </div>
                <ConfidenceMeter value={svc.uptimePct} variant="compact" label="uptime" />
              </div>
              <Dot color={sc} pulse={svc.status !== "healthy"} />
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Cross-App Correlation Card
// ---------------------------------------------------------------------------
function CorrelationCard({ corr, snap }: { corr: Correlation; snap: Snapshot | null }) {
  return (
    <div className="rounded-xl p-4 space-y-3"
      style={{ background: "rgba(139,122,200,0.06)", border: "1px solid rgba(139,122,200,0.18)" }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GitBranch className="w-3.5 h-3.5" style={{ color: "#8b7ac8" }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#8b7ac8" }}>Cross-App Correlation</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(139,122,200,0.12)", color: "#8b7ac8" }}>
              {Math.round(corr.strength * 100)}% strength
            </span>
          </div>
          <h3 className="text-sm font-semibold text-white leading-snug">{corr.title}</h3>
        </div>
        <FreshnessChip timestamp={corr.detectedAt} />
      </div>
      <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>{corr.description}</p>
      <div className="flex items-center gap-3 flex-wrap">
        {corr.entities.map((e) => {
          const pc = PRODUCT_COLORS[e.product] ?? "#64748b";
          return (
            <div key={e.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: `${pc}10`, border: `1px solid ${pc}25` }}>
              <span className="text-[9px] font-bold" style={{ color: pc }}>{e.product}</span>
              <ChevronRight className="w-2.5 h-2.5" style={{ color: "rgba(255,255,255,0.2)" }} />
              <span className="text-[10px] text-white">{e.label}</span>
              <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>({e.type})</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 flex-wrap pt-1">
        <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>Linked signals:</span>
        {corr.signals.map((sid) => {
          const sig = snap?.signals.find(s => s.id === sid);
          if (!sig) return null;
          return <Badge key={sid} label={sig.title.slice(0, 28) + "…"} color={SEVERITY_COLORS[sig.severity] ?? "#64748b"} />;
        })}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>Linked runs:</span>
        {corr.runs.map((rid) => (
          <Link key={rid} href="/operations/runs">
            <a className="text-[9px] font-mono hover:underline" style={{ color: "#d4a054" }}>{rid}</a>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export function GlobalFabricPage() {
  const { pushAuditEvent, openEvidenceDrawer } = useFabricShell();
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [streamStatus, setStreamStatus] = useState<"connecting" | "live" | "polling">("connecting");
  const esRef = useRef<EventSource | null>(null);
  // Approvals the operator has acted on inline. The SSE stream re-broadcasts
  // the full approvals array every few seconds, so without this guard an
  // approved/dismissed card would re-appear in the panel.
  const actedApprovalIdsRef = useRef<Set<string>>(new Set());
  const filterActed = useCallback((list: Approval[]): Approval[] => {
    const acted = actedApprovalIdsRef.current;
    if (acted.size === 0) return list;
    return list.filter((a) => !acted.has(String(a.approvalId)));
  }, []);

  const pollSnapshot = useCallback(() => {
    fetch(apiUrl("/fabric/snapshot"), { credentials: "include" })
      .then(r => r.json())
      .then((data: Snapshot) => {
        setSnap({ ...data, approvals: filterActed(data.approvals) });
        pushAuditEvent({
          eventId: `fabric-poll-${Date.now()}`,
          kind: "system",
          actor: "fabric-agent",
          actorType: "system",
          action: `Snapshot refreshed — ${data.signals.length} signals, ${data.runs.length} runs`,
          timestamp: new Date().toISOString(),
          outcome: "success",
        });
      })
      .catch(() => {});
  }, [pushAuditEvent]);

  useEffect(() => {
    try {
      const es = new EventSource(apiUrl("/fabric/stream"), { withCredentials: true } as EventSourceInit);
      esRef.current = es;

      es.addEventListener("snapshot", (e: MessageEvent) => {
        const data: Snapshot = JSON.parse(e.data);
        setSnap({ ...data, approvals: filterActed(data.approvals) });
        setStreamStatus("live");
        pushAuditEvent({
          eventId: `fabric-connect-${Date.now()}`,
          kind: "system",
          actor: "fabric-mesh",
          actorType: "system",
          action: `Fabric live — ${data.signals.length} signals · ${data.runs.filter(r => r.status === "running").length} active runs`,
          timestamp: new Date().toISOString(),
          outcome: "success",
        });
      });

      es.addEventListener("signals", (e: MessageEvent) => {
        const { signals } = JSON.parse(e.data);
        setSnap(prev => prev ? { ...prev, signals } : prev);
        const criticals = signals.filter((s: Signal) => s.severity === "critical");
        if (criticals.length) {
          pushAuditEvent({
            eventId: `sig-update-${Date.now()}`,
            kind: "agent-action",
            actor: `${criticals[0].product}-signal-mesh`,
            actorType: "agent",
            action: `${criticals.length} critical signal(s) updated`,
            detail: criticals[0].title,
            timestamp: new Date().toISOString(),
            outcome: "pending",
          });
        }
      });

      es.addEventListener("products",        (e: MessageEvent) => { const { products } = JSON.parse(e.data); setSnap(prev => prev ? { ...prev, products } : prev); });
      es.addEventListener("runs",            (e: MessageEvent) => { const { runs } = JSON.parse(e.data); setSnap(prev => prev ? { ...prev, runs } : prev); });
      es.addEventListener("alerts",          (e: MessageEvent) => { const { alerts } = JSON.parse(e.data); setSnap(prev => prev ? { ...prev, alerts } : prev); });
      es.addEventListener("recommendations", (e: MessageEvent) => { const { recommendations } = JSON.parse(e.data); setSnap(prev => prev ? { ...prev, recommendations } : prev); });
      es.addEventListener("approvals",       (e: MessageEvent) => { const { approvals } = JSON.parse(e.data); setSnap(prev => prev ? { ...prev, approvals: filterActed(approvals) } : prev); });
      es.addEventListener("system_health",   (e: MessageEvent) => { const { systemHealth } = JSON.parse(e.data); setSnap(prev => prev ? { ...prev, systemHealth } : prev); });
      es.addEventListener("connectors",      (e: MessageEvent) => { const { connectors } = JSON.parse(e.data); setSnap(prev => prev ? { ...prev, connectors } : prev); });

      es.onerror = () => {
        es.close();
        setStreamStatus("polling");
        pollSnapshot();
      };
    } catch {
      setStreamStatus("polling");
      pollSnapshot();
    }
    return () => { esRef.current?.close(); };
  }, [pushAuditEvent, pollSnapshot]);

  useEffect(() => {
    if (streamStatus !== "polling") return;
    const t = setInterval(pollSnapshot, 10_000);
    return () => clearInterval(t);
  }, [streamStatus, pollSnapshot]);

  // Open design-system EvidenceDrawer via shell context
  function drillSignal(s: Signal) {
    const items: EvidenceItem[] = [{
      evidenceId: s.id,
      kind: "normalized",
      source: s.product,
      ref: s.entityId,
      summary: `${s.title} — detected by ${s.product} (${s.domain}). Entity: ${s.entityId} (${s.entityType}).`,
      confidence: s.confidence,
      freshness: "fresh",
      capturedAt: s.detectedAt,
      policyState: s.severity === "critical" ? "requires-approval" : "allowed",
      drillUrl: "/operations/prism/signals",
    }];
    openEvidenceDrawer(s.title, items);
    pushAuditEvent({
      eventId: `drill-sig-${s.id}-${Date.now()}`,
      kind: "tool-call",
      actor: "operator",
      actorType: "human",
      action: `Opened evidence for signal: ${s.title}`,
      detail: `Entity: ${s.entityId} · Confidence: ${Math.round(s.confidence * 100)}%`,
      timestamp: new Date().toISOString(),
      outcome: "success",
    });
  }

  function drillRun(r: Run) {
    const items: EvidenceItem[] = [{
      evidenceId: r.runId,
      kind: "derived",
      source: r.product,
      ref: r.runId,
      summary: `${r.objective} — ${r.product} · ${r.autonomyMode} mode. Status: ${r.status}. Policy events: ${r.policyEvents}.`,
      confidence: r.status === "completed" ? 0.97 : 0.75,
      freshness: "fresh",
      capturedAt: r.startedAt,
      policyState: r.policyEvents > 0 ? "requires-approval" : "allowed",
      drillUrl: "/operations/runs",
    }];
    openEvidenceDrawer(r.objective, items);
  }

  function drillAlert(a: Alert) {
    const items: EvidenceItem[] = [{
      evidenceId: a.alertId,
      kind: "raw",
      source: a.product,
      ref: a.alertId,
      summary: `${a.title} — severity: ${a.severity}, status: ${a.status}. Linked run: ${a.runId}.`,
      confidence: 0.99,
      freshness: "fresh",
      capturedAt: a.firedAt,
      policyState: a.severity === "critical" ? "requires-approval" : "allowed",
      drillUrl: "/operations/alerts",
    }];
    openEvidenceDrawer(a.title, items);
  }

  function drillRec(r: Rec) {
    const items: EvidenceItem[] = [{
      evidenceId: r.recId,
      kind: "derived",
      source: r.product,
      ref: r.recId,
      summary: `${r.title} — impact: ${r.impact}, confidence: ${Math.round(r.confidence * 100)}%.`,
      confidence: r.confidence,
      freshness: "fresh",
      capturedAt: r.generatedAt,
      policyState: r.status === "awaiting_approval" ? "requires-approval" : "allowed",
      drillUrl: "/operations/recommendations",
    }];
    openEvidenceDrawer(r.title, items);
  }

  const handleApprovalAction = useCallback(
    async (approval: Approval, action: "approve" | "dismiss") => {
      const verb = action === "approve" ? "Approving" : "Dismissing";
      const past = action === "approve" ? "approved" : "dismissed";

      // Optimistic update — remove the card immediately and remember the
      // ID so the SSE re-stream doesn't bring it back.
      actedApprovalIdsRef.current.add(String(approval.approvalId));
      setSnap((prev) =>
        prev
          ? { ...prev, approvals: prev.approvals.filter((a) => a.approvalId !== approval.approvalId) }
          : prev,
      );

      pushAuditEvent({
        eventId: `apv-action-${approval.approvalId}-${Date.now()}`,
        kind: "policy-gate",
        actor: "operator",
        actorType: "human",
        action: `${verb} approval: ${approval.title}`,
        detail: `Policy: ${approval.policy} · Run: ${approval.runId}`,
        timestamp: new Date().toISOString(),
        outcome: "pending",
      });

      try {
        // Ensure a CSRF cookie is present (POST endpoints require X-CSRF-Token).
        let csrfMatch = document.cookie.split(";").find((c) => c.trim().startsWith("csrf_token="));
        if (!csrfMatch) {
          try {
            await fetch(apiUrl("/csrf-token"), { credentials: "include" });
            csrfMatch = document.cookie.split(";").find((c) => c.trim().startsWith("csrf_token="));
          } catch {
            /* ignore — request will fail with a clear error below */
          }
        }
        const csrfToken = csrfMatch ? decodeURIComponent(csrfMatch.split("=")[1] ?? "") : undefined;

        // Real DB-backed approvals (numeric IDs) go through the canonical
        // /approvals/:id/review endpoint so role/tenant guards and the
        // run-manager ledger writeback stay centralized. Synthetic demo IDs
        // from the Fabric snapshot use the demo-only fabric inline endpoint.
        const idStr = String(approval.approvalId);
        const isNumericId = /^\d+$/.test(idStr);
        const endpoint = isNumericId
          ? `/approvals/${idStr}/review`
          : "/fabric/approvals/inline-action";
        const decisionForCanonical = action === "approve" ? "approved" : "rejected";
        const body = isNumericId
          ? { decision: decisionForCanonical }
          : { approvalId: idStr, action };

        const res = await fetch(apiUrl(endpoint), {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          let message = `Request failed (${res.status})`;
          try {
            const data = (await res.json()) as { error?: { message?: string }; message?: string };
            message = data?.error?.message ?? data?.message ?? message;
          } catch {
            /* keep default */
          }
          throw new Error(message);
        }
        toast.success(`Approval ${past}`, { description: approval.title });
        pushAuditEvent({
          eventId: `apv-action-ok-${approval.approvalId}-${Date.now()}`,
          kind: "policy-gate",
          actor: "operator",
          actorType: "human",
          action: `Approval ${past}: ${approval.title}`,
          timestamp: new Date().toISOString(),
          outcome: "success",
        });
      } catch (err) {
        // Rollback optimistic update
        actedApprovalIdsRef.current.delete(String(approval.approvalId));
        setSnap((prev) =>
          prev
            ? prev.approvals.some((a) => a.approvalId === approval.approvalId)
              ? prev
              : { ...prev, approvals: [approval, ...prev.approvals] }
            : prev,
        );
        const msg = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Could not ${action} approval`, { description: msg });
        pushAuditEvent({
          eventId: `apv-action-err-${approval.approvalId}-${Date.now()}`,
          kind: "policy-gate",
          actor: "operator",
          actorType: "human",
          action: `Failed to ${action} approval: ${approval.title}`,
          detail: msg,
          timestamp: new Date().toISOString(),
          outcome: "failure",
        });
      }
    },
    [pushAuditEvent],
  );

  function drillApproval(a: Approval) {
    pushAuditEvent({
      eventId: `drill-apv-${a.approvalId}-${Date.now()}`,
      kind: "policy-gate",
      actor: "operator",
      actorType: "human",
      action: `Opened approval: ${a.title}`,
      detail: `Policy: ${a.policy} · Urgency: ${a.urgency}`,
      timestamp: new Date().toISOString(),
      outcome: "pending",
    });
  }

  const products        = snap?.products        ?? [];
  const signals         = snap?.signals         ?? [];
  const runs            = snap?.runs            ?? [];
  const alerts          = snap?.alerts          ?? [];
  const recommendations = snap?.recommendations ?? [];
  const approvals       = snap?.approvals       ?? [];
  const connectors      = snap?.connectors      ?? [];
  const systemHealth    = snap?.systemHealth    ?? null;
  const correlations    = snap?.correlations    ?? [];

  const criticalCount   = alerts.filter(a => a.severity === "critical" && a.status === "open").length;
  const pendingApprovals = approvals.length;

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: "#080c14", color: "rgba(255,255,255,0.85)" }}>
      {/* Header */}
      <div className="px-6 py-4 border-b shrink-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4" style={{ color: "#8b7ac8" }} />
              <span className="text-sm font-bold tracking-tight text-white">Global Operations Fabric</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(139,122,200,0.1)", border: "1px solid rgba(139,122,200,0.2)", color: "#8b7ac8" }}>
              {products.length} products · {signals.length} signals · {runs.filter(r => r.status !== "completed").length} active runs
            </span>
          </div>
          <div className="flex items-center gap-3">
            {criticalCount > 0 && (
              <span className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}>
                <Dot color="#ef4444" pulse />
                {criticalCount} critical alert{criticalCount > 1 ? "s" : ""}
              </span>
            )}
            {pendingApprovals > 0 && (
              <Link href="/operations/approvals">
                <a className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b" }}>
                  <CheckSquare className="w-3 h-3" />
                  {pendingApprovals} approval{pendingApprovals > 1 ? "s" : ""} waiting
                </a>
              </Link>
            )}
            <div className="flex items-center gap-1.5 text-[10px]" style={{ color: streamStatus === "live" ? "#22c55e" : "#f59e0b" }}>
              <Dot color={streamStatus === "live" ? "#22c55e" : "#f59e0b"} pulse={streamStatus === "connecting"} />
              {streamStatus === "live" ? "Live" : streamStatus === "connecting" ? "Connecting…" : "Polling"}
            </div>
            <button
              onClick={pollSnapshot}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] hover:opacity-80 transition-opacity"
              style={{ background: "rgba(139,122,200,0.1)", border: "1px solid rgba(139,122,200,0.2)", color: "#8b7ac8" }}>
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Cross-app correlation banner */}
      {correlations.length > 0 && (
        <div className="px-6 py-3 border-b shrink-0" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
          {correlations.map((c) => (
            <CorrelationCard key={c.correlationId} corr={c} snap={snap} />
          ))}
        </div>
      )}

      {/* Main 8-panel grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gridAutoRows: "minmax(280px, auto)" }}>
          <ProductsPanel products={products} />
          <SignalsPanel signals={signals} onDrill={drillSignal} />
          <RunsPanel runs={runs} onDrill={drillRun} />
          <AlertsPanel alerts={alerts} onDrill={drillAlert} />
          <RecsPanel recs={recommendations} onDrill={drillRec} />
          <ApprovalsPanel approvals={approvals} onDrill={drillApproval} onAction={handleApprovalAction} />
          <ConnectorsPanel connectors={connectors} />
          <SystemHealthPanel health={systemHealth} />
        </div>
      </div>
      <Toaster richColors closeButton position="bottom-right" />
    </div>
  );
}

export default GlobalFabricPage;
