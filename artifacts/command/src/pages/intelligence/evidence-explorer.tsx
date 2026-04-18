import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  EvidenceBadge,
  ConfidenceMeter,
  PolicyStateChip,
  type PolicyState,
  type EvidenceSource,
} from "@szl-holdings/design-system";
import {
  Activity,
  AlertTriangle,
  Database,
  Filter,
  RefreshCw,
  Radio,
  Sparkles,
  X,
} from "lucide-react";

// ─── Types (mirror the API contracts loosely) ──────────────────────────────

type SignalDomain =
  | "maritime"
  | "real-estate"
  | "legal"
  | "security"
  | "finance"
  | "workforce"
  | "hospitality"
  | "platform"
  | "ai"
  | "cross-domain";

type SignalSeverity = "info" | "low" | "medium" | "high" | "critical";

interface EntityRef {
  entityId: string;
  entityType: string;
  displayName?: string;
  domain?: SignalDomain;
}

interface ApiSignal {
  signalId: string;
  source: string;
  type: string;
  domain: SignalDomain;
  severity?: SignalSeverity;
  occurredAt: string;
  receivedAt: string;
  confidence: number;
  freshness: number;
  entityRefs: EntityRef[];
  tags: string[];
}

interface ApiRecommendation {
  recommendationId: string;
  domain: SignalDomain;
  title: string;
  summary: string;
  rationale: string;
  suggestedAction: string;
  confidence: number;
  freshness: number;
  projectedImpactUsd?: number;
  projectedRiskReductionPct?: number;
  evidenceIds: string[];
  signalIds: string[];
  entityRefs: EntityRef[];
  status: "pending" | "accepted" | "rejected" | "expired" | "executing" | "completed" | "failed";
  policyEvaluation: {
    outcome: "allow" | "require-approval" | "block" | "pending";
    policyIds: string[];
    reason?: string;
    evaluatedAt?: string;
  };
  generatedAt: string;
  tags: string[];
}

interface ApiEvidenceItem {
  evidenceId: string;
  type: string;
  domain: SignalDomain;
  summary: string;
  detail?: string;
  confidence: number;
  freshness: number;
  weight: number;
  sourceName?: string;
  sourceUrl?: string;
  observedAt: string;
  entityRefs: EntityRef[];
}

interface ApiEntitySnapshot {
  entityId: string;
  entityType: string;
  displayName: string;
  description?: string;
  domain: SignalDomain;
  health?: "healthy" | "degraded" | "at-risk" | "critical" | "unknown";
  riskScore?: number;
  opportunityScore?: number;
  activeSignalIds?: string[];
  activeRecommendationIds?: string[];
  attributes?: Record<string, unknown>;
  snapshotAt?: string;
}

interface ApiEvidenceChain {
  recommendation: ApiRecommendation;
  evidenceItems: ApiEvidenceItem[];
  entities: ApiEntitySnapshot[];
  summary: string;
  confidenceBreakdown: Array<{
    evidenceId: string;
    type: string;
    summary: string;
    confidence: number;
    weight: number;
    weightedContribution: number;
  }>;
  aggregateConfidence: number;
}

interface ApiWhyResult {
  entityId: string;
  entitySnapshot: ApiEntitySnapshot | null;
  activeRecommendations: ApiEvidenceChain[];
  allEvidenceItems: ApiEvidenceItem[];
  narrative: string;
}

interface ApiStatus {
  status: string;
  meshVersion: string;
  counts: { signals: number; evidenceItems: number; recommendations: number; entities: number };
  domainBreakdown: {
    signals: Record<string, number>;
    recommendations: Record<string, number>;
  };
}

// ─── Fetch helpers ─────────────────────────────────────────────────────────

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  const body = await res.json();
  return (body?.data ?? body) as T;
}

// ─── Visual helpers ────────────────────────────────────────────────────────

const ACCENT = "#8b7ac8";
const PANEL = "#0f1521";
const BORDER = "rgba(255,255,255,0.06)";
const MUTED = "rgba(255,255,255,0.55)";
const MUTED_DIM = "rgba(255,255,255,0.40)";
const TEXT = "rgba(255,255,255,0.90)";

