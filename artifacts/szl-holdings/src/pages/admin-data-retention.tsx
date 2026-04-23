import { useState } from "react";
import { m } from "framer-motion";
import { Shield, Clock, Trash2, RefreshCw, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Database, Play, Activity, Settings2, Save } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useQueryClient } from "@tanstack/react-query";
import { useStandardMutation, useStandardQuery } from "@szl-holdings/api-client-react";
import { toast } from "@szl-holdings/shared-ui/ui/sonner";
import { useRole } from "@szl-holdings/shared-ui/use-role";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API = `${BASE}/api`;

interface PurgeableTable {
  name: string;
  label: string;
  description: string;
  defaultRetentionDays: number;
  hasTenantColumn: boolean;
}

interface RetentionPolicy {
  id: number;
  orgId: number | null;
  tableName: string;
  retentionDays: number;
  purgeStrategy: "delete" | "anonymize" | "archive";
  isActive: boolean;
  description: string | null;
  lastRunAt: string | null;
}

interface AuditLogEntry {
  id: number;
  policyId: number | null;
  orgId: number | null;
  tableName: string;
  action: string;
  actorName: string | null;
  affectedRows: number | null;
  status: string;
  errorMessage: string | null;
  executedAt: string;
}

interface SignalMeshSweepResult {
  success: boolean;
  timestamp: string;
  durationMs: number;
  counts: {
    tracesEvicted: { cacheRemoved: number; dbRemoved: number };
    memoryEvicted: { cacheRemoved: number; dbRemoved: number };
    signalsEvicted: { dbRemoved: number };
    evidenceEvicted: { cacheRemoved: number; dbRemoved: number };
    recommendationsEvicted: { cacheRemoved: number; dbRemoved: number };
    entitiesEvicted: { cacheRemoved: number; dbRemoved: number };
    checkpointsEvicted: { cacheRemoved: number; dbRemoved: number };
  };
}

interface SweepStatus {
  schedule: {
    name: string;
    cronExpression: string;
    enabled: boolean;
    lastRunAt: string | null;
    nextRunAt: string | null;
  } | null;
  lastSweepAt: string | null;
  activePolicies: number;
  canTriggerSweep: boolean;
}

const PURGE_STRATEGY_LABELS: Record<string, string> = {
  delete: "Hard delete",
  anonymize: "Anonymize PII",
  archive: "Archive (mark purged, no hard delete)",
};

const SIGNAL_MESH_LABELS: Record<string, string> = {
  tracesEvicted: "Traces",
  memoryEvicted: "Memory",
  signalsEvicted: "Signals",
  evidenceEvicted: "Evidence",
  recommendationsEvicted: "Recommendations",
  entitiesEvicted: "Entity snapshots",
  checkpointsEvicted: "Checkpoints",
};

function sumCounts(counts: SignalMeshSweepResult["counts"]): number {
  return Object.values(counts).reduce((acc, group) => {
    const cache = (group as { cacheRemoved?: number }).cacheRemoved ?? 0;
    const db = (group as { dbRemoved?: number }).dbRemoved ?? 0;
    return acc + cache + db;
  }, 0);
}

const STATUS_COLORS: Record<string, string> = {
  success: "hsl(142,60%,50%)",
  failure: "hsl(0,72%,55%)",
  partial: "hsl(45,80%,52%)",
};

