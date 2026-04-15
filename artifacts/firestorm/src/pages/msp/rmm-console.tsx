import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { Button } from "@szl-holdings/shared-ui/ui/button";
import {
import { apiFetch } from "@szl-holdings/shared-ui";
  Monitor, AlertTriangle, CheckCircle, RefreshCw, Shield, Package, Terminal, Cpu,
  HardDrive, MemoryStick, Activity, Play, RotateCcw, Zap, ChevronRight, X,
  Clock, Server, Wifi, WifiOff, Wrench, Eye, CheckSquare, XCircle,
} from "lucide-react";
import { Skeleton } from "@szl-holdings/shared-ui/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include", ...options });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

interface Device {
  id: number;
  deviceId: string;
  hostname: string;
  clientName: string;
  type: string;
  os: string;
  ipAddress: string;
  status: "online" | "warning" | "critical" | "offline";
  cpu: number;
  memory: number;
  disk: number;
  alerts: number;
  patchesPending: number;
  threats: number;
  lastSeen: string;
}

interface RmmProvider {
  id: number;
  name: string;
  provider: string;
  status: string;
  mode: string;
  lastSyncAt: string | null;
  deviceCount: number | null;
}

interface RemoteAction {
  id: number;
  actionType: string;
  target: string | null;
  status: string;
  requiresApproval: boolean;
  requestedBy: string;
  approvedBy: string | null;
  createdAt: string;
  completedAt: string | null;
  hostname?: string;
  clientName?: string;
  errorMessage?: string | null;
}

interface HealingExecution {
  id: number;
  playbookName?: string;
  hostname?: string;
  clientName?: string;
  status: string;
  triggeredBy: string;
  healingConfidenceScore: number | null;
  createdAt: string;
  completedAt?: string | null;
}

interface SystemMetrics {
  device: { id: string; hostname: string; platform: string; arch: string; release: string; type: string; status: string };
  metrics: {
    cpu: { percent: number; cores: number; loadAvg1m: number; loadAvg5m: number; loadAvg15m: number };
    memory: { percent: number; totalGb: number; freeGb: number; usedGb: number; processRssGb: number; processHeapUsedGb: number };
    uptime: { seconds: number; hours: number; days: number; formatted: string };
    process: { pid: number; uptime: number; nodeVersion: string };
    disk: { percent: number; note: string };
  };
  fetchedAt: string;
}

interface RmmHealthResponse {
  overallStatus: string;
  providers: { total: number; active: number; error: number; list: RmmProvider[] };
  devices: { total: number; online: number; warning: number; critical: number; offline: number; avgCpu: number; avgMemory: number; avgDisk: number; totalAlerts: number };
  healing: { pendingApprovals: number; stats: Record<string, number> };
  fetchedAt: string;
}

const statusColor: Record<string, string> = {
  online: "text-emerald-400 bg-emerald-500/10",
  critical: "text-red-400 bg-red-500/10",
  warning: "text-amber-400 bg-amber-500/10",
  offline: "text-muted-foreground bg-muted",
};

const actionStatusColor: Record<string, string> = {
  pending_approval: "text-amber-400 bg-amber-500/10",
  approved: "text-blue-400 bg-blue-500/10",
  executing: "text-purple-400 bg-purple-500/10 animate-pulse",
  completed: "text-emerald-400 bg-emerald-500/10",
  failed: "text-red-400 bg-red-500/10",
  cancelled: "text-muted-foreground bg-muted",
};

function MetricBar({ value, label }: { value: number; label: string }) {
  const color = value >= 85 ? "bg-red-500" : value >= 70 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-0.5"><span className="text-muted-foreground">{label}</span><span>{value}%</span></div>
      <div className="h-1 bg-muted rounded-full overflow-hidden"><div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} /></div>
    </div>
  );
}

