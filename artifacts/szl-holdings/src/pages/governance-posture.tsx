import { StatusBadge as DSStatusBadge, type StatusVariant } from '@szl-holdings/design-system';
import { useStandardQuery } from "@szl-holdings/api-client-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { apiRequest } from "@/lib/api";
import {Shield,
  Ship, Building2, Briefcase, Users, Layers, ArrowRight,
  ChevronRight, TrendingUp, TrendingDown, Activity,ArrowUpRight, ExternalLink,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { HelpTip } from "@szl-holdings/shared-ui/onboarding";

const BG = "hsl(214,16%,4%)";
const BORDER = "hsla(0,0%,100%,0.07)";
const SURFACE = "hsla(0,0%,100%,0.035)";
const TEXT = "hsl(38,8%,94%)";
const TEXT_SEC = "hsl(214,7%,60%)";
const TEXT_FAINT = "hsl(214,7%,38%)";
const KORA = "hsl(192,72%,48%)";
const MONO = "var(--font-mono)";

const GREEN = "hsl(142,60%,48%)";
const YELLOW = "hsl(48,90%,52%)";
const RED = "hsl(0,72%,54%)";
const ORANGE = "hsl(30,90%,52%)";
const _BLUE = "hsl(215,72%,58%)";
const PURPLE = "hsl(260,60%,65%)";

interface DomainHealth {
  domain: string;
  color: string;
  icon: typeof Shield;
  policyCount: number;
  activePolicies: number;
  pendingApprovals: number;
  approvalThroughputPct: number;
  overrideRate: number;
  proofCoverage: number;
  slaBreaches: number;
  maturityScore: number;
  trend: "rising" | "stable" | "declining";
  lastReviewed: string;
}

const DOMAIN_HEALTH_FALLBACK: DomainHealth[] = [
  {
    domain: "PARAGON",
    color: "hsl(222,60%,60%)",
    icon: Shield,
    policyCount: 24,
    activePolicies: 22,
    pendingApprovals: 3,
    approvalThroughputPct: 94,
    overrideRate: 4.2,
    proofCoverage: 99.1,
    slaBreaches: 1,
    maturityScore: 91,
    trend: "rising",
    lastReviewed: "2d ago",
  },
  {
    domain: "SEXTANT",
    color: "hsl(206,72%,54%)",
    icon: Ship,
    policyCount: 18,
    activePolicies: 16,
    pendingApprovals: 2,
    approvalThroughputPct: 88,
    overrideRate: 7.8,
    proofCoverage: 97.4,
    slaBreaches: 2,
    maturityScore: 82,
    trend: "stable",
    lastReviewed: "5d ago",
  },
  {
    domain: "DOMAINE",
    color: "hsl(142,52%,48%)",
    icon: Building2,
    policyCount: 14,
    activePolicies: 14,
    pendingApprovals: 4,
    approvalThroughputPct: 79,
    overrideRate: 12.3,
    proofCoverage: 95.2,
    slaBreaches: 0,
    maturityScore: 74,
    trend: "declining",
    lastReviewed: "7d ago",
  },
  {
    domain: "Counsel",
    color: "hsl(260,60%,65%)",
    icon: Briefcase,
    policyCount: 21,
    activePolicies: 21,
    pendingApprovals: 5,
    approvalThroughputPct: 97,
    overrideRate: 2.1,
    proofCoverage: 99.8,
    slaBreaches: 0,
    maturityScore: 97,
    trend: "rising",
    lastReviewed: "1d ago",
  },
  {
    domain: "Carlota Jo",
    color: "hsl(340,52%,60%)",
    icon: Users,
    policyCount: 11,
    activePolicies: 11,
    pendingApprovals: 0,
    approvalThroughputPct: 100,
    overrideRate: 0,
    proofCoverage: 98.7,
    slaBreaches: 0,
    maturityScore: 99,
    trend: "stable",
    lastReviewed: "2d ago",
  },
  {
    domain: "IMPERIUM",
    color: "hsl(25,72%,54%)",
    icon: Layers,
    policyCount: 31,
    activePolicies: 28,
    pendingApprovals: 0,
    approvalThroughputPct: 91,
    overrideRate: 5.6,
    proofCoverage: 96.8,
    slaBreaches: 1,
    maturityScore: 86,
    trend: "rising",
    lastReviewed: "1d ago",
  },
];

interface ApprovalItem { id: string; title: string; domain: string; priority: string; requestedBy: string; age: string; dueIn: string; status: string; }
const APPROVAL_QUEUE_FALLBACK: ApprovalItem[] = [
  { id: "a1", title: "KEV response — isolation approval", domain: "PARAGON", priority: "critical", requestedBy: "SOC Analyst", age: "4h", dueIn: "T-2h", status: "pending" },
  { id: "a2", title: "LP notification — NYC distressed portfolio", domain: "DOMAINE", priority: "high", requestedBy: "Investment Lead", age: "18h", dueIn: "T-6h", status: "pending" },
  { id: "a3", title: "MV Adriatic Star — OFAC filing decision", domain: "SEXTANT", priority: "high", requestedBy: "Compliance Officer", age: "11h", dueIn: "T-12h", status: "escalated" },
  { id: "a4", title: "HC-2025-0487 — filing route selection", domain: "Counsel", priority: "high", requestedBy: "Lead Attorney", age: "22h", dueIn: "T-14h", status: "pending" },
  { id: "a5", title: "Cloud configuration change — sg-0xf823b1a", domain: "IMPERIUM", priority: "medium", requestedBy: "Cloud Ops", age: "4h", dueIn: "T-20h", status: "pending" },
];

interface ViolationItem { id: string; domain: string; type: string; detail: string; severity: string; timestamp: string; status: string; }
const VIOLATION_LOG_FALLBACK: ViolationItem[] = [
  { id: "v1", domain: "FORGE", type: "SLA breach", detail: "Approval queue depth exceeded 72h threshold", severity: "high", timestamp: "2h ago", status: "open" },
  { id: "v2", domain: "DOMAINE", type: "Override without justification", detail: "Policy gate bypassed on acquisition sign-off", severity: "high", timestamp: "1d ago", status: "open" },
  { id: "v3", domain: "SEXTANT", type: "Review state gap", detail: "AI recommendation exported without review completion", severity: "medium", timestamp: "3d ago", status: "resolved" },
  { id: "v4", domain: "IMPERIUM", type: "Configuration drift", detail: "Unrestricted egress rule persisted 4h after detection", severity: "medium", timestamp: "4h ago", status: "open" },
];

interface PlatformMetrics {
  totalPolicies: number; activePolicies: number; pendingApprovals: number;
  avgApprovalThroughput: number; avgOverrideRate: number; avgProofCoverage: number;
  totalSlaBreaches: number; avgMaturity: number;
}
function computePlatformMetrics(domains: DomainHealth[]): PlatformMetrics {
  const n = Math.max(1, domains.length);
  return {
    totalPolicies: domains.reduce((a, d) => a + d.policyCount, 0),
    activePolicies: domains.reduce((a, d) => a + d.activePolicies, 0),
    pendingApprovals: domains.reduce((a, d) => a + d.pendingApprovals, 0),
    avgApprovalThroughput: domains.reduce((a, d) => a + d.approvalThroughputPct, 0) / n,
    avgOverrideRate: domains.reduce((a, d) => a + d.overrideRate, 0) / n,
    avgProofCoverage: domains.reduce((a, d) => a + d.proofCoverage, 0) / n,
    totalSlaBreaches: domains.reduce((a, d) => a + d.slaBreaches, 0),
    avgMaturity: domains.reduce((a, d) => a + d.maturityScore, 0) / n,
  };
}

const ICON_MAP: Record<string, typeof Shield> = { Shield, Ship, Building2, Briefcase, Users, Layers };

function ScoreBar({ value, color, max = 100 }: { value: number; color: string; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <div style={{ flex: 1, height: 4, borderRadius: 2, background: "hsla(0,0%,100%,0.08)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: "0.6875rem", fontFamily: MONO, fontWeight: 700, color, minWidth: "2.75rem", textAlign: "right" }}>
        {typeof value === "number" && value < 10 && value !== Math.floor(value) ? value.toFixed(1) : Math.round(value)}{max === 100 && "%"}
      </span>
    </div>
  );
}

function MaturityBadge({ score }: { score: number }) {
  const color = score >= 90 ? GREEN : score >= 75 ? YELLOW : RED;
  const label = score >= 90 ? "Advanced" : score >= 75 ? "Developing" : "Foundational";
  return (
    <span style={{ fontSize: "0.575rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: MONO, padding: "2px 6px", borderRadius: 3, background: `${color}15`, border: `1px solid ${color}25`, color }}>
      {label}
    </span>
  );
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "rising") return <TrendingUp size={12} style={{ color: GREEN }} />;
  if (trend === "declining") return <TrendingDown size={12} style={{ color: RED }} />;
  return <Activity size={12} style={{ color: YELLOW }} />;
}

const PRIORITY_VARIANT: Record<string, StatusVariant> = {
  critical: 'error', high: 'warning', medium: 'warning',
};
function PriorityBadge({ priority }: { priority: string }) {
  return <DSStatusBadge variant={PRIORITY_VARIANT[priority] ?? 'neutral'} label={priority} />;
}

const APPROVAL_STATUS_VARIANT: Record<string, StatusVariant> = {
  pending: 'pending', escalated: 'escalated', resolved: 'approved', open: 'active',
};
function StatusBadge({ status }: { status: string }) {
  return <DSStatusBadge variant={APPROVAL_STATUS_VARIANT[status] ?? 'neutral'} label={status} />;
}

interface LedgerRow {
  id: number | null;
  requestId: string;
  agentId: string | null;
  sessionId: string | null;
  workflowId: string | null;
  tier: string;
  action: string;
  toolId: string | null;
  model: string | null;
  decision: "allow" | "require-approval" | "require-dual-approval" | "block";
  matchedRuleId: string | null;
  reason: string;
  rollbackRequired: boolean;
  controlViolations: unknown[];
  domain: string | null;
  latencyMs: number | null;
  traceId: string | null;
  traceStatus: string | null;
  decidedAt: string;
}

interface LedgerResponse {
  items: LedgerRow[];
  domains: string[];
  decisions: readonly string[];
  count: number;
  limit: number;
}

const WINDOW_TO_MS: Record<"15m" | "1h" | "24h" | "7d", number> = {
  "15m": 15 * 60_000,
  "1h": 60 * 60_000,
  "24h": 24 * 60 * 60_000,
  "7d": 7 * 24 * 60 * 60_000,
};

const DECISION_COLORS: Record<string, string> = {
  allow: GREEN,
  "require-approval": YELLOW,
  "require-dual-approval": ORANGE,
  block: RED,
};

function DecisionBadge({ decision }: { decision: string }) {
  const c = DECISION_COLORS[decision] ?? TEXT_FAINT;
  return (
    <span style={{ fontSize: "0.575rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: MONO, padding: "2px 6px", borderRadius: 3, background: `${c}15`, border: `1px solid ${c}30`, color: c, whiteSpace: "nowrap" }}>
      {decision}
    </span>
  );
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "just now";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatLatency(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms)) return "—";
  if (ms < 1) return "<1ms";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function LiveActivityTab(props: {
  ledgerDecision: string;
  setLedgerDecision: (v: string) => void;
  ledgerDomain: string;
  setLedgerDomain: (v: string) => void;
  ledgerWindow: "15m" | "1h" | "24h" | "7d";
  setLedgerWindow: (v: "15m" | "1h" | "24h" | "7d") => void;
}) {
  const { ledgerDecision, setLedgerDecision, ledgerDomain, setLedgerDomain, ledgerWindow, setLedgerWindow } = props;

  // Slide the rendered window with wall-clock time so old rows drop off as
  // they age past the selected duration. This used to drive a periodic
  // re-fetch — now it only triggers a re-render of the memoized merge below.
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  // Initial snapshot — fetched once per filter combination. The live stream
  // (below) keeps it fresh; we no longer poll on an interval.
  const ledgerQuery = useStandardQuery<LedgerResponse>({
    queryKey: ["guardian", "ledger", ledgerDecision, ledgerDomain, ledgerWindow],
    queryFn: async () => {
      const sinceIso = new Date(Date.now() - WINDOW_TO_MS[ledgerWindow]).toISOString();
      const params = new URLSearchParams();
      if (ledgerDecision) params.set("decision", ledgerDecision);
      if (ledgerDomain) params.set("domain", ledgerDomain);
      params.set("since", sinceIso);
      params.set("limit", "100");
      return apiRequest<LedgerResponse>("GET", `/api/ledger?${params.toString()}`);
    },
    staleTime: 60_000,
  });

  // Streamed decisions arriving over SSE since the snapshot loaded. We keep
  // them in a separate buffer so a re-fetch can replace the snapshot without
  // discarding live arrivals.
  const [streamed, setStreamed] = useState<LedgerRow[]>([]);
  const [streamConnected, setStreamConnected] = useState(false);
  const reconnectAttemptRef = useRef(0);

  // Reset the live buffer whenever the filters change — the snapshot will
  // re-fetch with the new filter window and live arrivals start from there.
  useEffect(() => { setStreamed([]); }, [ledgerDecision, ledgerDomain, ledgerWindow]);

  // Open one EventSource for the lifetime of the tab. EventSource handles
  // reconnect on transient failures automatically; we only manually retry
  // after explicit error events.
  useEffect(() => {
    let es: EventSource | null = null;
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      try {
        es = new EventSource("/api/ledger/stream", { withCredentials: true });
      } catch {
        return;
      }
      es.addEventListener("connected", () => {
        reconnectAttemptRef.current = 0;
        setStreamConnected(true);
      });
      es.addEventListener("decision", (ev: MessageEvent) => {
        try {
          const envelope = JSON.parse(ev.data) as { data?: LedgerRow } & LedgerRow;
          // sse-server wraps payloads as { channel, event, data, timestamp }
          const row = (envelope.data ?? envelope) as LedgerRow;
          if (!row || typeof row !== "object" || !row.requestId) return;
          setStreamed((prev) => {
            // Dedupe by requestId — id is null for engine-recorded events.
            if (prev.some((r) => r.requestId === row.requestId)) return prev;
            return [row, ...prev].slice(0, 200);
          });
        } catch {
          /* ignore malformed frame */
        }
      });
      es.onerror = () => {
        setStreamConnected(false);
        // EventSource will retry on its own; if it fully closed, reopen with
        // exponential backoff so a server restart doesn't leave us silent.
        if (es && es.readyState === EventSource.CLOSED) {
          es.close();
          es = null;
          const attempt = ++reconnectAttemptRef.current;
          const delay = Math.min(30_000, 1000 * 2 ** Math.min(attempt, 5));
          window.setTimeout(connect, delay);
        }
      };
    };

    connect();
    return () => {
      cancelled = true;
      if (es) es.close();
    };
  }, []);

  // Merge snapshot + live arrivals, then apply the active filters and the
  // sliding window cutoff. Filters are enforced client-side because the
  // stream emits the full firehose the caller is permitted to see.
  const items = useMemo<LedgerRow[]>(() => {
    const cutoff = nowMs - WINDOW_TO_MS[ledgerWindow];
    const base = ledgerQuery.data?.items ?? [];
    const seen = new Set<string>();
    const out: LedgerRow[] = [];
    for (const r of [...streamed, ...base]) {
      if (seen.has(r.requestId)) continue;
      seen.add(r.requestId);
      if (ledgerDecision && r.decision !== ledgerDecision) continue;
      if (ledgerDomain && r.domain !== ledgerDomain) continue;
      const t = new Date(r.decidedAt).getTime();
      if (Number.isFinite(t) && t < cutoff) continue;
      out.push(r);
    }
    out.sort((a, b) => new Date(b.decidedAt).getTime() - new Date(a.decidedAt).getTime());
    return out.slice(0, 100);
  }, [ledgerQuery.data, streamed, ledgerDecision, ledgerDomain, ledgerWindow, nowMs]);

  const domains = ledgerQuery.data?.domains ?? [];
  const decisions = ledgerQuery.data?.decisions ?? ["allow", "require-approval", "require-dual-approval", "block"];
  const counts = useMemo(() => {
    const c: Record<string, number> = { allow: 0, "require-approval": 0, "require-dual-approval": 0, block: 0 };
    for (const r of items) c[r.decision] = (c[r.decision] ?? 0) + 1;
    return c;
  }, [items]);

  const inputStyle: React.CSSProperties = {
    background: BG,
    color: TEXT,
    border: `1px solid ${BORDER}`,
    borderRadius: 6,
    padding: "0.4rem 0.625rem",
    fontSize: "0.75rem",
    fontFamily: MONO,
    cursor: "pointer",
  };

  return (
    <m.div key="live-activity" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      {/* Header + filters */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: GREEN, boxShadow: `0 0 8px ${GREEN}` }} />
          <p style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: TEXT_FAINT, margin: 0 }}>
            Live agent activity — {items.length} decision{items.length === 1 ? "" : "s"} in last {ledgerWindow}
          </p>
          {streamConnected ? (
            <span style={{ fontSize: "0.6rem", fontFamily: MONO, color: GREEN }}>● streaming</span>
          ) : ledgerQuery.isFetching ? (
            <span style={{ fontSize: "0.6rem", fontFamily: MONO, color: TEXT_FAINT }}>loading…</span>
          ) : (
            <span style={{ fontSize: "0.6rem", fontFamily: MONO, color: YELLOW }}>● reconnecting…</span>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <select aria-label="Decision filter" value={ledgerDecision} onChange={(e) => setLedgerDecision(e.target.value)} style={inputStyle}>
            <option value="">All decisions</option>
            {decisions.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select aria-label="Domain filter" value={ledgerDomain} onChange={(e) => setLedgerDomain(e.target.value)} style={inputStyle}>
            <option value="">All domains</option>
            {domains.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <div style={{ display: "flex", gap: "1px", background: BORDER, borderRadius: 6, overflow: "hidden", border: `1px solid ${BORDER}` }}>
            {(["15m", "1h", "24h", "7d"] as const).map((w) => (
              <button
                key={w}
                onClick={() => setLedgerWindow(w)}
                style={{
                  padding: "0.4rem 0.625rem",
                  border: "none",
                  background: ledgerWindow === w ? `${KORA}25` : BG,
                  color: ledgerWindow === w ? KORA : TEXT_SEC,
                  fontSize: "0.6875rem",
                  fontFamily: MONO,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Decision counts strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", background: BORDER, borderRadius: 8, overflow: "hidden", border: `1px solid ${BORDER}`, marginBottom: "1.25rem" }}>
        {(["allow", "require-approval", "require-dual-approval", "block"] as const).map((d) => (
          <div key={d} style={{ background: BG, padding: "0.75rem 1rem" }}>
            <p style={{ fontSize: "1.125rem", fontWeight: 700, fontFamily: MONO, color: DECISION_COLORS[d], margin: 0 }}>{counts[d] ?? 0}</p>
            <p style={{ fontSize: "0.575rem", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.1em", color: TEXT_FAINT, margin: 0 }}>{d}</p>
          </div>
        ))}
      </div>

      {ledgerQuery.isError && (
        <div style={{ padding: "1rem", borderRadius: 8, background: `${RED}10`, border: `1px solid ${RED}25`, color: RED, fontSize: "0.8125rem", marginBottom: "1rem" }}>
          Could not load the live activity feed. {ledgerQuery.error instanceof Error ? ledgerQuery.error.message : ""}
        </div>
      )}

      {!ledgerQuery.isError && items.length === 0 && !ledgerQuery.isLoading && (
        <div style={{ padding: "2.5rem", borderRadius: 8, background: SURFACE, border: `1px solid ${BORDER}`, textAlign: "center", color: TEXT_FAINT, fontSize: "0.8125rem" }}>
          No agent decisions recorded in the last {ledgerWindow}{ledgerDecision ? ` for "${ledgerDecision}"` : ""}{ledgerDomain ? ` in domain "${ledgerDomain}"` : ""}.
        </div>
      )}

      {/* Timeline */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {items.map((row, i) => {
          const decisionColor = DECISION_COLORS[row.decision] ?? TEXT_FAINT;
          return (
            <m.div
              key={row.requestId}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: Math.min(i * 0.015, 0.3) }}
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto auto auto",
                gap: "1rem",
                alignItems: "center",
                padding: "0.875rem 1rem",
                borderRadius: 8,
                background: SURFACE,
                border: `1px solid ${decisionColor}20`,
                borderLeft: `3px solid ${decisionColor}`,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", minWidth: 96 }}>
                <DecisionBadge decision={row.decision} />
                <span style={{ fontSize: "0.6rem", fontFamily: MONO, color: TEXT_FAINT }}>{formatRelative(row.decidedAt)}</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: TEXT, fontFamily: MONO, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {row.action}
                  </span>
                  {row.domain && (
                    <span style={{ fontSize: "0.6rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: TEXT_FAINT, background: "hsla(0,0%,100%,0.05)", border: `1px solid ${BORDER}`, padding: "1px 5px", borderRadius: 3 }}>
                      {row.domain}
                    </span>
                  )}
                  <span style={{ fontSize: "0.6rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: PURPLE, background: `${PURPLE}10`, border: `1px solid ${PURPLE}25`, padding: "1px 5px", borderRadius: 3 }}>
                    tier:{row.tier}
                  </span>
                </div>
                <div style={{ fontSize: "0.6875rem", color: TEXT_SEC, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row.reason}>
                  {row.reason}
                </div>
                <div style={{ display: "flex", gap: "0.875rem", flexWrap: "wrap", fontSize: "0.6rem", fontFamily: MONO, color: TEXT_FAINT }}>
                  <span>agent: <span style={{ color: TEXT_SEC }}>{row.agentId ?? "—"}</span></span>
                  {row.toolId && <span>tool: <span style={{ color: TEXT_SEC }}>{row.toolId}</span></span>}
                  {row.matchedRuleId && <span>rule: <span style={{ color: TEXT_SEC }}>{row.matchedRuleId}</span></span>}
                  {Array.isArray(row.controlViolations) && row.controlViolations.length > 0 && (
                    <span style={{ color: RED }}>{row.controlViolations.length} violation{row.controlViolations.length === 1 ? "" : "s"}</span>
                  )}
                </div>
              </div>

              <div style={{ textAlign: "right", minWidth: 70 }}>
                <p style={{ fontSize: "0.8125rem", fontWeight: 700, fontFamily: MONO, color: TEXT, margin: 0 }}>{formatLatency(row.latencyMs)}</p>
                <p style={{ fontSize: "0.575rem", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT_FAINT, margin: 0 }}>latency</p>
              </div>

              <div style={{ minWidth: 110, fontFamily: MONO, fontSize: "0.625rem", color: TEXT_FAINT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row.requestId}>
                {row.requestId.length > 14 ? `${row.requestId.slice(0, 14)}…` : row.requestId}
              </div>

              <div>
                {row.traceId ? (
                  <Link
                    href={`/intelligence/fabric?trace=${encodeURIComponent(row.traceId)}`}
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.375rem 0.625rem", borderRadius: 5, background: `${KORA}15`, border: `1px solid ${KORA}25`, fontSize: "0.6875rem", fontWeight: 600, color: KORA, textDecoration: "none" }}
                  >
                    Trace <ExternalLink size={11} />
                  </Link>
                ) : (
                  <span style={{ fontSize: "0.625rem", fontFamily: MONO, color: TEXT_FAINT, padding: "0.375rem 0.625rem" }}>no trace</span>
                )}
              </div>
            </m.div>
          );
        })}
      </div>
    </m.div>
  );
}

export default function GovernancePosturePage() {
  const __pageMeta = usePageMeta({
    title: "Governance Posture Dashboard — KORA | SZL Holdings",
    description: "CISO-grade governance dashboard: policy coverage, approval throughput, override rates, trust health by domain, and governance maturity scores. Inspired by BSI IT-Grundschutz and Romania CYBERINT.",
    canonical: "https://szlholdings.com/lyte/governance-posture",
  });

  const [activeTab, setActiveTab] = useState<"overview" | "approvals" | "violations" | "domains" | "live-activity">("overview");
  const [ledgerDecision, setLedgerDecision] = useState<string>("");
  const [ledgerDomain, setLedgerDomain] = useState<string>("");
  const [ledgerWindow, setLedgerWindow] = useState<"15m" | "1h" | "24h" | "7d">("1h");
  const [activeDomain, setActiveDomain] = useState<string>("PARAGON");

  interface GovApiResponse {
    domains: Array<Omit<DomainHealth, "icon"> & { iconKey: string }>;
    approvalQueue: ApprovalItem[];
    violations: ViolationItem[];
    platformMetrics: PlatformMetrics;
    dataAvailable: boolean;
  }
  const govQuery = useStandardQuery<GovApiResponse>({
    queryKey: ["lyte", "governance-domains"],
    queryFn: async () => {
      const res = await apiRequest<GovApiResponse>("GET", "/api/lyte/governance-domains");
      return res;
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const DOMAIN_HEALTH: DomainHealth[] = useMemo(() => {
    if (govQuery.data?.domains) {
      return govQuery.data.domains.map(d => ({ ...d, icon: ICON_MAP[d.iconKey] ?? Shield }));
    }
    return DOMAIN_HEALTH_FALLBACK;
  }, [govQuery.data]);
  const APPROVAL_QUEUE = govQuery.data?.approvalQueue ?? APPROVAL_QUEUE_FALLBACK;
  const VIOLATION_LOG = govQuery.data?.violations ?? VIOLATION_LOG_FALLBACK;
  const PLATFORM_METRICS = govQuery.data?.platformMetrics ?? computePlatformMetrics(DOMAIN_HEALTH);

  const domain = DOMAIN_HEALTH.find(d => d.domain === activeDomain) ?? DOMAIN_HEALTH[0]!;
  const DIcon = domain.icon;

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: BG, color: TEXT }}>
        <SiteNav />
        <main id="main-content">
  
          {/* Header */}
          <section style={{ borderBottom: `1px solid ${BORDER}`, padding: "clamp(5.5rem,10vw,7rem) 0 2rem" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
                  <Link href="/lyte" style={{ fontSize: "0.6rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: TEXT_FAINT, textDecoration: "none" }}>KORA</Link>
                  <ChevronRight size={10} style={{ color: TEXT_FAINT }} />
                  <span style={{ fontSize: "0.6rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: KORA }}>Governance Posture</span>
                  <HelpTip
                    tipId="szl.governance-posture.overview"
                    platform="szl"
                    title="Governance Posture Score"
                    content="A continuous, weighted score across policy coverage, approval throughput, override rate, and trust health for every domain pack. Updated as decisions and overrides flow through the platform — not assembled on demand."
                  />
                </div>
                <h1 style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)", fontWeight: 700, letterSpacing: "-0.028em", lineHeight: 1.08, maxWidth: "26ch", marginBottom: "1rem", color: TEXT }}>
                  Governance posture across every domain pack. Continuously.
                </h1>
                <p style={{ fontSize: "clamp(0.9375rem,1.6vw,1.0625rem)", lineHeight: 1.72, color: TEXT_SEC, maxWidth: "54ch", marginBottom: "2rem" }}>
                  Policy coverage, approval throughput, override rates, trust health per domain pack, and governance maturity scores — visible as a continuous operational feed, not assembled on demand. Inspired by BSI IT-Grundschutz and Romania CYBERINT's operational posture model.
                </p>
              </m.div>
  
              {/* Platform-wide stat bar */}
              <m.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                style={{ display: "flex", gap: "1px", background: BORDER, borderRadius: "8px", overflow: "hidden", border: `1px solid ${BORDER}` }}
              >
                {[
                  { label: "Active policies", value: `${PLATFORM_METRICS.activePolicies}/${PLATFORM_METRICS.totalPolicies}`, color: GREEN },
                  { label: "Pending approvals", value: PLATFORM_METRICS.pendingApprovals.toString(), color: PLATFORM_METRICS.pendingApprovals > 10 ? RED : YELLOW },
                  { label: "Approval throughput", value: `${PLATFORM_METRICS.avgApprovalThroughput.toFixed(0)}%`, color: GREEN },
                  { label: "Override rate (7d)", value: `${PLATFORM_METRICS.avgOverrideRate.toFixed(1)}%`, color: PLATFORM_METRICS.avgOverrideRate > 10 ? RED : YELLOW },
                  { label: "Proof coverage", value: `${PLATFORM_METRICS.avgProofCoverage.toFixed(1)}%`, color: GREEN },
                  { label: "SLA breaches (24h)", value: PLATFORM_METRICS.totalSlaBreaches.toString(), color: PLATFORM_METRICS.totalSlaBreaches > 0 ? RED : GREEN },
                  { label: "Avg maturity", value: `${PLATFORM_METRICS.avgMaturity.toFixed(0)}/100`, color: PLATFORM_METRICS.avgMaturity >= 80 ? GREEN : YELLOW },
                ].map((stat, i) => (
                  <div key={i} style={{ flex: 1, background: BG, padding: "0.875rem 1rem", textAlign: "center" }}>
                    <p style={{ fontSize: "1.0625rem", fontWeight: 700, fontFamily: MONO, color: stat.color, margin: 0 }}>{stat.value}</p>
                    <p style={{ fontSize: "0.575rem", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.1em", color: TEXT_FAINT, margin: 0 }}>{stat.label}</p>
                  </div>
                ))}
              </m.div>
            </div>
          </section>
  
          {/* Tabs */}
          <div style={{ borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)", display: "flex", gap: 0 }}>
              {(["overview", "domains", "approvals", "violations", "live-activity"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "0.875rem 1.25rem",
                    border: "none",
                    borderBottom: `2px solid ${activeTab === tab ? KORA : "transparent"}`,
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: "0.8125rem",
                    fontWeight: activeTab === tab ? 700 : 500,
                    color: activeTab === tab ? KORA : TEXT_FAINT,
                    textTransform: "capitalize",
                    transition: "all 0.15s ease",
                  }}
                >
                  {tab === "live-activity" ? "Live activity" : tab}
                </button>
              ))}
            </div>
          </div>
  
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem var(--space-content-x)" }}>
            <AnimatePresence mode="wait">
  
              {activeTab === "overview" && (
                <m.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  {/* Heat map */}
                  <div style={{ marginBottom: "2rem" }}>
                    <p style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: TEXT_FAINT, marginBottom: "1rem" }}>
                      Policy Coverage Heat Map — All Domains
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
                      {DOMAIN_HEALTH.map((d, i) => {
                        const Icon = d.icon;
                        return (
                          <m.button
                            key={d.domain}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.05 }}
                            onClick={() => { setActiveDomain(d.domain); setActiveTab("domains"); }}
                            style={{
                              padding: "1.25rem",
                              borderRadius: "9px",
                              background: SURFACE,
                              border: `1px solid ${d.maturityScore >= 90 ? `${d.color}25` : d.maturityScore >= 75 ? "hsla(48,90%,52%,0.15)" : "hsla(0,72%,54%,0.15)"}`,
                              cursor: "pointer",
                              textAlign: "left",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
                              <div style={{ width: 26, height: 26, borderRadius: 5, background: `${d.color}18`, border: `1px solid ${d.color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Icon size={12} style={{ color: d.color }} />
                              </div>
                              <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: TEXT }}>{d.domain}</span>
                              <div style={{ marginLeft: "auto", display: "flex", gap: "0.375rem", alignItems: "center" }}>
                                <TrendIcon trend={d.trend} />
                                <MaturityBadge score={d.maturityScore} />
                              </div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                              <div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                                  <span style={{ fontSize: "0.625rem", fontFamily: MONO, color: TEXT_FAINT }}>Maturity</span>
                                </div>
                                <ScoreBar value={d.maturityScore} color={d.maturityScore >= 90 ? GREEN : d.maturityScore >= 75 ? YELLOW : RED} />
                              </div>
                              <div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                                  <span style={{ fontSize: "0.625rem", fontFamily: MONO, color: TEXT_FAINT }}>Proof coverage</span>
                                </div>
                                <ScoreBar value={d.proofCoverage} color={d.proofCoverage >= 98 ? GREEN : YELLOW} />
                              </div>
                              <div style={{ display: "flex", gap: "1rem", marginTop: "0.25rem" }}>
                                <div>
                                  <p style={{ fontSize: "0.875rem", fontWeight: 700, fontFamily: MONO, color: d.pendingApprovals > 3 ? ORANGE : TEXT_SEC, margin: 0 }}>{d.pendingApprovals}</p>
                                  <p style={{ fontSize: "0.575rem", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT_FAINT, margin: 0 }}>Pending</p>
                                </div>
                                <div>
                                  <p style={{ fontSize: "0.875rem", fontWeight: 700, fontFamily: MONO, color: d.overrideRate > 10 ? RED : d.overrideRate > 5 ? YELLOW : GREEN, margin: 0 }}>{d.overrideRate}%</p>
                                  <p style={{ fontSize: "0.575rem", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT_FAINT, margin: 0 }}>Override</p>
                                </div>
                                <div>
                                  <p style={{ fontSize: "0.875rem", fontWeight: 700, fontFamily: MONO, color: d.slaBreaches > 0 ? RED : GREEN, margin: 0 }}>{d.slaBreaches}</p>
                                  <p style={{ fontSize: "0.575rem", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT_FAINT, margin: 0 }}>SLA breach</p>
                                </div>
                                <div>
                                  <p style={{ fontSize: "0.875rem", fontWeight: 700, fontFamily: MONO, color: TEXT_SEC, margin: 0 }}>{d.approvalThroughputPct}%</p>
                                  <p style={{ fontSize: "0.575rem", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT_FAINT, margin: 0 }}>Throughput</p>
                                </div>
                              </div>
                            </div>
                          </m.button>
                        );
                      })}
                    </div>
                  </div>
  
                  {/* Summary stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                    <div style={{ padding: "1.5rem", borderRadius: "9px", background: SURFACE, border: `1px solid ${BORDER}` }}>
                      <p style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: TEXT_FAINT, marginBottom: "1.25rem" }}>
                        Approval Throughput by Domain
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {DOMAIN_HEALTH.sort((a, b) => b.approvalThroughputPct - a.approvalThroughputPct).map(d => (
                          <div key={d.domain} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "0.75rem", alignItems: "center" }}>
                            <span style={{ fontSize: "0.75rem", color: TEXT_SEC }}>{d.domain}</span>
                            <ScoreBar value={d.approvalThroughputPct} color={d.approvalThroughputPct >= 90 ? GREEN : d.approvalThroughputPct >= 80 ? YELLOW : RED} />
                          </div>
                        ))}
                      </div>
                    </div>
  
                    <div style={{ padding: "1.5rem", borderRadius: "9px", background: SURFACE, border: `1px solid ${BORDER}` }}>
                      <p style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: TEXT_FAINT, marginBottom: "1.25rem" }}>
                        Override Rate by Domain (7d) — lower is better
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {DOMAIN_HEALTH.sort((a, b) => b.overrideRate - a.overrideRate).map(d => (
                          <div key={d.domain} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "0.75rem", alignItems: "center" }}>
                            <span style={{ fontSize: "0.75rem", color: TEXT_SEC }}>{d.domain}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <div style={{ flex: 1, height: 4, borderRadius: 2, background: "hsla(0,0%,100%,0.08)", overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${Math.min(100, d.overrideRate * 5)}%`, background: d.overrideRate > 10 ? RED : d.overrideRate > 5 ? YELLOW : GREEN, borderRadius: 2 }} />
                              </div>
                              <span style={{ fontSize: "0.6875rem", fontFamily: MONO, fontWeight: 700, color: d.overrideRate > 10 ? RED : d.overrideRate > 5 ? YELLOW : GREEN, minWidth: "2.5rem", textAlign: "right" }}>
                                {d.overrideRate}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </m.div>
              )}
  
              {activeTab === "domains" && (
                <m.div key="domains" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "1.25rem" }}>
                    {/* Domain nav */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                      {DOMAIN_HEALTH.map(d => {
                        const Icon = d.icon;
                        return (
                          <button key={d.domain} onClick={() => setActiveDomain(d.domain)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 0.875rem", borderRadius: 6, background: activeDomain === d.domain ? `${d.color}10` : "transparent", border: `1px solid ${activeDomain === d.domain ? `${d.color}28` : "transparent"}`, cursor: "pointer", textAlign: "left" }}>
                            <div style={{ width: 20, height: 20, borderRadius: 4, background: `${d.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Icon size={10} style={{ color: d.color }} />
                            </div>
                            <span style={{ fontSize: "0.8125rem", fontWeight: activeDomain === d.domain ? 700 : 500, color: activeDomain === d.domain ? TEXT : TEXT_SEC }}>{d.domain}</span>
                            <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: d.maturityScore >= 90 ? GREEN : d.maturityScore >= 75 ? YELLOW : RED }} />
                          </button>
                        );
                      })}
                    </div>
  
                    {/* Domain detail */}
                    <AnimatePresence mode="wait">
                      <m.div
                        key={domain.domain}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -4 }}
                        transition={{ duration: 0.2 }}
                        style={{ display: "flex", flexDirection: "column", gap: "1px", background: BORDER, borderRadius: "10px", overflow: "hidden", border: `1px solid ${BORDER}` }}
                      >
                        <div style={{ background: BG, padding: "1.5rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "1.25rem" }}>
                            <div style={{ width: 36, height: 36, borderRadius: 8, background: `${domain.color}18`, border: `1px solid ${domain.color}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <DIcon size={16} style={{ color: domain.color }} />
                            </div>
                            <div>
                              <p style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: domain.color, margin: 0 }}>{domain.domain}</p>
                              <p style={{ fontSize: "1rem", fontWeight: 700, color: TEXT, margin: 0, letterSpacing: "-0.014em" }}>Governance Health</p>
                            </div>
                            <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                              <TrendIcon trend={domain.trend} />
                              <MaturityBadge score={domain.maturityScore} />
                            </div>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
                            {[
                              { label: "Policy coverage", value: `${domain.activePolicies}/${domain.policyCount}`, color: domain.activePolicies === domain.policyCount ? GREEN : YELLOW },
                              { label: "Approval throughput", value: `${domain.approvalThroughputPct}%`, color: domain.approvalThroughputPct >= 90 ? GREEN : YELLOW },
                              { label: "Override rate (7d)", value: `${domain.overrideRate}%`, color: domain.overrideRate > 10 ? RED : domain.overrideRate > 5 ? YELLOW : GREEN },
                              { label: "Proof coverage", value: `${domain.proofCoverage}%`, color: GREEN },
                            ].map((m, i) => (
                              <div key={i} style={{ padding: "0.875rem", borderRadius: 6, background: SURFACE, border: `1px solid ${BORDER}` }}>
                                <p style={{ fontSize: "1.125rem", fontWeight: 700, fontFamily: MONO, color: m.color, margin: 0 }}>{m.value}</p>
                                <p style={{ fontSize: "0.625rem", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT_FAINT, margin: 0 }}>{m.label}</p>
                              </div>
                            ))}
                          </div>
                        </div>
  
                        <div style={{ background: BG, padding: "1.25rem 1.5rem" }}>
                          <p style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEXT_FAINT, marginBottom: "1rem" }}>
                            Maturity Score Breakdown
                          </p>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {[
                              { label: "Policy completeness", value: domain.activePolicies / domain.policyCount * 100, weight: "25%" },
                              { label: "Approval throughput", value: domain.approvalThroughputPct, weight: "25%" },
                              { label: "Proof coverage", value: domain.proofCoverage, weight: "20%" },
                              { label: "Override compliance", value: Math.max(0, 100 - domain.overrideRate * 5), weight: "15%" },
                              { label: "SLA adherence", value: Math.max(0, 100 - domain.slaBreaches * 15), weight: "15%" },
                            ].map((row, i) => (
                              <div key={i} style={{ display: "grid", gridTemplateColumns: "180px 1fr 50px", gap: "0.75rem", alignItems: "center" }}>
                                <div>
                                  <span style={{ fontSize: "0.75rem", color: TEXT_SEC }}>{row.label}</span>
                                  <span style={{ fontSize: "0.575rem", fontFamily: MONO, color: TEXT_FAINT, marginLeft: "0.375rem" }}>wt: {row.weight}</span>
                                </div>
                                <ScoreBar value={row.value} color={row.value >= 90 ? GREEN : row.value >= 70 ? YELLOW : RED} />
                              </div>
                            ))}
                          </div>
                          <div style={{ marginTop: "1.25rem", padding: "0.875rem", borderRadius: 6, background: `${domain.maturityScore >= 90 ? GREEN : domain.maturityScore >= 75 ? YELLOW : RED}10`, border: `1px solid ${domain.maturityScore >= 90 ? GREEN : domain.maturityScore >= 75 ? YELLOW : RED}25` }}>
                            <p style={{ fontSize: "0.875rem", fontWeight: 700, color: domain.maturityScore >= 90 ? GREEN : domain.maturityScore >= 75 ? YELLOW : RED, margin: "0 0 0.25rem" }}>
                              Governance Maturity Score: {domain.maturityScore}/100
                            </p>
                            <p style={{ fontSize: "0.8125rem", color: TEXT_SEC, margin: 0, lineHeight: 1.5 }}>
                              {domain.maturityScore >= 90 ? "Advanced maturity. Policy coverage complete, approval throughput high, minimal overrides. Audit-ready posture." : domain.maturityScore >= 75 ? "Developing maturity. Core policies active, approval throughput adequate. Override rate warrants review." : "Foundational maturity. Policy gaps or throughput issues require immediate attention."}
                            </p>
                          </div>
                        </div>
  
                        <div style={{ background: BG, padding: "1rem 1.5rem", display: "flex", gap: "0.5rem" }}>
                          <button style={{ padding: "0.5rem 1rem", borderRadius: 5, background: `${KORA}15`, border: `1px solid ${KORA}30`, cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, color: KORA }}>
                            Export compliance report
                          </button>
                          <button style={{ padding: "0.5rem 1rem", borderRadius: 5, background: "transparent", border: `1px solid ${BORDER}`, cursor: "pointer", fontSize: "0.75rem", color: TEXT_SEC }}>
                            Review policies
                          </button>
                          <button style={{ padding: "0.5rem 1rem", borderRadius: 5, background: "transparent", border: `1px solid ${BORDER}`, cursor: "pointer", fontSize: "0.75rem", color: TEXT_SEC }}>
                            View audit trail
                          </button>
                        </div>
                      </m.div>
                    </AnimatePresence>
                  </div>
                </m.div>
              )}
  
              {activeTab === "approvals" && (
                <m.div key="approvals" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <p style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: TEXT_FAINT, marginBottom: "1rem" }}>
                    Approval Queue — {APPROVAL_QUEUE.length} pending · Sorted by urgency
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                    {APPROVAL_QUEUE.map((a, i) => (
                      <m.div
                        key={a.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: "1rem", alignItems: "center", padding: "1rem 1.25rem", borderRadius: "8px", background: SURFACE, border: `1px solid ${a.status === "escalated" ? `${RED}25` : BORDER}` }}
                      >
                        <div>
                          <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: TEXT, margin: "0 0 0.25rem", lineHeight: 1.3 }}>{a.title}</p>
                          <p style={{ fontSize: "0.625rem", fontFamily: MONO, color: TEXT_FAINT, margin: 0 }}>Requested by: {a.requestedBy}</p>
                        </div>
                        <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.6rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: DOMAIN_HEALTH.find(d => d.domain === a.domain)?.color ?? KORA }}>
                            {a.domain}
                          </span>
                          <PriorityBadge priority={a.priority} />
                          <StatusBadge status={a.status} />
                        </div>
                        <div>
                          <p style={{ fontSize: "0.6rem", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT_FAINT, margin: "0 0 0.2rem" }}>Age</p>
                          <p style={{ fontSize: "0.8125rem", fontWeight: 600, fontFamily: MONO, color: TEXT_SEC, margin: 0 }}>{a.age}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: "0.6rem", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT_FAINT, margin: "0 0 0.2rem" }}>Due</p>
                          <p style={{ fontSize: "0.8125rem", fontWeight: 700, fontFamily: MONO, color: a.dueIn.startsWith("T-2") ? RED : ORANGE, margin: 0 }}>{a.dueIn}</p>
                        </div>
                        <div style={{ display: "flex", gap: "0.375rem" }}>
                          <button style={{ padding: "0.375rem 0.75rem", borderRadius: 5, background: `${GREEN}15`, border: `1px solid ${GREEN}25`, cursor: "pointer", fontSize: "0.6875rem", fontWeight: 600, color: GREEN }}>
                            Approve
                          </button>
                          <button style={{ padding: "0.375rem 0.75rem", borderRadius: 5, background: "transparent", border: `1px solid ${BORDER}`, cursor: "pointer", fontSize: "0.6875rem", color: TEXT_FAINT }}>
                            Review
                          </button>
                        </div>
                      </m.div>
                    ))}
                  </div>
                </m.div>
              )}
  
              {activeTab === "violations" && (
                <m.div key="violations" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <p style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: TEXT_FAINT, marginBottom: "1rem" }}>
                    Active Policy Violations — {VIOLATION_LOG.filter(v => v.status === "open").length} open
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                    {VIOLATION_LOG.map((v, i) => (
                      <m.div
                        key={v.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                        style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "1rem", alignItems: "center", padding: "1rem 1.25rem", borderRadius: "8px", background: SURFACE, border: `1px solid ${v.status === "open" ? (v.severity === "high" ? `${RED}20` : `${YELLOW}15`) : `${GREEN}12`}` }}
                      >
                        <div>
                          <div style={{ display: "flex", gap: "0.375rem", marginBottom: "0.375rem", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "0.6rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: DOMAIN_HEALTH.find(d => d.domain === v.domain)?.color ?? KORA }}>
                              {v.domain}
                            </span>
                            <span style={{ fontSize: "0.6rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.06em", color: TEXT_FAINT, background: "hsla(0,0%,100%,0.05)", border: `1px solid ${BORDER}`, padding: "1px 5px", borderRadius: 3 }}>
                              {v.type}
                            </span>
                            <StatusBadge status={v.status} />
                          </div>
                          <p style={{ fontSize: "0.8125rem", color: TEXT_SEC, margin: 0, lineHeight: 1.4 }}>{v.detail}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: "0.625rem", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT_FAINT, margin: "0 0 0.2rem" }}>Detected</p>
                          <p style={{ fontSize: "0.8125rem", color: TEXT_SEC, margin: 0 }}>{v.timestamp}</p>
                        </div>
                        <div style={{ display: "flex", gap: "0.375rem" }}>
                          {v.status === "open" && (
                            <button style={{ padding: "0.375rem 0.75rem", borderRadius: 5, background: `${KORA}15`, border: `1px solid ${KORA}25`, cursor: "pointer", fontSize: "0.6875rem", fontWeight: 600, color: KORA }}>
                              Remediate
                            </button>
                          )}
                          <button style={{ padding: "0.375rem 0.75rem", borderRadius: 5, background: "transparent", border: `1px solid ${BORDER}`, cursor: "pointer", fontSize: "0.6875rem", color: TEXT_FAINT }}>
                            Details
                          </button>
                        </div>
                      </m.div>
                    ))}
                  </div>
                </m.div>
              )}
  
              {activeTab === "live-activity" && (
                <LiveActivityTab
                  ledgerDecision={ledgerDecision}
                  setLedgerDecision={setLedgerDecision}
                  ledgerDomain={ledgerDomain}
                  setLedgerDomain={setLedgerDomain}
                  ledgerWindow={ledgerWindow}
                  setLedgerWindow={setLedgerWindow}
                />
              )}
  
            </AnimatePresence>
          </div>
  
          {/* Architecture note */}
          <section style={{ borderTop: `1px solid ${BORDER}`, padding: "clamp(4rem,8vw,5rem) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}
              >
                <div>
                  <p style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: KORA, marginBottom: "0.75rem" }}>
                    Architectural Inspiration
                  </p>
                  <h2 style={{ fontSize: "clamp(1.5rem,3vw,2.125rem)", fontWeight: 700, letterSpacing: "-0.022em", color: TEXT, marginBottom: "1rem" }}>
                    Governance posture modeled on the world's highest-assurance frameworks.
                  </h2>
                  <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: TEXT_SEC, marginBottom: "1.5rem" }}>
                    The Governance Posture Dashboard draws from Germany's BSI IT-Grundschutz baseline protection model, Romania's CYBERINT 24/7 operational posture, and the IC's security posture reporting architecture — and applies these patterns to enterprise-grade governance visibility.
                  </p>
                  <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
                    <Link href="/lyte" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.125rem", background: KORA, color: "hsl(214,18%,4%)", borderRadius: 6, fontSize: "0.8125rem", fontWeight: 600, textDecoration: "none" }}>
                      Back to KORA <ArrowRight size={13} />
                    </Link>
                    <Link href="/trust/governance" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.125rem", background: "transparent", color: TEXT_SEC, border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: "0.8125rem", fontWeight: 500, textDecoration: "none" }}>
                      Trust & Governance <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {[
                    { src: "Germany BSI IT-Grundschutz", map: "Baseline protection catalog → Maturity scoring per domain pack with exportable compliance artifacts" },
                    { src: "Romania CYBERINT", map: "24/7 operational posture → Continuous governance feed, not on-demand assembly" },
                    { src: "IC ITE data tagging", map: "Need-to-know access control + data provenance → Proof Chain coverage metric" },
                    { src: "GCHQ NCSC active defense", map: "Proactive posture reporting → Violation detection before escalation" },
                  ].map((item, i) => (
                    <m.div
                      key={i}
                      initial={{ opacity: 0, x: 12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35, delay: i * 0.07 }}
                      style={{ padding: "0.875rem 1.125rem", borderRadius: "7px", background: SURFACE, border: `1px solid ${BORDER}` }}
                    >
                      <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: KORA, marginBottom: "0.25rem" }}>{item.src}</p>
                      <p style={{ fontSize: "0.8125rem", color: TEXT_SEC, margin: 0, lineHeight: 1.5 }}>{item.map}</p>
                    </m.div>
                  ))}
                </div>
              </m.div>
            </div>
          </section>
  
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
