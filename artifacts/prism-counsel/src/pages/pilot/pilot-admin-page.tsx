import { useAdminHealth, useAdminJobs, useAdminConnectors } from "../../hooks/use-prism-pilot";
import { Server, Activity, Plug, AlertTriangle, CheckCircle, Clock, RefreshCw, Database, FileText, Shield } from "lucide-react";

const DEMO_HEALTH = {
  connectors: [
    { type: "outlook", status: "active", lastSync: new Date(Date.now() - 300000).toISOString() },
    { type: "sharepoint", status: "active", lastSync: new Date(Date.now() - 600000).toISOString() },
    { type: "onedrive", status: "active", lastSync: new Date(Date.now() - 900000).toISOString() },
    { type: "teams", status: "pending_consent", lastSync: null },
  ],
  jobs: { total: 47, completed: 42, failed: 2, pending: 1, processing: 2 },
  reviewBacklog: 3,
  signoffBacklog: 2,
  recentExports: 3,
};

const DEMO_JOBS = {
  jobs: [
    { id: 1, sourceType: "email", sourceRef: "Reserve increase notification", status: "completed", itemCount: 2, processedCount: 2, errorCount: 0, createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 2, sourceType: "file", sourceRef: "IME Report — Dr. Whitmore", status: "completed", itemCount: 1, processedCount: 1, errorCount: 0, createdAt: new Date(Date.now() - 7200000).toISOString() },
    { id: 3, sourceType: "email", sourceRef: "Discovery extension granted", status: "completed", itemCount: 1, processedCount: 1, errorCount: 0, createdAt: new Date(Date.now() - 14400000).toISOString() },
    { id: 4, sourceType: "file", sourceRef: "Medical records — Queens Medical", status: "processing", itemCount: 3, processedCount: 1, errorCount: 0, createdAt: new Date(Date.now() - 1800000).toISOString() },
    { id: 5, sourceType: "email", sourceRef: "Adjuster follow-up — Park", status: "failed", itemCount: 1, processedCount: 0, errorCount: 1, createdAt: new Date(Date.now() - 28800000).toISOString() },
  ],
  stats: { total: 47, completed: 42, failed: 2, pending: 1, processing: 2 },
};

export default function PilotAdminPage() {
  const { data: healthData } = useAdminHealth();
  const { data: jobsData } = useAdminJobs();

  const health = healthData ?? DEMO_HEALTH;
  const jobs = jobsData ?? DEMO_JOBS;
  const isDemo = !healthData;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-3">
            <Server className="w-6 h-6 text-slate-400" /> Pilot Zero — Admin
          </h1>
          <p className="text-sm text-slate-400 mt-1">Connector health, ingestion jobs, queue status, and system observability</p>
        </div>
        {isDemo && <span className="px-2 py-0.5 text-xs font-mono bg-amber-900/30 text-amber-400 rounded">DEMO</span>}
      </div>

      <div className="grid grid-cols-5 gap-4">
        <StatCard icon={<Database className="w-4 h-4" />} label="Total Jobs" value={health.jobs?.total ?? 0} color="blue" />
        <StatCard icon={<CheckCircle className="w-4 h-4" />} label="Completed" value={health.jobs?.completed ?? 0} color="green" />
        <StatCard icon={<AlertTriangle className="w-4 h-4" />} label="Failed" value={health.jobs?.failed ?? 0} color="red" />
        <StatCard icon={<FileText className="w-4 h-4" />} label="Review Backlog" value={health.reviewBacklog ?? 0} color="amber" />
        <StatCard icon={<Shield className="w-4 h-4" />} label="Sign-off Backlog" value={health.signoffBacklog ?? 0} color="purple" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <section className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2 mb-4">
            <Plug className="w-4 h-4 text-[#4a90b8]" /> Connectors
          </h2>
          <div className="space-y-3">
            {(health.connectors ?? []).map((c: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${c.status === "active" ? "bg-emerald-400" : c.status === "error" ? "bg-red-400" : "bg-amber-400"}`} />
                  <div>
                    <span className="text-sm text-white capitalize">{connectorLabel(c.type)}</span>
                    <p className="text-[10px] text-slate-500">{c.status === "active" ? "Connected" : c.status === "pending_consent" ? "Awaiting tenant consent" : c.status}</p>
                  </div>
                </div>
                <div className="text-right">
                  {c.lastSync ? (
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" /> {timeAgo(c.lastSync)}
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-400">Not synced</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-[#c8953c]" /> Recent Jobs
          </h2>
          <div className="space-y-2">
            {(jobs.jobs ?? []).slice(0, 8).map((j: any) => (
              <div key={j.id} className="flex items-center justify-between p-2.5 rounded bg-slate-900/50">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${j.status === "completed" ? "bg-emerald-400" : j.status === "failed" ? "bg-red-400" : j.status === "processing" ? "bg-blue-400 animate-pulse" : "bg-amber-400"}`} />
                  <div className="min-w-0">
                    <span className="text-xs text-white truncate block">{j.sourceRef}</span>
                    <span className="text-[10px] text-slate-500">{j.sourceType} · {j.processedCount}/{j.itemCount} items</span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 ml-2">{timeAgo(j.createdAt)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Microsoft 365 Tenant Status</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded bg-slate-900/50 text-xs">
            <span className="text-slate-400">Graph API Subscriptions</span>
            <p className="text-white mt-1">Requires Microsoft 365 tenant admin consent. Configure at <span className="text-[#d4a054] font-mono">/admin/connectors</span></p>
          </div>
          <div className="p-3 rounded bg-slate-900/50 text-xs">
            <span className="text-slate-400">Teams Webhooks</span>
            <p className="text-white mt-1">Blocked until tenant consent is granted. Alert delivery will fall back to in-app notifications.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colors: Record<string, string> = { blue: "text-[#4a90b8]", amber: "text-[#d4a054]", red: "text-[#c45a4a]", green: "text-emerald-400", purple: "text-[#8b7ac8]" };
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <span className={colors[color]}>{icon}</span>
        <span className="text-[10px] text-slate-400 uppercase">{label}</span>
      </div>
      <div className={`text-xl font-semibold ${colors[color]}`}>{value}</div>
    </div>
  );
}

function connectorLabel(type: string) {
  const map: Record<string, string> = { outlook: "Communications", sharepoint: "Matter Files", onedrive: "Document Store", teams: "Team Alerts" };
  return map[type] ?? type;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
