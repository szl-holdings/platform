import { ApiError } from "@szl-holdings/shared-ui/api-fetch";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@szl-holdings/shared-ui/api-fetch";
import {

  Rocket,
  History,
  RotateCcw,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  GitCommit,
  Server,
  Clock,
  User,
  X,
} from "lucide-react";
import { useStandardMutation, useStandardQuery } from "@szl-holdings/api-client-react";

type DeploymentStatus = "active" | "deploying" | "rolled-back" | "failed" | "inactive";
type DeploymentEnvironment = "development" | "staging" | "production";

interface DeploymentUserSummary {
  id: number;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  team: string | null;
}

interface DeploymentRecord {
  appId: string;
  appName: string;
  version: string;
  environment: DeploymentEnvironment;
  status: DeploymentStatus;
  deployedAt: string;
  deployedBy: string;
  deployedByUser?: DeploymentUserSummary;
  ownerTeam?: string;
  commitSha?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

function TeamPill({ team, tone = "owner" }: { team: string; tone?: "owner" | "person" }) {
  const color = tone === "owner" ? "#7dd3fc" : "#cdb8f0";
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
      style={{
        color,
        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 28%, transparent)`,
      }}
      title={tone === "owner" ? `Owning team: ${team}` : `On team: ${team}`}
    >
      {team}
    </span>
  );
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function DeployerBadge({
  record,
  size = "sm",
  prefix,
}: {
  record: DeploymentRecord;
  size?: "sm" | "md";
  prefix?: string;
}) {
  const user = record.deployedByUser;
  const name = user?.displayName ?? record.deployedBy;
  const dim = size === "md" ? 20 : 16;
  const fontSize = size === "md" ? 9 : 8;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-mono"
      style={{ color: "var(--color-fg-muted)" }}
      title={user?.email ?? record.deployedBy}
    >
      {prefix && <span className="opacity-70">{prefix}</span>}
      {user?.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt=""
          width={dim}
          height={dim}
          className="rounded-full object-cover shrink-0"
          style={{ border: "1px solid var(--color-surface-border)" }}
        />
      ) : (
        <span
          className="inline-flex items-center justify-center rounded-full font-bold shrink-0"
          style={{
            width: dim,
            height: dim,
            fontSize,
            backgroundColor: "color-mix(in srgb, #8b7ac8 18%, transparent)",
            color: "#cdb8f0",
            border: "1px solid color-mix(in srgb, #8b7ac8 30%, transparent)",
          }}
        >
          {initialsFor(name)}
        </span>
      )}
      <span className="truncate" style={{ color: "var(--color-fg-secondary, var(--color-fg-primary))" }}>
        {name}
      </span>
      {user?.team ? (
        <TeamPill team={user.team} tone="person" />
      ) : !user ? (
        <span
          className="text-[9px] font-mono uppercase tracking-wider px-1 py-0.5 rounded opacity-70"
          style={{
            color: "var(--color-fg-muted)",
            border: "1px dashed var(--color-surface-border)",
          }}
          title="Not a registered user (likely a CI bot or automation)"
        >
          unregistered
        </span>
      ) : null}
    </span>
  );
}

/**
 * For a rollback row, find the latest non-rollback deployment of the same
 * version that preceded it — that's the person who originally shipped that
 * version. Shows "Rolled back by X · originally shipped by Y".
 */
function findOriginalDeployerFor(
  entry: DeploymentRecord,
  history: DeploymentRecord[],
): DeploymentRecord | undefined {
  if (!entry.notes?.startsWith("Rolled back from")) return undefined;
  const entryTime = new Date(entry.deployedAt).getTime();
  const candidates = history
    .filter(
      (h) =>
        h.version === entry.version &&
        new Date(h.deployedAt).getTime() < entryTime &&
        !h.notes?.startsWith("Rolled back from"),
    )
    .sort((a, b) => new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime());
  return candidates[0];
}

interface ListResponse {
  deployments: DeploymentRecord[];
  environment: string;
  count: number;
}

interface HistoryResponse {
  appId: string;
  environment: string;
  history: DeploymentRecord[];
  count: number;
}

interface RollbackResponse {
  rolledBack: boolean;
  previous: DeploymentRecord;
  current: DeploymentRecord;
}

const ENVIRONMENTS: DeploymentEnvironment[] = ["production", "staging", "development"];

const STATUS_STYLES: Record<DeploymentStatus, { color: string; label: string; icon: typeof CheckCircle2 }> = {
  active: { color: "#10b981", label: "Active", icon: CheckCircle2 },
  deploying: { color: "#8b7ac8", label: "Deploying", icon: Loader2 },
  "rolled-back": { color: "#f59e0b", label: "Rolled Back", icon: RotateCcw },
  failed: { color: "#ef4444", label: "Failed", icon: XCircle },
  inactive: { color: "#64748b", label: "Inactive", icon: Clock },
};

function StatusBadge({ status }: { status: DeploymentStatus }) {
  const cfg = STATUS_STYLES[status] ?? STATUS_STYLES.inactive;
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded"
      style={{
        color: cfg.color,
        backgroundColor: `color-mix(in srgb, ${cfg.color} 12%, transparent)`,
        border: `1px solid color-mix(in srgb, ${cfg.color} 25%, transparent)`,
      }}
    >
      <Icon className={`w-3 h-3 ${status === "deploying" ? "animate-spin" : ""}`} />
      {cfg.label}
    </span>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DeploymentsPage() {
  const queryClient = useQueryClient();
  const [environment, setEnvironment] = useState<DeploymentEnvironment>("production");
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [deployerFilter, setDeployerFilter] = useState<string>("");
  const [confirmRollback, setConfirmRollback] = useState<{ appId: string; from: string; to?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Unfiltered list — drives the deployer dropdown options so the choices
  // don't disappear once a filter is applied.
  const allDeployersQuery = useStandardQuery<ListResponse>({
    queryKey: ["deployments", "list", environment, "all-deployers"],
    queryFn: () => apiFetch<ListResponse>(`/deployments?environment=${environment}`),
    refetchInterval: 60_000,
  });

  const listQuery = useStandardQuery<ListResponse>({
    queryKey: ["deployments", "list", environment, deployerFilter || null],
    queryFn: () => {
      const qs = new URLSearchParams({ environment });
      if (deployerFilter) qs.set("deployedBy", deployerFilter);
      return apiFetch<ListResponse>(`/deployments?${qs.toString()}`);
    },
    refetchInterval: 30_000,
  });

  const historyQuery = useStandardQuery<HistoryResponse>({
    queryKey: ["deployments", "history", selectedAppId, environment, deployerFilter || null],
    queryFn: () => {
      const qs = new URLSearchParams({ environment });
      if (deployerFilter) qs.set("deployedBy", deployerFilter);
      return apiFetch<HistoryResponse>(
        `/deployments/${selectedAppId}/history?${qs.toString()}`,
      );
    },
    enabled: !!selectedAppId,
  });

  // Build deployer options from the unfiltered active list, sorted by display
  // name. Each option keeps the principal string (the actual filter value)
  // and an optional resolved user summary for avatars/initials in the menu.
  const deployerOptions = useMemo(() => {
    const map = new Map<
      string,
      { value: string; label: string; user?: DeploymentUserSummary }
    >();
    for (const d of allDeployersQuery.data?.deployments ?? []) {
      if (!d.deployedBy || d.deployedBy === "system") continue;
      if (!map.has(d.deployedBy)) {
        map.set(d.deployedBy, {
          value: d.deployedBy,
          label: d.deployedByUser?.displayName ?? d.deployedBy,
          user: d.deployedByUser,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [allDeployersQuery.data]);

  // If the active filter no longer matches any known deployer (env change,
  // person no longer has active deploys), clear it so the UI doesn't get
  // stuck showing an empty list with no obvious reason.
  if (
    deployerFilter &&
    allDeployersQuery.data &&
    !deployerOptions.some((o) => o.value === deployerFilter)
  ) {
    // Defer the state change to avoid setState-during-render warning.
    queueMicrotask(() => setDeployerFilter(""));
  }

  const rollbackMutation = useStandardMutation({
    mutationFn: async (vars: { appId: string; version?: string }) => {
      return apiFetch<RollbackResponse>(`/deployments/${vars.appId}/rollback`, {
        method: "POST",
        body: JSON.stringify({ environment, version: vars.version }),
      });
    },
    onSuccess: (data, vars) => {
      setError(null);
      setSuccess(
        `Rolled back ${vars.appId} from ${data.previous.version} to ${data.current.version}.`,
      );
      setConfirmRollback(null);
      queryClient.invalidateQueries({ queryKey: ["deployments"] });
    },
    onError: (err: unknown) => {
      setSuccess(null);
      setError(err instanceof ApiError ? err.message : "Rollback failed");
    },
  });

  const deployments = listQuery.data?.deployments ?? [];
  const sortedDeployments = useMemo(
    () => [...deployments].sort((a, b) => a.appName.localeCompare(b.appName)),
    [deployments],
  );

  const selectedActive = sortedDeployments.find((d) => d.appId === selectedAppId);
  const history = historyQuery.data?.history ?? [];
  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime()),
    [history],
  );

  return (
    <div
      className="min-h-full p-6 lg:p-8"
      style={{ backgroundColor: "var(--color-bg-primary)", color: "var(--color-fg-primary)" }}
    >
      <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: "color-mix(in srgb, #8b7ac8 14%, transparent)",
                border: "1px solid color-mix(in srgb, #8b7ac8 30%, transparent)",
              }}
            >
              <Rocket className="w-4 h-4" style={{ color: "#8b7ac8" }} />
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-[0.18em]" style={{ color: "var(--color-fg-muted)" }}>
                Operator Console
              </div>
              <h1 className="text-xl font-bold tracking-tight">Deployments</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ backgroundColor: "var(--color-surface-base)", border: "1px solid var(--color-surface-border)" }}>
              <User className="w-3 h-3" style={{ color: "var(--color-fg-muted)" }} />
              <select
                value={deployerFilter}
                onChange={(e) => setDeployerFilter(e.target.value)}
                aria-label="Filter by deployer"
                className="bg-transparent text-[11px] font-mono outline-none cursor-pointer"
                style={{
                  color: deployerFilter ? "#cdb8f0" : "var(--color-fg-muted)",
                  maxWidth: 180,
                }}
              >
                <option value="">All deployers</option>
                {deployerOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {deployerFilter && (
                <button
                  onClick={() => setDeployerFilter("")}
                  aria-label="Clear deployer filter"
                  className="opacity-70 hover:opacity-100"
                  style={{ color: "var(--color-fg-muted)" }}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: "var(--color-surface-base)", border: "1px solid var(--color-surface-border)" }}>
              {ENVIRONMENTS.map((env) => (
                <button
                  key={env}
                  onClick={() => {
                    setEnvironment(env);
                    setSelectedAppId(null);
                  }}
                  className="px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all"
                  style={{
                    backgroundColor: environment === env ? "color-mix(in srgb, #8b7ac8 18%, transparent)" : "transparent",
                    color: environment === env ? "#cdb8f0" : "var(--color-fg-muted)",
                  }}
                >
                  {env}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                listQuery.refetch();
                if (selectedAppId) historyQuery.refetch();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs"
              style={{ backgroundColor: "var(--color-surface-base)", border: "1px solid var(--color-surface-border)", color: "var(--color-fg-muted)" }}
            >
              <RefreshCw className={`w-3 h-3 ${listQuery.isFetching ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </header>

        {error && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
            style={{ backgroundColor: "color-mix(in srgb, #ef4444 10%, transparent)", border: "1px solid color-mix(in srgb, #ef4444 25%, transparent)", color: "#fca5a5" }}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            {error}
            <button className="ml-auto opacity-70 hover:opacity-100" onClick={() => setError(null)}>×</button>
          </div>
        )}
        {success && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
            style={{ backgroundColor: "color-mix(in srgb, #10b981 10%, transparent)", border: "1px solid color-mix(in srgb, #10b981 25%, transparent)", color: "#86efac" }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {success}
            <button className="ml-auto opacity-70 hover:opacity-100" onClick={() => setSuccess(null)}>×</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-6">
          {/* Active deployments list */}
          <section
            className="rounded-xl overflow-hidden flex flex-col"
            style={{ backgroundColor: "var(--color-surface-base)", border: "1px solid var(--color-surface-border)" }}
          >
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--color-surface-border)" }}>
              <div className="flex items-center gap-2">
                <Server className="w-3.5 h-3.5" style={{ color: "var(--color-fg-muted)" }} />
                <h2 className="text-xs font-bold uppercase tracking-[0.15em]">Active Versions</h2>
              </div>
              <span className="text-[10px] font-mono" style={{ color: "var(--color-fg-muted)" }}>
                {sortedDeployments.length} app{sortedDeployments.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="flex-1">
              {listQuery.isLoading ? (
                <div className="flex items-center justify-center py-10 text-xs" style={{ color: "var(--color-fg-muted)" }}>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading deployments…
                </div>
              ) : listQuery.isError ? (
                <div className="px-4 py-6 text-xs" style={{ color: "#fca5a5" }}>
                  Failed to load deployments: {(listQuery.error as Error)?.message ?? "Unknown error"}
                </div>
              ) : sortedDeployments.length === 0 ? (
                <div className="px-4 py-10 text-center text-xs" style={{ color: "var(--color-fg-muted)" }}>
                  No active deployments registered for <span className="font-mono">{environment}</span>.
                </div>
              ) : (
                <ul>
                  {sortedDeployments.map((d) => {
                    const active = selectedAppId === d.appId;
                    return (
                      <li key={d.appId}>
                        <button
                          onClick={() => setSelectedAppId(d.appId)}
                          className="w-full text-left px-4 py-3 flex items-center gap-3 transition-all"
                          style={{
                            backgroundColor: active ? "color-mix(in srgb, #8b7ac8 10%, transparent)" : "transparent",
                            borderBottom: "1px solid var(--color-surface-border)",
                            borderLeft: active ? "3px solid #8b7ac8" : "3px solid transparent",
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-sm font-semibold truncate">{d.appName}</span>
                              <span className="text-[10px] font-mono" style={{ color: "var(--color-fg-muted)" }}>
                                {d.appId}
                              </span>
                              {d.ownerTeam && <TeamPill team={d.ownerTeam} tone="owner" />}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-mono" style={{ color: "#cdb8f0" }}>{d.version}</span>
                              <StatusBadge status={d.status} />
                              <span className="text-[10px] font-mono" style={{ color: "var(--color-fg-muted)" }}>
                                {formatTime(d.deployedAt)}
                              </span>
                              <DeployerBadge record={d} />
                            </div>
                          </div>
                          <ChevronRight
                            className="w-3.5 h-3.5"
                            style={{ color: active ? "#8b7ac8" : "var(--color-fg-muted)" }}
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          {/* History panel */}
          <section
            className="rounded-xl overflow-hidden flex flex-col"
            style={{ backgroundColor: "var(--color-surface-base)", border: "1px solid var(--color-surface-border)" }}
          >
            <div className="flex items-center justify-between px-4 py-3 gap-3" style={{ borderBottom: "1px solid var(--color-surface-border)" }}>
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <History className="w-3.5 h-3.5" style={{ color: "var(--color-fg-muted)" }} />
                <h2 className="text-xs font-bold uppercase tracking-[0.15em] truncate">
                  {selectedActive ? `${selectedActive.appName} History` : "Deployment History"}
                </h2>
                {selectedActive?.ownerTeam && (
                  <TeamPill team={selectedActive.ownerTeam} tone="owner" />
                )}
              </div>
              {selectedActive && (
                <button
                  onClick={() =>
                    setConfirmRollback({
                      appId: selectedActive.appId,
                      from: selectedActive.version,
                    })
                  }
                  disabled={sortedHistory.length < 2 || rollbackMutation.isPending}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-mono uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: "color-mix(in srgb, #f59e0b 14%, transparent)",
                    border: "1px solid color-mix(in srgb, #f59e0b 35%, transparent)",
                    color: "#fbbf24",
                  }}
                >
                  <RotateCcw className="w-3 h-3" />
                  Roll back
                </button>
              )}
            </div>
            <div className="flex-1">
              {!selectedAppId ? (
                <div className="px-6 py-12 text-center text-xs" style={{ color: "var(--color-fg-muted)" }}>
                  Select an app on the left to view its deployment history.
                </div>
              ) : historyQuery.isLoading ? (
                <div className="flex items-center justify-center py-10 text-xs" style={{ color: "var(--color-fg-muted)" }}>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading history…
                </div>
              ) : historyQuery.isError ? (
                <div className="px-4 py-6 text-xs" style={{ color: "#fca5a5" }}>
                  Failed to load history: {(historyQuery.error as Error)?.message ?? "Unknown error"}
                </div>
              ) : sortedHistory.length === 0 ? (
                <div className="px-4 py-10 text-center text-xs" style={{ color: "var(--color-fg-muted)" }}>
                  No deployment records for this app in <span className="font-mono">{environment}</span>.
                </div>
              ) : (
                <ol className="px-4 py-3 flex flex-col gap-2">
                  {sortedHistory.map((entry, idx) => {
                    const isCurrentActive = entry.status === "active";
                    const canRollbackTo = !isCurrentActive && entry.status !== "failed";
                    return (
                      <li
                        key={`${entry.version}-${entry.deployedAt}-${idx}`}
                        className="rounded-lg p-3 flex items-start gap-3"
                        style={{
                          backgroundColor: isCurrentActive
                            ? "color-mix(in srgb, #10b981 8%, transparent)"
                            : "var(--color-bg-elevated)",
                          border: isCurrentActive
                            ? "1px solid color-mix(in srgb, #10b981 30%, transparent)"
                            : "1px solid var(--color-surface-border)",
                        }}
                      >
                        <div
                          className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: "color-mix(in srgb, #8b7ac8 14%, transparent)",
                            border: "1px solid color-mix(in srgb, #8b7ac8 25%, transparent)",
                          }}
                        >
                          <GitCommit className="w-3.5 h-3.5" style={{ color: "#cdb8f0" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-sm font-mono font-semibold" style={{ color: "var(--color-fg-primary)" }}>
                              {entry.version}
                            </span>
                            <StatusBadge status={entry.status} />
                            {entry.commitSha && (
                              <span
                                className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                                style={{
                                  backgroundColor: "var(--color-bg-elevated)",
                                  border: "1px solid var(--color-surface-border)",
                                  color: "var(--color-fg-muted)",
                                }}
                              >
                                {entry.commitSha.slice(0, 8)}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono mb-1" style={{ color: "var(--color-fg-muted)" }}>
                            {formatTime(entry.deployedAt)}
                          </div>
                          {(() => {
                            const isRollback = entry.notes?.startsWith("Rolled back from") ?? false;
                            const original = isRollback
                              ? findOriginalDeployerFor(entry, sortedHistory)
                              : undefined;
                            return (
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                                <DeployerBadge
                                  record={entry}
                                  prefix={isRollback ? "Rolled back by" : "Shipped by"}
                                />
                                {original && original.deployedBy !== entry.deployedBy && (
                                  <DeployerBadge
                                    record={original}
                                    prefix="originally shipped by"
                                  />
                                )}
                              </div>
                            );
                          })()}
                          {entry.notes && (
                            <div className="text-xs leading-relaxed" style={{ color: "var(--color-fg-secondary, var(--color-fg-muted))" }}>
                              {entry.notes}
                            </div>
                          )}
                        </div>
                        {canRollbackTo && (
                          <button
                            onClick={() =>
                              setConfirmRollback({
                                appId: entry.appId,
                                from: selectedActive?.version ?? "current",
                                to: entry.version,
                              })
                            }
                            disabled={rollbackMutation.isPending}
                            className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-md shrink-0 disabled:opacity-40"
                            style={{
                              backgroundColor: "color-mix(in srgb, #f59e0b 12%, transparent)",
                              border: "1px solid color-mix(in srgb, #f59e0b 30%, transparent)",
                              color: "#fbbf24",
                            }}
                          >
                            Roll back to this
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Confirm rollback modal */}
      {confirmRollback && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(8,12,20,0.72)" }}
          onClick={() => !rollbackMutation.isPending && setConfirmRollback(null)}
        >
          <div
            className="max-w-md w-full rounded-xl p-5"
            style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-surface-border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: "color-mix(in srgb, #f59e0b 14%, transparent)",
                  border: "1px solid color-mix(in srgb, #f59e0b 35%, transparent)",
                }}
              >
                <AlertTriangle className="w-4 h-4" style={{ color: "#fbbf24" }} />
              </div>
              <div>
                <div className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--color-fg-muted)" }}>
                  Confirm Rollback
                </div>
                <h3 className="text-base font-bold">
                  {confirmRollback.appId} · {environment}
                </h3>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--color-fg-muted)" }}>
              This will roll <span className="font-mono" style={{ color: "var(--color-fg-primary)" }}>{confirmRollback.appId}</span> back from{" "}
              <span className="font-mono" style={{ color: "#fbbf24" }}>{confirmRollback.from}</span> to{" "}
              <span className="font-mono" style={{ color: "#86efac" }}>
                {confirmRollback.to ?? "the previous version"}
              </span>{" "}
              in the <span className="font-mono">{environment}</span> environment. The current version will be marked rolled-back.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                disabled={rollbackMutation.isPending}
                onClick={() => setConfirmRollback(null)}
                className="px-3 py-1.5 rounded-md text-xs"
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid var(--color-surface-border)",
                  color: "var(--color-fg-muted)",
                }}
              >
                Cancel
              </button>
              <button
                disabled={rollbackMutation.isPending}
                onClick={() =>
                  rollbackMutation.mutate({ appId: confirmRollback.appId, version: confirmRollback.to })
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold"
                style={{
                  backgroundColor: "color-mix(in srgb, #f59e0b 22%, transparent)",
                  border: "1px solid color-mix(in srgb, #f59e0b 45%, transparent)",
                  color: "#fbbf24",
                }}
              >
                {rollbackMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                Confirm rollback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
