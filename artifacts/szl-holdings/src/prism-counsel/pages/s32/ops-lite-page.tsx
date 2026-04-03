import { Settings2, CheckCircle, AlertTriangle, RefreshCw, FileText, MessageSquare, Calendar, Users, Brain, Database, Wifi, WifiOff } from "lucide-react";

const OPS_STATUS = [
  {
    system: "Communications",
    description: "Emails and carrier correspondence",
    status: "healthy",
    detail: "47 communications synced · Last update 12 minutes ago",
    icon: MessageSquare,
    color: "#4a90b8",
  },
  {
    system: "Matter Files",
    description: "Documents and records",
    status: "healthy",
    detail: "312 files indexed · 3 new files today",
    icon: FileText,
    color: "#d4a054",
  },
  {
    system: "Team Alerts",
    description: "Team notifications and updates",
    status: "healthy",
    detail: "Connected · 4 team members active today",
    icon: Users,
    color: "#8b7ac8",
  },
  {
    system: "Prep Windows",
    description: "Calendar and scheduling",
    status: "attention",
    detail: "Live updates need attention — reconnect to restore automatic scheduling",
    icon: Calendar,
    color: "#d4a054",
    actionLabel: "Reconnect",
  },
  {
    system: "Workbench",
    description: "AI-assisted drafting and analysis",
    status: "healthy",
    detail: "Available · Using latest models",
    icon: Brain,
    color: "#c8953c",
  },
  {
    system: "Records Sync",
    description: "Incoming records and document processing",
    status: "healthy",
    detail: "14 documents processed today · Queue clear",
    icon: Database,
    color: "#4a90b8",
  },
];

const RECENT_ACTIVITY = [
  { event: "3 records arrived — Rodriguez matter", time: "2h ago", type: "records" },
  { event: "Communications refreshed — 12 new items", time: "12m ago", type: "comms" },
  { event: "Draft updated — Chen chronology", time: "4h ago", type: "draft" },
  { event: "Files synced — Torres matter", time: "6h ago", type: "files" },
  { event: "Team alert sent — Rodriguez deadline reminder", time: "8h ago", type: "alert" },
];

const HEALTH_SUMMARY = {
  syncedMatters: 8,
  totalMatters: 8,
  recordsArrived: 3,
  draftUpdates: 2,
  communicationsSynced: 12,
  attentionNeeded: 1,
};

export default function OpsLitePage() {
  const healthy = OPS_STATUS.filter(s => s.status === "healthy").length;
  const attention = OPS_STATUS.filter(s => s.status === "attention").length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Settings2 className="w-5 h-5 text-slate-400" />
          <h1 className="text-lg font-semibold text-slate-100">System Status</h1>
        </div>
        <p className="text-xs text-slate-500">Everything your practice runs on — in plain English, no technical jargon</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-[#4a90b8]/20 p-4 text-center" style={{ background: "#0c1220" }}>
          <div className="text-2xl font-semibold text-[#4a90b8]">{healthy}</div>
          <div className="text-[10px] text-slate-500 mt-1">All clear</div>
        </div>
        <div className={`rounded-lg border p-4 text-center ${attention > 0 ? "border-[#d4a054]/20" : "border-white/[0.06]"}`} style={{ background: "#0c1220" }}>
          <div className={`text-2xl font-semibold ${attention > 0 ? "text-[#d4a054]" : "text-slate-500"}`}>{attention}</div>
          <div className="text-[10px] text-slate-500 mt-1">Need attention</div>
        </div>
        <div className="rounded-lg border border-white/[0.06] p-4 text-center" style={{ background: "#0c1220" }}>
          <div className="text-2xl font-semibold text-slate-200">{HEALTH_SUMMARY.syncedMatters}/{HEALTH_SUMMARY.totalMatters}</div>
          <div className="text-[10px] text-slate-500 mt-1">Matters synced</div>
        </div>
      </div>

      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">What's Running</h3>
        <div className="space-y-3">
          {OPS_STATUS.map(sys => {
            const Icon = sys.icon;
            return (
              <div key={sys.system} className={`flex items-center gap-3 p-3 rounded border ${sys.status === "attention" ? "border-[#d4a054]/20" : "border-white/[0.04]"}`} style={{ background: "#080c14" }}>
                <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0" style={{ background: sys.color + "15" }}>
                  <Icon className="w-4 h-4" style={{ color: sys.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-200">{sys.system}</span>
                    <span className="text-[10px] text-slate-500">— {sys.description}</span>
                  </div>
                  <p className={`text-[11px] mt-0.5 ${sys.status === "attention" ? "text-[#d4a054]" : "text-slate-500"}`}>{sys.detail}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {sys.status === "healthy" ? (
                    <div className="flex items-center gap-1 text-[10px] text-[#4a90b8]">
                      <CheckCircle className="w-3 h-3" /> All clear
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-[10px] text-[#d4a054]">
                        <AlertTriangle className="w-3 h-3" /> Attention needed
                      </div>
                      {sys.actionLabel && (
                        <button className="px-2 py-0.5 rounded text-[10px] bg-[#d4a054]/10 text-[#d4a054] hover:bg-[#d4a054]/20 transition-colors">
                          {sys.actionLabel}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Today's Activity</h3>
          <div className="space-y-2">
            {RECENT_ACTIVITY.map((a, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 border-b border-white/[0.04] last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4a90b8] flex-shrink-0" />
                <span className="text-[11px] text-slate-300 flex-1">{a.event}</span>
                <span className="text-[10px] text-slate-600 flex-shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Today's Numbers</h3>
          <div className="space-y-3">
            {[
              { label: "Records arrived", value: HEALTH_SUMMARY.recordsArrived, color: "#4a90b8" },
              { label: "Drafts updated", value: HEALTH_SUMMARY.draftUpdates, color: "#d4a054" },
              { label: "Communications synced", value: HEALTH_SUMMARY.communicationsSynced, color: "#8b7ac8" },
              { label: "Things needing attention", value: HEALTH_SUMMARY.attentionNeeded, color: "#c45a4a" },
            ].map((stat, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">{stat.label}</span>
                <span className="text-sm font-semibold font-mono" style={{ color: stat.color }}>{stat.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-2 rounded text-[10px] text-slate-500 border border-white/[0.04]">
            Technical details like connector IDs, delta tokens, and sync states are available in the Admin view for your technical team.
          </div>
        </div>
      </div>
    </div>
  );
}