const SEVERITY_COLOR: Record<SignalSeverity, string> = {
  critical: "#ff4455",
  high: "#ff8a3d",
  medium: "#ffb700",
  low: "#4a90e2",
  info: "#7a99b8",
};

const DOMAINS: SignalDomain[] = [
  "maritime",
  "real-estate",
  "legal",
  "security",
  "finance",
  "workforce",
  "hospitality",
  "platform",
  "ai",
  "cross-domain",
];

const REC_STATUSES = ["pending", "accepted", "rejected", "expired", "executing", "completed", "failed"] as const;

function policyOutcomeToState(outcome: ApiRecommendation["policyEvaluation"]["outcome"]): PolicyState {
  if (outcome === "block") return "blocked";
  if (outcome === "require-approval" || outcome === "pending") return "requires-approval";
  return "allowed";
}

function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const diff = Date.now() - t;
  const s = Math.max(0, Math.floor(diff / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function formatUsd(n?: number): string {
  if (n === undefined || n === null) return "—";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

// ─── Sub-components ────────────────────────────────────────────────────────

function StatusBar({ status }: { status?: ApiStatus }) {
  const items = [
    { label: "Signals", value: status?.counts.signals ?? 0, icon: Radio },
    { label: "Evidence", value: status?.counts.evidenceItems ?? 0, icon: Database },
    { label: "Recommendations", value: status?.counts.recommendations ?? 0, icon: Sparkles },
    { label: "Entities", value: status?.counts.entities ?? 0, icon: Activity },
  ];
  return (
    <div
      className="flex items-center gap-6 px-6 py-3"
      style={{ borderBottom: `1px solid ${BORDER}`, background: PANEL }}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ background: status?.status === "live" ? "#00e878" : "#ffb700" }}
        />
        <span className="text-[12px] font-semibold tracking-wider uppercase" style={{ color: TEXT }}>
          Evidence Explorer
        </span>
        <span className="text-[10px]" style={{ color: MUTED_DIM }}>
          mesh {status?.meshVersion ?? "—"}
        </span>
      </div>
      <div className="flex items-center gap-5 ml-auto">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-2">
            <it.icon className="w-3.5 h-3.5" style={{ color: ACCENT }} />
            <span className="text-[11px] uppercase tracking-wider" style={{ color: MUTED_DIM }}>
              {it.label}
            </span>
            <span className="text-[13px] font-semibold tabular-nums" style={{ color: TEXT }}>
              {it.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilterBar({
  domain,
  onDomain,
  status,
  onStatus,
  onRefresh,
  isFetching,
}: {
  domain: string;
  onDomain: (d: string) => void;
  status: string;
  onStatus: (s: string) => void;
  onRefresh: () => void;
  isFetching: boolean;
}) {
  const selectStyle: React.CSSProperties = {
    background: "#0a0f18",
    color: TEXT,
    border: `1px solid ${BORDER}`,
    borderRadius: 4,
    padding: "4px 8px",
    fontSize: 12,
  };
  return (
    <div className="flex items-center gap-3 px-4 py-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
      <Filter className="w-3.5 h-3.5" style={{ color: MUTED_DIM }} />
      <label className="text-[11px] uppercase tracking-wider" style={{ color: MUTED_DIM }}>Domain</label>
      <select value={domain} onChange={(e) => onDomain(e.target.value)} style={selectStyle}>
        <option value="">All</option>
        {DOMAINS.map((d) => (<option key={d} value={d}>{d}</option>))}
      </select>
      <label className="text-[11px] uppercase tracking-wider ml-2" style={{ color: MUTED_DIM }}>Status</label>
      <select value={status} onChange={(e) => onStatus(e.target.value)} style={selectStyle}>
        <option value="">All</option>
        {REC_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
      </select>
      <button
        type="button"
        onClick={onRefresh}
        className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px]"
        style={{ border: `1px solid ${BORDER}`, color: MUTED, background: "transparent" }}
      >
        <RefreshCw className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`} />
        Refresh
      </button>
    </div>
  );
}

function SignalRow({ s }: { s: ApiSignal }) {
  const sev = s.severity ?? "info";
  const color = SEVERITY_COLOR[sev];
  const entity = s.entityRefs[0]?.displayName ?? s.entityRefs[0]?.entityId ?? "—";
  return (
    <div
      className="grid items-center gap-2 px-3 py-1.5 text-[12px]"
      style={{ borderBottom: `1px solid ${BORDER}`, gridTemplateColumns: "70px 110px 110px 1fr 80px" }}
    >
      <span
        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
        style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}
      >
        {sev}
      </span>
      <span style={{ color: MUTED }}>{s.domain}</span>
      <span style={{ color: MUTED }}>{s.type}</span>
      <span className="truncate" style={{ color: TEXT }} title={entity}>{entity}</span>
      <span className="text-right tabular-nums" style={{ color: MUTED_DIM }}>{relativeTime(s.occurredAt)}</span>
    </div>
  );
}

function SignalsPanel({ domain }: { domain: string }) {
  const params = new URLSearchParams();
  if (domain) params.set("domain", domain);
  params.set("limit", "100");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["evidence-graph", "signals", domain],
    queryFn: () => fetchJson<{ signals: ApiSignal[]; total: number; busCount: number }>(
      `/api/evidence-graph/signals?${params.toString()}`,
    ),
    refetchInterval: 5_000,
  });

  return (
    <div className="flex flex-col h-full" style={{ background: PANEL }}>
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5" style={{ color: ACCENT }} />
          <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: TEXT }}>
            Live Signal Feed
          </span>
          <span className="text-[10px]" style={{ color: MUTED_DIM }}>
            {data?.total ?? 0} of {data?.busCount ?? 0}
          </span>
        </div>
      </div>
      <div
        className="grid items-center gap-2 px-3 py-1.5 text-[10px] uppercase tracking-wider"
        style={{ color: MUTED_DIM, borderBottom: `1px solid ${BORDER}`, gridTemplateColumns: "70px 110px 110px 1fr 80px" }}
      >
        <span>Sev</span><span>Domain</span><span>Type</span><span>Entity</span><span className="text-right">Age</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading && <div className="px-3 py-6 text-[12px]" style={{ color: MUTED_DIM }}>Loading signals…</div>}
        {isError && <div className="px-3 py-6 text-[12px]" style={{ color: SEVERITY_COLOR.high }}>Failed to load signals.</div>}
        {data?.signals.length === 0 && (
          <div className="px-3 py-6 text-[12px]" style={{ color: MUTED_DIM }}>No signals on the bus yet.</div>
        )}
        {data?.signals.map((s) => <SignalRow key={s.signalId} s={s} />)}
      </div>
    </div>
  );
}

function RecommendationCard({
  r,
  selected,
  onSelect,
}: {
  r: ApiRecommendation;
  selected: boolean;
  onSelect: () => void;
}) {
  const sources: EvidenceSource[] = r.evidenceIds.slice(0, 8).map((id, i) => ({
    id,
    label: `Evidence ${i + 1}`,
    type: "signal",
  }));
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full text-left px-4 py-3"
      style={{
        background: selected ? "rgba(139,122,200,0.08)" : "transparent",
        borderBottom: `1px solid ${BORDER}`,
        borderLeft: selected ? `2px solid ${ACCENT}` : "2px solid transparent",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ background: "rgba(139,122,200,0.12)", color: ACCENT }}
            >
              {r.domain}
            </span>
            <span className="text-[10px] uppercase tracking-wider" style={{ color: MUTED_DIM }}>
              {r.suggestedAction} · {r.status}
            </span>
          </div>
          <div className="text-[13px] font-semibold truncate" style={{ color: TEXT }}>
            {r.title}
          </div>
          <div className="text-[11px] mt-1 line-clamp-2" style={{ color: MUTED }}>
            {r.summary}
          </div>
        </div>
        <PolicyStateChip
          state={policyOutcomeToState(r.policyEvaluation.outcome)}
          reason={r.policyEvaluation.reason}
        />
      </div>
      <div className="flex items-center gap-4 mt-2.5">
        <ConfidenceMeter value={Math.round(r.confidence * 100)} className="w-32" />
        <EvidenceBadge sources={sources} compact />
        <span className="text-[10px] uppercase tracking-wider" style={{ color: MUTED_DIM }}>
          Impact <span className="text-[11px] font-semibold tabular-nums" style={{ color: TEXT }}>{formatUsd(r.projectedImpactUsd)}</span>
        </span>
        <span className="text-[10px] uppercase tracking-wider ml-auto" style={{ color: MUTED_DIM }}>
          {relativeTime(r.generatedAt)}
        </span>
      </div>
    </button>
  );
}

function RecommendationsPanel({
  domain,
  status,
  selectedId,
  onSelect,
}: {
  domain: string;
  status: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const params = new URLSearchParams();
  if (domain) params.set("domain", domain);
  if (status) params.set("status", status);
  params.set("limit", "100");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["evidence-graph", "recommendations", domain, status],
    queryFn: () => fetchJson<{ recommendations: ApiRecommendation[]; total: number }>(
      `/api/evidence-graph/recommendations?${params.toString()}`,
    ),
    refetchInterval: 10_000,
  });

  return (
    <div className="flex flex-col h-full" style={{ background: PANEL }}>
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" style={{ color: ACCENT }} />
          <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: TEXT }}>
            Recommendations
          </span>
          <span className="text-[10px]" style={{ color: MUTED_DIM }}>
            {data?.total ?? 0}
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading && <div className="px-4 py-6 text-[12px]" style={{ color: MUTED_DIM }}>Loading recommendations…</div>}
        {isError && (
          <div className="px-4 py-6 text-[12px]" style={{ color: SEVERITY_COLOR.high }}>
            Failed to load recommendations.
          </div>
        )}
        {data?.recommendations.length === 0 && (
          <div className="px-4 py-6 text-[12px]" style={{ color: MUTED_DIM }}>
            No recommendations match the current filters.
          </div>
        )}
        {data?.recommendations.map((r) => (
          <RecommendationCard
            key={r.recommendationId}
            r={r}
            selected={selectedId === r.recommendationId}
            onSelect={() => onSelect(r.recommendationId)}
          />
        ))}
      </div>
    </div>
  );
}

function EvidenceChainDrawer({
  recommendationId,
  onClose,
  onSelectEntity,
}: {
  recommendationId: string;
  onClose: () => void;
  onSelectEntity: (entityId: string) => void;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["evidence-graph", "chain", recommendationId],
    queryFn: () => fetchJson<{ chain: ApiEvidenceChain }>(
      `/api/evidence-graph/recommendations/${recommendationId}`,
    ),
  });

  const chain = data?.chain;

  return (
    <aside
      className="absolute top-0 right-0 h-full w-[520px] flex flex-col z-30"
      style={{ background: "#0b1018", borderLeft: `1px solid ${BORDER}`, boxShadow: "-8px 0 24px rgba(0,0,0,0.5)" }}
    >
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5" style={{ color: ACCENT }} />
          <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: TEXT }}>
            Evidence Chain
          </span>
        </div>
        <button type="button" onClick={onClose} className="p-1 rounded hover:bg-white/5" aria-label="Close">
          <X className="w-4 h-4" style={{ color: MUTED }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading && <div className="text-[12px]" style={{ color: MUTED_DIM }}>Loading evidence chain…</div>}
        {isError && (
          <div className="text-[12px]" style={{ color: SEVERITY_COLOR.high }}>Failed to load evidence chain.</div>
        )}
        {chain && (
          <>
            <header>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(139,122,200,0.12)", color: ACCENT }}
                >
                  {chain.recommendation.domain}
                </span>
                <PolicyStateChip
                  state={policyOutcomeToState(chain.recommendation.policyEvaluation.outcome)}
                  reason={chain.recommendation.policyEvaluation.reason}
                />
              </div>
              <h2 className="text-[15px] font-semibold" style={{ color: TEXT }}>
                {chain.recommendation.title}
              </h2>
              <p className="text-[12px] mt-1" style={{ color: MUTED }}>
                {chain.recommendation.summary}
              </p>
            </header>

            <section>
              <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: MUTED_DIM }}>
                Aggregate confidence
              </div>
              <ConfidenceMeter
                value={Math.round(chain.aggregateConfidence * 100)}
                label="Weighted across evidence"
                variant="full"
              />
            </section>

            <section>
              <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: MUTED_DIM }}>
                Why
              </div>
              <p className="text-[12px] leading-relaxed" style={{ color: TEXT }}>
                {chain.summary}
              </p>
              <p className="text-[12px] leading-relaxed mt-2 italic" style={{ color: MUTED }}>
                {chain.recommendation.rationale}
              </p>
            </section>

            <section>
              <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: MUTED_DIM }}>
                Evidence breakdown ({chain.confidenceBreakdown.length})
              </div>
              <div className="space-y-2">
                {chain.confidenceBreakdown.map((b) => (
                  <div
                    key={b.evidenceId}
                    className="p-2.5 rounded"
                    style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER}` }}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] uppercase tracking-wider" style={{ color: ACCENT }}>
                        {b.type}
                      </span>
                      <span className="text-[10px] tabular-nums" style={{ color: MUTED_DIM }}>
                        weight {b.weight.toFixed(2)} · contrib {(b.weightedContribution * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="text-[12px] mb-1.5" style={{ color: TEXT }}>{b.summary}</div>
                    <ConfidenceMeter value={Math.round(b.confidence * 100)} />
                  </div>
                ))}
                {chain.confidenceBreakdown.length === 0 && (
                  <div className="text-[12px]" style={{ color: MUTED_DIM }}>No evidence items recorded.</div>
                )}
              </div>
            </section>

            <section>
              <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: MUTED_DIM }}>
                Entities ({chain.entities.length})
              </div>
              <div className="space-y-1">
                {chain.entities.map((e) => (
                  <button
                    key={e.entityId}
                    type="button"
                    onClick={() => onSelectEntity(e.entityId)}
                    className="w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between gap-2"
                    style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER}` }}
                  >
                    <span className="text-[12px] truncate" style={{ color: TEXT }}>{e.displayName}</span>
                    <span className="text-[10px] uppercase tracking-wider" style={{ color: MUTED_DIM }}>
                      {e.entityType} · {e.domain}
                    </span>
                  </button>
                ))}
                {chain.entities.length === 0 && (
                  <div className="text-[12px]" style={{ color: MUTED_DIM }}>No entities resolved.</div>
                )}
              </div>
            </section>

            <section className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER}` }}>
                <div className="uppercase tracking-wider text-[10px]" style={{ color: MUTED_DIM }}>Action</div>
                <div className="font-semibold" style={{ color: TEXT }}>{chain.recommendation.suggestedAction}</div>
              </div>
              <div className="p-2.5 rounded" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER}` }}>
                <div className="uppercase tracking-wider text-[10px]" style={{ color: MUTED_DIM }}>Status</div>
                <div className="font-semibold" style={{ color: TEXT }}>{chain.recommendation.status}</div>
              </div>
              <div className="p-2.5 rounded" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER}` }}>
                <div className="uppercase tracking-wider text-[10px]" style={{ color: MUTED_DIM }}>Projected impact</div>
                <div className="font-semibold tabular-nums" style={{ color: TEXT }}>{formatUsd(chain.recommendation.projectedImpactUsd)}</div>
              </div>
              <div className="p-2.5 rounded" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER}` }}>
                <div className="uppercase tracking-wider text-[10px]" style={{ color: MUTED_DIM }}>Risk reduction</div>
                <div className="font-semibold tabular-nums" style={{ color: TEXT }}>
                  {chain.recommendation.projectedRiskReductionPct !== undefined
                    ? `${chain.recommendation.projectedRiskReductionPct.toFixed(0)}%`
                    : "—"}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </aside>
  );
}

function EntitySnapshotPanel({
  entityId,
  onClose,
  onSelectRecommendation,
}: {
  entityId: string;
  onClose: () => void;
  onSelectRecommendation: (id: string) => void;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["evidence-graph", "why", entityId],
    queryFn: () => fetchJson<{ why: ApiWhyResult }>(`/api/evidence-graph/why/${entityId}`),
  });

  const why = data?.why;
  const snapshot = why?.entitySnapshot;
  const health = (snapshot?.health ?? "unknown") as "healthy" | "degraded" | "critical" | "unknown";
  const healthColor =
    health === "healthy" ? "#00e878" : health === "degraded" ? "#ffb700" : health === "critical" ? "#ff4455" : MUTED_DIM;

  return (
    <aside
      className="absolute top-0 right-0 h-full w-[520px] flex flex-col z-40"
      style={{ background: "#0b1018", borderLeft: `1px solid ${BORDER}`, boxShadow: "-8px 0 24px rgba(0,0,0,0.5)" }}
    >
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2 min-w-0">
          <Activity className="w-3.5 h-3.5 shrink-0" style={{ color: ACCENT }} />
          <span className="text-[11px] uppercase tracking-wider font-semibold truncate" style={{ color: TEXT }}>
            Entity Snapshot
          </span>
        </div>
        <button type="button" onClick={onClose} className="p-1 rounded hover:bg-white/5" aria-label="Close">
          <X className="w-4 h-4" style={{ color: MUTED }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading && <div className="text-[12px]" style={{ color: MUTED_DIM }}>Loading entity…</div>}
        {isError && (
          <div className="text-[12px]" style={{ color: SEVERITY_COLOR.high }}>Failed to load entity.</div>
        )}
        {why && (
          <>
            <header>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider"
                  style={{ background: `${healthColor}18`, color: healthColor, border: `1px solid ${healthColor}40` }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: healthColor }} />
                  {health}
                </span>
                {snapshot && (
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: MUTED_DIM }}>
                    {snapshot.entityType} · {snapshot.domain}
                  </span>
                )}
              </div>
              <h2 className="text-[15px] font-semibold" style={{ color: TEXT }}>
                {snapshot?.displayName ?? why.entityId}
              </h2>
              <p className="text-[11px] mt-0.5 font-mono" style={{ color: MUTED_DIM }}>{why.entityId}</p>
              {snapshot?.description && (
                <p className="text-[12px] mt-2" style={{ color: MUTED }}>{snapshot.description}</p>
              )}
            </header>

            {snapshot && (snapshot.riskScore !== undefined || snapshot.opportunityScore !== undefined) && (
              <section className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER}` }}>
                  <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: MUTED_DIM }}>Risk score</div>
                  {snapshot.riskScore !== undefined ? (
                    <ConfidenceMeter value={Math.round(snapshot.riskScore)} />
                  ) : (
                    <div className="text-[12px]" style={{ color: MUTED_DIM }}>—</div>
                  )}
                </div>
                <div className="p-2.5 rounded" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER}` }}>
                  <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: MUTED_DIM }}>Opportunity score</div>
                  {snapshot.opportunityScore !== undefined ? (
                    <ConfidenceMeter value={Math.round(snapshot.opportunityScore)} />
                  ) : (
                    <div className="text-[12px]" style={{ color: MUTED_DIM }}>—</div>
                  )}
                </div>
              </section>
            )}

            <section>
              <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: MUTED_DIM }}>Narrative</div>
              <p className="text-[12px] leading-relaxed" style={{ color: TEXT }}>{why.narrative}</p>
            </section>

            {snapshot && (
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <Radio className="w-3 h-3" style={{ color: ACCENT }} />
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: MUTED_DIM }}>
                    Active signals ({snapshot.activeSignalIds?.length ?? 0})
                  </span>
                </div>
                {snapshot.activeSignalIds && snapshot.activeSignalIds.length > 0 ? (
                  <div className="space-y-1">
                    {snapshot.activeSignalIds.slice(0, 12).map((sid) => (
                      <div
                        key={sid}
                        className="px-2 py-1 rounded text-[11px] font-mono truncate"
                        style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER}`, color: MUTED }}
                        title={sid}
                      >
                        {sid}
                      </div>
                    ))}
                    {snapshot.activeSignalIds.length > 12 && (
                      <div className="text-[10px]" style={{ color: MUTED_DIM }}>
                        + {snapshot.activeSignalIds.length - 12} more
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[12px]" style={{ color: MUTED_DIM }}>No active signals on this entity.</div>
                )}
              </section>
            )}

            <section>
              <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: MUTED_DIM }}>
                Active recommendations ({why.activeRecommendations.length})
              </div>
              <div className="space-y-2">
                {why.activeRecommendations.map((c) => (
                  <button
                    key={c.recommendation.recommendationId}
                    type="button"
                    onClick={() => onSelectRecommendation(c.recommendation.recommendationId)}
                    className="w-full text-left p-2.5 rounded"
                    style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER}` }}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[12px] font-semibold truncate" style={{ color: TEXT }}>
                        {c.recommendation.title}
                      </span>
                      <PolicyStateChip
                        state={policyOutcomeToState(c.recommendation.policyEvaluation.outcome)}
                      />
                    </div>
                    <ConfidenceMeter value={Math.round(c.aggregateConfidence * 100)} />
                  </button>
                ))}
                {why.activeRecommendations.length === 0 && (
                  <div className="text-[12px]" style={{ color: MUTED_DIM }}>No active recommendations.</div>
                )}
              </div>
            </section>

            <section>
              <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: MUTED_DIM }}>
                All evidence ({why.allEvidenceItems.length})
              </div>
              <div className="space-y-1.5">
                {why.allEvidenceItems.slice(0, 20).map((e) => (
                  <div
                    key={e.evidenceId}
                    className="p-2 rounded"
                    style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER}` }}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] uppercase tracking-wider" style={{ color: ACCENT }}>{e.type}</span>
                      <span className="text-[10px] tabular-nums" style={{ color: MUTED_DIM }}>
                        {relativeTime(e.observedAt)}
                      </span>
                    </div>
                    <div className="text-[12px]" style={{ color: TEXT }}>{e.summary}</div>
                  </div>
                ))}
                {why.allEvidenceItems.length === 0 && (
                  <div className="text-[12px]" style={{ color: MUTED_DIM }}>No evidence recorded.</div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </aside>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function EvidenceExplorerPage() {
  const [domain, setDomain] = useState<string>("");
  const [recStatus, setRecStatus] = useState<string>("");
  const [selectedRec, setSelectedRec] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: status, isFetching } = useQuery({
    queryKey: ["evidence-graph", "status"],
    queryFn: () => fetchJson<ApiStatus>("/api/evidence-graph/status"),
    refetchInterval: 15_000,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["evidence-graph"] });
  };

  const filterMemo = useMemo(() => ({ domain, recStatus }), [domain, recStatus]);

  return (
    <div className="flex flex-col h-full relative" style={{ background: "#080c14" }}>
      <StatusBar status={status} />
      <FilterBar
        domain={filterMemo.domain}
        onDomain={(d) => { setDomain(d); setSelectedRec(null); }}
        status={filterMemo.recStatus}
        onStatus={(s) => { setRecStatus(s); setSelectedRec(null); }}
        onRefresh={handleRefresh}
        isFetching={isFetching}
      />

      <div className="flex-1 grid overflow-hidden" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }}>
        <div style={{ borderRight: `1px solid ${BORDER}`, overflow: "hidden" }}>
          <RecommendationsPanel
            domain={filterMemo.domain}
            status={filterMemo.recStatus}
            selectedId={selectedRec}
            onSelect={(id) => setSelectedRec(id)}
          />
        </div>
        <div style={{ overflow: "hidden" }}>
          <SignalsPanel domain={filterMemo.domain} />
        </div>
      </div>

      {selectedRec && (
        <EvidenceChainDrawer
          recommendationId={selectedRec}
          onClose={() => setSelectedRec(null)}
          onSelectEntity={(id) => setSelectedEntity(id)}
        />
      )}
      {selectedEntity && (
        <EntitySnapshotPanel
          entityId={selectedEntity}
          onClose={() => setSelectedEntity(null)}
          onSelectRecommendation={(id) => {
            setSelectedEntity(null);
            setSelectedRec(id);
          }}
        />
      )}

      {!selectedRec && !selectedEntity && (
        <div
          className="absolute bottom-4 right-4 px-3 py-2 rounded text-[11px] flex items-center gap-2"
          style={{ background: "rgba(139,122,200,0.08)", border: `1px solid ${BORDER}`, color: MUTED }}
        >
          <AlertTriangle className="w-3 h-3" style={{ color: ACCENT }} />
          Click a recommendation to open its evidence chain.
        </div>
      )}
    </div>
  );
}
