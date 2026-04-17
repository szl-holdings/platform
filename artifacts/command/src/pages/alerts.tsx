import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { OpsLayout } from "../components/ops-layout";
import { Bell, BellOff, ArrowUpRight, Clock, CheckCircle2, AlarmClock, ChevronDown, Filter, Settings, XCircle } from "lucide-react";
import { EmptyState } from "@szl-holdings/shared-ui/EmptyState";

type AlertStatus = "active" | "acknowledged" | "snoozed" | "resolved";
type AlertPriority = "critical" | "high" | "medium" | "low";

interface ApiAlertsResponse {
  alerts: Alert[];
  counts: { active: number; critical: number; acknowledged: number; snoozed: number };
  generatedAt: string;
  dataSource: "live" | "empty";
}

interface Alert {
  id: string;
  domain: string;
  domainColor: string;
  priority: AlertPriority;
  title: string;
  description: string;
  time: string;
  status: AlertStatus;
  category: string;
  assignee?: string;
}

const INITIAL_ALERTS: Alert[] = [
  { id: "a1", domain: "Vessels", domainColor: "#0ea5e9", priority: "critical", title: "Engine room fire suppression triggered — MV Poseidon", description: "Automatic suppression system activated. Port engine offline. Vessel diverting to Piraeus.", time: "2m ago", status: "active", category: "Emergency", assignee: "Ops Team" },
  { id: "a2", domain: "Aegis", domainColor: "#ef4444", priority: "critical", title: "Credential breach attempt — Maritime OT Systems", description: "7 failed authentication attempts from IP 185.220.101.x targeting SCADA interface.", time: "8m ago", status: "active", category: "Security" },
  { id: "a3", domain: "Lyte", domainColor: "#f97316", priority: "high", title: "API response times exceeding 2s SLA threshold", description: "P95 latency at 2.4s for /scheduling/routes endpoint. Affecting 12 active operators.", time: "15m ago", status: "acknowledged", category: "Performance", assignee: "Eng Team" },
  { id: "a4", domain: "Terra", domainColor: "#22c55e", priority: "high", title: "Deal deadline: Miami Beach Commercial — 48h remaining", description: "Binding agreement deadline for $42M commercial acquisition. Legal review incomplete.", time: "1h ago", status: "active", category: "Deadline" },
  { id: "a5", domain: "PRISM", domainColor: "#a855f7", priority: "high", title: "Force majeure clause triggered — Q3 Cargo Agreement", description: "Oil price threshold crossed. Legal review required for 3 affected contracts.", time: "2h ago", status: "active", category: "Legal" },
  { id: "a6", domain: "Vessels", domainColor: "#0ea5e9", priority: "medium", title: "MV Argo fuel consumption 18% above forecast", description: "Current heading optimization suggests 4.2% reduction if route adjusted by 12°N.", time: "3h ago", status: "snoozed", category: "Operations" },
  { id: "a7", domain: "SZL", domainColor: "#f59e0b", priority: "medium", title: "NAV calculation delayed — market data feed latency", description: "Bloomberg feed latency causing 15-min delay in daily NAV computation.", time: "4h ago", status: "acknowledged", category: "Data", assignee: "Finance Ops" },
  { id: "a8", domain: "Aegis", domainColor: "#ef4444", priority: "medium", title: "SSL certificate expiring in 14 days — legacy.szl.net", description: "Auto-renewal failed. Manual intervention required before expiry on Apr 29.", time: "5h ago", status: "active", category: "Infrastructure" },
  { id: "a9", domain: "Carlota Jo", domainColor: "#ec4899", priority: "low", title: "Client satisfaction score below target — Q1 Review", description: "3 engagements below 85% satisfaction threshold. Advisory flagged for review.", time: "6h ago", status: "snoozed", category: "Client" },
  { id: "a10", domain: "Terra", domainColor: "#22c55e", priority: "low", title: "Market data stale for Austin Industrial portfolio", description: "Comparable sales data 30+ days old. Re-evaluation recommended.", time: "8h ago", status: "resolved", category: "Data" },
];

const PRIORITY_COLORS: Record<AlertPriority, string> = {
  critical: "var(--color-critical)",
  high: "var(--color-high)",
  medium: "var(--color-medium)",
  low: "var(--color-low)",
};