export default function AdminDataRetentionPage() {
  const __pageMeta = usePageMeta({ title: "Data Retention — Admin" });

  const queryClient = useQueryClient();
  const { roles } = useRole();
  const isSuperAdmin = roles.includes("super_admin");
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [editingPolicy, setEditingPolicy] = useState<{ tableName: string; retentionDays: number; purgeStrategy: "archive" | "delete" | "anonymize"; isActive: boolean; description: string } | null>(null);
  const [runningTable, setRunningTable] = useState<string | null>(null);
  const [orgIdInput, setOrgIdInput] = useState<string>("");
  const [signalMeshSweepResult, setSignalMeshSweepResult] = useState<SignalMeshSweepResult | null>(null);
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [scheduleCron, setScheduleCron] = useState("");
  const [scheduleEnabled, setScheduleEnabled] = useState(true);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const selectedOrgId = orgIdInput.trim() !== "" ? Number(orgIdInput.trim()) || null : null;

  const { data: tablesData } = useStandardQuery({
    queryKey: ["retention-tables"],
    queryFn: async () => {
      const res = await fetch(`${API}/data-retention/tables`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load tables");
      return res.json() as Promise<{ tables: PurgeableTable[] }>;
    },
  });

  const { data: policiesData, refetch: refetchPolicies } = useStandardQuery({
    queryKey: ["retention-policies", selectedOrgId],
    queryFn: async () => {
      const params = selectedOrgId != null ? `?orgId=${selectedOrgId}` : "";
      const res = await fetch(`${API}/data-retention/policies${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load policies");
      return res.json() as Promise<{ policies: RetentionPolicy[] }>;
    },
  });

  const { data: auditData, refetch: refetchAudit } = useStandardQuery({
    queryKey: ["retention-audit-log", selectedOrgId],
    queryFn: async () => {
      const params = selectedOrgId != null ? `orgId=${selectedOrgId}&limit=30` : "limit=30";
      const res = await fetch(`${API}/data-retention/audit-log?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load audit log");
      return res.json() as Promise<{ entries: AuditLogEntry[] }>;
    },
  });

  const { data: sweepStatusData, refetch: refetchSweepStatus } = useStandardQuery({
    queryKey: ["retention-sweep-status"],
    queryFn: async () => {
      const res = await fetch(`${API}/data-retention/sweep-status`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load sweep status");
      return res.json() as Promise<SweepStatus>;
    },
    refetchInterval: 30_000,
  });

  const runSweepMutation = useStandardMutation({
    mutationFn: async () => {
      const res = await fetch(`${API}/data-retention/sweep`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? "Failed to trigger sweep");
      }
      return res.json() as Promise<{ success: boolean; jobId: string; message: string }>;
    },
    onSuccess: (data) => {
      toast.success(data.message ?? "Retention sweep enqueued.");
      queryClient.invalidateQueries({ queryKey: ["retention-audit-log"] });
      queryClient.invalidateQueries({ queryKey: ["retention-sweep-status"] });
      setTimeout(() => {
        void refetchSweepStatus();
        void refetchAudit();
      }, 3000);
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to trigger sweep."),
  });

  const runSignalMeshSweepMutation = useStandardMutation({
    mutationFn: async () => {
      const res = await fetch(`${API}/admin/retention/sweep`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `Sweep failed (HTTP ${res.status})`);
      }
      return res.json() as Promise<SignalMeshSweepResult>;
    },
    onSuccess: (data) => {
      setSignalMeshSweepResult(data);
      const total = sumCounts(data.counts);
      toast.success(`Signal mesh sweep complete — ${total.toLocaleString()} records pruned in ${(data.durationMs / 1000).toFixed(1)}s.`);
    },
    onError: (err: Error) => toast.error(err.message ?? "Signal mesh sweep failed."),
  });

  type PolicyInput = Pick<RetentionPolicy, "tableName" | "retentionDays" | "purgeStrategy" | "isActive" | "description">;

  const savePolicyMutation = useStandardMutation({
    mutationFn: async (policy: PolicyInput) => {
      const res = await fetch(`${API}/data-retention/policies`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...policy, orgId: selectedOrgId }),
      });
      if (!res.ok) throw new Error("Failed to save policy");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Retention policy saved.");
      setEditingPolicy(null);
      queryClient.invalidateQueries({ queryKey: ["retention-policies"] });
    },
    onError: () => toast.error("Failed to save policy."),
  });

  const runPurgeMutation = useStandardMutation({
    mutationFn: async ({ policyId, tableName }: { policyId: number; tableName: string }) => {
      setRunningTable(tableName);
      const res = await fetch(`${API}/data-retention/policies/${policyId}/run`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to run purge");
      return res.json();
    },
    onSuccess: (data) => {
      setRunningTable(null);
      if (data.success) {
        toast.success(`Purge completed: ${data.affectedRows} rows processed.`);
      } else {
        toast.error(`Purge failed: ${data.errorMessage}`);
      }
      queryClient.invalidateQueries({ queryKey: ["retention-audit-log"] });
      queryClient.invalidateQueries({ queryKey: ["retention-policies"] });
    },
    onError: () => {
      setRunningTable(null);
      toast.error("Failed to trigger purge.");
    },
  });

  const tables = tablesData?.tables ?? [];
  const policies = policiesData?.policies ?? [];
  const auditEntries = auditData?.entries ?? [];

  const getPolicyForTable = (tableName: string) => policies.find((p) => p.tableName === tableName);

  const startEdit = (table: PurgeableTable) => {
    const existing = getPolicyForTable(table.name);
    setEditingPolicy({
      tableName: table.name,
      retentionDays: existing?.retentionDays ?? table.defaultRetentionDays,
      purgeStrategy: existing?.purgeStrategy ?? "delete",
      isActive: existing?.isActive ?? true,
      description: existing?.description ?? table.description,
    });
  };

  const sectionStyle: React.CSSProperties = { marginBottom: "2rem" };
  const cardStyle: React.CSSProperties = { padding: "1.25rem", borderRadius: "8px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.07)" };
  const labelStyle: React.CSSProperties = { fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "hsl(210,5%,42%)", display: "block", marginBottom: "0.375rem" };
  const inputStyle: React.CSSProperties = { width: "100%", padding: "0.5rem 0.75rem", borderRadius: "6px", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.09)", color: "hsl(38,12%,88%)", fontSize: "13px", outline: "none", boxSizing: "border-box" };

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)", padding: "2rem" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "2rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "hsla(192,72%,48%,0.1)", border: "1px solid hsla(192,72%,48%,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Shield size={16} style={{ color: "hsl(192,72%,48%)" }} />
              </div>
              <div>
                <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "hsl(38,12%,94%)" }}>Data Retention</h1>
                <p style={{ fontSize: "12px", color: "hsl(210,5%,45%)" }}>Configure per-table retention policies, trigger purge jobs, and view the audit trail.</p>
              </div>
            </div>
  
            <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
              <div style={{ flex: "0 0 auto" }}>
                <span style={labelStyle}>Tenant / Org Filter</span>
                <input
                  type="number"
                  placeholder="All orgs (global)"
                  value={orgIdInput}
                  onChange={(e) => setOrgIdInput(e.target.value)}
                  style={{ ...inputStyle, width: "200px" }}
                />
              </div>
              <div style={{ flex: 1, minWidth: "180px" }}>
                <p style={{ fontSize: "12px", color: "hsl(210,5%,42%)", marginTop: "1.25rem" }}>
                  {selectedOrgId != null
                    ? `Showing policies for Org ID ${selectedOrgId}. Policies saved here will apply only to this tenant.`
                    : "No org selected — showing and saving global (cross-tenant) policies."}
                </p>
              </div>
            </div>
  
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
              {[
                { label: "Active policies", value: policies.filter((p) => p.isActive).length, icon: CheckCircle2, color: "hsl(142,60%,50%)" },
                { label: "Tables configured", value: `${policies.length} / ${tables.length}`, icon: Database, color: "hsl(192,72%,48%)" },
                { label: "Recent purge events", value: auditEntries.filter((e) => e.action === "purge_completed").length, icon: Trash2, color: "hsl(45,80%,52%)" },
              ].map((stat) => (
                <div key={stat.label} style={cardStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.625rem" }}>
                    <stat.icon size={14} style={{ color: stat.color }} />
                    <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "hsl(210,5%,42%)" }}>{stat.label}</span>
                  </div>
                  <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "hsl(38,12%,88%)" }}>{stat.value}</span>
                </div>
              ))}
            </div>
  
            <div style={{ ...cardStyle, marginBottom: "2rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                  <Clock size={14} style={{ color: "hsl(192,72%,48%)" }} />
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "hsl(38,12%,82%)" }}>Automated Sweep Schedule</span>
                  <span style={{ fontSize: "11px", padding: "0.15rem 0.5rem", borderRadius: "20px", background: "hsla(142,60%,50%,0.1)", color: "hsl(142,60%,52%)", border: "1px solid hsla(142,60%,50%,0.2)" }}>
                    {sweepStatusData?.schedule?.enabled !== false ? "Active · weekly" : "Disabled"}
                  </span>
                </div>
                {sweepStatusData?.canTriggerSweep && (
                  <button
                    onClick={() => {
                      if (confirm("Run the full data retention sweep now? All active policies will be processed immediately.")) {
                        runSweepMutation.mutate();
                      }
                    }}
                    disabled={runSweepMutation.isPending}
                    style={{ padding: "0.4rem 0.875rem", borderRadius: "6px", fontSize: "12px", fontWeight: 600, background: "hsla(192,72%,48%,0.1)", border: "1px solid hsla(192,72%,48%,0.25)", color: "hsl(192,72%,52%)", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
                  >
                    {runSweepMutation.isPending ? <RefreshCw size={11} style={{ animation: "spin 1s linear infinite" }} /> : <Play size={11} />}
                    {runSweepMutation.isPending ? "Enqueueing…" : "Run sweep now"}
                  </button>
                )}
              </div>
              <div style={{ display: "flex", gap: "2.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
                {[
                  {
                    label: "Cron schedule",
                    value: sweepStatusData?.schedule?.cronExpression ?? "0 2 * * 0",
                    hint: "Every Sunday at 02:00 UTC",
                  },
                  {
                    label: "Last automated sweep",
                    value: sweepStatusData?.lastSweepAt
                      ? new Date(sweepStatusData.lastSweepAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                      : sweepStatusData !== undefined ? "Never run" : "Loading…",
                    hint: null,
                  },
                  {
                    label: "Next scheduled sweep",
                    value: sweepStatusData?.schedule?.nextRunAt
                      ? new Date(sweepStatusData.schedule.nextRunAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                      : sweepStatusData?.schedule?.enabled === false ? "Disabled" : "—",
                    hint: null,
                  },
                  {
                    label: "Active policies",
                    value: sweepStatusData?.activePolicies !== undefined ? String(sweepStatusData.activePolicies) : "—",
                    hint: "policies queued for next sweep",
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "hsl(210,5%,40%)", display: "block", marginBottom: "0.25rem" }}>{item.label}</span>
                    <span style={{ fontSize: "13px", color: "hsl(38,12%,78%)", fontFamily: item.label === "Cron schedule" ? "var(--font-mono)" : "inherit" }}>{item.value}</span>
                    {item.hint && <span style={{ display: "block", fontSize: "11px", color: "hsl(210,5%,38%)", marginTop: "0.125rem" }}>{item.hint}</span>}
                  </div>
                ))}
              </div>

              {isSuperAdmin && !editingSchedule && (
                <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid hsla(0,0%,100%,0.06)" }}>
                  <button
                    onClick={() => {
                      setScheduleCron(sweepStatusData?.schedule?.cronExpression ?? "0 2 * * 0");
                      setScheduleEnabled(sweepStatusData?.schedule?.enabled !== false);
                      setEditingSchedule(true);
                    }}
                    style={{ display: "flex", alignItems: "center", gap: "5px", padding: "0.375rem 0.75rem", borderRadius: "6px", fontSize: "11px", fontWeight: 600, background: "transparent", border: "1px solid hsla(0,0%,100%,0.08)", color: "hsl(210,5%,50%)", cursor: "pointer" }}
                  >
                    <Settings2 size={11} /> Configure schedule
                  </button>
                </div>
              )}

              {isSuperAdmin && editingSchedule && (
                <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid hsla(0,0%,100%,0.06)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "hsl(210,5%,42%)" }}>Configure Sweep Schedule</span>
                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
                    <div>
                      <label style={labelStyle}>Cron expression</label>
                      <input
                        type="text"
                        value={scheduleCron}
                        onChange={(e) => setScheduleCron(e.target.value)}
                        placeholder="0 2 * * 0"
                        style={{ ...inputStyle, width: "200px", fontFamily: "var(--font-mono)" }}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Status</label>
                      <select
                        value={scheduleEnabled ? "enabled" : "disabled"}
                        onChange={(e) => setScheduleEnabled(e.target.value === "enabled")}
                        style={{ ...inputStyle, width: "140px", appearance: "none" }}
                      >
                        <option value="enabled">Enabled</option>
                        <option value="disabled">Disabled</option>
                      </select>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", paddingBottom: "1px" }}>
                      <button
                        onClick={async () => {
                          setSavingSchedule(true);
                          try {
                            const res = await fetch(`${API}/data-retention/sweep-schedule`, {
                              method: "PUT",
                              credentials: "include",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ cronExpression: scheduleCron, enabled: scheduleEnabled }),
                            });
                            if (!res.ok) {
                              const e = await res.json().catch(() => ({})) as { error?: string };
                              throw new Error(e.error ?? "Failed to save schedule");
                            }
                            toast.success("Sweep schedule updated");
                            setEditingSchedule(false);
                            await refetchSweepStatus();
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : "Failed to save schedule");
                          } finally {
                            setSavingSchedule(false);
                          }
                        }}
                        disabled={savingSchedule || !scheduleCron.trim()}
                        style={{ display: "flex", alignItems: "center", gap: "5px", padding: "0.4rem 0.75rem", borderRadius: "6px", fontSize: "12px", fontWeight: 600, background: "hsl(192,72%,48%)", color: "hsl(210,12%,5%)", border: "none", cursor: "pointer", opacity: savingSchedule ? 0.7 : 1 }}
                      >
                        <Save size={11} /> {savingSchedule ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={() => setEditingSchedule(false)}
                        style={{ padding: "0.4rem 0.75rem", borderRadius: "6px", fontSize: "12px", background: "transparent", border: "1px solid hsla(0,0%,100%,0.09)", color: "hsl(210,5%,50%)", cursor: "pointer" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
  
            <div style={{ ...cardStyle, marginBottom: "2rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                  <Activity size={14} style={{ color: "hsl(280,70%,60%)" }} />
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "hsl(38,12%,82%)" }}>Signal Mesh Retention</span>
                  <span style={{ fontSize: "11px", padding: "0.15rem 0.5rem", borderRadius: "20px", background: "hsla(280,70%,60%,0.1)", color: "hsl(280,70%,65%)", border: "1px solid hsla(280,70%,60%,0.2)" }}>
                    on-demand prune
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (confirm("Run the signal mesh retention sweep now? This prunes traces, memory, signals, evidence, recommendations, entity snapshots, and checkpoints older than their configured retention windows.")) {
                      runSignalMeshSweepMutation.mutate();
                    }
                  }}
                  disabled={runSignalMeshSweepMutation.isPending}
                  style={{ padding: "0.4rem 0.875rem", borderRadius: "6px", fontSize: "12px", fontWeight: 600, background: "hsla(280,70%,60%,0.1)", border: "1px solid hsla(280,70%,60%,0.25)", color: "hsl(280,70%,65%)", cursor: runSignalMeshSweepMutation.isPending ? "wait" : "pointer", display: "flex", alignItems: "center", gap: "5px" }}
                >
                  {runSignalMeshSweepMutation.isPending ? <RefreshCw size={11} style={{ animation: "spin 1s linear infinite" }} /> : <Play size={11} />}
                  {runSignalMeshSweepMutation.isPending ? "Pruning…" : "Prune now"}
                </button>
              </div>
              <p style={{ fontSize: "12px", color: "hsl(210,5%,45%)", marginTop: "0.625rem" }}>
                Triggers an immediate sweep of the in-process Signal Mesh stores (traces, memory, signals, evidence, recommendations, entity snapshots, and orchestration checkpoints). Useful after a noisy ingest backfill — no need to wait for the next scheduled hourly sweep.
              </p>
              {signalMeshSweepResult && (
                <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid hsla(0,0%,100%,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.625rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "hsl(38,12%,72%)" }}>
                      Last manual sweep
                    </span>
                    <span style={{ fontSize: "11px", color: "hsl(210,5%,50%)", fontFamily: "var(--font-mono)" }}>
                      {new Date(signalMeshSweepResult.timestamp).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      {" · "}
                      {(signalMeshSweepResult.durationMs / 1000).toFixed(2)}s
                      {" · "}
                      {sumCounts(signalMeshSweepResult.counts).toLocaleString()} pruned
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.625rem" }}>
                    {(Object.keys(SIGNAL_MESH_LABELS) as Array<keyof typeof SIGNAL_MESH_LABELS>).map((key) => {
                      const group = signalMeshSweepResult.counts[key as keyof SignalMeshSweepResult["counts"]] as { cacheRemoved?: number; dbRemoved?: number };
                      const cache = group.cacheRemoved ?? 0;
                      const db = group.dbRemoved ?? 0;
                      const total = cache + db;
                      return (
                        <div key={key} style={{ padding: "0.625rem 0.75rem", borderRadius: "6px", background: "hsla(0,0%,100%,0.03)", border: "1px solid hsla(0,0%,100%,0.06)" }}>
                          <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "hsl(210,5%,42%)", display: "block", marginBottom: "0.25rem" }}>
                            {SIGNAL_MESH_LABELS[key]}
                          </span>
                          <span style={{ fontSize: "16px", fontWeight: 700, color: total > 0 ? "hsl(38,12%,88%)" : "hsl(210,5%,38%)" }}>
                            {total.toLocaleString()}
                          </span>
                          {("cacheRemoved" in group) && (
                            <span style={{ display: "block", fontSize: "10px", color: "hsl(210,5%,38%)", marginTop: "0.125rem" }}>
                              cache {cache.toLocaleString()} · db {db.toLocaleString()}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div style={sectionStyle}>
              <h2 style={{ fontSize: "13px", fontWeight: 700, color: "hsl(38,12%,75%)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "1rem" }}>Retention Policies</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {tables.map((table) => {
                  const policy = getPolicyForTable(table.name);
                  const isExpanded = expandedTable === table.name;
                  const isEditing = editingPolicy?.tableName === table.name;
                  return (
                    <div key={table.name} style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
                      <div style={{ padding: "1rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", cursor: "pointer" }}
                        onClick={() => setExpandedTable(isExpanded ? null : table.name)}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "hsl(38,12%,88%)", fontFamily: "var(--font-mono)" }}>{table.name}</span>
                            {policy ? (
                              <>
                                <span style={{ fontSize: "11px", padding: "0.2rem 0.6rem", borderRadius: "20px", background: policy.isActive ? "hsla(142,60%,50%,0.1)" : "hsla(0,0%,100%,0.05)", color: policy.isActive ? "hsl(142,60%,52%)" : "hsl(210,5%,45%)", border: `1px solid ${policy.isActive ? "hsla(142,60%,50%,0.2)" : "hsla(0,0%,100%,0.08)"}` }}>
                                  {policy.isActive ? `${policy.retentionDays}d · ${PURGE_STRATEGY_LABELS[policy.purgeStrategy] ?? policy.purgeStrategy}` : "Inactive"}
                                </span>
                                {policy.isActive && policy.lastRunAt === null && (
                                  <span style={{ fontSize: "10px", padding: "0.15rem 0.5rem", borderRadius: "20px", background: "hsla(45,80%,50%,0.08)", color: "hsl(45,80%,52%)", border: "1px solid hsla(45,80%,50%,0.2)" }}>
                                    Never run
                                  </span>
                                )}
                              </>
                            ) : (
                              <span style={{ fontSize: "11px", color: "hsl(210,5%,38%)" }}>No policy</span>
                            )}
                          </div>
                          <p style={{ fontSize: "12px", color: "hsl(210,5%,45%)", marginTop: "0.25rem" }}>{table.description}</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          {policy?.isActive && (
                            <button onClick={(e) => { e.stopPropagation(); if (confirm(`Run purge for "${table.name}"? This will remove records older than ${policy.retentionDays} days.`)) { runPurgeMutation.mutate({ policyId: policy.id, tableName: table.name }); } }}
                              disabled={runningTable === table.name}
                              style={{ padding: "0.375rem 0.75rem", borderRadius: "6px", fontSize: "11px", fontWeight: 600, background: "hsla(0,60%,50%,0.08)", border: "1px solid hsla(0,60%,50%,0.2)", color: "hsl(0,55%,55%)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                              {runningTable === table.name ? <RefreshCw size={10} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={10} />}
                              {runningTable === table.name ? "Running…" : "Run purge"}
                            </button>
                          )}
                          {isExpanded ? <ChevronUp size={14} style={{ color: "hsl(210,5%,40%)" }} /> : <ChevronDown size={14} style={{ color: "hsl(210,5%,40%)" }} />}
                        </div>
                      </div>
  
                      {isExpanded && (
                        <div style={{ borderTop: "1px solid hsla(0,0%,100%,0.06)", padding: "1.25rem" }}>
                          {isEditing && editingPolicy ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                                <div>
                                  <label style={labelStyle}>Retention (days)</label>
                                  <input type="number" min={1} max={36500} value={editingPolicy.retentionDays} onChange={(e) => setEditingPolicy((p) => p ? { ...p, retentionDays: parseInt(e.target.value, 10) || 1 } : p)} style={inputStyle} />
                                </div>
                                <div>
                                  <label style={labelStyle}>Purge strategy</label>
                                  <select value={editingPolicy.purgeStrategy} onChange={(e) => setEditingPolicy((p) => p ? { ...p, purgeStrategy: e.target.value as "archive" | "delete" | "anonymize" } : p)} style={{ ...inputStyle, appearance: "none" }}>
                                    <option value="delete">Hard delete</option>
                                    <option value="anonymize">Anonymize PII</option>
                                    <option value="archive">Archive</option>
                                  </select>
                                </div>
                                <div>
                                  <label style={labelStyle}>Status</label>
                                  <select value={editingPolicy.isActive ? "active" : "inactive"} onChange={(e) => setEditingPolicy((p) => p ? { ...p, isActive: e.target.value === "active" } : p)} style={{ ...inputStyle, appearance: "none" }}>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                  </select>
                                </div>
                              </div>
                              <div>
                                <label style={labelStyle}>Description</label>
                                <input type="text" value={editingPolicy.description} onChange={(e) => setEditingPolicy((p) => p ? { ...p, description: e.target.value } : p)} style={inputStyle} maxLength={500} />
                              </div>
                              <div style={{ display: "flex", gap: "0.625rem" }}>
                                <button onClick={() => savePolicyMutation.mutate({ ...editingPolicy, purgeStrategy: editingPolicy.purgeStrategy as "delete" | "anonymize" | "archive" })} disabled={savePolicyMutation.isPending} style={{ padding: "0.5rem 1rem", borderRadius: "6px", fontSize: "12px", fontWeight: 600, background: "hsl(192,72%,48%)", color: "hsl(210,12%,5%)", border: "none", cursor: "pointer" }}>
                                  {savePolicyMutation.isPending ? "Saving…" : "Save policy"}
                                </button>
                                <button onClick={() => setEditingPolicy(null)} style={{ padding: "0.5rem 1rem", borderRadius: "6px", fontSize: "12px", background: "transparent", border: "1px solid hsla(0,0%,100%,0.09)", color: "hsl(210,5%,50%)", cursor: "pointer" }}>Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                              {policy ? (
                                <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
                                  {[
                                    { label: "Retention", value: `${policy.retentionDays} days` },
                                    { label: "Strategy", value: PURGE_STRATEGY_LABELS[policy.purgeStrategy] ?? policy.purgeStrategy },
                                    { label: "Last run", value: policy.lastRunAt ? new Date(policy.lastRunAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Never" },
                                  ].map((item) => (
                                    <div key={item.label}>
                                      <span style={{ ...labelStyle, display: "block" }}>{item.label}</span>
                                      <span style={{ fontSize: "13px", color: "hsl(38,12%,78%)" }}>{item.value}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p style={{ fontSize: "13px", color: "hsl(210,5%,45%)" }}>No retention policy configured. Default platform policy applies.</p>
                              )}
                              <button onClick={() => startEdit(table)} style={{ padding: "0.5rem 1rem", borderRadius: "6px", fontSize: "12px", fontWeight: 600, background: "hsla(0,0%,100%,0.05)", border: "1px solid hsla(0,0%,100%,0.09)", color: "hsl(38,12%,78%)", cursor: "pointer" }}>
                                {policy ? "Edit policy" : "Add policy"}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
  
            <div style={sectionStyle}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <h2 style={{ fontSize: "13px", fontWeight: 700, color: "hsl(38,12%,75%)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Retention Audit Log</h2>
                <button onClick={() => refetchAudit()} style={{ padding: "0.375rem 0.75rem", borderRadius: "6px", fontSize: "11px", background: "transparent", border: "1px solid hsla(0,0%,100%,0.08)", color: "hsl(210,5%,45%)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                  <RefreshCw size={10} /> Refresh
                </button>
              </div>
  
              {auditEntries.length === 0 ? (
                <div style={{ ...cardStyle, textAlign: "center", padding: "2rem" }}>
                  <p style={{ fontSize: "13px", color: "hsl(210,5%,45%)" }}>No audit log entries yet. Policy changes and purge events will appear here.</p>
                </div>
              ) : (
                <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid hsla(0,0%,100%,0.06)" }}>
                        {["Time", "Table", "Action", "Actor", "Affected rows", "Status"].map((h) => (
                          <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "hsl(210,5%,38%)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {auditEntries.map((entry, i: number) => (
                        <tr key={entry.id} style={{ borderBottom: i < auditEntries.length - 1 ? "1px solid hsla(0,0%,100%,0.04)" : "none" }}>
                          <td style={{ padding: "0.75rem 1rem", fontSize: "11px", color: "hsl(210,5%,42%)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
                            {new Date(entry.executedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td style={{ padding: "0.75rem 1rem", fontSize: "12px", color: "hsl(38,12%,75%)", fontFamily: "var(--font-mono)" }}>{entry.tableName}</td>
                          <td style={{ padding: "0.75rem 1rem", fontSize: "12px", color: "hsl(210,5%,55%)" }}>{entry.action.replace(/_/g, " ")}</td>
                          <td style={{ padding: "0.75rem 1rem", fontSize: "12px", color: "hsl(210,5%,50%)" }}>{entry.actorName ?? "—"}</td>
                          <td style={{ padding: "0.75rem 1rem", fontSize: "12px", color: "hsl(210,5%,55%)" }}>{entry.affectedRows ?? "—"}</td>
                          <td style={{ padding: "0.75rem 1rem" }}>
                            <span style={{ fontSize: "11px", fontWeight: 600, color: STATUS_COLORS[entry.status] ?? "hsl(210,5%,45%)" }}>{entry.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
  
            <div style={{ padding: "1rem 1.25rem", borderRadius: "8px", background: "hsla(45,80%,50%,0.05)", border: "1px solid hsla(45,80%,50%,0.15)", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
              <AlertTriangle size={14} style={{ color: "hsl(45,80%,52%)", flexShrink: 0, marginTop: "2px" }} />
              <p style={{ fontSize: "12px", lineHeight: 1.6, color: "hsl(210,5%,52%)", margin: 0 }}>
                Purge operations are irreversible. Always verify the retention period and strategy before running a purge. The audit log records all purge events for compliance purposes. Legal hold policies may supersede configured retention periods.
              </p>
            </div>
          </m.div>
        </div>
      </div>
        </>
  );
}
