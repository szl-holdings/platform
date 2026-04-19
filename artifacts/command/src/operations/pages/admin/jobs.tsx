import { useQueryClient } from "@tanstack/react-query";
import { Play, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw, Zap, Calendar, RotateCcw } from "lucide-react";
import { useState } from "react";
import { apiFetch } from "@szl-holdings/shared-ui/api-fetch";
import { useStandardMutation, useStandardQuery } from "@szl-holdings/api-client-react";

interface JobRegistryEntry {
  type: string;
  name: string;
  description: string;
  schedule: "daily" | "hourly" | "on_demand";
  enabled: boolean;
  lastRunAt?: number;
  nextRunAt?: number;
  lastStatus?: "completed" | "failed" | "running" | "pending";
  lastDurationMs?: number;
  runCount: number;
  failCount: number;
}

interface JobStats {
  pending: number;
  running: number;
  completed: number;
  failed: number;
}

interface RecentJob {
  id: string;
  type: string;
  status: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  retries: number;
}

function formatMs(ms?: number) {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTime(ts?: number) {
  if (!ts) return "—";
  const d = new Date(ts);
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

function timeUntil(ts?: number) {
  if (!ts) return "—";
  const diff = ts - Date.now();
  if (diff <= 0) return "imminent";
  if (diff < 60000) return `${Math.floor(diff / 1000)}s`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  return `${Math.floor(diff / 3600000)}h`;
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return <span className="text-xs text-muted-foreground">—</span>;
  const colors: Record<string, string> = {
    completed: "bg-[#6b8f71]/15 text-[#6b8f71] border-[#6b8f71]/30",
    failed: "bg-[#c45a4a]/15 text-[#c45a4a] border-[#c45a4a]/30",
    running: "bg-[#4a90b8]/15 text-[#4a90b8] border-[#4a90b8]/30",
    pending: "bg-[#d4a054]/15 text-[#d4a054] border-[#d4a054]/30",
  };
  const icons: Record<string, React.ReactNode> = {
    completed: <CheckCircle className="w-3 h-3" />,
    failed: <XCircle className="w-3 h-3" />,
    running: <RefreshCw className="w-3 h-3 animate-spin" />,
    pending: <Clock className="w-3 h-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${colors[status] ?? "bg-muted text-muted-foreground border-border"}`}>
      {icons[status]}{status}
    </span>
  );
}

function ScheduleBadge({ schedule }: { schedule: string }) {
  const map: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    daily: { label: "Daily", color: "text-violet-400 bg-violet-500/10 border-violet-500/20", icon: <Calendar className="w-3 h-3" /> },
    hourly: { label: "Hourly", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20", icon: <Clock className="w-3 h-3" /> },
    on_demand: { label: "On-demand", color: "text-[#d4a054] bg-[#d4a054]/10 border-[#d4a054]/20", icon: <Zap className="w-3 h-3" /> },
  };
  const info = map[schedule] ?? { label: schedule, color: "text-muted-foreground bg-muted border-border", icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${info.color}`}>
      {info.icon}{info.label}
    </span>
  );
}

export default function JobsPage() {
  const queryClient = useQueryClient();
  const [triggerType, setTriggerType] = useState<string | null>(null);

  const { data: registry = [], isLoading: regLoading } = useStandardQuery<JobRegistryEntry[]>({
    queryKey: ["jobs-registry"],
    queryFn: () => apiFetch("/jobs/registry"),
    refetchInterval: 15000,
  });

  const { data: stats } = useStandardQuery<JobStats>({
    queryKey: ["jobs-stats"],
    queryFn: () => apiFetch("/jobs/stats"),
    refetchInterval: 10000,
  });

  const { data: recentJobs = [] } = useStandardQuery<RecentJob[]>({
    queryKey: ["jobs-recent"],
    queryFn: () => apiFetch("/jobs/recent?limit=15"),
    refetchInterval: 10000,
  });

  const triggerMutation = useStandardMutation({
    mutationFn: (type: string) => apiFetch(`/jobs/trigger/${type}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs-recent"] });
      queryClient.invalidateQueries({ queryKey: ["jobs-stats"] });
      queryClient.invalidateQueries({ queryKey: ["jobs-registry"] });
      setTriggerType(null);
    },
    onError: () => setTriggerType(null),
  });

  const dailyJobs = registry.filter(j => j.schedule === "daily");
  const hourlyJobs = registry.filter(j => j.schedule === "hourly");
  const onDemandJobs = registry.filter(j => j.schedule === "on_demand");
  const statsData = stats ?? { pending: 0, running: 0, completed: 0, failed: 0 };

  const kpis = [
    { label: "Pending", value: statsData.pending, color: "text-[#d4a054]" },
    { label: "Running", value: statsData.running, color: "text-[#4a90b8]" },
    { label: "Completed", value: statsData.completed, color: "text-[#6b8f71]" },
    { label: "Failed", value: statsData.failed, color: "text-[#c45a4a]" },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" /> Job Status
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Scheduled and on-demand job registry — real-time status, next run times, and trigger controls</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground mb-1">{label}</div>
            <div className={`text-2xl font-bold font-display ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {regLoading ? (
        <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-4">
          {[
            { label: "Daily Jobs", jobs: dailyJobs, icon: Calendar },
            { label: "Hourly Jobs", jobs: hourlyJobs, icon: Clock },
            { label: "On-Demand Jobs", jobs: onDemandJobs, icon: Zap },
          ].map(({ label, jobs, icon: Icon }) => (
            <div key={label} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <Icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-xs text-muted-foreground ml-auto">{jobs.length} job{jobs.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="divide-y divide-border">
                {jobs.map((job) => (
                  <div key={job.type} className="px-4 py-3 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">{job.name}</span>
                        <ScheduleBadge schedule={job.schedule} />
                        <StatusBadge status={job.lastStatus} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{job.description}</p>
                      <div className="flex items-center gap-4 mt-1.5 text-[10px] text-muted-foreground">
                        <span>Last run: {formatTime(job.lastRunAt)}</span>
                        {job.schedule !== "on_demand" && <span>Next: {timeUntil(job.nextRunAt)}</span>}
                        <span>Duration: {formatMs(job.lastDurationMs)}</span>
                        <span className="text-[#6b8f71]">{job.runCount} runs</span>
                        {job.failCount > 0 && <span className="text-[#c45a4a]">{job.failCount} failures</span>}
                        <span className="font-mono text-[9px] opacity-60">{job.type}</span>
                      </div>
                    </div>
                    {job.schedule === "on_demand" && (
                      <button
                        onClick={() => { setTriggerType(job.type); triggerMutation.mutate(job.type); }}
                        disabled={triggerMutation.isPending && triggerType === job.type}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                      >
                        {triggerMutation.isPending && triggerType === job.type ? (
                          <><RefreshCw className="w-3 h-3 animate-spin" />Running</>
                        ) : (
                          <><Play className="w-3 h-3" />Trigger</>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Recent Job Runs</span>
          <span className="text-xs text-muted-foreground ml-auto">{recentJobs.length} entries</span>
        </div>
        <div className="divide-y divide-border">
          {recentJobs.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">No recent job runs</div>
          ) : recentJobs.map((job) => (
            <div key={job.id} className="px-4 py-2.5 flex items-center gap-3">
              <StatusBadge status={job.status} />
              <span className="text-xs font-mono text-muted-foreground w-56 truncate">{job.type}</span>
              <span className="text-xs text-muted-foreground">{formatTime(job.createdAt)}</span>
              {job.completedAt && job.startedAt && (
                <span className="text-xs text-muted-foreground">{formatMs(job.completedAt - job.startedAt)}</span>
              )}
              {job.error && <span className="text-xs text-[#c45a4a] truncate max-w-xs">{job.error}</span>}
              {job.retries > 0 && <span className="text-xs text-[#d4a054]">{job.retries} retries</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