function formatLastSeen(lastSeen: string): string {
  const diff = Date.now() - new Date(lastSeen).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatActionType(t: string): string {
  return t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function ProviderBadge({ provider, status }: { provider: string; status: string }) {
  const color = status === "active" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    : status === "error" ? "text-red-400 bg-red-500/10 border-red-500/20"
    : "text-muted-foreground bg-muted border-border";
  const labels: Record<string, string> = { ninjaone: "NinjaOne", connectwise_automate: "CW Automate", connectwise_manage: "CW Manage", halopsa: "HaloPSA", datto_rmm: "Datto RMM" };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${color} font-mono`}>
      {labels[provider] ?? provider}
    </span>
  );
}

interface ActionModalProps {
  device: Device;
  onClose: () => void;
  onSubmit: (type: string, target?: string) => void;
  loading: boolean;
}

function RemoteActionModal({ device, onClose, onSubmit, loading }: ActionModalProps) {
  const [actionType, setActionType] = useState("service_restart");
  const [target, setTarget] = useState("");
  const DESTRUCTIVE = ["reboot", "forced_reboot", "kill_process", "run_script"];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <p className="font-semibold text-sm flex items-center gap-2"><Terminal className="w-4 h-4 text-primary" /> Remote Action</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{device.hostname} · {device.ipAddress}</p>
          </div>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground hover:text-foreground" /></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Action Type</label>
            <select
              value={actionType}
              onChange={e => setActionType(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none"
            >
              <option value="service_restart">Restart Service</option>
              <option value="service_start">Start Service</option>
              <option value="service_stop">Stop Service</option>
              <option value="reboot">Safe Reboot</option>
              <option value="forced_reboot">Forced Reboot</option>
              <option value="kill_process">Kill Process</option>
              <option value="clear_temp">Clear Temp Files</option>
            </select>
          </div>
          {(actionType === "service_restart" || actionType === "service_start" || actionType === "service_stop") && (
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Service Name</label>
              <input value={target} onChange={e => setTarget(e.target.value)} placeholder="e.g. wuauserv, spooler" className="w-full px-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none font-mono" />
            </div>
          )}
          {actionType === "kill_process" && (
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Process ID (PID)</label>
              <input value={target} onChange={e => setTarget(e.target.value)} placeholder="e.g. 4832" type="number" className="w-full px-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none font-mono" />
            </div>
          )}
          {DESTRUCTIVE.includes(actionType) && (
            <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
              <p className="text-xs text-red-400 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Destructive action — will require approval before execution</p>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose} className="flex-1">Cancel</Button>
            <Button size="sm" onClick={() => onSubmit(actionType, target || undefined)} disabled={loading} className="flex-1">
              {loading ? "Submitting..." : DESTRUCTIVE.includes(actionType) ? "Request (needs approval)" : "Execute Now"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RMMConsole() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"endpoints" | "actions" | "healing">("endpoints");
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [lastPolled, setLastPolled] = useState<Date>(new Date());
  const [actionDevice, setActionDevice] = useState<Device | null>(null);
  const [actionFilter, setActionFilter] = useState("all");

  const { data: devicesData, isLoading: devicesLoading, refetch: refetchDevices } = useQuery({
    queryKey: ["msp-devices-rmm"],
    queryFn: () => apiFetch<{ dbDevices: Device[]; totalDbDevices: number }>("/msp/rmm/devices").then(r => ({ devices: r.dbDevices, total: r.totalDbDevices })),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const { data: rmmHealth, refetch: refetchHealth } = useQuery({
    queryKey: ["rmm-health"],
    queryFn: () => apiFetch<RmmHealthResponse>("/msp/rmm/health"),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const { data: actionsData, refetch: refetchActions } = useQuery({
    queryKey: ["rmm-actions", actionFilter],
    queryFn: () => apiFetch<{ actions: RemoteAction[]; total: number }>(`/msp/rmm/actions?status=${actionFilter}&limit=30`),
    staleTime: 10_000,
    refetchInterval: 15_000,
    enabled: activeTab === "actions",
  });

  const { data: healingData, refetch: refetchHealing } = useQuery({
    queryKey: ["rmm-healing-executions"],
    queryFn: () => apiFetch<{ executions: HealingExecution[]; total: number }>("/msp/rmm/playbooks/executions?limit=30"),
    staleTime: 10_000,
    refetchInterval: 20_000,
    enabled: activeTab === "healing",
  });

  const createActionMutation = useMutation({
    mutationFn: (data: { deviceId: number; actionType: string; target?: string; parameters?: Record<string, unknown> }) =>
      apiFetch<{ action: { id: number; status: string }; message: string }>("/msp/rmm/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, requestedBy: "operator" }),
      }),
    onSuccess: () => {
      setActionDevice(null);
      queryClient.invalidateQueries({ queryKey: ["rmm-actions"] });
    },
  });

  const approveActionMutation = useMutation({
    mutationFn: (actionId: number) =>
      apiFetch(`/msp/rmm/actions/${actionId}/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ approvedBy: "operator" }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rmm-actions"] }),
  });

  const cancelActionMutation = useMutation({
    mutationFn: (actionId: number) =>
      apiFetch(`/msp/rmm/actions/${actionId}/cancel`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rmm-actions"] }),
  });

  const approveHealingMutation = useMutation({
    mutationFn: (execId: number) =>
      apiFetch(`/msp/rmm/playbooks/executions/${execId}/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ approvedBy: "operator" }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rmm-healing-executions"] }),
  });

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await apiFetch<SystemMetrics>("/msp/live/system-metrics");
      setSystemMetrics(data);
      setLastPolled(new Date());
    } catch { /* silently fail */ }
    finally { setMetricsLoading(false); }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30_000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const refetchAll = () => { refetchDevices(); refetchHealth(); fetchMetrics(); if (activeTab === "actions") refetchActions(); if (activeTab === "healing") refetchHealing(); };

  const devices = devicesData?.devices ?? [];
  const filtered = devices.filter(e =>
    e.hostname.toLowerCase().includes(search.toLowerCase()) ||
    (e.clientName || "").toLowerCase().includes(search.toLowerCase())
  );

  const health = rmmHealth;
  const totalEndpoints = (health?.devices.total ?? devices.length) + 1;
  const onlineCount = (health?.devices.online ?? devices.filter(e => e.status === "online").length) + (systemMetrics ? 1 : 0);
  const alertCount = (health?.devices.critical ?? 0) + (health?.devices.warning ?? 0);
  const activeProviders = health?.providers.active ?? 0;
  const pendingApprovals = health?.healing.pendingApprovals ?? 0;

  const totalPatchesPending = devices.reduce((sum, d) => sum + (d.patchesPending ?? 0), 0);
  const patchGroups = [
    { name: "Critical Security", count: devices.filter(d => (d.patchesPending ?? 0) > 10).length, severity: "Critical", autoApprove: false },
    { name: "High Priority Patches", count: devices.filter(d => (d.patchesPending ?? 0) > 5 && (d.patchesPending ?? 0) <= 10).length, severity: "High", autoApprove: false },
    { name: "Pending Updates", count: devices.filter(d => (d.patchesPending ?? 0) > 0 && (d.patchesPending ?? 0) <= 5).length, severity: "Medium", autoApprove: false },
    { name: "Total Patches Pending", count: totalPatchesPending, severity: "Info", autoApprove: false },
  ].filter(g => g.count > 0);

  const tabs = [
    { id: "endpoints" as const, label: "Endpoints", count: totalEndpoints },
    { id: "actions" as const, label: "Remote Actions", count: pendingApprovals > 0 ? pendingApprovals : null, alert: pendingApprovals > 0 },
    { id: "healing" as const, label: "Auto-Healing", count: null },
  ];

  return (
    <div className="p-6 space-y-6">
      {actionDevice && (
        <RemoteActionModal
          device={actionDevice}
          onClose={() => setActionDevice(null)}
          loading={createActionMutation.isPending}
          onSubmit={(type, target) => {
            const params: Record<string, unknown> = {};
            if (type === "kill_process" && target) params.processId = parseInt(target, 10);
            createActionMutation.mutate({ deviceId: actionDevice.id, actionType: type, target, parameters: Object.keys(params).length > 0 ? params : undefined });
          }}
        />
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Monitor className="w-6 h-6 text-primary" /> RMM Console
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live endpoint monitoring, remote actions, and automated healing
            {activeProviders > 0 && <span className="text-emerald-400 ml-1">· {activeProviders} live provider{activeProviders > 1 ? "s" : ""} connected</span>}
          </p>
        </div>
        <div className="text-right flex flex-col items-end gap-1">
          <p className="text-[10px] text-muted-foreground">
            Polled {lastPolled.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
          <button onClick={refetchAll} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {health?.providers.list && health.providers.list.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Connected Providers:</span>
          {health.providers.list.map(p => (
            <div key={p.id} className="flex items-center gap-1.5">
              <ProviderBadge provider={p.provider} status={p.status} />
              {p.lastSyncAt && <span className="text-[10px] text-muted-foreground">{formatLastSeen(p.lastSyncAt)}</span>}
            </div>
          ))}
          {health.providers.total === 0 && (
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              No providers configured — <a href="/ops/provider-settings" className="text-primary underline ml-0.5">Add Provider</a>
            </Badge>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Endpoints", value: totalEndpoints, color: "text-sky-400", icon: <Server className="w-4 h-4" /> },
          { label: "Online", value: onlineCount, color: "text-emerald-400", icon: <Wifi className="w-4 h-4" /> },
          { label: "Alerts / Warnings", value: alertCount, color: alertCount > 0 ? "text-red-400" : "text-muted-foreground", icon: <AlertTriangle className="w-4 h-4" /> },
          { label: "Pending Approvals", value: pendingApprovals, color: pendingApprovals > 0 ? "text-amber-400" : "text-muted-foreground", icon: <Clock className="w-4 h-4" /> },
          { label: "Active Providers", value: activeProviders, color: activeProviders > 0 ? "text-blue-400" : "text-muted-foreground", icon: <Activity className="w-4 h-4" /> },
        ].map(({ label, value, color, icon }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{label}</p>
                <span className={color}>{icon}</span>
              </div>
              <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex border-b border-border gap-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === tab.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {tab.label}
            {tab.count !== null && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab.alert ? "bg-amber-500/20 text-amber-400" : "bg-muted text-muted-foreground"}`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "endpoints" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search endpoints or clients..."
              className="w-full px-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary"
            />

            {systemMetrics && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Monitored Server
                </p>
                <Card className={`border-2 ${systemMetrics.metrics.cpu.percent > 85 || systemMetrics.metrics.memory.percent > 90 ? "border-amber-500/30" : "border-emerald-500/20"}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-2 h-2 rounded-full mt-1.5 bg-emerald-500 animate-pulse`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm font-mono">{systemMetrics.device.hostname}</span>
                          <Badge variant="outline" className="text-[10px]">SZL Infrastructure</Badge>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">LIVE</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{systemMetrics.device.platform} {systemMetrics.device.arch} · Node {systemMetrics.metrics.process.nodeVersion} · {systemMetrics.metrics.uptime.formatted} uptime</p>
                        <div className="grid grid-cols-3 gap-3 mt-2">
                          <MetricBar value={systemMetrics.metrics.cpu.percent} label="CPU" />
                          <MetricBar value={systemMetrics.metrics.memory.percent} label="Memory" />
                          <MetricBar value={systemMetrics.metrics.disk.percent} label="Disk" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Managed Endpoints ({filtered.length})</p>
              {devicesLoading ? (
                <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
              ) : filtered.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No endpoints found. Configure a provider in <a href="/ops/provider-settings" className="text-primary underline">Provider Settings</a>.
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.slice(0, 30).map((ep) => (
                    <Card key={ep.id} className={ep.status === "critical" ? "border-red-500/30" : ep.status === "warning" ? "border-amber-500/20" : ""}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`w-2 h-2 rounded-full mt-1.5 ${ep.status === "online" ? "bg-emerald-500" : ep.status === "critical" ? "bg-red-500 animate-pulse" : ep.status === "warning" ? "bg-amber-500" : "bg-zinc-500"}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm font-mono">{ep.hostname}</span>
                              {ep.clientName && <Badge variant="outline" className="text-[10px]">{ep.clientName}</Badge>}
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusColor[ep.status]}`}>{ep.status.charAt(0).toUpperCase() + ep.status.slice(1)}</span>
                              <span className="text-[10px] text-muted-foreground font-mono">{ep.ipAddress}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{ep.os} · {ep.type} · {formatLastSeen(ep.lastSeen)}</p>
                            {ep.status !== "offline" && (
                              <div className="grid grid-cols-3 gap-3 mt-2">
                                <MetricBar value={ep.cpu} label="CPU" />
                                <MetricBar value={ep.memory} label="RAM" />
                                <MetricBar value={ep.disk} label="Disk" />
                              </div>
                            )}
                            <div className="flex gap-3 mt-1.5 flex-wrap">
                              {ep.patchesPending > 0 && <span className="flex items-center gap-1 text-[10px] text-amber-400"><Package className="w-3 h-3" />{ep.patchesPending} patches</span>}
                              {ep.threats > 0 && <span className="flex items-center gap-1 text-[10px] text-red-400"><Shield className="w-3 h-3" />{ep.threats} threat</span>}
                              {ep.alerts > 0 && <span className="flex items-center gap-1 text-[10px] text-orange-400"><AlertTriangle className="w-3 h-3" />{ep.alerts} alert{ep.alerts > 1 ? "s" : ""}</span>}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5 shrink-0">
                            <button
                              onClick={() => setActionDevice(ep)}
                              className="text-[10px] px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors flex items-center gap-1"
                            >
                              <Terminal className="w-3 h-3" />Remote
                            </button>
                            <button className="text-[10px] px-2 py-1 bg-muted border border-border rounded hover:bg-muted/80 transition-colors flex items-center gap-1">
                              <Eye className="w-3 h-3" />Details
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Package className="w-4 h-4 text-amber-400" />Patch Approval Queue</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {patchGroups.map((g) => (
                  <div key={g.name} className="p-3 rounded-lg bg-muted/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold">{g.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{g.count} patches pending</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className={`text-[10px] ${g.severity === "Critical" ? "text-red-400 bg-red-500/10 border-red-500/20" : g.severity === "High" ? "text-orange-400 bg-orange-500/10 border-orange-500/20" : "text-muted-foreground"}`}>{g.severity}</Badge>
                        {g.autoApprove && <span className="text-[10px] text-emerald-400">Auto-approved</span>}
                      </div>
                    </div>
                    {!g.autoApprove && <button className="mt-2 text-[10px] px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors w-full">Review & Deploy</button>}
                  </div>
                ))}
              </CardContent>
            </Card>

            {systemMetrics && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Cpu className="w-4 h-4 text-blue-400" />API Server — Live</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">CPU Load (1m / 5m / 15m)</span><span className="font-mono">{systemMetrics.metrics.cpu.loadAvg1m} / {systemMetrics.metrics.cpu.loadAvg5m} / {systemMetrics.metrics.cpu.loadAvg15m}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">RAM Used</span><span className="font-mono">{systemMetrics.metrics.memory.usedGb}GB / {systemMetrics.metrics.memory.totalGb}GB</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Process RSS</span><span className="font-mono">{systemMetrics.metrics.memory.processRssGb}GB</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Heap Used</span><span className="font-mono">{systemMetrics.metrics.memory.processHeapUsedGb}GB</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Uptime</span><span className="font-mono">{systemMetrics.metrics.uptime.formatted}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Node.js</span><span className="font-mono">{systemMetrics.metrics.process.nodeVersion}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">PID</span><span className="font-mono">{systemMetrics.metrics.process.pid}</span></div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === "actions" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold flex-1">Remote Action Audit Log</p>
            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="px-3 py-1.5 text-sm bg-muted rounded-lg border border-border focus:outline-none"
            >
              {["all", "pending_approval", "executing", "completed", "failed"].map(s => (
                <option key={s} value={s}>{s === "all" ? "All Statuses" : formatActionType(s)}</option>
              ))}
            </select>
          </div>
          {!actionsData?.actions.length ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No remote actions yet. Use the Remote button on any endpoint to create one.</div>
          ) : (
            <div className="space-y-2">
              {actionsData.actions.map(action => (
                <Card key={action.id} className={action.status === "pending_approval" ? "border-amber-500/20" : action.status === "failed" ? "border-red-500/20" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{formatActionType(action.actionType)}</span>
                          {action.target && <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{action.target}</span>}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${actionStatusColor[action.status] ?? "text-muted-foreground bg-muted"}`}>{formatActionType(action.status)}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {action.hostname && <span className="font-mono">{action.hostname} · </span>}
                          Requested by {action.requestedBy} · {formatLastSeen(action.createdAt)}
                          {action.approvedBy && <span> · Approved by {action.approvedBy}</span>}
                        </p>
                        {action.errorMessage && <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1"><XCircle className="w-3 h-3" />{action.errorMessage}</p>}
                      </div>
                      {action.status === "pending_approval" && (
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => approveActionMutation.mutate(action.id)}
                            disabled={approveActionMutation.isPending}
                            className="text-[10px] px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded hover:bg-emerald-500/20 flex items-center gap-1 transition-colors"
                          >
                            <CheckSquare className="w-3 h-3" />Approve
                          </button>
                          <button
                            onClick={() => cancelActionMutation.mutate(action.id)}
                            disabled={cancelActionMutation.isPending}
                            className="text-[10px] px-2 py-1 bg-muted text-muted-foreground rounded hover:bg-muted/80 flex items-center gap-1 transition-colors"
                          >
                            <X className="w-3 h-3" />Cancel
                          </button>
                        </div>
                      )}
                      {action.status === "completed" && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                      {action.status === "failed" && <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
                      {action.status === "executing" && <Activity className="w-4 h-4 text-purple-400 shrink-0 mt-0.5 animate-pulse" />}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "healing" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Auto-Healing Execution Log</p>
              <p className="text-xs text-muted-foreground mt-0.5">Playbook executions with before/after metrics and approval gates</p>
            </div>
            <a href="/msp/ops-console" className="text-xs text-primary flex items-center gap-1 hover:underline">Manage Playbooks <ChevronRight className="w-3 h-3" /></a>
          </div>
          {!healingData?.executions.length ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No healing executions yet. Configure playbooks in the Ops Console to enable automated remediation.
            </div>
          ) : (
            <div className="space-y-2">
              {healingData.executions.map(exec => (
                <Card key={exec.id} className={exec.status === "pending_approval" ? "border-amber-500/20" : exec.status === "failed" ? "border-red-500/20" : exec.status === "completed" ? "border-emerald-500/10" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{exec.playbookName ?? "Unknown Playbook"}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${actionStatusColor[exec.status] ?? "text-muted-foreground bg-muted"}`}>{formatActionType(exec.status)}</span>
                          {exec.healingConfidenceScore !== null && <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">{exec.healingConfidenceScore}% confidence</span>}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {exec.hostname && <span className="font-mono">{exec.hostname} · </span>}
                          Triggered by {exec.triggeredBy} · {formatLastSeen(exec.createdAt)}
                        </p>
                      </div>
                      {exec.status === "pending_approval" && (
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => approveHealingMutation.mutate(exec.id)}
                            disabled={approveHealingMutation.isPending}
                            className="text-[10px] px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded hover:bg-emerald-500/20 flex items-center gap-1"
                          >
                            <CheckSquare className="w-3 h-3" />Approve & Run
                          </button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
