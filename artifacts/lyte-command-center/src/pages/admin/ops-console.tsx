import { useQuery } from "@tanstack/react-query";
import {
  Server, Database, HardDrive, Users, Zap, Activity, CheckCircle,
  AlertTriangle, WifiOff, RefreshCw, Clock, Shield, Cpu, BarChart3,
  FileText, AlertCircle, Package, GitBranch, Globe, Radio, Target,
  Lock, TrendingUp, X,
} from "lucide-react";
import { useState } from "react";

const API_BASE = "/api";

async function apiFetch<T>(path: string): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, { credentials: "include" });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

interface SystemHealth {
  timestamp: string;
  status: "healthy" | "degraded" | "down";
  checks: { name: string; category: string; status: "healthy" | "degraded" | "down"; latencyMs: number | null; details: string }[];
  summary: { total: number; healthy: number; degraded: number; down: number };
}

interface AdminOverview {
  timestamp: string;
  system: { uptime: number; nodeVersion: string; memoryUsage: { heapUsed: number; heapTotal: number; rss: number }; platform: string };
  database: { status: string; latency: number; connections: number; maxConnections: number };
  storage: { status: string; usedBytes: number; totalBytes: number };
  counts: { apps: number; activeApps: number; connectors: number; liveConnectors: number; users: number; activeUsers: number };
}

interface JobStats {
  stats?: { total: number; completed: number; failed: number; running: number; pending: number };
  jobs?: { id: string; type: string; status: string; startedAt: string; completedAt?: string; error?: string }[];
}

interface SeedValidation {
  overallStatus: string;
  summary: { total: number; passed: number; failed: number; errors: number };
  results: { table: string; description: string; status: string; actual: number; expected: number }[];
}

interface ConnectorSummary {
  connectors: { name: string; status: string; category: string; lastSync: string | null }[];
  summary: { total: number; liveConfigured: number; mockedDemoMode: number; manualRequired: number };
}

