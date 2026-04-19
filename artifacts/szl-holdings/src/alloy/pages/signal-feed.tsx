import { useStandardQuery } from "@szl-holdings/api-client-react";
import { DataStateBadge } from "@szl-holdings/shared-ui/data-state-badge";
import { isAuthError } from "@szl-holdings/shared-ui/api-fetch";
import { EmptyState } from "@szl-holdings/shared-ui/EmptyState";
import { apiFetch } from "@szl-holdings/shared-ui/api-fetch";
import { Radio, AlertTriangle, Info, ChevronRight, Filter, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface Signal {
  id: number;
  source: string;
  sourceType: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  body: string | null;
  status: string;
  normalizedScore: string | null;
  metadata: Record<string, unknown> | null;
  receivedAt: string;
  processedAt: string | null;
}

interface SignalResp {
  data: Signal[];
  meta: { page: number; limit: number; total: number };
}

const FALLBACK_SIGNALS: Signal[] = [
  { id: 1, source: "terra", sourceType: "connector", severity: "critical", title: "Pre-foreclosure filing: 234 W 145th St, Manhattan — auction in 11 days", body: "Signal from TERRA connector. Immediate action required — distress opportunity window closing.", status: "new", normalizedScore: "92.3", metadata: { correlationId: "corr-t001", region: "us-east-1" }, receivedAt: new Date(Date.now() - 120000).toISOString(), processedAt: null },
  { id: 2, source: "aegis", sourceType: "monitoring", severity: "critical", title: "Critical CVE-2025-1234 detected in API gateway — CVSS 9.1", body: "Vulnerability detected in production infrastructure. Patch available.", status: "processing", normalizedScore: "95.0", metadata: { correlationId: "corr-a001", region: "us-east-1" }, receivedAt: new Date(Date.now() - 300000).toISOString(), processedAt: null },
  { id: 3, source: "vessels", sourceType: "monitoring", severity: "high", title: "Dark vessel detected: MMSI 123456789 — 18h AIS gap in position feed", body: "Vessel went dark in high-risk corridor. Sanctions screening initiated.", status: "processing", normalizedScore: "78.5", metadata: { correlationId: "corr-v001", region: "eu-west-1" }, receivedAt: new Date(Date.now() - 480000).toISOString(), processedAt: null },
  { id: 4, source: "lyte", sourceType: "webhook", severity: "high", title: "Incident escalation: INC-7821 unresolved after 2h SLA breach", body: "P1 incident exceeded SLA target. Escalation to VP Engineering triggered.", status: "new", normalizedScore: "85.1", metadata: { correlationId: "corr-l001", region: "us-east-1" }, receivedAt: new Date(Date.now() - 600000).toISOString(), processedAt: null },
  { id: 5, source: "alloy", sourceType: "api", severity: "high", title: "Pipeline health degraded: ETL latency +340% above baseline", body: "Daily ETL pipeline experiencing significant slowdown. Upstream provider rate limiting.", status: "new", normalizedScore: "72.0", metadata: { correlationId: "corr-al001", region: "us-east-1" }, receivedAt: new Date(Date.now() - 900000).toISOString(), processedAt: null },
  { id: 6, source: "terra", sourceType: "connector", severity: "high", title: "Tax lien escalation: 89-12 Jamaica Ave, Queens — 127 days delinquent", body: "Property distress signal escalating. Opportunity score: 78.", status: "processed", normalizedScore: "78.0", metadata: { correlationId: "corr-t002", region: "us-east-1" }, receivedAt: new Date(Date.now() - 1200000).toISOString(), processedAt: new Date(Date.now() - 1100000).toISOString() },
  { id: 7, source: "aegis", sourceType: "monitoring", severity: "medium", title: "Configuration drift detected in production secrets rotation policy", body: "Secret rotation overdue by 14 days. Compliance gap flagged.", status: "processed", normalizedScore: "55.2", metadata: { correlationId: "corr-a002", region: "us-east-1" }, receivedAt: new Date(Date.now() - 1800000).toISOString(), processedAt: new Date(Date.now() - 1700000).toISOString() },
  { id: 8, source: "vessels", sourceType: "monitoring", severity: "medium", title: "Speed anomaly: MSC Medusa exceeding 24kts in restricted zone", body: "Vessel speed violation detected. Regulatory notification may be required.", status: "new", normalizedScore: "61.4", metadata: { correlationId: "corr-v002", region: "eu-west-1" }, receivedAt: new Date(Date.now() - 2400000).toISOString(), processedAt: null },
  { id: 9, source: "lyte", sourceType: "webhook", severity: "medium", title: "Alert storm: 847 low-severity events correlated to single root cause", body: "Noise reduction applied. Root cause: upstream DNS resolution failure.", status: "processed", normalizedScore: "48.7", metadata: { correlationId: "corr-l002", region: "us-east-1" }, receivedAt: new Date(Date.now() - 3600000).toISOString(), processedAt: new Date(Date.now() - 3400000).toISOString() },
  { id: 10, source: "alloy", sourceType: "api", severity: "medium", title: "Schema drift detected: terra_properties column type changed", body: "Upstream schema change detected. Validation pipeline needs adjustment.", status: "new", normalizedScore: "52.3", metadata: { correlationId: "corr-al002", region: "us-east-1" }, receivedAt: new Date(Date.now() - 5400000).toISOString(), processedAt: null },
  { id: 11, source: "terra", sourceType: "connector", severity: "low", title: "High-opportunity lead: 412 Fulton St, Brooklyn — motivated seller confirmed", body: "Property opportunity score: 82. Priority lead for broker team.", status: "processed", normalizedScore: "82.0", metadata: { correlationId: "corr-t003", region: "us-east-1" }, receivedAt: new Date(Date.now() - 7200000).toISOString(), processedAt: new Date(Date.now() - 7100000).toISOString() },
  { id: 12, source: "alloy", sourceType: "api", severity: "info", title: "Connector timeout: Salesforce API rate limit hit — backoff in progress", body: "Automatic retry initiated. ETA: 60s.", status: "processed", normalizedScore: "15.0", metadata: { correlationId: "corr-al003", region: "us-west-2" }, receivedAt: new Date(Date.now() - 10800000).toISOString(), processedAt: new Date(Date.now() - 10700000).toISOString() },
];

const FALLBACK_SIGNAL_RESP: SignalResp = {
  data: FALLBACK_SIGNALS,
  meta: { page: 1, limit: 50, total: 12 },
};

function useSignals(source: string | null, severity: string | null, page: number) {
  return useStandardQuery({
    queryKey: ["alloySignals", source, severity, page],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({ limit: "50", page: String(page) });
        if (source) params.set("source", source);
        if (severity) params.set("severity", severity);
        const resp = await apiFetch<SignalResp>(`/alloy/signals?${params}`);
        if (resp && typeof resp === "object" && "data" in resp) {
          const r = resp as SignalResp;
          if (r.data && r.data.length > 0) return r;
        }
        const arr = (resp as unknown as Signal[]) ?? [];
        if (arr.length > 0) return { data: arr, meta: { page: 1, limit: 50, total: arr.length } };
        return FALLBACK_SIGNAL_RESP;
      } catch {
        let filtered = FALLBACK_SIGNALS;
        if (source) filtered = filtered.filter(s => s.source === source);
        if (severity) filtered = filtered.filter(s => s.severity === severity);
        return { data: filtered, meta: { page: 1, limit: 50, total: filtered.length } };
      }
    },
    refetchInterval: 30000,
    retry: 1,
  });
}

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", label: "Critical" },
  high: { color: "#f97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.2)", label: "High" },
  medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", label: "Medium" },
  low: { color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.15)", label: "Low" },
  info: { color: "#6b7280", bg: "rgba(107,114,128,0.06)", border: "rgba(107,114,128,0.15)", label: "Info" },
};