const STATUS_ICONS: Record<AlertStatus, React.ElementType> = {
  active: Bell,
  acknowledged: CheckCircle2,
  snoozed: AlarmClock,
  resolved: BellOff,
};

export default function AlertsPage() {
  const { data: apiData } = useQuery<ApiAlertsResponse>({
    queryKey: ["command-alerts"],
    queryFn: async () => {
      const res = await fetch("/api/command/alerts", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load alerts");
      const json = await res.json();
      return (json?.data ?? json) as ApiAlertsResponse;
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  useEffect(() => {
    if (apiData?.alerts !== undefined) {
      setAlerts(apiData.alerts);
    }
  }, [apiData]);
  const [filter, setFilter] = useState<AlertStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<AlertPriority | "all">("all");
  const [domainFilter, setDomainFilter] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [prefsOpen, setPrefsOpen] = useState(false);

  const domains = Array.from(new Set(INITIAL_ALERTS.map((a) => a.domain)));

  const filtered = alerts.filter((a) => {
    if (filter !== "all" && a.status !== filter) return false;
    if (priorityFilter !== "all" && a.priority !== priorityFilter) return false;
    if (domainFilter !== "all" && a.domain !== domainFilter) return false;
    return true;
  });

  const counts = {
    active: alerts.filter((a) => a.status === "active").length,
    critical: alerts.filter((a) => a.priority === "critical" && a.status === "active").length,
    acknowledged: alerts.filter((a) => a.status === "acknowledged").length,
    snoozed: alerts.filter((a) => a.status === "snoozed").length,
  };

  const updateStatus = (id: string, status: AlertStatus) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    if (selected === id && status === "resolved") setSelected(null);
  };

  const selectedAlert = alerts.find((a) => a.id === selected);

  return (
    <OpsLayout title="Alert Inbox">
      <div className="flex flex-col gap-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Alerts", value: counts.active, color: "var(--color-high)", icon: Bell },
            { label: "Critical", value: counts.critical, color: "var(--color-critical)", icon: XCircle },
            { label: "Acknowledged", value: counts.acknowledged, color: "var(--color-medium)", icon: CheckCircle2 },
            { label: "Snoozed", value: counts.snoozed, color: "var(--color-fg-muted)", icon: AlarmClock },
          ].map(({ label, value, color, icon: Icon }) => (
            <div
              key={label}
              className="p-4 rounded-xl flex items-center gap-4"
              style={{ backgroundColor: "var(--color-surface-base)", border: "1px solid var(--color-surface-border)" }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 30%, transparent)` }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono" style={{ color }}>{value}</div>
                <div className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--color-fg-muted)" }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-3.5 h-3.5" style={{ color: "var(--color-fg-muted)" }} />
          <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: "var(--color-surface-base)", border: "1px solid var(--color-surface-border)" }}>
            {(["all", "active", "acknowledged", "snoozed", "resolved"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className="px-3 py-1 rounded-md text-xs font-medium transition-all capitalize"
                style={{
                  backgroundColor: filter === s ? "var(--color-bg-elevated)" : "transparent",
                  color: filter === s ? "var(--color-fg-primary)" : "var(--color-fg-muted)",
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as AlertPriority | "all")}
            className="px-2 py-1 rounded-lg text-xs"
            style={{ backgroundColor: "var(--color-surface-base)", border: "1px solid var(--color-surface-border)", color: "var(--color-fg-muted)" }}
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="px-2 py-1 rounded-lg text-xs"
            style={{ backgroundColor: "var(--color-surface-base)", border: "1px solid var(--color-surface-border)", color: "var(--color-fg-muted)" }}
          >
            <option value="all">All Domains</option>
            {domains.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setPrefsOpen(!prefsOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
              style={{ backgroundColor: "var(--color-surface-base)", border: "1px solid var(--color-surface-border)", color: "var(--color-fg-muted)" }}
            >
              <Settings className="w-3 h-3" />
              Preferences
            </button>
          </div>
        </div>

        {prefsOpen && (
          <div
            className="rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-6"
            style={{ backgroundColor: "var(--color-surface-base)", border: "1px solid var(--color-surface-border)" }}
          >
            <div>
              <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--color-fg-muted)" }}>Notification Channels</div>
              {["In-App Inbox", "Email Digest (Daily)", "Email Digest (Immediate)", "Mobile Push"].map((ch) => (
                <label key={ch} className="flex items-center gap-2 py-1.5 cursor-pointer">
                  <input type="checkbox" defaultChecked={ch.startsWith("In-App") || ch === "Email Digest (Daily)"} className="rounded" style={{ accentColor: "#8b7ac8" }} />
                  <span className="text-xs" style={{ color: "var(--color-fg-secondary)" }}>{ch}</span>
                </label>
              ))}
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--color-fg-muted)" }}>Priority Threshold</div>
              {(["critical", "high", "medium", "low"] as AlertPriority[]).map((p) => (
                <label key={p} className="flex items-center gap-2 py-1.5 cursor-pointer">
                  <input type="checkbox" defaultChecked={p !== "low"} className="rounded" style={{ accentColor: "#8b7ac8" }} />
                  <span className="text-xs capitalize" style={{ color: PRIORITY_COLORS[p] }}>{p}</span>
                </label>
              ))}
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--color-fg-muted)" }}>Snooze Defaults</div>
              {["15 minutes", "1 hour", "4 hours", "Until tomorrow", "Until resolved"].map((t) => (
                <label key={t} className="flex items-center gap-2 py-1.5 cursor-pointer">
                  <input type="radio" name="snooze" defaultChecked={t === "1 hour"} style={{ accentColor: "#8b7ac8" }} />
                  <span className="text-xs" style={{ color: "var(--color-fg-secondary)" }}>{t}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Alert List + Detail Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: "500px" }}>
          <div className="lg:col-span-2 flex flex-col gap-2">
            {filtered.length === 0 && (
              <EmptyState
                icon={BellOff}
                headline="No alerts match the current filters"
                description="Try adjusting the severity or status filter to see more results."
                compact
              />
            )}
            {filtered.map((alert) => {
              const StatusIcon = STATUS_ICONS[alert.status];
              const isSelected = selected === alert.id;
              return (
                <div
                  key={alert.id}
                  onClick={() => setSelected(isSelected ? null : alert.id)}
                  className="rounded-xl p-4 cursor-pointer transition-all"
                  style={{
                    backgroundColor: isSelected ? "var(--color-bg-elevated)" : "var(--color-surface-base)",
                    border: `1px solid ${isSelected ? "#8b7ac8" : "var(--color-surface-border)"}`,
                    borderLeftWidth: "3px",
                    borderLeftColor: PRIORITY_COLORS[alert.priority],
                    opacity: alert.status === "resolved" ? 0.5 : 1,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${alert.domainColor} 12%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${alert.domainColor} 30%, transparent)`,
                      }}
                    >
                      <span className="text-[10px] font-bold" style={{ color: alert.domainColor }}>{alert.domain[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: alert.domainColor }}>{alert.domain}</span>
                        <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--color-fg-muted)", opacity: 0.5 }}>/</span>
                        <span className="text-[10px] font-mono uppercase" style={{ color: PRIORITY_COLORS[alert.priority] }}>{alert.priority}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--color-bg-elevated)", color: "var(--color-fg-muted)", border: "1px solid var(--color-surface-border)" }}>{alert.category}</span>
                      </div>
                      <div className="text-sm font-semibold truncate" style={{ color: "var(--color-fg-primary)" }}>{alert.title}</div>
                      {isSelected && (
                        <div className="text-xs mt-1 leading-relaxed" style={{ color: "var(--color-fg-muted)" }}>{alert.description}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono" style={{ color: "var(--color-fg-muted)" }}>{alert.time}</span>
                      <StatusIcon className="w-3.5 h-3.5" style={{ color: "var(--color-fg-muted)" }} />
                    </div>
                  </div>
                  {isSelected && (
                    <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: "1px solid var(--color-surface-border)" }}>
                      {alert.status !== "acknowledged" && alert.status !== "resolved" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); updateStatus(alert.id, "acknowledged"); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                          style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-surface-border)", color: "var(--color-fg-secondary)" }}
                        >
                          <CheckCircle2 className="w-3 h-3" /> Acknowledge
                        </button>
                      )}
                      {alert.status !== "snoozed" && alert.status !== "resolved" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); updateStatus(alert.id, "snoozed"); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                          style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-surface-border)", color: "var(--color-fg-secondary)" }}
                        >
                          <AlarmClock className="w-3 h-3" /> Snooze 1h
                        </button>
                      )}
                      {alert.status !== "resolved" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); updateStatus(alert.id, "resolved"); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                          style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-surface-border)", color: "var(--color-low)" }}
                        >
                          <CheckCircle2 className="w-3 h-3" /> Resolve
                        </button>
                      )}
                      <button
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ml-auto"
                        style={{ backgroundColor: "#8b7ac820", border: "1px solid #8b7ac840", color: "#8b7ac8" }}
                      >
                        <ArrowUpRight className="w-3 h-3" /> Escalate
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Panel */}
          <div className="flex flex-col gap-4">
            {selectedAlert ? (
              <div
                className="rounded-xl p-5 flex flex-col gap-4"
                style={{ backgroundColor: "var(--color-surface-base)", border: "1px solid var(--color-surface-border)" }}
              >
                <div className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "var(--color-fg-muted)" }}>Alert Details</div>
                <div>
                  <div className="text-sm font-bold mb-2" style={{ color: "var(--color-fg-primary)" }}>{selectedAlert.title}</div>
                  <div className="text-xs leading-relaxed" style={{ color: "var(--color-fg-muted)" }}>{selectedAlert.description}</div>
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    { label: "Domain", value: selectedAlert.domain, color: selectedAlert.domainColor },
                    { label: "Priority", value: selectedAlert.priority, color: PRIORITY_COLORS[selectedAlert.priority] },
                    { label: "Category", value: selectedAlert.category, color: "var(--color-fg-secondary)" },
                    { label: "Status", value: selectedAlert.status, color: "var(--color-fg-secondary)" },
                    { label: "Received", value: selectedAlert.time, color: "var(--color-fg-muted)" },
                    ...(selectedAlert.assignee ? [{ label: "Assignee", value: selectedAlert.assignee, color: "var(--color-fg-secondary)" }] : []),
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex justify-between items-center py-1.5" style={{ borderBottom: "1px solid var(--color-surface-border)" }}>
                      <span className="text-xs font-mono uppercase tracking-wide" style={{ color: "var(--color-fg-muted)" }}>{label}</span>
                      <span className="text-xs font-semibold capitalize" style={{ color }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div
                  className="rounded-xl p-5"
                  style={{ backgroundColor: "var(--color-surface-base)", border: "1px solid var(--color-surface-border)" }}
                >
                  <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: "var(--color-fg-muted)" }}>Alert Volume (24h)</div>
                  <div className="flex items-end gap-1 h-20">
                    {[4, 7, 3, 9, 5, 2, 8, 11, 6, 4, 7, 3].map((v, i) => (
                      <div key={i} className="flex-1 rounded-sm" style={{ height: `${(v / 11) * 100}%`, backgroundColor: i === 11 ? "#8b7ac8" : "var(--color-bg-elevated)" }} />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] font-mono" style={{ color: "var(--color-fg-muted)" }}>12h ago</span>
                    <span className="text-[9px] font-mono" style={{ color: "var(--color-fg-muted)" }}>Now</span>
                  </div>
                </div>
                <div
                  className="rounded-xl p-5"
                  style={{ backgroundColor: "var(--color-surface-base)", border: "1px solid var(--color-surface-border)" }}
                >
                  <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: "var(--color-fg-muted)" }}>By Domain</div>
                  {domains.map((d) => {
                    const count = alerts.filter((a) => a.domain === d && a.status === "active").length;
                    const total = alerts.filter((a) => a.domain === d).length;
                    const color = INITIAL_ALERTS.find((a) => a.domain === d)?.domainColor ?? "#888";
                    return (
                      <div key={d} className="flex items-center gap-2 py-1.5">
                        <span className="text-xs w-20 shrink-0" style={{ color }}>{d}</span>
                        <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: "var(--color-bg-elevated)" }}>
                          <div className="h-full rounded-full" style={{ width: `${(count / Math.max(total, 1)) * 100}%`, backgroundColor: color }} />
                        </div>
                        <span className="text-xs font-mono w-6 text-right" style={{ color: "var(--color-fg-muted)" }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </OpsLayout>
  );
}