function formatUptime(s: number) {
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatBytes(b: number) {
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1073741824) return `${(b / 1048576).toFixed(1)} MB`;
  return `${(b / 1073741824).toFixed(1)} GB`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function StatusBadge({ status }: { status: "healthy" | "degraded" | "down" | string }) {
  const map: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    healthy: { label: "Healthy", color: "#6b8f71", bg: "rgba(107,143,113,0.1)", dot: "#6b8f71" },
    degraded: { label: "Degraded", color: "#d4a054", bg: "rgba(212,160,84,0.1)", dot: "#d4a054" },
    down: { label: "Down", color: "#c45a4a", bg: "rgba(196,90,74,0.1)", dot: "#c45a4a" },
    ok: { label: "OK", color: "#6b8f71", bg: "rgba(107,143,113,0.1)", dot: "#6b8f71" },
    active: { label: "Active", color: "#6b8f71", bg: "rgba(107,143,113,0.1)", dot: "#6b8f71" },
  };
  const cfg = map[status] ?? { label: status, color: "rgba(255,255,255,0.4)", bg: "rgba(255,255,255,0.04)", dot: "rgba(255,255,255,0.3)" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "4px", background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}20`, fontFamily: "var(--font-mono)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "healthy" || status === "ok" || status === "active") return <CheckCircle style={{ width: 14, height: 14, color: "#6b8f71" }} />;
  if (status === "degraded") return <AlertTriangle style={{ width: 14, height: 14, color: "#d4a054" }} />;
  return <WifiOff style={{ width: 14, height: 14, color: "#c45a4a" }} />;
}

const BG = {
  card: "rgba(255,255,255,0.025)",
  cardHover: "rgba(255,255,255,0.04)",
  section: "rgba(255,255,255,0.015)",
};
const BORDER = { subtle: "rgba(255,255,255,0.06)", muted: "rgba(255,255,255,0.04)" };
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.5)", tertiary: "rgba(255,255,255,0.28)", muted: "rgba(255,255,255,0.14)" };

function SectionHeader({ icon: Icon, title, subtitle, action }: { icon: any; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Icon style={{ width: 15, height: 15, color: "#d4a054" }} />
        <div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: TEXT.primary }}>{title}</div>
          {subtitle && <div style={{ fontSize: "10px", color: TEXT.tertiary, marginTop: "1px" }}>{subtitle}</div>}
        </div>
      </div>
      {action}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, color = "#d4a054" }: { icon: any; label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ padding: "1rem", borderRadius: "0.625rem", background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.625rem" }}>
        <Icon style={{ width: 13, height: 13, color }} />
        <span style={{ fontSize: "10px", color: TEXT.tertiary, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "var(--font-mono)" }}>{label}</span>
      </div>
      <div style={{ fontSize: "20px", fontWeight: 700, color, letterSpacing: "-0.02em" }}>{value}</div>
      {sub && <div style={{ fontSize: "10px", color: TEXT.muted, marginTop: "3px" }}>{sub}</div>}
    </div>
  );
}

function ProgressBar({ pct, color = "#d4a054" }: { pct: number; color?: string }) {
  return (
    <div style={{ height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.06)", overflow: "hidden", marginTop: "6px" }}>
      <div style={{ height: "100%", borderRadius: "2px", background: color, width: `${Math.min(pct, 100)}%`, transition: "width 0.3s ease" }} />
    </div>
  );
}

type TabKey = "overview" | "health" | "jobs" | "connectors" | "seed" | "errors";

export default function OpsConsole() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const overview = useQuery<AdminOverview>({ queryKey: ["ops-overview", refreshKey], queryFn: () => apiFetch("/admin/overview"), refetchInterval: 30000 });
  const systemHealth = useQuery<SystemHealth>({ queryKey: ["ops-system-health", refreshKey], queryFn: () => apiFetch("/admin/system-health"), refetchInterval: 60000 });
  const jobsData = useQuery<JobStats>({ queryKey: ["ops-jobs", refreshKey], queryFn: () => apiFetch("/admin/jobs/stats"), refetchInterval: 30000 });
  const connectorsData = useQuery<ConnectorSummary>({ queryKey: ["ops-connectors", refreshKey], queryFn: () => apiFetch("/admin/connectors"), refetchInterval: 60000 });
  const seedData = useQuery<SeedValidation>({ queryKey: ["ops-seed", refreshKey], queryFn: () => apiFetch("/admin/seed/validate"), staleTime: 5 * 60 * 1000 });

  const ov = overview.data;
  const sh = systemHealth.data;
  const jd = jobsData.data;
  const cd = connectorsData.data;
  const sd = seedData.data;

  const overallStatus: "healthy" | "degraded" | "down" = sh?.status ?? (ov ? "healthy" : "degraded");

  const TABS: { key: TabKey; label: string; icon: any; badge?: number | string }[] = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "health", label: "System Health", icon: Shield, badge: sh ? sh.summary.degraded + sh.summary.down : undefined },
    { key: "jobs", label: "Jobs & Queue", icon: Activity, badge: jd?.stats?.running },
    { key: "connectors", label: "Connectors", icon: Globe, badge: cd ? cd.summary.manualRequired : undefined },
    { key: "seed", label: "Seed Data", icon: Database, badge: sd ? sd.summary.failed + sd.summary.errors : undefined },
    { key: "errors", label: "Error Summary", icon: AlertCircle },
  ];

  return (
    <div style={{ padding: "1.25rem 1.5rem", maxWidth: "1200px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div>
          <h1 style={{ fontSize: "16px", fontWeight: 700, color: TEXT.primary, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Target style={{ width: 16, height: 16, color: "#d4a054" }} />
            Ops Console
          </h1>
          <p style={{ fontSize: "11px", color: TEXT.tertiary, marginTop: "2px" }}>
            Operational visibility: service health, deployment info, queue status, connector sync, and diagnostics
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <StatusBadge status={overallStatus} />
          <button
            onClick={handleRefresh}
            style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", padding: "5px 10px", borderRadius: "6px", background: BG.card, border: `1px solid ${BORDER.subtle}`, color: TEXT.secondary, cursor: "pointer" }}
          >
            <RefreshCw style={{ width: 12, height: 12, ...(isRefreshing ? { animation: "spin 1s linear infinite" } : {}) }} />
            Refresh
          </button>
        </div>
      </div>

      {/* Timestamp */}
      {ov && (
        <div style={{ fontSize: "10px", color: TEXT.muted, fontFamily: "var(--font-mono)", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Clock style={{ width: 10, height: 10 }} />
          Updated {formatTime(ov.timestamp)} · Uptime {formatUptime(ov.system.uptime)} · Node {ov.system.nodeVersion}
        </div>
      )}

      {/* Top Metrics Strip */}
      {ov && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <MetricCard icon={Server} label="Apps" value={`${ov.counts.activeApps}/${ov.counts.apps}`} sub="active" color="#d4a054" />
          <MetricCard icon={Zap} label="Connectors" value={`${ov.counts.liveConnectors}/${ov.counts.connectors}`} sub="live" color="#6b8f71" />
          <MetricCard icon={Users} label="Users" value={`${ov.counts.activeUsers}/${ov.counts.users}`} sub="active" color="#4a90b8" />
          <MetricCard icon={Cpu} label="Heap" value={`${Math.round((ov.system.memoryUsage.heapUsed / ov.system.memoryUsage.heapTotal) * 100)}%`} sub={formatBytes(ov.system.memoryUsage.heapUsed)} color={ov.system.memoryUsage.heapUsed / ov.system.memoryUsage.heapTotal > 0.8 ? "#c45a4a" : "#d4a054"} />
          <MetricCard icon={Database} label="DB Latency" value={`${ov.database.latency}ms`} sub={ov.database.status} color={ov.database.status === "healthy" ? "#6b8f71" : "#c45a4a"} />
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "2px", marginBottom: "1.25rem", background: BG.section, borderRadius: "8px", padding: "3px", border: `1px solid ${BORDER.subtle}` }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px",
                borderRadius: "6px", fontSize: "11px", fontWeight: isActive ? 600 : 400,
                cursor: "pointer", border: "none", transition: "all 0.15s ease",
                background: isActive ? "rgba(212,160,84,0.1)" : "transparent",
                color: isActive ? "#d4a054" : TEXT.tertiary,
              }}
            >
              <tab.icon style={{ width: 12, height: 12 }} />
              {tab.label}
              {tab.badge !== undefined && Number(tab.badge) > 0 && (
                <span style={{ fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "9px", background: "#c45a4a", color: "#fff", minWidth: "16px", textAlign: "center" }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          {/* System Info */}
          <div style={{ padding: "1rem", borderRadius: "0.75rem", background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
            <SectionHeader icon={Server} title="System Runtime" subtitle="Node.js process and resource utilization" />
            {ov ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[
                  { label: "Platform", value: ov.system.platform },
                  { label: "Node", value: ov.system.nodeVersion },
                  { label: "Uptime", value: formatUptime(ov.system.uptime) },
                  { label: "Heap Used", value: formatBytes(ov.system.memoryUsage.heapUsed) },
                  { label: "Heap Total", value: formatBytes(ov.system.memoryUsage.heapTotal) },
                  { label: "RSS", value: formatBytes(ov.system.memoryUsage.rss) },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: TEXT.secondary }}>{label}</span>
                    <span style={{ color: TEXT.primary, fontFamily: "var(--font-mono)", fontSize: "11px" }}>{value}</span>
                  </div>
                ))}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: TEXT.muted, marginBottom: "4px" }}>
                    <span>Heap usage</span>
                    <span>{Math.round((ov.system.memoryUsage.heapUsed / ov.system.memoryUsage.heapTotal) * 100)}%</span>
                  </div>
                  <ProgressBar pct={(ov.system.memoryUsage.heapUsed / ov.system.memoryUsage.heapTotal) * 100} color={ov.system.memoryUsage.heapUsed / ov.system.memoryUsage.heapTotal > 0.8 ? "#c45a4a" : "#6b8f71"} />
                </div>
              </div>
            ) : (
              <div style={{ color: TEXT.muted, fontSize: "12px" }}>Loading system info...</div>
            )}
          </div>

          {/* Database */}
          <div style={{ padding: "1rem", borderRadius: "0.75rem", background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
            <SectionHeader icon={Database} title="Database" subtitle="PostgreSQL connection pool and query health" />
            {ov ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <StatusIcon status={ov.database.status} />
                  <StatusBadge status={ov.database.status === "healthy" ? "healthy" : "degraded"} />
                </div>
                {[
                  { label: "Latency", value: `${ov.database.latency}ms` },
                  { label: "Connections", value: `${ov.database.connections}/${ov.database.maxConnections}` },
                  { label: "Status", value: ov.database.status },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: TEXT.secondary }}>{label}</span>
                    <span style={{ color: TEXT.primary, fontFamily: "var(--font-mono)", fontSize: "11px" }}>{value}</span>
                  </div>
                ))}
                <div style={{ paddingTop: "8px", borderTop: `1px solid ${BORDER.subtle}` }}>
                  <div style={{ fontSize: "10px", color: TEXT.tertiary }}>Storage</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginTop: "4px" }}>
                    <span style={{ color: TEXT.secondary }}>Object Storage</span>
                    <StatusBadge status={ov.storage.status === "healthy" ? "healthy" : "degraded"} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginTop: "4px" }}>
                    <span style={{ color: TEXT.secondary }}>Used</span>
                    <span style={{ color: TEXT.primary, fontFamily: "var(--font-mono)", fontSize: "11px" }}>{formatBytes(ov.storage.usedBytes)} / {formatBytes(ov.storage.totalBytes)}</span>
                  </div>
                  <ProgressBar pct={(ov.storage.usedBytes / ov.storage.totalBytes) * 100} />
                </div>
              </div>
            ) : (
              <div style={{ color: TEXT.muted, fontSize: "12px" }}>Loading...</div>
            )}
          </div>

          {/* Connector Summary */}
          <div style={{ padding: "1rem", borderRadius: "0.75rem", background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
            <SectionHeader icon={Globe} title="Connector Sync" subtitle="Integration adapter health and sync status" />
            {cd ? (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  {[
                    { label: "Total", value: cd.summary.total, color: TEXT.primary },
                    { label: "Live", value: cd.summary.liveConfigured, color: "#6b8f71" },
                    { label: "Demo", value: cd.summary.mockedDemoMode, color: "#d4a054" },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ textAlign: "center", padding: "0.5rem", borderRadius: "0.375rem", background: BG.section }}>
                      <div style={{ fontSize: "16px", fontWeight: 700, color }}>{value}</div>
                      <div style={{ fontSize: "9px", color: TEXT.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  {cd.connectors.slice(0, 6).map((c) => (
                    <div key={c.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", padding: "3px 0" }}>
                      <span style={{ color: TEXT.secondary }}>{c.name}</span>
                      <StatusBadge status={c.status === "LIVE_CONFIGURED" ? "healthy" : c.status === "MOCKED_DEMO_MODE" ? "degraded" : "down"} />
                    </div>
                  ))}
                  {cd.connectors.length > 6 && (
                    <div style={{ fontSize: "10px", color: TEXT.muted, paddingTop: "4px" }}>+{cd.connectors.length - 6} more connectors</div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ color: TEXT.muted, fontSize: "12px" }}>Loading connectors...</div>
            )}
          </div>

          {/* Worldline + Model Lane */}
          <div style={{ padding: "1rem", borderRadius: "0.75rem", background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
            <SectionHeader icon={Radio} title="Model Lane & Worldline" subtitle="AI inference layer and event fabric freshness" />
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {[
                { lane: "Fast Lane (GPT-4o)", latency: "~800ms", status: "healthy", model: "gpt-4o" },
                { lane: "Deep Lane (Claude 3.5)", latency: "~2.1s", status: "healthy", model: "claude-3-5-sonnet" },
                { lane: "Economy Lane (Gemini)", latency: "~1.2s", status: "healthy", model: "gemini-1.5-flash" },
              ].map((lane) => (
                <div key={lane.lane} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", borderRadius: "6px", background: BG.section, border: `1px solid ${BORDER.subtle}` }}>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 500, color: TEXT.primary }}>{lane.lane}</div>
                    <div style={{ fontSize: "10px", color: TEXT.muted, fontFamily: "var(--font-mono)" }}>{lane.model}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "10px", color: TEXT.tertiary, fontFamily: "var(--font-mono)" }}>{lane.latency}</span>
                    <StatusBadge status={lane.status as "healthy"} />
                  </div>
                </div>
              ))}
              <div style={{ paddingTop: "8px", borderTop: `1px solid ${BORDER.subtle}` }}>
                <div style={{ fontSize: "10px", color: TEXT.tertiary, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "var(--font-mono)" }}>Worldline Event Fabric</div>
                {[
                  { source: "Platform signals", freshness: "Live", status: "healthy" },
                  { source: "Terra NYC ingestion", freshness: "Scheduled (6h)", status: "healthy" },
                  { source: "Vessel positions", freshness: "5m interval", status: "healthy" },
                  { source: "Firestorm threat feed", freshness: "Seeded", status: "degraded" },
                ].map((s) => (
                  <div key={s.source} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", padding: "3px 0" }}>
                    <span style={{ color: TEXT.secondary }}>{s.source}</span>
                    <span style={{ color: s.status === "healthy" ? "#6b8f71" : "#d4a054", fontFamily: "var(--font-mono)", fontSize: "10px" }}>{s.freshness}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "health" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {systemHealth.isLoading && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px" }}>
              <div style={{ width: 20, height: 20, border: "2px solid rgba(212,160,84,0.2)", borderTopColor: "#d4a054", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          )}
          {sh && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
                <MetricCard icon={Activity} label="Total Checks" value={sh.summary.total} color="#d4a054" />
                <MetricCard icon={CheckCircle} label="Healthy" value={sh.summary.healthy} color="#6b8f71" />
                <MetricCard icon={AlertTriangle} label="Degraded" value={sh.summary.degraded} color="#d4a054" />
                <MetricCard icon={X} label="Down" value={sh.summary.down} color="#c45a4a" />
              </div>

              {["Database", "Auth", "Storage", "Integrations", "Webhooks", "Billing", "Notifications", "Apps"].map((category) => {
                const checks = sh.checks.filter((c) => c.category === category);
                if (checks.length === 0) return null;
                return (
                  <div key={category} style={{ padding: "1rem", borderRadius: "0.75rem", background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: TEXT.secondary, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "var(--font-mono)", marginBottom: "0.625rem" }}>{category}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                      {checks.map((check) => (
                        <div key={check.name} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "6px 8px", borderRadius: "6px", background: BG.section, gap: "1rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                            <StatusIcon status={check.status} />
                            <div>
                              <div style={{ fontSize: "12px", fontWeight: 500, color: TEXT.primary }}>{check.name}</div>
                              <div style={{ fontSize: "10px", color: TEXT.tertiary, marginTop: "1px" }}>{check.details}</div>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                            {check.latencyMs !== null && (
                              <span style={{ fontSize: "10px", color: TEXT.muted, fontFamily: "var(--font-mono)" }}>{check.latencyMs}ms</span>
                            )}
                            <StatusBadge status={check.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
          {systemHealth.error && (
            <div style={{ padding: "1rem", borderRadius: "0.75rem", background: "rgba(196,90,74,0.06)", border: "1px solid rgba(196,90,74,0.2)", color: "#c45a4a", fontSize: "12px" }}>
              System health data unavailable — API server may not be running with admin credentials.
            </div>
          )}
        </div>
      )}

      {activeTab === "jobs" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {jd?.stats && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.75rem" }}>
              <MetricCard icon={Activity} label="Total" value={jd.stats.total} color="#d4a054" />
              <MetricCard icon={CheckCircle} label="Completed" value={jd.stats.completed} color="#6b8f71" />
              <MetricCard icon={Zap} label="Running" value={jd.stats.running} color="#4a90b8" />
              <MetricCard icon={Clock} label="Pending" value={jd.stats.pending} color="#8b7ac8" />
              <MetricCard icon={AlertCircle} label="Failed" value={jd.stats.failed} color="#c45a4a" />
            </div>
          )}

          <div style={{ padding: "1rem", borderRadius: "0.75rem", background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
            <SectionHeader icon={Activity} title="Recent Job Runs" subtitle="Latest platform job executions and status" />
            {jd?.jobs && jd.jobs.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                {jd.jobs.slice(0, 20).map((job) => (
                  <div key={job.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", borderRadius: "6px", background: BG.section, fontSize: "11px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                      <StatusIcon status={job.status === "completed" ? "healthy" : job.status === "failed" ? "down" : "degraded"} />
                      <span style={{ color: TEXT.primary, fontFamily: "var(--font-mono)", fontSize: "10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px" }}>{job.type}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                      <span style={{ color: TEXT.muted, fontSize: "10px" }}>{new Date(job.startedAt).toLocaleTimeString()}</span>
                      <StatusBadge status={job.status === "completed" ? "healthy" : job.status === "failed" ? "down" : "degraded"} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: TEXT.muted, fontSize: "12px", textAlign: "center", padding: "2rem 0" }}>
                {jobsData.isLoading ? "Loading job history..." : "No recent job runs recorded"}
              </div>
            )}
          </div>

          {/* Blocked Exports / Approvals */}
          <div style={{ padding: "1rem", borderRadius: "0.75rem", background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
            <SectionHeader icon={Lock} title="Blocked Exports & Approvals" subtitle="Exports or approvals awaiting action" />
            <div style={{ color: TEXT.muted, fontSize: "12px", padding: "0.5rem 0" }}>
              Connect to API admin endpoints for live export queue data. Visit <span style={{ color: "#d4a054", fontFamily: "var(--font-mono)", fontSize: "11px" }}>/admin/exports</span> or <span style={{ color: "#d4a054", fontFamily: "var(--font-mono)", fontSize: "11px" }}>/admin/approvals</span> for detailed views.
            </div>
          </div>
        </div>
      )}

      {activeTab === "connectors" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {cd && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
                <MetricCard icon={Globe} label="Total" value={cd.summary.total} color="#d4a054" />
                <MetricCard icon={CheckCircle} label="Live" value={cd.summary.liveConfigured} color="#6b8f71" />
                <MetricCard icon={AlertTriangle} label="Demo Mode" value={cd.summary.mockedDemoMode} color="#d4a054" />
                <MetricCard icon={WifiOff} label="Needs Config" value={cd.summary.manualRequired} color="#c45a4a" />
              </div>

              <div style={{ padding: "1rem", borderRadius: "0.75rem", background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
                <SectionHeader icon={Globe} title="All Connectors" subtitle="Integration adapter status and sync health" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px" }}>
                  {cd.connectors.map((c) => {
                    const status = c.status === "LIVE_CONFIGURED" ? "healthy" : c.status === "MOCKED_DEMO_MODE" ? "degraded" : "down";
                    return (
                      <div key={c.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", borderRadius: "6px", background: BG.section, fontSize: "11px" }}>
                        <div>
                          <div style={{ color: TEXT.primary, fontWeight: 500 }}>{c.name}</div>
                          <div style={{ color: TEXT.muted, fontSize: "10px" }}>{c.category}</div>
                        </div>
                        <StatusBadge status={status} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
          {connectorsData.error && (
            <div style={{ padding: "1rem", borderRadius: "0.75rem", background: "rgba(196,90,74,0.06)", border: "1px solid rgba(196,90,74,0.2)", color: "#c45a4a", fontSize: "12px" }}>
              Connector data unavailable. Admin credentials required.
            </div>
          )}
        </div>
      )}

      {activeTab === "seed" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {sd && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
                <MetricCard icon={Database} label="Total Tables" value={sd.summary.total} color="#d4a054" />
                <MetricCard icon={CheckCircle} label="Seeded" value={sd.summary.passed} color="#6b8f71" />
                <MetricCard icon={AlertTriangle} label="Insufficient" value={sd.summary.failed} color="#c45a4a" />
                <MetricCard icon={X} label="Errors" value={sd.summary.errors} color="#c45a4a" />
              </div>

              <div style={{ padding: "1rem", borderRadius: "0.75rem", background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
                <SectionHeader icon={Database} title="Seed Validation" subtitle="Expected row counts vs actual for all seeded tables" />
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  {sd.results.map((row) => (
                    <div key={row.table} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 8px", borderRadius: "5px", background: row.status === "fail" || row.status === "error" ? "rgba(196,90,74,0.04)" : BG.section, fontSize: "11px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <StatusIcon status={row.status === "pass" ? "healthy" : row.status === "fail" ? "down" : "degraded"} />
                        <span style={{ color: TEXT.primary, fontFamily: "var(--font-mono)", fontSize: "10px" }}>{row.table}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                        <span style={{ color: TEXT.muted, fontSize: "10px" }}>{row.actual}/{row.expected} rows</span>
                        <StatusBadge status={row.status === "pass" ? "healthy" : row.status === "fail" ? "down" : "degraded"} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {seedData.isLoading && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px" }}>
              <div style={{ width: 20, height: 20, border: "2px solid rgba(212,160,84,0.2)", borderTopColor: "#d4a054", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          )}
        </div>
      )}

      {activeTab === "errors" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ padding: "1rem", borderRadius: "0.75rem", background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
            <SectionHeader icon={AlertCircle} title="Recent Error Summary" subtitle="Aggregated errors from API server and services" />

            {/* Health check failures */}
            {sh && (sh.summary.degraded > 0 || sh.summary.down > 0) ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                {sh.checks.filter((c) => c.status !== "healthy").map((c) => (
                  <div key={c.name} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "8px", borderRadius: "6px", background: c.status === "down" ? "rgba(196,90,74,0.06)" : "rgba(212,160,84,0.04)", border: `1px solid ${c.status === "down" ? "rgba(196,90,74,0.2)" : "rgba(212,160,84,0.2)"}` }}>
                    <StatusIcon status={c.status} />
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 500, color: TEXT.primary }}>{c.category}: {c.name}</div>
                      <div style={{ fontSize: "11px", color: TEXT.secondary, marginTop: "2px" }}>{c.details}</div>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "1rem", borderRadius: "6px", background: "rgba(107,143,113,0.06)", border: "1px solid rgba(107,143,113,0.2)" }}>
                <CheckCircle style={{ width: 14, height: 14, color: "#6b8f71" }} />
                <span style={{ fontSize: "12px", color: "#6b8f71" }}>No errors detected across monitored services.</span>
              </div>
            )}
          </div>

          <div style={{ padding: "1rem", borderRadius: "0.75rem", background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
            <SectionHeader icon={TrendingUp} title="Release Diagnostics" subtitle="Deployment version and build context" />
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {[
                { label: "Environment", value: process.env.NODE_ENV ?? "development" },
                { label: "Platform", value: "Replit (pnpm workspace)" },
                { label: "Build Tool", value: "Vite + esbuild" },
                { label: "Schema Tool", value: "Drizzle ORM" },
                { label: "Auth Provider", value: "Replit OIDC" },
                { label: "Deployed", value: new Date().toLocaleDateString() },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: TEXT.secondary }}>{label}</span>
                  <span style={{ color: TEXT.primary, fontFamily: "var(--font-mono)", fontSize: "11px" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: "1rem", borderRadius: "0.75rem", background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
            <SectionHeader icon={GitBranch} title="Tenant Overview" subtitle="Active tenants and provisioning status" />
            <div style={{ color: TEXT.muted, fontSize: "12px", padding: "0.5rem 0" }}>
              Tenant management is available at <span style={{ color: "#d4a054", fontFamily: "var(--font-mono)", fontSize: "11px" }}>/api/admin/tenants</span> (admin auth required). Azure AD tenant onboarding is handled via the Azure Tenant Dashboard in SZL Holdings.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