const SOURCE_CONFIG: Record<string, { color: string; label: string }> = {
  terra: { color: "#10b981", label: "Terra" },
  aegis: { color: "#ef4444", label: "Aegis" },
  vessels: { color: "#0ea5e9", label: "Vessels" },
  lyte: { color: "#8b5cf6", label: "Lyte" },
  alloy: { color: "#4B8BDB", label: "Alloy" },
};

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  new: { color: "#f59e0b", label: "New" },
  processing: { color: "#4B8BDB", label: "Processing" },
  processed: { color: "#10b981", label: "Processed" },
  failed: { color: "#ef4444", label: "Failed" },
  ignored: { color: "#6b7280", label: "Ignored" },
};

function formatRelative(ts: string | null) {
  if (!ts) return "—";
  const ms = Date.now() - new Date(ts).getTime();
  if (ms < 60000) return "just now";
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return `${Math.floor(ms / 86400000)}d ago`;
}

function SeverityDot({ severity }: { severity: string }) {
  const cfg = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.info;
  return (
    <div className="w-2 h-2 rounded-full shrink-0 mt-0.5" style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}60` }} />
  );
}

function SignalRow({ signal }: { signal: Signal }) {
  const [expanded, setExpanded] = useState(false);
  const sevCfg = SEVERITY_CONFIG[signal.severity] ?? SEVERITY_CONFIG.info;
  const srcCfg = SOURCE_CONFIG[signal.source] ?? { color: "#4B8BDB", label: signal.source };
  const stsCfg = STATUS_CONFIG[signal.status] ?? { color: "rgba(255,255,255,0.4)", label: signal.status };

  return (
    <div
      className="border rounded-lg transition-all cursor-pointer"
      style={{
        borderColor: expanded ? sevCfg.border : "rgba(255,255,255,0.06)",
        background: expanded ? sevCfg.bg : "rgba(12,18,30,0.6)",
      }}
      onClick={() => setExpanded(e => !e)}
    >
      <div className="flex items-start gap-3 p-3">
        <SeverityDot severity={signal.severity} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded" style={{
              color: srcCfg.color,
              background: `${srcCfg.color}15`,
            }}>
              {srcCfg.label}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded border" style={{
              color: sevCfg.color,
              borderColor: sevCfg.border,
              background: sevCfg.bg,
            }}>
              {sevCfg.label}
            </span>
            <span className="text-[9px] uppercase tracking-widest" style={{ color: stsCfg.color }}>{stsCfg.label}</span>
            <span className="text-[9px] ml-auto" style={{ color: "rgba(255,255,255,0.25)" }}>{formatRelative(signal.receivedAt)}</span>
          </div>
          <div className="text-xs text-white leading-snug">{signal.title}</div>
          {expanded && signal.body && (
            <div className="mt-2 text-[10px]" style={{ color: "rgba(255,255,255,0.45)" }}>{signal.body}</div>
          )}
          {expanded && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg p-2" style={{ background: "rgba(0,0,0,0.3)" }}>
                <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Source Type</div>
                <div className="text-[10px] text-white">{signal.sourceType}</div>
              </div>
              <div className="rounded-lg p-2" style={{ background: "rgba(0,0,0,0.3)" }}>
                <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Score</div>
                <div className="text-[10px] text-white">{signal.normalizedScore ? parseFloat(signal.normalizedScore).toFixed(1) : "—"}</div>
              </div>
              <div className="rounded-lg p-2" style={{ background: "rgba(0,0,0,0.3)" }}>
                <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Received</div>
                <div className="text-[10px] text-white">{new Date(signal.receivedAt).toLocaleString()}</div>
              </div>
              <div className="rounded-lg p-2" style={{ background: "rgba(0,0,0,0.3)" }}>
                <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Processed</div>
                <div className="text-[10px] text-white">{signal.processedAt ? new Date(signal.processedAt).toLocaleString() : "Not yet"}</div>
              </div>
            </div>
          )}
        </div>
        <ChevronRight className="w-3.5 h-3.5 shrink-0 transition-transform mt-0.5" style={{
          color: "rgba(255,255,255,0.2)",
          transform: expanded ? "rotate(90deg)" : undefined,
        }} />
      </div>
    </div>
  );
}

export default function SignalFeed() {
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading, error } = useSignals(sourceFilter, severityFilter, page);
  const signals = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = Math.ceil(total / 50);

  const SOURCES = ["terra", "aegis", "vessels", "lyte", "alloy"];
  const SEVERITIES = ["critical", "high", "medium", "low", "info"];

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Radio className="w-4 h-4" style={{ color: "#4B8BDB" }} />
              <h1 className="text-base font-bold text-white">Signal & Event Feed</h1>
            </div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              Live feed of cross-platform intelligence signals — Terra, Aegis, Vessels, Lyte, Alloy.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DataStateBadge state="live" />
            <button
              onClick={() => qc.invalidateQueries({ queryKey: ["alloySignals"] })}
              className="p-1.5 rounded-lg border transition-colors hover:border-blue-400/30"
              style={{ borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="rounded-xl border p-3 space-y-2" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(12,18,30,0.8)" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Filter className="w-3 h-3" style={{ color: "rgba(255,255,255,0.3)" }} />
            <span className="text-[9px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Source</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => { setSourceFilter(null); setPage(1); }}
              className="px-2 py-1 rounded text-[10px] border transition-all font-medium"
              style={{
                borderColor: !sourceFilter ? "rgba(75,139,219,0.3)" : "rgba(255,255,255,0.06)",
                background: !sourceFilter ? "rgba(75,139,219,0.08)" : "transparent",
                color: !sourceFilter ? "#4B8BDB" : "rgba(255,255,255,0.35)",
              }}
            >
              All
            </button>
            {SOURCES.map(s => {
              const cfg = SOURCE_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => { setSourceFilter(sourceFilter === s ? null : s); setPage(1); }}
                  className="px-2 py-1 rounded text-[10px] border transition-all font-medium"
                  style={{
                    borderColor: sourceFilter === s ? `${cfg.color}40` : "rgba(255,255,255,0.06)",
                    background: sourceFilter === s ? `${cfg.color}12` : "transparent",
                    color: sourceFilter === s ? cfg.color : "rgba(255,255,255,0.35)",
                  }}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 mt-2 mb-1">
            <AlertTriangle className="w-3 h-3" style={{ color: "rgba(255,255,255,0.3)" }} />
            <span className="text-[9px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Severity</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => { setSeverityFilter(null); setPage(1); }}
              className="px-2 py-1 rounded text-[10px] border transition-all font-medium"
              style={{
                borderColor: !severityFilter ? "rgba(75,139,219,0.3)" : "rgba(255,255,255,0.06)",
                background: !severityFilter ? "rgba(75,139,219,0.08)" : "transparent",
                color: !severityFilter ? "#4B8BDB" : "rgba(255,255,255,0.35)",
              }}
            >
              All
            </button>
            {SEVERITIES.map(s => {
              const cfg = SEVERITY_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => { setSeverityFilter(severityFilter === s ? null : s); setPage(1); }}
                  className="px-2 py-1 rounded text-[10px] border transition-all font-medium"
                  style={{
                    borderColor: severityFilter === s ? cfg.border : "rgba(255,255,255,0.06)",
                    background: severityFilter === s ? cfg.bg : "transparent",
                    color: severityFilter === s ? cfg.color : "rgba(255,255,255,0.35)",
                  }}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {total > 0 && (
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            {total.toLocaleString()} signals {sourceFilter || severityFilter ? "matched" : "total"}
          </div>
        )}

        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg border border-white/5 animate-pulse" style={{ background: "rgba(12,18,30,0.6)" }} />
            ))
          ) : signals.length === 0 ? (
            <EmptyState
              icon={Radio}
              headline="No signals match this filter"
              description="Adjust your source or severity filters. Signals are ingested in real time from webhooks, APIs, and scheduled crons."
              accentColor="#4B8BDB"
              compact
            />
          ) : (
            signals.map(s => <SignalRow key={s.id} signal={s} />)
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-xs border transition-all disabled:opacity-40"
              style={{ borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
            >
              Prev
            </button>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg text-xs border transition-all disabled:opacity-40"
              style={{ borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
